import { type Product, type InsertProduct, type UploadSession, type InsertUploadSession, type TryOnJob, type InsertTryOnJob, type JobStatus } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  // Products
  getProducts(filters?: { category?: string; gender?: string; search?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Upload Sessions
  getUploadSession(id: string): Promise<UploadSession | undefined>;
  createUploadSession(session: InsertUploadSession): Promise<UploadSession>;
  
  // Try-On Jobs
  getTryOnJob(id: string): Promise<TryOnJob | undefined>;
  createTryOnJob(job: InsertTryOnJob): Promise<TryOnJob>;
  updateTryOnJob(id: string, updates: Partial<TryOnJob>): Promise<TryOnJob | undefined>;
  getTryOnJobsBySession(sessionId: string): Promise<TryOnJob[]>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private uploadSessions: Map<string, UploadSession>;
  private tryOnJobs: Map<string, TryOnJob>;

  constructor() {
    this.products = new Map();
    this.uploadSessions = new Map();
    this.tryOnJobs = new Map();
    this.loadMockProducts();
  }

  private loadMockProducts() {
    try {
      const productsPath = path.resolve(process.cwd(), 'data', 'products.json');
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
      
      productsData.products.forEach((product: Product) => {
        this.products.set(product.id, product);
      });
    } catch (error) {
      console.warn('Could not load mock products:', error);
    }
  }

  async getProducts(filters?: { category?: string; gender?: string; search?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters?.category && filters.category !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    }
    
    if (filters?.gender && filters.gender !== 'all') {
      products = products.filter(p => p.gender?.toLowerCase() === filters.gender!.toLowerCase());
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(search) || 
        p.description?.toLowerCase().includes(search)
      );
    }
    
    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async getUploadSession(id: string): Promise<UploadSession | undefined> {
    return this.uploadSessions.get(id);
  }

  async createUploadSession(insertSession: InsertUploadSession): Promise<UploadSession> {
    const id = randomUUID();
    const session: UploadSession = { 
      ...insertSession, 
      id, 
      createdAt: new Date()
    };
    this.uploadSessions.set(id, session);
    return session;
  }

  async getTryOnJob(id: string): Promise<TryOnJob | undefined> {
    return this.tryOnJobs.get(id);
  }

  async createTryOnJob(insertJob: InsertTryOnJob): Promise<TryOnJob> {
    const id = randomUUID();
    const job: TryOnJob = { 
      ...insertJob, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tryOnJobs.set(id, job);
    return job;
  }

  async updateTryOnJob(id: string, updates: Partial<TryOnJob>): Promise<TryOnJob | undefined> {
    const job = this.tryOnJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { 
      ...job, 
      ...updates, 
      updatedAt: new Date()
    };
    this.tryOnJobs.set(id, updatedJob);
    return updatedJob;
  }

  async getTryOnJobsBySession(sessionId: string): Promise<TryOnJob[]> {
    return Array.from(this.tryOnJobs.values()).filter(job => job.sessionId === sessionId);
  }
}

export const storage = new MemStorage();
