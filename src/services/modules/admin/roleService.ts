import apiClient from '../../apiClient';
import { BaseResponse, PaginatedResponse } from '../../../types';

export const roleService = {
  getRoles: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/admin/roles?${queryParams.toString()}`);
    return response.data;
  },
  
  createRole: async (roleData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/roles', roleData);
    return response.data;
  },
  
  updateRole: async (id: number, roleData: any): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/roles/${id}`, roleData);
    return response.data;
  },
  
  deleteRole: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/admin/roles/${id}`);
    return response.data;
  },
  
  downloadRolesTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/admin/roles/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importRoles: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/roles/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getUserRoleMappings: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get<PaginatedResponse>(`/api/v1/admin/user-role-mappings?${queryParams.toString()}`);
    return response.data;
  },
  
  createUserRoleMapping: async (mappingData: any): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/v1/admin/user-role-mappings', mappingData);
    return response.data;
  },
  
  deleteUserRoleMapping: async (id: number): Promise<BaseResponse> => {
    const response = await apiClient.delete<BaseResponse>(`/api/v1/admin/user-role-mappings/${id}`);
    return response.data;
  },
  
  getRoleMenus: async (roleId: number): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>(`/api/v1/admin/role-menu-mappings/${roleId}/menus`);
    return response.data;
  },
  
  getAllMenus: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/menus');
    return response.data;
  },
  
  updateRoleMenus: async (roleId: number, menuMappings: any[]): Promise<BaseResponse> => {
    const response = await apiClient.put<BaseResponse>(`/api/v1/admin/role-menu-mappings/${roleId}/menus`, menuMappings);
    return response.data;
  },
  
  getUserMenus: async (): Promise<BaseResponse> => {
    const response = await apiClient.get<BaseResponse>('/api/v1/admin/menus/me');
    return response.data;
  },
};
