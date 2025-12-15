import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const doctorService = {
  getDoctors: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/doctors?${queryParams.toString()}`);
    return response.data;
  },
  
  createDoctor: async (doctorData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/doctors', doctorData);
    return response.data;
  },
  
  getDoctor: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/doctors/${id}`);
    return response.data;
  },
  
  updateDoctor: async (id: number, doctorData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/doctors/${id}`, doctorData);
    return response.data;
  },
  
  deleteDoctor: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/doctors/${id}`);
    return response.data;
  },
  
  downloadDoctorsTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/health/doctors/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importDoctors: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/health/doctors/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};
