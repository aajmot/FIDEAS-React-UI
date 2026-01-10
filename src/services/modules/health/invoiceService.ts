import apiClient from '../../apiClient';
import { PaginatedResponse } from '../../../types';

export const invoiceService = {
  getTestInvoices: async (params?: {
    page?: number; per_page?: number;
    search?: string;
    patient_id?: number;
    status?: string;
    payment_status?: string;
    include_items?: boolean;
  }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search.toString());
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    if (params?.status) {
      params.status.split(',').map(s => {
        queryParams.append('status', s.toString());
      });
    }
    if (params?.payment_status) {
      params.payment_status.split(',').map(s => {
        queryParams.append('payment_status', s.toString());
      });
    }
    //if (params?.payment_status) queryParams.append('payment_status', params.payment_status.toString());
    if (params?.include_items) queryParams.append('include_items', params.include_items.toString());

    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/testinvoices?${queryParams.toString()}`);
    return response.data;
  },
  getTestInvoice: (id: number) => apiClient.get(`/api/v1/health/testinvoices/${id}`),
  createTestInvoice: (data: any) => apiClient.post('/api/v1/health/testinvoices', data),
  updateTestInvoice: (id: number, data: any) => apiClient.put(`/api/v1/health/testinvoices/${id}`, data),
  deleteTestInvoice: (id: number) => apiClient.delete(`/api/v1/health/testinvoices/${id}`)
};
