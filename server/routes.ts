import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { randomUUID } from "crypto";

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
        userAssetId: z.string(),
        productIds: z.array(z.string()).min(1).max(3),
        mode: z.enum(['image', 'video']).default('image'),
      });

      const { userAssetId, productIds, mode } = schema.parse(req.body);
      const sessionId = getSessionId(req);

      // Verify upload exists
      const uploadSession = await storage.getUploadSession(userAssetId);
      if (!uploadSession) {
        return res.status(400).json({ message: 'Invalid upload asset ID' });
      }

      // Verify all products exist
      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${productId} not found` });
        }
      }

      const job = await storage.createTryOnJob({
        sessionId,
        uploadId: userAssetId,
        productIds,
        status: 'queued',
      });

      // Start processing simulation
      simulateProcessing(job.id);

      res.json({ jobId: job.id });
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
      const job = await storage.getTryOnJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json({
        status: job.status,
        resultUrls: job.resultUrls || [],
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
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

  // Simulate processing function
  async function simulateProcessing(jobId: string) {
    try {
      // Update to processing
      await storage.updateTryOnJob(jobId, { status: 'processing' });
      
      // Simulate processing time (3-5 seconds)
      const processingTime = 3000 + Math.random() * 2000;
      
      setTimeout(async () => {
        // Generate mock result URLs
        const resultUrls = [
          'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=750'
        ];
        
        await storage.updateTryOnJob(jobId, { 
          status: 'succeeded',
          resultUrls 
        });
      }, processingTime);
      
    } catch (error) {
      console.error('Processing simulation error:', error);
      await storage.updateTryOnJob(jobId, { status: 'failed' });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
