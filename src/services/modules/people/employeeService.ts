import apiClient from '../../apiClient';

export const employeeService = {
  getEmployees: async (params?: { page?: number; per_page?: number; search?: string; status?: string; employee_type?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.employee_type) queryParams.append('employee_type', params.employee_type);
      const response = await apiClient.get(`/api/v1/people/employees?${queryParams.toString()}`);
      return { data: response.data.data || response.data, total: response.data.total || 0 };
    } catch (error: any) {
      throw error;
    }
  },

  getEmployee: (id: number) => apiClient.get(`/api/v1/people/employees/${id}`),

  createEmployee: (data: any) => apiClient.post('/api/v1/people/employees', data),

  updateEmployee: (id: number, data: any) => apiClient.put(`/api/v1/people/employees/${id}`, data),

  deleteEmployee: (id: number) => apiClient.delete(`/api/v1/people/employees/${id}`),

  downloadTemplate: async () => {
    try {
      const response = await apiClient.get('/api/v1/people/employees/export-template', { responseType: 'blob' });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  importEmployees: (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/api/v1/people/employees/import', formData);
    } catch (error: any) {
      throw error;
    }
  }
};
