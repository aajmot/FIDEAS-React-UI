import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const productService = {
  getProducts: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/inventory/products?${queryParams.toString()}`);
    return response.data;
  },

  getProduct: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/inventory/products/get/${id}`);
    return response.data;
  },
  
  createProduct: async (productData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/inventory/products', productData);
    return response.data;
  },
  
  updateProduct: async (id: number, productData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/inventory/products/update/${id}`, productData);
    return response.data;
  },
  
  deleteProduct: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/inventory/products/${id}`);
    return response.data;
  },
  
  downloadProductsTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/inventory/products/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importProducts: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/inventory/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};
