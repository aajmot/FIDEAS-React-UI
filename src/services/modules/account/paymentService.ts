import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const paymentService = {
  getPayments: async (params?: {
    page?: number; per_page?: number;
    search?: string; payment_mode?: string; payment_type?: string;
    party_type?: string;
    status?: string;    
    is_allocated: boolean;
    include_details:boolean;
    include_allocations:boolean

  }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.payment_mode) queryParams.append('payment_mode', params.payment_mode);
    if (params?.payment_type) queryParams.append('payment_type', params.payment_type);
    if (params?.party_type) queryParams.append('party_type', params.party_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.is_allocated) queryParams.append('is_allocated', params.is_allocated.toString());

    if (params?.include_details) queryParams.append('include_details', params.include_details.toString());
    if (params?.include_allocations) queryParams.append('include_allocations', params.include_allocations.toString());

    const response = await apiClient.get<PaginatedResponse>(`/api/v1/account/payments?${queryParams.toString()}`);
    return response.data;
  },

  getPayment: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/payments/${id}`);
    return response.data;
  },

  recordPayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/record-payment', paymentData);
    return response.data;
  },

  recordReceipt: async (receiptData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/record-receipt', receiptData);
    return response.data;
  },

  createPayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/payments', paymentData);
    return response.data;
  },

  updatePayment: async (id: number, paymentData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/payments/${id}`, paymentData);
    return response.data;
  },

  deletePayment: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/payments/${id}`);
    return response.data;
  },

  createAdvancePayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/payments/advance/customer', paymentData);
    return response.data;
  },

  getAdvancePayments: async (params?: { page?: number; page_size?: number; payment_type?: string; party_type?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.payment_type) queryParams.append('payment_type', params.payment_type);
    if (params?.party_type) queryParams.append('party_type', params.party_type);

    const response = await apiClient.get<PaginatedResponse>(`/api/v1/account/payments?${queryParams.toString()}`);
    return response.data;
  },

  createInvoicePayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/payments/invoice', paymentData);
    return response.data;
  },

};
