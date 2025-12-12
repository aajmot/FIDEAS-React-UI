import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const voucherService = {
  getVouchers: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/vouchers');
    return response.data;
  },
  
  getVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/vouchers/${id}`);
    return response.data;
  },
  
  createVoucher: async (voucherData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/vouchers', voucherData);
    return response.data;
  },
  
  updateVoucher: async (id: number, voucherData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/vouchers/${id}`, voucherData);
    return response.data;
  },
  
  deleteVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/vouchers/${id}`);
    return response.data;
  },
  
  postVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>(`/api/v1/account/vouchers/${id}/post`);
    return response.data;
  },
  
  unpostVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>(`/api/v1/account/vouchers/${id}/unpost`);
    return response.data;
  },
  
  reverseVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>(`/api/v1/account/vouchers/${id}/reverse`);
    return response.data;
  },
  
  getVoucherTypes: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/voucher-types');
    return response.data;
  },
  
  getVoucherSeries: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/voucher-series');
    return response.data;
  },
  
  createVoucherSeries: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/voucher-series', data);
    return response.data;
  },
  
  updateVoucherSeries: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/voucher-series/${id}`, data);
    return response.data;
  },
  
  deleteVoucherSeries: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/voucher-series/${id}`);
    return response.data;
  },
};
