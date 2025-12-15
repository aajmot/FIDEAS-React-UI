/**
 * @deprecated This file is deprecated. Import from './services' instead.
 * This file now re-exports from the new modular structure for backward compatibility.
 * 
 * Migration:
 * OLD: import { accountService } from '../../services/api';
 * NEW: import { accountService } from '../../services';
 */

import apiClient from './apiClient';
import { userService, roleService, tenantService } from './modules/admin';
import { patientService, doctorService, appointmentService, billingService } from './modules/health';
import { productService, customerService, supplierService } from './modules/inventory';
import { diagnosticService, prescriptionService } from './modules/health';
import { dashboardService } from './modules/dashboard';

// Re-export all services from new modular structure
export * from './index';

// Re-export apiClient as default for backward compatibility
export default apiClient;

// Re-export dashboardService from new location
export { dashboardService };

export const gstService = {
  getGSTR1: (month: string) => apiClient.get(`/api/v1/gst/gstr1?month=${month}`),
  getGSTR3B: (month: string) => apiClient.get(`/api/v1/gst/gstr3b?month=${month}`)
};

export const accountExtensions = {
  getTDSEntries: () => apiClient.get('/api/v1/account/tds-entries'),
  createTDSEntry: (data: any) => apiClient.post('/api/v1/account/tds-entries', data),
  updateTDSEntry: (id: number, data: any) => apiClient.put(`/api/v1/account/tds-entries/${id}`, data),
  deleteTDSEntry: (id: number) => apiClient.delete(`/api/v1/account/tds-entries/${id}`),
  getTDSSections: () => apiClient.get('/api/v1/account/tds-sections'),
  createTDSSection: (data: any) => apiClient.post('/api/v1/account/tds-sections', data),
  calculateTDS: (data: any) => apiClient.post('/api/v1/account/calculate-tds', data),
  getReceivablesAging: () => apiClient.get('/api/v1/account/reports/ar-aging'),
  getPayablesAging: () => apiClient.get('/api/v1/account/reports/ap-aging'),
  getContraVouchers: () => apiClient.get('/api/v1/account/contra'),
  createContra: (data: any) => apiClient.post('/api/v1/account/contra', data),
  getCreditNotes: () => apiClient.get('/api/v1/account/credit-notes'),
  getCreditNoteById: (id: number) => apiClient.get(`/api/v1/account/credit-notes/${id}`),
  createCreditNote: (data: any) => apiClient.post('/api/v1/account/credit-notes', data),
  getDebitNotes: () => apiClient.get('/api/v1/account/debit-notes'),
  getDebitNoteById: (id: number) => apiClient.get(`/api/v1/account/debit-notes/${id}`),
  createDebitNote: (data: any) => apiClient.post('/api/v1/account/debit-notes', data)
};

export const batchService = {
  createBatch: (data: any) => apiClient.post('/api/v1/batch/create', data),
  getNearExpiry: (days: number) => apiClient.get(`/api/v1/batch/near-expiry?days=${days}`),
  getProductBatches: (productId: number) => apiClient.get(`/api/v1/batch/product/${productId}`)
};

export const currencyService = {
  getCurrencies: () => apiClient.get('/api/v1/admin/currency/list'),
  convertAmount: (data: any) => apiClient.post('/api/v1/admin/currency/convert', data),
  updateExchangeRate: (currencyId: number, rate: number) => 
    apiClient.put('/api/v1/admin/currency/exchange-rate', { currency_id: currencyId, rate }),
  getForexGainLoss: (voucherId: number) => apiClient.get(`/api/v1/admin/currency/forex-gain-loss/${voucherId}`)
};

export const reconciliationService = {
  importStatement: (accountId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/api/v1/account/import/${accountId}`, formData);
  },
  autoMatch: (accountId: number) => apiClient.post(`/api/v1/account/auto-match/${accountId}`),
  manualReconcile: (data: any) => apiClient.post('/api/v1/account/manual-reconcile', data),
  getUnreconciled: (accountId: number) => apiClient.get(`/api/v1/account/unreconciled/${accountId}`)
};

export const notificationService = {
  sendEmail: (data: any) => apiClient.post('/api/v1/notifications/send-email', data),
  sendInvoiceEmail: (voucherId: number) => apiClient.post(`/api/v1/notifications/invoice-email/${voucherId}`),
  sendPaymentReminder: (partyId: number) => apiClient.post(`/api/v1/notifications/payment-reminder/${partyId}`),
  sendLowStockAlert: (productId: number) => apiClient.post(`/api/v1/notifications/low-stock-alert/${productId}`)
};

// Combine admin services
export const adminService = {
  ...userService,
  ...roleService,
  ...tenantService,
  getVouchers: () => apiClient.get('/api/v1/account/vouchers'),
  getVoucher: (id: number) => apiClient.get(`/api/v1/account/vouchers/${id}`),
  createVoucher: (data: any) => apiClient.post('/api/v1/account/vouchers', data),
  updateVoucher: (id: number, data: any) => apiClient.put(`/api/v1/account/vouchers/${id}`, data),
  deleteVoucher: (id: number) => apiClient.delete(`/api/v1/account/vouchers/${id}`),
  postVoucher: (id: number) => apiClient.post(`/api/v1/account/vouchers/${id}/post`),
  unpostVoucher: (id: number) => apiClient.post(`/api/v1/account/vouchers/${id}/unpost`),
  reverseVoucher: (id: number) => apiClient.post(`/api/v1/account/vouchers/${id}/reverse`),
  getVoucherSeries: () => apiClient.get('/api/v1/account/voucher-series'),
  createVoucherSeries: (data: any) => apiClient.post('/api/v1/account/voucher-series', data),
  updateVoucherSeries: (id: number, data: any) => apiClient.put(`/api/v1/account/voucher-series/${id}`, data),
  deleteVoucherSeries: (id: number) => apiClient.delete(`/api/v1/account/voucher-series/${id}`),
  deleteAccountConfiguration: (id: number) => apiClient.delete(`/api/v1/admin/account-configurations/${id}`),
  getAgencyCommissions: async (params?: { page?: number; per_page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const response = await apiClient.get(`/api/v1/admin/agency-commissions?${queryParams.toString()}`);
    return { data: response.data.data || response.data, total: response.data.total || 0 };
  },
  createAgencyCommission: (data: any) => apiClient.post('/api/v1/admin/agency-commissions', data),
  updateAgencyCommission: (id: number, data: any) => apiClient.put(`/api/v1/admin/agency-commissions/${id}`, data),
  deleteAgencyCommission: (id: number) => apiClient.delete(`/api/v1/admin/agency-commissions/${id}`),
  downloadAgenciesTemplate: async () => {
    const response = await apiClient.get('/api/v1/admin/agencies/template', { responseType: 'blob' });
    return response.data;
  },
  importAgencies: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/admin/agencies/import', formData);
  },
  downloadFinancialYearsTemplate: async () => {
    const response = await apiClient.get('/api/v1/admin/financial-years/template', { responseType: 'blob' });
    return response.data;
  },
  importFinancialYears: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/admin/financial-years/import', formData);
  },
  downloadLegalEntitiesTemplate: async () => {
    const response = await apiClient.get('/api/v1/admin/legal-entities/template', { responseType: 'blob' });
    return response.data;
  },
  importLegalEntities: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/admin/legal-entities/import', formData);
  },
  getOrderCommissions: () => apiClient.get('/api/v1/admin/order-commissions'),
  getOrderCommission: (id: number) => apiClient.get(`/api/v1/admin/order-commissions/${id}`),
  createOrderCommission: (data: any) => apiClient.post('/api/v1/admin/order-commissions', data),
  updateOrderCommission: (id: number, data: any) => apiClient.put(`/api/v1/admin/order-commissions/${id}`, data),
  deleteOrderCommission: (id: number) => apiClient.delete(`/api/v1/admin/order-commissions/${id}`),
  getRoleMenuMappings: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    const response = await apiClient.get(`/api/v1/admin/role-menu-mappings?${queryParams.toString()}`);
    return { data: response.data.data || response.data, total: response.data.total || 0 };
  },
  updateRoleUsers: (roleId: number, userIds: number[]) => apiClient.put(`/api/v1/admin/roles/${roleId}/users`, { user_ids: userIds }),
  deleteAllUsersFromRole: (roleId: number) => apiClient.delete(`/api/v1/admin/roles/${roleId}/users`),
  getRoleUsers: (roleId: number) => apiClient.get(`/api/v1/admin/roles/${roleId}/users`),
  downloadUserRoleMappingsTemplate: async () => {
    const response = await apiClient.get('/api/v1/admin/user-role-mappings/template', { responseType: 'blob' });
    return response.data;
  },
  importUserRoleMappings: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/v1/admin/user-role-mappings/import', formData);
    return { success: true, data: response.data };
  },
  // Account service methods accessed through accountService
  getGSTR1: (month: number, year: number) => apiClient.get(`/api/v1/account/gstr1?month=${month}&year=${year}`),
  getGSTR3B: (month: number, year: number) => apiClient.get(`/api/v1/account/gstr3b?month=${month}&year=${year}`),
  getJournalEntries: (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    return apiClient.get(`/api/v1/account/journal-entries?${queryParams.toString()}`);
  },
  createJournalEntry: (data: any) => apiClient.post('/api/v1/account/journal-entries', data),
  getPayments: (params?: { page?: number; per_page?: number; search?: string; payment_type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.payment_type) queryParams.append('payment_type', params.payment_type);
    return apiClient.get(`/api/v1/account/payments?${queryParams.toString()}`);
  },
  createPayment: (data: any) => apiClient.post('/api/v1/account/payments', data),
  getPayment: (id: number) => apiClient.get(`/api/v1/account/payments/${id}`),
  getRecurringVouchers: () => apiClient.get('/api/v1/account/recurring-vouchers'),
  createRecurringVoucher: (data: any) => apiClient.post('/api/v1/account/recurring-vouchers', data),
  updateRecurringVoucher: (id: number, data: any) => apiClient.put(`/api/v1/account/recurring-vouchers/${id}`, data),
  deleteRecurringVoucher: (id: number) => apiClient.delete(`/api/v1/account/recurring-vouchers/${id}`),
  getTrialBalance: (fromDate: string, toDate: string) => apiClient.get(`/api/v1/account/reports/trial-balance?from_date=${fromDate}&to_date=${toDate}`),
  getProfitLoss: (fromDate: string, toDate: string) => apiClient.get(`/api/v1/account/reports/profit-loss?from_date=${fromDate}&to_date=${toDate}`),
  getBalanceSheet: (asOfDate: string) => apiClient.get(`/api/v1/account/reports/balance-sheet?as_of_date=${asOfDate}`),
  getCashFlow: (fromDate: string, toDate: string) => apiClient.get(`/api/v1/account/reports/cash-flow?from_date=${fromDate}&to_date=${toDate}`),
  getTaxes: () => apiClient.get('/api/v1/account/taxes'),
  createTax: (data: any) => apiClient.post('/api/v1/account/taxes', data),
  updateTax: (id: number, data: any) => apiClient.put(`/api/v1/account/taxes/${id}`, data),
  deleteTax: (id: number) => apiClient.delete(`/api/v1/account/taxes/${id}`),
  getCostCenters: () => apiClient.get('/api/v1/account/cost-centers')
};

// Combine clinic services
export const clinicService = {
  ...patientService,
  ...doctorService,
  ...appointmentService,
  ...billingService,
  ...prescriptionService,
  exportAppointmentTemplate: async () => {
    const response = await apiClient.get('/api/v1/clinic/appointments/template', { responseType: 'blob' });
    return response.data;
  },
  importAppointments: (data: string) => apiClient.post('/api/v1/clinic/appointments/import', { data }),
  downloadBillingMastersTemplate: async () => {
    const response = await apiClient.get('/api/v1/clinic/billing-masters/template', { responseType: 'blob' });
    return response.data;
  },
  importBillingMasters: (data: string) => apiClient.post('/api/v1/clinic/billing-masters/import', { data }),
  exportMedicalRecordTemplate: async () => {
    const response = await apiClient.get('/api/v1/clinic/medical-records/template', { responseType: 'blob' });
    return response.data;
  },
  importMedicalRecords: (data: string) => apiClient.post('/api/v1/clinic/medical-records/import', { data })
};

// Care service (tests and categories)
export const healthService = {
  ...diagnosticService,
  ...prescriptionService,
  importTestCategories: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/health/testcategories/import', formData);
  },
  exportTestCategoriesTemplate: async () => {
    const response = await apiClient.get('/api/v1/health/testcategories/export-template', { responseType: 'blob' });
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test_categories_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  importTests: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/health/tests/import', formData);
  },
  exportTestsTemplate: async () => {
    const response = await apiClient.get('/api/v1/health/tests/export-template', { responseType: 'blob' });
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tests_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

// Keep careService as alias for backward compatibility
export const careService = healthService;

// Combine inventory services (already exported individually)
export const inventoryService = {
  ...productService,
  ...customerService,
  ...supplierService,
  getStockValuation: () => apiClient.get('/api/v1/inventory/stock-valuation'),
  getStockAging: () => apiClient.get('/api/v1/inventory/stock-aging'),
  getCOGS: (productId: number, quantity: number, method: string) => 
    apiClient.get(`/api/v1/inventory/cogs?product_id=${productId}&quantity=${quantity}&method=${method}`),
  getSalesInvoices: (params?: { customer_id?: number; per_page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    return apiClient.get(`/api/v1/invoice/sales-invoices?${queryParams.toString()}`);
  },
  getSalesInvoiceById: (id: number) => apiClient.get(`/api/v1/invoice/sales-invoices/${id}`),
  getPurchaseInvoices: (params?: { supplier_id?: number; per_page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    return apiClient.get(`/api/v1/invoice/purchase-invoices?${queryParams.toString()}`);
  },
  getPurchaseInvoiceById: (id: number) => apiClient.get(`/api/v1/invoice/purchase-invoices/${id}`),
  getWarehouses: (params?: { per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    return apiClient.get(`/api/v1/inventory/warehouses?${queryParams.toString()}`);
  },
  getStockAdjustments: () => apiClient.get('/api/v1/inventory/stock-adjustments'),
  deleteStockAdjustment: (id: number) => apiClient.delete(`/api/v1/inventory/stock-adjustments/${id}`),
  getStockSummary: (productId?: number) => {
    const url = productId ? `/api/v1/inventory/stock-summary?product_id=${productId}` : '/api/v1/inventory/stock-summary';
    return apiClient.get(url);
  },
  getStockDetails: async (productId?: number, params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (productId) queryParams.append('product_id', productId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    const response = await apiClient.get(`/api/v1/inventory/stock-details?${queryParams.toString()}`);
    return { data: response.data.data || response.data, total: response.data.total || 0, page: response.data.page || 1 };
  },
  getStockMeterSummary: (productId?: number) => {
    const url = productId ? `/api/v1/inventory/stock-meter-summary?product_id=${productId}` : '/api/v1/inventory/stock-meter-summary';
    return apiClient.get(url);
  },
  getStockTrackingSummary: (params?: { product_id?: string; movement_type?: string; reference_type?: string; from_date?: string; to_date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.product_id) queryParams.append('product_id', params.product_id);
    if (params?.movement_type) queryParams.append('movement_type', params.movement_type);
    if (params?.reference_type) queryParams.append('reference_type', params.reference_type);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    return apiClient.get(`/api/v1/inventory/stock-tracking-summary?${queryParams.toString()}`);
  },
  getStockMovements: (params?: { product_id?: string; movement_type?: string; reference_type?: string; from_date?: string; to_date?: string; page?: number; per_page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.product_id) queryParams.append('product_id', params.product_id);
    if (params?.movement_type) queryParams.append('movement_type', params.movement_type);
    if (params?.reference_type) queryParams.append('reference_type', params.reference_type);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    return apiClient.get(`/api/v1/inventory/stock-movements?${queryParams.toString()}`);
  },
  getUnits: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    const response = await apiClient.get(`/api/v1/inventory/units?${queryParams.toString()}`);
    return { data: response.data.data || response.data, total: response.data.total || 0, page: response.data.page || 1 };
  },
  createUnit: (data: any) => apiClient.post('/api/v1/inventory/units', data),
  updateUnit: (id: number, data: any) => apiClient.put(`/api/v1/inventory/units/${id}`, data),
  deleteUnit: (id: number) => apiClient.delete(`/api/v1/inventory/units/${id}`),
  downloadUnitsTemplate: async () => {
    const response = await apiClient.get('/api/v1/inventory/units/template', { responseType: 'blob' });
    return response.data;
  },
  importUnits: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/inventory/units/import', formData);
  },
  getCategories: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    const response = await apiClient.get(`/api/v1/inventory/categories?${queryParams.toString()}`);
    return { data: response.data.data || response.data, total: response.data.total || 0, page: response.data.page || 1 };
  },
  createCategory: (data: any) => apiClient.post('/api/v1/inventory/categories', data),
  updateCategory: (id: number, data: any) => apiClient.put(`/api/v1/inventory/categories/${id}`, data),
  deleteCategory: (id: number) => apiClient.delete(`/api/v1/inventory/categories/${id}`),
  downloadCategoriesTemplate: async () => {
    const response = await apiClient.get('/api/v1/inventory/categories/template', { responseType: 'blob' });
    return response.data;
  },
  importCategories: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/inventory/categories/import', formData);
  },
  createProductWaste: async (data: any) => {
    const response = await apiClient.post('/api/v1/inventory/product-wastes', data);
    return { success: true, data: response.data.data || response.data, message: 'Product waste created successfully' };
  },
  getProductWastes: async () => {
    const response = await apiClient.get('/api/v1/inventory/waste-products');
    return { data: response.data.data || response.data || [] };
  },
  deleteProductWaste: (id: number) => apiClient.delete(`/api/v1/inventory/waste-products/${id}`),
  createPurchaseOrder: (data: any) => apiClient.post('/api/v1/inventory/purchase-orders', data),
  getPurchaseOrders: () => apiClient.get('/api/v1/inventory/purchase-orders'),
  getPurchaseOrder: (id: number) => apiClient.get(`/api/v1/inventory/purchase-orders/${id}`),
  reversePurchaseOrder: (id: number, data: { reason: string }) => apiClient.post(`/api/v1/inventory/purchase-orders/${id}/reverse`, data),
  createSalesOrder: (data: any) => apiClient.post('/api/v1/inventory/sales-orders', data),
  getSalesOrders: () => apiClient.get('/api/v1/inventory/sales-orders'),
  getSalesOrder: (id: number) => apiClient.get(`/api/v1/inventory/sales-orders/${id}`),
  reverseSalesOrder: (id: number, reason: string) => apiClient.post(`/api/v1/inventory/sales-orders/${id}/reverse`, { reason }),
  createStockAdjustment: (data: any) => apiClient.post('/api/v1/inventory/stock-adjustments', data)
};


