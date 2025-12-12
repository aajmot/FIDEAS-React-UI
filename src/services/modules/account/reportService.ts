import apiClient from '../../apiClient';
import { BaseResponse } from '../../../types';

export const reportService = {
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
  
  getGSTR1: async (month: number, year: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/gstr1?month=${month}&year=${year}`);
    return response.data;
  },
  
  getGSTR3B: async (month: number, year: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/account/gstr3b?month=${month}&year=${year}`);
    return response.data;
  },
};
