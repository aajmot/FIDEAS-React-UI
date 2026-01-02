import apiClient from '../../apiClient';

export const invoiceService = {
  getTestInvoices: () => apiClient.get('/api/v1/health/testinvoices'),
  getTestInvoice: (id: number) => apiClient.get(`/api/v1/health/testinvoices/${id}`),
  createTestInvoice: (data: any) => apiClient.post('/api/v1/health/testinvoices', data),
  updateTestInvoice: (id: number, data: any) => apiClient.put(`/api/v1/health/testinvoices/${id}`, data),
  deleteTestInvoice: (id: number) => apiClient.delete(`/api/v1/health/testinvoices/${id}`)
};
