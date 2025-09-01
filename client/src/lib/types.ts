export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  sizes: string[];
  category: string;
  gender?: string;
  description?: string;
}

export interface UploadSession {
  assetId: string;
  url: string;
  filename: string;
  size: number;
}

export interface TryOnJob {
  id: string;
  sessionId: string;
  uploadId: string;
  productIds: string[];
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  resultUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TryOnResults {
  originalUrl: string;
  resultUrls: string[];
  products: Product[];
  createdAt: Date;
}
