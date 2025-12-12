import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const accountService = {
  getAccounts: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/account-masters');
    return response.data;
  },
  
  createAccount: async (accountData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/account-masters', accountData);
    return response.data;
  },
  
  updateAccount: async (id: number, accountData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/account-masters/${id}`, accountData);
    return response.data;
  },
  
  deleteAccount: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/account-masters/${id}`);
    return response.data;
  },
  
  getAccountTypes: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/account/account-types');
    return response.data;
  },
  
  getAccountGroups: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/account-groups');
    return response.data;
  },
  
  createAccountGroup: async (groupData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/account-groups', groupData);
    return response.data;
  },
  
  updateAccountGroup: async (id: number, groupData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/account-groups/${id}`, groupData);
    return response.data;
  },
  
  deleteAccountGroup: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/account-groups/${id}`);
    return response.data;
  },

  // Journal Entries
  getJournalEntries: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/account/journal-entries?${queryParams.toString()}`);
    return response.data;
  },
  
  createJournalEntry: async (entryData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/journal-entries', entryData);
    return response.data;
  },

  // Payments
  getPayments: async (params?: { page?: number; per_page?: number; search?: string; payment_mode?: string; payment_type?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.payment_mode) queryParams.append('payment_mode', params.payment_mode);
    if (params?.payment_type) queryParams.append('payment_type', params.payment_type);
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/account/payments?${queryParams.toString()}`);
    return response.data;
  },
  
  getPayment: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/payments/${id}`);
    return response.data;
  },
  
  createPayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/payments', paymentData);
    return response.data;
  },

  // Vouchers
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

  // Recurring Vouchers
  getRecurringVouchers: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/recurring-vouchers');
    return response.data;
  },
  
  createRecurringVoucher: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/recurring-vouchers', data);
    return response.data;
  },
  
  updateRecurringVoucher: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/recurring-vouchers/${id}`, data);
    return response.data;
  },
  
  deleteRecurringVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/recurring-vouchers/${id}`);
    return response.data;
  },

  // Reports
  getTrialBalance: async (fromDate?: string, toDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/trial-balance?${queryParams.toString()}`);
    return response.data;
  },
  
  getProfitLoss: async (fromDate?: string, toDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/profit-loss?${queryParams.toString()}`);
    return response.data;
  },
  
  getBalanceSheet: async (asOfDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.append('as_of_date', asOfDate);
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/balance-sheet?${queryParams.toString()}`);
    return response.data;
  },
  
  getCashFlow: async (fromDate?: string, toDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/cash-flow?${queryParams.toString()}`);
    return response.data;
  },
  
  getGSTR1: async (month: string): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/gst/gstr1?month=${month}`);
    return response.data;
  },
  
  getGSTR3B: async (month: string): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/gst/gstr3b?month=${month}`);
    return response.data;
  },

  // Taxes
  getTaxes: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/taxes');
    return response.data;
  },
  
  createTax: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/account/taxes', data);
    return response.data;
  },
  
  updateTax: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/account/taxes/${id}`, data);
    return response.data;
  },
  
  deleteTax: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/taxes/${id}`);
    return response.data;
  },

  // Cost Centers
  getCostCenters: async (): Promise<PaginatedResponse> => {
    const response = await apiClient.get<PaginatedResponse>('/api/v1/account/cost-centers');
    return response.data;
  },
};
