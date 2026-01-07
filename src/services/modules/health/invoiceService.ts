import apiClient from '../../apiClient';
import { PaginatedResponse } from '../../../types';

export const invoiceService = {
  getTestInvoices: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/testinvoices?${queryParams.toString()}`);
    return response.data;
  },
  getTestInvoice: (id: number) => apiClient.get(`/api/v1/health/testinvoices/${id}`),
  createTestInvoice: (data: any) => apiClient.post('/api/v1/health/testinvoices', data),
  updateTestInvoice: (id: number, data: any) => apiClient.put(`/api/v1/health/testinvoices/${id}`, data),
  deleteTestInvoice: (id: number) => apiClient.delete(`/api/v1/health/testinvoices/${id}`)
};
