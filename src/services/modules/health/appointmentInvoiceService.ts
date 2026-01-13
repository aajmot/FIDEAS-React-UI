import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const appointmentInvoiceService = {
  getAppointmentInvoices: async (params?: { page?: number; per_page?: number; search?: string;
    status?: string;
    payment_status?: string;
   }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
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
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/health/appointment-invoices?${queryParams.toString()}`);
    return response.data;
  },
  
  createAppointmentInvoice: async (invoiceData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/health/appointment-invoices', invoiceData);
    return response.data;
  },
  
  getAppointmentInvoice: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/health/appointment-invoices/${id}`);
    return response.data;
  },
  
  updateAppointmentInvoice: async (id: number, invoiceData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/health/appointment-invoices/${id}`, invoiceData);
    return response.data;
  },
  
  deleteAppointmentInvoice: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/health/appointment-invoices/${id}`);
    return response.data;
  },
};