import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const customerService = {
  getCustomers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/inventory/customers?${queryParams.toString()}`);
    return response.data;
  },
  
  createCustomer: async (customerData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/inventory/customers', customerData);
    return response.data;
  },
  
  updateCustomer: async (id: number, customerData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/inventory/customers/${id}`, customerData);
    return response.data;
  },
  
  deleteCustomer: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/inventory/customers/${id}`);
    return response.data;
  },
  
  downloadCustomersTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/inventory/customers/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importCustomers: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/inventory/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};
