import api from './api';
import { BaseResponse, PaginatedResponse } from '../types';

// Dashboard Service
export const dashboardService = {
  getKPIs: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/dashboard/kpis');
    return response.data;
  },
  
  getRevenueTrend: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/dashboard/revenue-trend');
    return response.data;
  },
  
  getTopProducts: async (limit: number = 10): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/dashboard/top-products?limit=${limit}`);
    return response.data;
  },
  
  getRecentTransactions: async (limit: number = 10): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/dashboard/recent-transactions?limit=${limit}`);
    return response.data;
  },
};

// Add to accountService
export const accountServiceExtensions = {
  // Contra Vouchers
  getContraVouchers: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const response = await api.get<PaginatedResponse>(`/api/v1/account/contra?${queryParams.toString()}`);
    return response.data;
  },
  
  createContra: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/contra', data);
    return response.data;
  },
  
  // Credit Notes
  getCreditNotes: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const response = await api.get<PaginatedResponse>(`/api/v1/account/credit-notes?${queryParams.toString()}`);
    return response.data;
  },
  
  createCreditNote: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/credit-notes', data);
    return response.data;
  },
  
  // Debit Notes
  getDebitNotes: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const response = await api.get<PaginatedResponse>(`/api/v1/account/debit-notes?${queryParams.toString()}`);
    return response.data;
  },
  
  createDebitNote: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/debit-notes', data);
    return response.data;
  },
  
  // Aging Analysis
  getReceivablesAging: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/account/aging-analysis/receivables');
    return response.data;
  },
  
  getPayablesAging: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/account/aging-analysis/payables');
    return response.data;
  },
  
  // TDS Management
  getTDSSections: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/tds-sections');
    return response.data;
  },
  
  createTDSSection: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/tds-sections', data);
    return response.data;
  },
  
  calculateTDS: async (data: { section_code: string; amount: number }): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/tds-calculate', data);
    return response.data;
  },
};

// Merge extensions into accountService
Object.assign((window as any).accountService || {}, accountServiceExtensions);

export { dashboardService as default };
