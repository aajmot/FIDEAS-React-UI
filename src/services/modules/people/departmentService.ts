import apiClient from '../../apiClient';

export const departmentService = {
  getDepartments: async (params?: { page?: number; per_page?: number; search?: string; status?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      const response = await apiClient.get(`/api/v1/people/departments?${queryParams.toString()}`);
      return { data: response.data.data || response.data, total: response.data.total || 0 };
    } catch (error: any) {
      throw error;
    }
  },

  getDepartment: (id: number) => apiClient.get(`/api/v1/people/departments/${id}`),

  getActiveDepartments: async () => {
    try {
      const response = await apiClient.get('/api/v1/people/departments/active');
      return { data: response.data.data || response.data };
    } catch (error: any) {
      throw error;
    }
  },

  getDepartmentHierarchy: async () => {
    try {
      const response = await apiClient.get('/api/v1/people/departments/hierarchy');
      return { data: response.data.data || response.data };
    } catch (error: any) {
      throw error;
    }
  },

  createDepartment: (data: any) => apiClient.post('/api/v1/people/departments', data),

  updateDepartment: (id: number, data: any) => apiClient.put(`/api/v1/people/departments/${id}`, data),

  deleteDepartment: (id: number) => apiClient.delete(`/api/v1/people/departments/${id}`),

  downloadTemplate: async () => {
    try {
      const response = await apiClient.get('/api/v1/people/departments/export-template', { responseType: 'blob' });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  importDepartments: (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/api/v1/people/departments/import', formData);
    } catch (error: any) {
      throw error;
    }
  }
};
