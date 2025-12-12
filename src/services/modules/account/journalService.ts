import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const journalService = {
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
  
  postJournalEntry: async (journalId: number): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>(`/api/v1/account/journal-entries/${journalId}/post`);
    return response.data;
  },
  
  unpostJournalEntry: async (journalId: number): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>(`/api/v1/account/journal-entries/${journalId}/unpost`);
    return response.data;
  },
  
  deleteJournalEntry: async (journalId: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/account/journal-entries/${journalId}`);
    return response.data;
  },
};
