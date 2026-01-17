import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const sampleCollectionService = {
  getSampleCollections: async (params?: { page?: number; per_page?: number; search?: string; status?: string[] | null }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status.join(','));
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/sample-collections?${queryParams.toString()}`);
    return response.data;
  },
  
  getSampleCollection: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/sample-collections/${id}`);
    return response.data;
  },
  
  createSampleCollection: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/sample-collections', data);
    return response.data;
  },
  
  updateSampleCollection: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/sample-collections/${id}`, data);
    return response.data;
  },
  
  deleteSampleCollection: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/sample-collections/${id}`);
    return response.data;
  },
  
  getSampleCollectionMethods: async (sampleType: string): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/sample-collection-methods/${sampleType}`);
    return response.data;
  },
};
