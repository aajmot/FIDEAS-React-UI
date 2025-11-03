import api from './api';

export const dashboardService = {
  getKPIs: () => api.get('/api/v1/dashboard/kpis'),
  getRevenueTrend: () => api.get('/api/v1/dashboard/revenue-trend'),
  getTopProducts: () => api.get('/api/v1/dashboard/top-products'),
  getRecentTransactions: () => api.get('/api/v1/dashboard/recent-transactions')
};

export const gstService = {
  getGSTR1: (month: string) => api.get(`/api/v1/gst/gstr1?month=${month}`),
  getGSTR3B: (month: string) => api.get(`/api/v1/gst/gstr3b?month=${month}`)
};

export const inventoryService = {
  getStockValuation: () => api.get('/api/v1/inventory/stock-valuation'),
  getStockAging: () => api.get('/api/v1/inventory/stock-aging'),
  getCOGS: (productId: number, quantity: number, method: string) => 
    api.get(`/api/v1/inventory/cogs?product_id=${productId}&quantity=${quantity}&method=${method}`)
};

export const accountExtensions = {
  getTDSEntries: () => api.get('/api/v1/account/tds-entries'),
  createTDSEntry: (data: any) => api.post('/api/v1/account/tds-entries', data),
  updateTDSEntry: (id: number, data: any) => api.put(`/api/v1/account/tds-entries/${id}`, data),
  deleteTDSEntry: (id: number) => api.delete(`/api/v1/account/tds-entries/${id}`),
  getTDSSections: () => api.get('/api/v1/account/tds-sections'),
  createTDSSection: (data: any) => api.post('/api/v1/account/tds-sections', data),
  calculateTDS: (data: any) => api.post('/api/v1/account/calculate-tds', data),
  getReceivablesAging: () => api.get('/api/v1/account/reports/ar-aging'),
  getPayablesAging: () => api.get('/api/v1/account/reports/ap-aging'),
  getContraVouchers: () => api.get('/api/v1/account/contra'),
  createContra: (data: any) => api.post('/api/v1/account/contra', data),
  getCreditNotes: () => api.get('/api/v1/account/credit-notes'),
  createCreditNote: (data: any) => api.post('/api/v1/account/credit-notes', data),
  getDebitNotes: () => api.get('/api/v1/account/debit-notes'),
  createDebitNote: (data: any) => api.post('/api/v1/account/debit-notes', data)
};

export const batchService = {
  createBatch: (data: any) => api.post('/api/v1/batch/create', data),
  getNearExpiry: (days: number) => api.get(`/api/v1/batch/near-expiry?days=${days}`),
  getProductBatches: (productId: number) => api.get(`/api/v1/batch/product/${productId}`)
};

export const currencyService = {
  getCurrencies: () => api.get('/api/v1/admin/currency/list'),
  convertAmount: (data: any) => api.post('/api/v1/admin/currency/convert', data),
  updateExchangeRate: (currencyId: number, rate: number) => 
    api.put('/api/v1/admin/currency/exchange-rate', { currency_id: currencyId, rate }),
  getForexGainLoss: (voucherId: number) => api.get(`/api/v1/admin/currency/forex-gain-loss/${voucherId}`)
};

export const reconciliationService = {
  importStatement: (accountId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/v1/account/import/${accountId}`, formData);
  },
  autoMatch: (accountId: number) => api.post(`/api/v1/account/auto-match/${accountId}`),
  manualReconcile: (data: any) => api.post('/api/v1/account/manual-reconcile', data),
  getUnreconciled: (accountId: number) => api.get(`/api/v1/account/unreconciled/${accountId}`)
};

export const notificationService = {
  sendEmail: (data: any) => api.post('/api/v1/notifications/send-email', data),
  sendInvoiceEmail: (voucherId: number) => api.post(`/api/v1/notifications/invoice-email/${voucherId}`),
  sendPaymentReminder: (partyId: number) => api.post(`/api/v1/notifications/payment-reminder/${partyId}`),
  sendLowStockAlert: (productId: number) => api.post(`/api/v1/notifications/low-stock-alert/${productId}`)
};
