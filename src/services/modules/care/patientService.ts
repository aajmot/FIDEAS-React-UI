import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const patientService = {
  getPatients: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/patients?${queryParams.toString()}`);
    return response.data;
  },
  
  createPatient: async (patientData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/patients', patientData);
    return response.data;
  },
  
  getPatient: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/patients/${id}`);
    return response.data;
  },
  
  updatePatient: async (id: number, patientData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/patients/${id}`, patientData);
    return response.data;
  },
  
  deletePatient: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/patients/${id}`);
    return response.data;
  },
  
  downloadPatientsTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/health/patients/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importPatients: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/health/patients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};
