import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const supplierService = {
  getSuppliers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/inventory/suppliers?${queryParams.toString()}`);
    return response.data;
  },
  
  createSupplier: async (supplierData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/inventory/suppliers', supplierData);
    return response.data;
  },

  getSupplier: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/inventory/suppliers/${id}`);
    return response.data;
  },

  updateSupplier: async (id: number, supplierData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/inventory/suppliers/${id}`, supplierData);
    return response.data;
  },
  
  deleteSupplier: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/inventory/suppliers/${id}`);
    return response.data;
  },
  
  downloadSuppliersTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/inventory/suppliers/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importSuppliers: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/inventory/suppliers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};
