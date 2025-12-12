import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const diagnosticService = {
  getTestPanels: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/care/testpanels?${queryParams.toString()}`);
    return response.data;
  },
  
  getTestPanel: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/care/testpanels/${id}`);
    return response.data;
  },
  
  createTestPanel: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/care/testpanels', data);
    return response.data;
  },
  
  updateTestPanel: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/care/testpanels/${id}`, data);
    return response.data;
  },
  
  deleteTestPanel: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/care/testpanels/${id}`);
    return response.data;
  },
  
  getTestOrders: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/care/testorders?${queryParams.toString()}`);
    return response.data;
  },
  
  getTestOrder: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/care/testorders/${id}`);
    return response.data;
  },
  
  createTestOrder: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/care/testorders', data);
    return response.data;
  },
  
  updateTestOrder: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/care/testorders/${id}`, data);
    return response.data;
  },
  
  deleteTestOrder: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/care/testorders/${id}`);
    return response.data;
  },
  
  getTestResults: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/care/testresults?${queryParams.toString()}`);
    return response.data;
  },
  
  getTestResultByOrderId: async (orderId: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/care/testresults/order/${orderId}`);
    return response.data;
  },
  
  getTestResult: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/care/testresults/${id}`);
    return response.data;
  },
  
  createTestResult: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/care/testresults', data);
    return response.data;
  },
  
  updateTestResult: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/care/testresults/${id}`, data);
    return response.data;
  },
  
  deleteTestResult: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/care/testresults/${id}`);
    return response.data;
  },
  
  getTests: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/tests?${queryParams.toString()}`);
    return response.data;
  },
  
  getTest: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/tests/${id}`);
    return response.data;
  },
  
  createTest: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/tests', data);
    return response.data;
  },
  
  updateTest: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/tests/${id}`, data);
    return response.data;
  },
  
  deleteTest: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/tests/${id}`);
    return response.data;
  },
  
  getTestCategories: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/testcategories?${queryParams.toString()}`);
    return response.data;
  },
  
  createTestCategory: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/testcategories', data);
    return response.data;
  },
  
  updateTestCategory: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/testcategories/${id}`, data);
    return response.data;
  },
  
  deleteTestCategory: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/testcategories/${id}`);
    return response.data;
  },
};
