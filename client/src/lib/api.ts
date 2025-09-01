import { apiRequest } from "./queryClient";

export interface ProductFilters {
  category?: string;
  gender?: string;
  search?: string;
}

export interface CreateTryOnJobRequest {
  userAssetId: string;
  productIds: string[];
  mode: 'image' | 'video';
}

export const api = {
  // Upload photo
  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Upload failed');
    }
    
    return response.json();
  },

  // Get products with filters
  getProducts: async (filters: ProductFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.gender && filters.gender !== 'all') {
      params.append('gender', filters.gender);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // Create try-on job
  createTryOnJob: async (data: CreateTryOnJobRequest) => {
    const response = await apiRequest('POST', '/api/tryon', data);
    return response.json();
  },

  // Get job status
  getJobStatus: async (jobId: string) => {
    const response = await apiRequest('GET', `/api/jobs/${jobId}`);
    return response.json();
  },

  // Get results
  getResults: async (jobId: string) => {
    const response = await apiRequest('GET', `/api/results/${jobId}`);
    return response.json();
  },
};
