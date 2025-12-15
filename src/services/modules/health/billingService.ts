import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const billingService = {
  getInvoices: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/health/invoices');
    return response.data;
  },
  
  createInvoice: async (invoiceData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/invoices', invoiceData);
    return response.data;
  },
  
  getInvoice: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/invoices/${id}`);
    return response.data;
  },
  
  updateInvoice: async (id: number, invoiceData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/invoices/${id}`, invoiceData);
    return response.data;
  },
  
  deleteInvoice: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/invoices/${id}`);
    return response.data;
  },
  
  getBillingMasters: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/billing-masters?${queryParams.toString()}`);
    return response.data;
  },
  
  createBillingMaster: async (billingMasterData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/billing-masters', billingMasterData);
    return response.data;
  },
  
  getBillingMaster: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/billing-masters/${id}`);
    return response.data;
  },
  
  updateBillingMaster: async (id: number, billingMasterData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/billing-masters/${id}`, billingMasterData);
    return response.data;
  },
  
  deleteBillingMaster: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/billing-masters/${id}`);
    return response.data;
  },
};
