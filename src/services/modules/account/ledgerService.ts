import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const ledgerService = {
  getLedgerEntries: async (filters?: {
    account_id?: string;
    from_date?: string;
    to_date?: string;
    reference_type?: string;
    is_reconciled?: boolean;
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.account_id) queryParams.append('account_id', filters.account_id);
    if (filters?.from_date) queryParams.append('from_date', filters.from_date);
    if (filters?.to_date) queryParams.append('to_date', filters.to_date);
    if (filters?.reference_type) queryParams.append('reference_type', filters.reference_type);
    if (filters?.is_reconciled !== undefined) queryParams.append('is_reconciled', filters.is_reconciled.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/account/ledger?${queryParams.toString()}`);
    return response.data;
  },
  
  getLedgerSummary: async (filters?: {
    account_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.account_id) queryParams.append('account_id', filters.account_id);
    if (filters?.from_date) queryParams.append('from_date', filters.from_date);
    if (filters?.to_date) queryParams.append('to_date', filters.to_date);
    
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/ledger/summary?${queryParams.toString()}`);
    return response.data;
  },
};
