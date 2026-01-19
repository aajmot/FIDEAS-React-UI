import apiClient from '../../apiClient';
import { 
  InvoicePaymentReportRequest, 
  InvoicePaymentReportResponse 
} from '../../../types/invoicePaymentReport';

export const invoicePaymentReportService = {
  /**
   * Fetch invoice payment report for specified date range and users
   * @param request - Contains start_date, end_date, and user_ids
   * @returns Promise with report data
   */
  getInvoicePaymentReport: async (
    request: InvoicePaymentReportRequest
  ): Promise<InvoicePaymentReportResponse> => {
    try {
      const response = await apiClient.post<InvoicePaymentReportResponse>(
        '/api/v1/health/reports/invoice-payment',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice payment report:', error);
      throw error;
    }
  }
};
