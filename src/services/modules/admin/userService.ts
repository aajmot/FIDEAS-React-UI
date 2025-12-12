import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const userService = {
  getUsers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/admin/users?${queryParams.toString()}`);
    return response.data;
  },
  
  createUser: async (userData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/users', userData);
    return response.data;
  },
  
  updateUser: async (id: number, userData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/admin/users/${id}`);
    return response.data;
  },
  
  downloadUsersTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/admin/users/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importUsers: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};
