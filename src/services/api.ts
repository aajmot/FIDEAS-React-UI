import axios from 'axios';
import { LoginRequest, LoginResponse, BaseResponse, PaginatedResponse } from '../types';

//const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_BASE_URL = (window as any).ENV?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && token.split('.').length === 3) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    // Invalid token format, clear it
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },
  
  logout: async (): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/auth/logout');
    return response.data;
  },
};

export const adminService = {
  getUsers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/users?${queryParams.toString()}`);
    return response.data;
  },
  
  createUser: async (userData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/users', userData);
    return response.data;
  },
  
  updateUser: async (id: number, userData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/users/${id}`);
    return response.data;
  },
  
  getRoles: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/roles?${queryParams.toString()}`);
    return response.data;
  },
  
  createRole: async (roleData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/roles', roleData);
    return response.data;
  },
  
  updateRole: async (id: number, roleData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/roles/${id}`, roleData);
    return response.data;
  },
  
  deleteRole: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/roles/${id}`);
    return response.data;
  },
  
  downloadUsersTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/admin/users/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importUsers: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/admin/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  downloadRolesTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/admin/roles/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importRoles: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/admin/roles/import', formData, {
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
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/user-role-mappings?${queryParams.toString()}`);
    return response.data;
  },
  
  createUserRoleMapping: async (mappingData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/user-role-mappings', mappingData);
    return response.data;
  },
  
  deleteUserRoleMapping: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/user-role-mappings/${id}`);
    return response.data;
  },
  
  bulkDeleteUserRoleMappings: async (ids: number[]): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/user-role-mappings/bulk-delete', ids);
    return response.data;
  },
  
  deleteAllUsersFromRole: async (roleId: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/user-role-mappings/role/${roleId}`);
    return response.data;
  },
  
  updateRoleUsers: async (roleId: number, userIds: number[]): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/user-role-mappings/role/${roleId}`, userIds);
    return response.data;
  },
  
  getRoleUsers: async (roleId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/admin/user-role-mappings/role/${roleId}`);
    return response.data;
  },
  
  downloadUserRoleMappingsTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/admin/user-role-mappings/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importUserRoleMappings: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/admin/user-role-mappings/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getTenant: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/admin/tenant');
    return response.data;
  },
  
  updateTenant: async (tenantData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>('/api/v1/admin/tenant', tenantData);
    return response.data;
  },
  
  getTenantSettings: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/admin/tenant-settings');
    return response.data;
  },
  
  updateTenantSetting: async (setting: string, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/tenant-settings/${setting}`, data);
    return response.data;
  },
  
  getLegalEntities: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/legal-entities?${queryParams.toString()}`);
    return response.data;
  },
  
  createLegalEntity: async (entityData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/legal-entities', entityData);
    return response.data;
  },
  
  updateLegalEntity: async (id: number, entityData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/legal-entities/${id}`, entityData);
    return response.data;
  },
  
  deleteLegalEntity: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/legal-entities/${id}`);
    return response.data;
  },
  
  downloadLegalEntitiesTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/admin/legal-entities/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importLegalEntities: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/admin/legal-entities/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getFinancialYears: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/financial-years?${queryParams.toString()}`);
    return response.data;
  },
  
  createFinancialYear: async (yearData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/financial-years', yearData);
    return response.data;
  },
  
  updateFinancialYear: async (id: number, yearData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/financial-years/${id}`, yearData);
    return response.data;
  },
  
  deleteFinancialYear: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/financial-years/${id}`);
    return response.data;
  },
  
  downloadFinancialYearsTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/admin/financial-years/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importFinancialYears: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/admin/financial-years/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Agencies
  getAgencies: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/agencies?${queryParams.toString()}`);
    return response.data;
  },
  
  createAgency: async (agencyData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/agencies', agencyData);
    return response.data;
  },
  
  updateAgency: async (id: number, agencyData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/agencies/${id}`, agencyData);
    return response.data;
  },
  
  deleteAgency: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/agencies/${id}`);
    return response.data;
  },
  
  downloadAgenciesTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/admin/agencies/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importAgencies: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/admin/agencies/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Role Menu Mapping
  getRoleMenuMappings: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/role-menu-mappings?${queryParams.toString()}`);
    return response.data;
  },
  
  getRoleMenus: async (roleId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/admin/role-menu-mappings/${roleId}/menus`);
    return response.data;
  },
  
  updateRoleMenus: async (roleId: number, menuMappings: any[]): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/role-menu-mappings/${roleId}/menus`, menuMappings);
    return response.data;
  },
  
  // User Menus
  getUserMenus: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/admin/menus');
    return response.data;
  },
  
  // Agency Commissions
  getAgencyCommissions: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/agencycommissions?${queryParams.toString()}`);
    return response.data;
  },
  
  createAgencyCommission: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/agencycommissions', data);
    return response.data;
  },
  
  updateAgencyCommission: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/agencycommissions/${id}`, data);
    return response.data;
  },
  
  deleteAgencyCommission: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/agencycommissions/${id}`);
    return response.data;
  },
  
  // Order Commissions
  getOrderCommissions: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await api.get<PaginatedResponse>(`/api/v1/admin/ordercommissions?${queryParams.toString()}`);
    return response.data;
  },
  
  getOrderCommission: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/admin/ordercommissions/${id}`);
    return response.data;
  },
  
  createOrderCommission: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/ordercommissions', data);
    return response.data;
  },
  
  updateOrderCommission: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/ordercommissions/${id}`, data);
    return response.data;
  },
  
  deleteOrderCommission: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/ordercommissions/${id}`);
    return response.data;
  },
  
  // Transaction Templates
  getTransactionTemplates: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/admin/transaction-templates');
    return response.data;
  },
  
  getTransactionTemplateRules: async (templateId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/admin/transaction-templates/${templateId}/rules`);
    return response.data;
  },
  
  updateTransactionTemplateRules: async (templateId: number, rules: any[]): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/transaction-templates/${templateId}/rules`, rules);
    return response.data;
  },
  
  getAccountConfigurations: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/admin/account-configurations');
    return response.data;
  },
  
  getAccountConfigurationKeys: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/admin/account-configuration-keys');
    return response.data;
  },
  
  updateAccountConfiguration: async (configKey: string, data: { account_id: number; module?: string }): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/admin/account-configurations/${configKey}`, data);
    return response.data;
  },
  
  deleteAccountConfiguration: async (configId: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/admin/account-configurations/${configId}`);
    return response.data;
  },
  
  getAccounts: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/account/account-masters');
    return response.data;
  },

  getAccountTypes: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/account/account-types');
    return response.data;
  },
};

export const clinicAgencyService = {
  createAgency: async (agencyData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/admin/agencies', agencyData);
    return response.data;
  },
};

export const inventoryService = {
  // Units
  getUnits: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/units?${queryParams.toString()}`);
    return response.data;
  },
  
  createUnit: async (unitData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/units', unitData);
    return response.data;
  },
  
  updateUnit: async (id: number, unitData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/inventory/units/${id}`, unitData);
    return response.data;
  },
  
  deleteUnit: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/units/${id}`);
    return response.data;
  },
  
  downloadUnitsTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/inventory/units/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importUnits: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/inventory/units/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Categories
  getCategories: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/categories?${queryParams.toString()}`);
    return response.data;
  },
  
  createCategory: async (categoryData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/categories', categoryData);
    return response.data;
  },
  
  updateCategory: async (id: number, categoryData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/inventory/categories/${id}`, categoryData);
    return response.data;
  },
  
  deleteCategory: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/categories/${id}`);
    return response.data;
  },
  
  downloadCategoriesTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/inventory/categories/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importCategories: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/inventory/categories/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Products
  getProducts: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/products?${queryParams.toString()}`);
    return response.data;
  },

  getProduct: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/inventory/products/get/${id}`);
    return response.data;
  },
  
  createProduct: async (productData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/products', productData);
    return response.data;
  },
  
  updateProduct: async (id: number, productData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/inventory/products/update/${id}`, productData);
    return response.data;
  },
  
  deleteProduct: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/products/${id}`);
    return response.data;
  },
  
  downloadProductsTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/inventory/products/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importProducts: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/inventory/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Customers
  getCustomers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/customers?${queryParams.toString()}`);
    return response.data;
  },
  
  createCustomer: async (customerData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/customers', customerData);
    return response.data;
  },
  
  updateCustomer: async (id: number, customerData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/inventory/customers/${id}`, customerData);
    return response.data;
  },
  
  deleteCustomer: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/customers/${id}`);
    return response.data;
  },
  
  downloadCustomersTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/inventory/customers/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importCustomers: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/inventory/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Suppliers
  getSuppliers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/suppliers?${queryParams.toString()}`);
    return response.data;
  },
  
  createSupplier: async (supplierData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/suppliers', supplierData);
    return response.data;
  },

  getSupplier: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/inventory/suppliers/${id}`);
    return response.data;
  },

  updateSupplier: async (id: number, supplierData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/inventory/suppliers/${id}`, supplierData);
    return response.data;
  },  deleteSupplier: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/suppliers/${id}`);
    return response.data;
  },
  
  downloadSuppliersTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/inventory/suppliers/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importSuppliers: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/inventory/suppliers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  
  // Purchase Orders
  getPurchaseOrders: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/purchase-orders?${queryParams.toString()}`);
    return response.data;
  },
  
  createPurchaseOrder: async (orderData: any): Promise<BaseResponse> => {
    const normalizedOrder = {
      ...orderData,
      items: Array.isArray(orderData.items)
        ? orderData.items.map((item: any) => ({
            ...item,
            expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString() : item.expiry_date,
            total_price: item.total_price ?? item.unit_price * item.quantity,
            total_amount: item.total_amount ?? item.unit_price * item.quantity,
            is_active: item.is_active ?? true
          }))
        : []
    };

    const response = await api.post<BaseResponse>('/api/v1/inventory/purchase-orders', normalizedOrder);
    return response.data;
  },
  
  getPurchaseOrder: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/inventory/purchase-orders/${id}`);
    return response.data;
  },
  
  reversePurchaseOrder: async (id: number, reason: { reason: string }): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/inventory/purchase-orders/${id}/reverse`, reason);
    return response.data;
  },
  
  // Sales Orders
  getSalesOrders: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/inventory/sales-orders');
    return response.data;
  },
  
  createSalesOrder: async (orderData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/sales-orders', orderData);
    return response.data;
  },
  
  getSalesOrder: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/inventory/sales-orders/${id}`);
    return response.data;
  },
  
  reverseSalesOrder: async (id: number, reason: string): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/inventory/sales-orders/${id}/reverse`, { reason });
    return response.data;
  },
  
  // Product Wastes
  getProductWastes: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/inventory/waste-products');
    return response.data;
  },
  
  createProductWaste: async (wasteData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/waste-products', wasteData);
    return response.data;
  },
  
  deleteProductWaste: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/waste-products/${id}`);
    return response.data;
  },

  // Stock Adjustments
  getStockAdjustments: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/stock-adjustments?${queryParams.toString()}`);
    return response.data;
  },

  createStockAdjustment: async (adjustmentData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/inventory/stock-adjustments', adjustmentData);
    return response.data;
  },

  getStockAdjustment: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/inventory/stock-adjustments/${id}`);
    return response.data;
  },

  deleteStockAdjustment: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/inventory/stock-adjustments/${id}`);
    return response.data;
  },

  // Warehouses
  getWarehouses: async (params?: { search?: string; page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/warehouses?${queryParams.toString()}`);
    return response.data;
  },
  
  // Stock Meter Summary
  getStockMeterSummary: async (productId?: number): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (productId) queryParams.append('product_id', productId.toString());
    
    const response = await api.get<BaseResponse>(`/api/v1/inventory/stock-meter-summary?${queryParams.toString()}`);
    return response.data;
  },
  
  // Stock Summary
  getStockSummary: async (productId?: number): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (productId) queryParams.append('product_id', productId.toString());
    
    const response = await api.get<BaseResponse>(`/api/v1/inventory/stock-summary?${queryParams.toString()}`);
    return response.data;
  },
  
  // Stock Details
  getStockDetails: async (productId?: number, params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (productId) queryParams.append('product_id', productId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/stock-details?${queryParams.toString()}`);
    return response.data;
  },
  
  // Stock Tracking Summary
  getStockTrackingSummary: async (filters?: {
    product_id?: string;
    movement_type?: string;
    reference_type?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.product_id) queryParams.append('product_id', filters.product_id);
    if (filters?.movement_type) queryParams.append('movement_type', filters.movement_type);
    if (filters?.reference_type) queryParams.append('reference_type', filters.reference_type);
    if (filters?.from_date) queryParams.append('from_date', filters.from_date);
    if (filters?.to_date) queryParams.append('to_date', filters.to_date);
    
    const response = await api.get<BaseResponse>(`/api/v1/inventory/stock-tracking-summary?${queryParams.toString()}`);
    return response.data;
  },

  // Stock Movements
  getStockMovements: async (filters?: {
    product_id?: string;
    movement_type?: string;
    reference_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.product_id) queryParams.append('product_id', filters.product_id);
    if (filters?.movement_type) queryParams.append('movement_type', filters.movement_type);
    if (filters?.reference_type) queryParams.append('reference_type', filters.reference_type);
    if (filters?.from_date) queryParams.append('from_date', filters.from_date);
    if (filters?.to_date) queryParams.append('to_date', filters.to_date);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/stock-movements?${queryParams.toString()}`);
    return response.data;
  },

  // Purchase Invoices
  getPurchaseInvoices: async (params?: { supplier_id?: number; page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/purchase-invoices?${queryParams.toString()}`);
    return response.data;
  },

  // Sales Invoices
  getSalesInvoices: async (params?: { customer_id?: number; page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await api.get<PaginatedResponse>(`/api/v1/inventory/sales-invoices?${queryParams.toString()}`);
    return response.data;
  },

  getSalesInvoiceById: async (invoiceId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/invoice/sales-invoices/${invoiceId}`);
    return response.data;
  },

  getPurchaseInvoiceById: async (invoiceId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/invoice/purchase-invoices/${invoiceId}`);
    return response.data;
  },
};

export const accountService = {
  // Chart of Accounts
  getAccounts: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/account-masters');
    return response.data;
  },
  
  createAccount: async (accountData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/account-masters', accountData);
    return response.data;
  },
  
  updateAccount: async (id: number, accountData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/account-masters/${id}`, accountData);
    return response.data;
  },
  
  deleteAccount: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/account-masters/${id}`);
    return response.data;
  },
  
  // Journal Entries
  getJournalEntries: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/account/journal-entries?${queryParams.toString()}`);
    return response.data;
  },
  
  createJournalEntry: async (entryData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/journal-entries', entryData);
    return response.data;
  },
  
  postJournalEntry: async (journalId: number): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/account/journal-entries/${journalId}/post`);
    return response.data;
  },
  
  unpostJournalEntry: async (journalId: number): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/account/journal-entries/${journalId}/unpost`);
    return response.data;
  },
  
  deleteJournalEntry: async (journalId: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/journal-entries/${journalId}`);
    return response.data;
  },
  
  // Ledger
  getLedgerEntries: async (filters?: {
    account_id?: string;
    from_date?: string;
    to_date?: string;
    voucher_type?: string;
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.account_id) queryParams.append('account_id', filters.account_id);
    if (filters?.from_date) queryParams.append('from_date', filters.from_date);
    if (filters?.to_date) queryParams.append('to_date', filters.to_date);
    if (filters?.voucher_type) queryParams.append('voucher_type', filters.voucher_type);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/account/ledger?${queryParams.toString()}`);
    return response.data;
  },
  
  getLedgerSummary: async (filters?: {
    account_id?: string;
    from_date?: string;
    to_date?: string;
    voucher_type?: string;
  }): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.account_id) queryParams.append('account_id', filters.account_id);
    if (filters?.from_date) queryParams.append('from_date', filters.from_date);
    if (filters?.to_date) queryParams.append('to_date', filters.to_date);
    if (filters?.voucher_type) queryParams.append('voucher_type', filters.voucher_type);
    
    const response = await api.get<BaseResponse>(`/api/v1/account/ledger/summary?${queryParams.toString()}`);
    return response.data;
  },
  
  // Vouchers
  getVouchers: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/vouchers');
    return response.data;
  },
  
  getVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/account/vouchers/${id}`);
    return response.data;
  },
  
  createVoucher: async (voucherData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/vouchers', voucherData);
    return response.data;
  },
  
  updateVoucher: async (id: number, voucherData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/vouchers/${id}`, voucherData);
    return response.data;
  },
  
  deleteVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/vouchers/${id}`);
    return response.data;
  },
  
  postVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/account/vouchers/${id}/post`);
    return response.data;
  },
  
  unpostVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/account/vouchers/${id}/unpost`);
    return response.data;
  },
  
  reverseVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/account/vouchers/${id}/reverse`);
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
    
    const response = await api.get<PaginatedResponse>(`/api/v1/account/payments?${queryParams.toString()}`);
    return response.data;
  },
  
  getPayment: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/account/payments/${id}`);
    return response.data;
  },
  
  recordPayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/record-payment', paymentData);
    return response.data;
  },
  
  recordReceipt: async (receiptData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/record-receipt', receiptData);
    return response.data;
  },
  
  createPayment: async (paymentData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/payments', paymentData);
    return response.data;
  },
  
  updatePayment: async (id: number, paymentData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/payments/${id}`, paymentData);
    return response.data;
  },
  
  deletePayment: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/payments/${id}`);
    return response.data;
  },
  
  // Account Groups
  getAccountGroups: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/account-groups');
    return response.data;
  },
  
  createAccountGroup: async (groupData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/account-groups', groupData);
    return response.data;
  },
  
  updateAccountGroup: async (id: number, groupData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/account-groups/${id}`, groupData);
    return response.data;
  },
  
  deleteAccountGroup: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/account-groups/${id}`);
    return response.data;
  },

  // Account Types
  getAccountTypes: async (): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>('/api/v1/account/account-types');
    return response.data;
  },
  
  // Voucher Types
  getVoucherTypes: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/voucher-types');
    return response.data;
  },
  
  // Reports
  getTrialBalance: async (fromDate?: string, toDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    
    const response = await api.get<BaseResponse>(`/api/v1/account/trial-balance?${queryParams.toString()}`);
    return response.data;
  },
  
  getProfitLoss: async (fromDate?: string, toDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    
    const response = await api.get<BaseResponse>(`/api/v1/account/profit-loss?${queryParams.toString()}`);
    return response.data;
  },
  
  getBalanceSheet: async (asOfDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.append('as_of_date', asOfDate);
    
    const response = await api.get<BaseResponse>(`/api/v1/account/balance-sheet?${queryParams.toString()}`);
    return response.data;
  },
  
  getGSTR1: async (month: string): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/gst/gstr1?month=${month}`);
    return response.data;
  },
  
  getGSTR3B: async (month: string): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/gst/gstr3b?month=${month}`);
    return response.data;
  },
  
  getCashFlow: async (fromDate?: string, toDate?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    
    const response = await api.get<BaseResponse>(`/api/v1/account/cash-flow?${queryParams.toString()}`);
    return response.data;
  },
  
  // Voucher Series
  getVoucherSeries: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/voucher-series');
    return response.data;
  },
  
  createVoucherSeries: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/voucher-series', data);
    return response.data;
  },
  
  updateVoucherSeries: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/voucher-series/${id}`, data);
    return response.data;
  },
  
  deleteVoucherSeries: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/voucher-series/${id}`);
    return response.data;
  },
  
  // Recurring Vouchers
  getRecurringVouchers: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/recurring-vouchers');
    return response.data;
  },
  
  createRecurringVoucher: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/recurring-vouchers', data);
    return response.data;
  },
  
  updateRecurringVoucher: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/recurring-vouchers/${id}`, data);
    return response.data;
  },
  
  deleteRecurringVoucher: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/recurring-vouchers/${id}`);
    return response.data;
  },
  
  // Tax Management
  getTaxes: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/taxes');
    return response.data;
  },
  
  createTax: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/taxes', data);
    return response.data;
  },
  
  updateTax: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/account/taxes/${id}`, data);
    return response.data;
  },
  
  deleteTax: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/account/taxes/${id}`);
    return response.data;
  },
  
  // Currency Management
  getCurrencies: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/currencies');
    return response.data;
  },
  
  getExchangeRate: async (fromCurrency: string, toCurrency: string, date?: string): Promise<BaseResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('from_currency', fromCurrency);
    queryParams.append('to_currency', toCurrency);
    if (date) queryParams.append('date', date);
    
    const response = await api.get<BaseResponse>(`/api/v1/account/exchange-rates?${queryParams.toString()}`);
    return response.data;
  },
  
  createExchangeRate: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/exchange-rates', data);
    return response.data;
  },
  
  // Bank Reconciliation
  getBankReconciliations: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const response = await api.get<PaginatedResponse>(`/api/v1/account/bank-reconciliations?${queryParams.toString()}`);
    return response.data;
  },
  
  createBankReconciliation: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/account/bank-reconciliations', data);
    return response.data;
  },
  
  getUnmatchedItems: async (reconId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/account/bank-reconciliations/${reconId}/unmatched-items`);
    return response.data;
  },
  
  matchReconciliationItem: async (reconId: number, data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>(`/api/v1/account/bank-reconciliations/${reconId}/match`, data);
    return response.data;
  },
  
  // Cost Centers
  getCostCenters: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/account/cost-centers');
    return response.data;
  },
};

export const clinicService = {
  // Patients
  getPatients: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/patients?${queryParams.toString()}`);
    return response.data;
  },
  
  createPatient: async (patientData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/patients', patientData);
    return response.data;
  },
  
  getPatient: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/patients/${id}`);
    return response.data;
  },
  
  updatePatient: async (id: number, patientData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/patients/${id}`, patientData);
    return response.data;
  },
  
  deletePatient: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/patients/${id}`);
    return response.data;
  },
  
  downloadPatientsTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/health/patients/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importPatients: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/health/patients/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Doctors
  getDoctors: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/doctors?${queryParams.toString()}`);
    return response.data;
  },
  
  createDoctor: async (doctorData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/doctors', doctorData);
    return response.data;
  },
  
  getDoctor: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/doctors/${id}`);
    return response.data;
  },
  
  updateDoctor: async (id: number, doctorData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/doctors/${id}`, doctorData);
    return response.data;
  },
  
  deleteDoctor: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/doctors/${id}`);
    return response.data;
  },
  
  downloadDoctorsTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/health/doctors/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importDoctors: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/health/doctors/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Appointments
  getAppointments: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/appointments?${queryParams.toString()}`);
    return response.data;
  },
  
  createAppointment: async (appointmentData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/appointments', appointmentData);
    return response.data;
  },
  
  getAppointment: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/appointments/${id}`);
    return response.data;
  },
  
  updateAppointment: async (id: number, appointmentData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/appointments/${id}`, appointmentData);
    return response.data;
  },
  
  deleteAppointment: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/appointments/${id}`);
    return response.data;
  },
  
  exportAppointmentTemplate: async (): Promise<string> => {
    const response = await api.get('/api/v1/health/appointments/export-template', {
      responseType: 'text'
    });
    return response.data;
  },
  
  importAppointments: async (csvContent: string): Promise<{ imported: number; errors: string[] }> => {
    const response = await api.post('/api/v1/health/appointments/import', { csv_content: csvContent });
    return response.data;
  },
  
  // Medical Records
  getMedicalRecords: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/medical-records?${queryParams.toString()}`);
    return response.data;
  },
  
  createMedicalRecord: async (recordData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/medical-records', recordData);
    return response.data;
  },
  
  getMedicalRecord: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/medical-records/${id}`);
    return response.data;
  },
  
  exportMedicalRecordTemplate: async (): Promise<string> => {
    const response = await api.get('/api/v1/health/medical-records/export-template', {
      responseType: 'text'
    });
    return response.data;
  },
  
  importMedicalRecords: async (csvContent: string): Promise<{ imported: number; errors: string[] }> => {
    const response = await api.post('/api/v1/health/medical-records/import', { csv_content: csvContent });
    return response.data;
  },
  
  getMedicalRecordByAppointment: async (appointmentId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/medical-records/appointment/${appointmentId}`);
    return response.data;
  },
  
  updateMedicalRecord: async (id: number, recordData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/medical-records/${id}`, recordData);
    return response.data;
  },
  
  deleteMedicalRecord: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/medical-records/${id}`);
    return response.data;
  },
  
  // Prescriptions
  getPrescriptions: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/prescriptions?${queryParams.toString()}`);
    return response.data;
  },
  
  createPrescription: async (prescriptionData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/prescriptions', prescriptionData);
    return response.data;
  },
  
  getPrescription: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/prescriptions/${id}`);
    return response.data;
  },
  
  updatePrescription: async (id: number, prescriptionData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/prescriptions/${id}`, prescriptionData);
    return response.data;
  },
  
  deletePrescription: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/prescriptions/${id}`);
    return response.data;
  },
  
  // Billing/Invoices
  getInvoices: async (): Promise<PaginatedResponse> => {
    const response = await api.get<PaginatedResponse>('/api/v1/health/invoices');
    return response.data;
  },
  
  createInvoice: async (invoiceData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/invoices', invoiceData);
    return response.data;
  },
  
  getInvoice: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/invoices/${id}`);
    return response.data;
  },
  
  updateInvoice: async (id: number, invoiceData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/invoices/${id}`, invoiceData);
    return response.data;
  },
  
  deleteInvoice: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/invoices/${id}`);
    return response.data;
  },
  
  // Billing Masters
  getBillingMasters: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/billing-masters?${queryParams.toString()}`);
    return response.data;
  },
  
  createBillingMaster: async (billingMasterData: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/billing-masters', billingMasterData);
    return response.data;
  },
  
  getBillingMaster: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/billing-masters/${id}`);
    return response.data;
  },
  
  updateBillingMaster: async (id: number, billingMasterData: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/billing-masters/${id}`, billingMasterData);
    return response.data;
  },
  
  deleteBillingMaster: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/billing-masters/${id}`);
    return response.data;
  },
  
  downloadBillingMastersTemplate: async (): Promise<Blob> => {
    const response = await api.get('/api/v1/health/billing-masters/export-template', {
      responseType: 'blob'
    });
    return response.data;
  },
  
  importBillingMasters: async (csvContent: string): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/billing-masters/import', { csv_content: csvContent });
    return response.data;
  },
  

};

export const diagnosticService = {
  // Test Panels
  getTestPanels: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/diagnostic/testpanels?${queryParams.toString()}`);
    return response.data;
  },
  
  getTestPanel: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/diagnostic/testpanels/${id}`);
    return response.data;
  },
  
  createTestPanel: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/diagnostic/testpanels', data);
    return response.data;
  },
  
  updateTestPanel: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/diagnostic/testpanels/${id}`, data);
    return response.data;
  },
  
  deleteTestPanel: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/diagnostic/testpanels/${id}`);
    return response.data;
  },
  
  // Test Orders
  getTestOrders: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/diagnostic/testorders?${queryParams.toString()}`);
    return response.data;
  },
  
  getTestOrder: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/diagnostic/testorders/${id}`);
    return response.data;
  },
  
  createTestOrder: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/diagnostic/testorders', data);
    return response.data;
  },
  
  updateTestOrder: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/diagnostic/testorders/${id}`, data);
    return response.data;
  },
  
  deleteTestOrder: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/diagnostic/testorders/${id}`);
    return response.data;
  },
  
  // Test Results
  getTestResults: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/diagnostic/testresults?${queryParams.toString()}`);
    return response.data;
  },
  
  getTestResultByOrderId: async (orderId: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/diagnostic/testresults/order/${orderId}`);
    return response.data;
  },
  
  getTestResult: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/diagnostic/testresults/${id}`);
    return response.data;
  },
  
  createTestResult: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/diagnostic/testresults', data);
    return response.data;
  },
  
  updateTestResult: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/diagnostic/testresults/${id}`, data);
    return response.data;
  },
  
  deleteTestResult: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/diagnostic/testresults/${id}`);
    return response.data;
  },
  
  getTest: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/tests/${id}`);
    return response.data;
  }
};

export const careService = {
  // Test Categories
  getTestCategories: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/testcategories?${queryParams.toString()}`);
    return response.data;
  },
  
  createTestCategory: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/testcategories', data);
    return response.data;
  },
  
  updateTestCategory: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/testcategories/${id}`, data);
    return response.data;
  },
  
  deleteTestCategory: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/testcategories/${id}`);
    return response.data;
  },
  
  exportTestCategoriesTemplate: async (): Promise<void> => {
    const response = await api.get('/api/v1/health/testcategories/export-template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'test_categories_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  importTestCategories: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/health/testcategories/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  // Tests
  getTests: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await api.get<PaginatedResponse>(`/api/v1/health/tests?${queryParams.toString()}`);
    return response.data;
  },
  
  getTest: async (id: number): Promise<BaseResponse> => {
    const response = await api.get<BaseResponse>(`/api/v1/health/tests/${id}`);
    return response.data;
  },
  
  createTest: async (data: any): Promise<BaseResponse> => {
    const response = await api.post<BaseResponse>('/api/v1/health/tests', data);
    return response.data;
  },
  
  updateTest: async (id: number, data: any): Promise<BaseResponse> => {
    const response = await api.put<BaseResponse>(`/api/v1/health/tests/${id}`, data);
    return response.data;
  },
  
  deleteTest: async (id: number): Promise<BaseResponse> => {
    const response = await api.delete<BaseResponse>(`/api/v1/health/tests/${id}`);
    return response.data;
  },
  
  exportTestsTemplate: async (): Promise<void> => {
    const response = await api.get('/api/v1/health/tests/export-template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tests_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  
  importTests: async (file: File): Promise<BaseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<BaseResponse>('/api/v1/health/tests/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export default api;