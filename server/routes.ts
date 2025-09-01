import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { randomUUID } from "crypto";

// Simple in-memory job storage
interface JobState {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  resultUrl?: string;
}

const jobsMap = new Map<string, JobState>();

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get session ID from headers or create new one
  const getSessionId = (req: any) => {
    return req.headers['x-session-id'] || randomUUID();
  };

  // Upload photo endpoint
  app.post('/api/upload', upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const session = await storage.createUploadSession({
        filename: req.file.originalname,
        filepath: req.file.path,
        filesize: req.file.size,
        mimetype: req.file.mimetype,
      });

      res.json({
        assetId: session.id,
        url: `/api/uploads/${session.id}`,
        filename: session.filename,
        size: session.filesize
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Serve uploaded files
  app.get('/api/uploads/:id', async (req, res) => {
    try {
      const session = await storage.getUploadSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: 'File not found' });
      }

      if (!fs.existsSync(session.filepath)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      res.setHeader('Content-Type', session.mimetype);
      res.sendFile(path.resolve(session.filepath));
    } catch (error) {
      console.error('File serve error:', error);
      res.status(500).json({ message: 'Failed to serve file' });
    }
  });

  // Get products with filtering
  app.get('/api/products', async (req, res) => {
    try {
      const { category, gender, search } = req.query;
      
      const products = await storage.getProducts({
        category: category as string,
        gender: gender as string,
        search: search as string,
      });

      res.json({ items: products });
    } catch (error) {
      console.error('Products fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Create try-on job
  app.post('/api/tryon', async (req, res) => {
    try {
      const schema = z.object({
        userImageUrl: z.string().url('Must be a valid URL'),
        clothingImageUrl: z.string().url('Must be a valid URL'),
      });

      const { userImageUrl, clothingImageUrl } = schema.parse(req.body);
      
      // Generate random jobId
      const jobId = randomUUID();
      
      // Store job status in memory
      jobsMap.set(jobId, {
        jobId,
        status: 'processing'
      });

      // Call n8n webhook
      callN8nWebhook(jobId, userImageUrl, clothingImageUrl);

      res.json({ jobId });
    } catch (error) {
      console.error('Try-on job creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create try-on job' });
    }
  });

  // Get job status
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const jobId = req.params.id;
      const job = jobsMap.get(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const response: any = {
        jobId: job.jobId,
        status: job.status
      };
      
      if (job.resultUrl) {
        response.resultUrl = job.resultUrl;
      }

      res.json(response);
    } catch (error) {
      console.error('Job status error:', error);
      res.status(500).json({ message: 'Failed to get job status' });
    }
  });

  // Get results for a job
  app.get('/api/results/:id', async (req, res) => {
    try {
      const job = await storage.getTryOnJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      if (job.status !== 'succeeded') {
        return res.status(400).json({ message: 'Job not completed successfully' });
      }

      // Get original upload
      const upload = await storage.getUploadSession(job.uploadId);
      const products = await Promise.all(
        job.productIds.map(id => storage.getProduct(id))
      );

      res.json({
        originalUrl: `/api/uploads/${job.uploadId}`,
        resultUrls: job.resultUrls || [],
        products: products.filter(Boolean),
        createdAt: job.createdAt,
      });
    } catch (error) {
      console.error('Results fetch error:', error);
      res.status(500).json({ message: 'Failed to get results' });
    }
  });

  // Webhook endpoint for n8n callbacks
  app.post('/api/webhooks/tryon', async (req, res) => {
    try {
      const schema = z.object({
        jobId: z.string(),
        status: z.enum(['processing', 'completed', 'failed']),
        resultUrl: z.string().url().optional(),
      });

      const { jobId, status, resultUrl } = schema.parse(req.body);

      // Check if job exists
      const existingJob = jobsMap.get(jobId);
      if (!existingJob) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Update job status in memory
      const updatedJob: JobState = {
        jobId,
        status,
        ...(resultUrl && { resultUrl })
      };
      
      jobsMap.set(jobId, updatedJob);

      res.status(200).json({ message: 'Job updated successfully' });
    } catch (error) {
      console.error('Webhook error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid webhook data', errors: error.errors });
      }
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Call n8n webhook
  async function callN8nWebhook(jobId: string, userImageUrl: string, clothingImageUrl: string) {
    const webhookUrl = 'http://localhost:5678/webhook/tryon';
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userImageUrl,
          clothingImageUrl,
        }),
      });

      if (!response.ok) {
        console.error(`n8n webhook failed: ${response.status}`);
        // Update job status to failed
        const job = jobsMap.get(jobId);
        if (job) {
          jobsMap.set(jobId, { ...job, status: 'failed' });
        }
      }
    } catch (error) {
      console.error('n8n webhook error:', error);
      // Update job status to failed
      const job = jobsMap.get(jobId);
      if (job) {
        jobsMap.set(jobId, { ...job, status: 'failed' });
      }
    }
  }


  const httpServer = createServer(app);
  return httpServer;
}
