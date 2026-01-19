export interface InvoicePaymentReportRequest {
  start_date: string;
  end_date: string;
  user_ids: number[];
}

export interface InvoicePaymentReportItem {
  transaction_type: string;
  transaction_datetime: string;
  created_by_user_id: number;
  created_by_user_name: string;
  invoice_number: string;
  invoice_date: string | null;
  invoice_type: string | null;
  invoice_amount: number | null;
  payment_number: string | null;
  payment_date: string | null;
  payment_amount: number | null;
  allocated_amount: number | null;
  unallocated_amount: number | null;
  allocation_document_type: string | null;
  balance_amount: number | null;
}

export interface InvoicePaymentReportResponse {
  success: boolean;
  message: string;
  data: InvoicePaymentReportItem[];
}
