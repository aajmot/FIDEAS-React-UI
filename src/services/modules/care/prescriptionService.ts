import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const prescriptionService = {
  getPrescriptions: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/prescriptions?${queryParams.toString()}`);
    return response.data;
  },
  
  createPrescription: async (prescriptionData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/prescriptions', prescriptionData);
    return response.data;
  },
  
  getPrescription: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/prescriptions/${id}`);
    return response.data;
  },
  
  updatePrescription: async (id: number, prescriptionData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/prescriptions/${id}`, prescriptionData);
    return response.data;
  },
  
  deletePrescription: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/prescriptions/${id}`);
    return response.data;
  },
  
  getMedicalRecords: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/medical-records?${queryParams.toString()}`);
    return response.data;
  },
  
  createMedicalRecord: async (recordData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/medical-records', recordData);
    return response.data;
  },
  
  getMedicalRecord: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/medical-records/${id}`);
    return response.data;
  },
  
  updateMedicalRecord: async (id: number, recordData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/medical-records/${id}`, recordData);
    return response.data;
  },
  
  deleteMedicalRecord: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/medical-records/${id}`);
    return response.data;
  },
  
  getMedicalRecordByAppointment: async (appointmentId: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/medical-records/appointment/${appointmentId}`);
    return response.data;
  },
};
