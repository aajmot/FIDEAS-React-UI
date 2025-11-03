// Types for Purchase Order API payload

export interface PurchaseOrderApiPayload {
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_tax_id: string;
  reference_number: string;
  order_date: string; // ISO date string
  total_amount: number;
  sub_total: number;
  discount_percent: number;
  discount_amount: number;
  roundoff: number;
  status: string;
  cgst_amount: number;
  sgst_amount: number;
  total_tax_amount: number;
  notes: string;
  items: PurchaseOrderItemApiPayload[];
}

export interface PurchaseOrderItemApiPayload {
  product_id: number;
  product_name: string;
  quantity: number;
  free_quantity: number;
  unit_price: number;
  mrp: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  batch_number: string;
  expiry_date: string; // ISO date string
  is_active: boolean;
  hsn_code: string;
  description: string;
  // Tax related fields
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  taxable_amount: number;
  total_tax_amount: number;
}