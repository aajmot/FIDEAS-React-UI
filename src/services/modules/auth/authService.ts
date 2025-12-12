import apiClient from '../../apiClient';
import { LoginRequest, LoginResponse, BaseResponse } from '../../../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },
  
  logout: async (): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/auth/logout');
    return response.data;
  },
};
