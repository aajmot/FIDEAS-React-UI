import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const tenantService = {
  getTenant: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/tenant');
    return response.data;
  },
  
  updateTenant: async (tenantData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>('/api/v1/admin/tenant', tenantData);
    return response.data;
  },
  
  getTenantSettings: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/tenant-settings');
    return response.data;
  },
  
  updateTenantSetting: async (setting: string, data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/tenant-settings/${setting}`, data);
    return response.data;
  },
  
  updateTenantSettings: async (data: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>('/api/v1/admin/tenant-settings', data);
    return response.data;
  },
  
  getLegalEntities: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/admin/legal-entities?${queryParams.toString()}`);
    return response.data;
  },
  
  createLegalEntity: async (entityData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/legal-entities', entityData);
    return response.data;
  },
  
  updateLegalEntity: async (id: number, entityData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/legal-entities/${id}`, entityData);
    return response.data;
  },
  
  deleteLegalEntity: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/admin/legal-entities/${id}`);
    return response.data;
  },
  
  getFinancialYears: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/admin/financial-years?${queryParams.toString()}`);
    return response.data;
  },
  
  createFinancialYear: async (yearData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/financial-years', yearData);
    return response.data;
  },
  
  updateFinancialYear: async (id: number, yearData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/financial-years/${id}`, yearData);
    return response.data;
  },
  
  deleteFinancialYear: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/admin/financial-years/${id}`);
    return response.data;
  },
  
  getAgencies: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/admin/agencies?${queryParams.toString()}`);
    return response.data;
  },
  
  createAgency: async (agencyData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/agencies', agencyData);
    return response.data;
  },
  
  updateAgency: async (id: number, agencyData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/agencies/${id}`, agencyData);
    return response.data;
  },
  
  deleteAgency: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/admin/agencies/${id}`);
    return response.data;
  },
  
  getAccountConfigurations: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/account-configurations');
    return response.data;
  },
  
  updateAccountConfiguration: async (configKey: string, data: { account_id: number; module?: string }): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/account-configurations/${configKey}`, data);
    return response.data;
  },
  
  getAccounts: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/account/account-masters');
    return response.data;
  },
  
  getAccountTypes: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/account/account-types');
    return response.data;
  },
  
  getAccountConfigurationKeys: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/account-configuration-keys');
    return response.data;
  },
  
  getTransactionTemplates: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/transaction-templates');
    return response.data;
  },
  
  getTransactionTemplateRules: async (templateId: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/admin/transaction-templates/${templateId}/rules`);
    return response.data;
  },
  
  updateTransactionTemplateRules: async (templateId: number, rules: any[]): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/transaction-templates/${templateId}/rules`, { rules });
    return response.data;
  },
};
