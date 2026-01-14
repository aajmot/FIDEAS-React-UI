export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  tenant_id: number;
  is_tenant_admin?: boolean;
  roles?: string[];
  role_ids?: number[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    user: User;
  };
}

export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface MenuItem {
  id: number;
  name: string;
  code: string;
  icon?: string;
  module_code: string;
  parent_id?: number;
  children?: MenuItem[];
}

export interface MenuGroup {
  name: string;
  icon: string;
  children: MenuItem[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  address?: string;
  tax_id?: string;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email?: string;
  tax_id?: string;
  contact_person?: string;
  address?: string;
  is_active: boolean;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_tax_id: string;
  reference_number: string;
  order_date: string;
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
  items?: PurchaseOrderItem[];
  
  // Optional fields for backward compatibility
  subtotal_amount?: number;
  header_discount_percent?: number;
  header_discount_amount?: number;
  taxable_amount?: number;
  igst_amount?: number;
  cess_amount?: number;
  net_amount?: number;
  currency_id?: number;
  exchange_rate?: number;
  is_reverse_charge?: boolean;
  is_tax_inclusive?: boolean;
  approval_status?: string;
}

export interface PurchaseOrderItem {
  id?: number;
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
  expiry_date: string;
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
  
  // Optional fields for backward compatibility
  total_price?: number;
  igst_rate?: number;
  igst_amount?: number;
  cess_rate?: number;
  cess_amount?: number;
  line_discount_percent?: number;
  line_discount_amount?: number;
}

export interface Product {
  id: number;
  tenant_id?: number;
  name: string;
  code?: string;
  description?: string;
  composition?: string;
  tags?: string;
  hsn_id?: number | null;
  hsn_code?: string;
  schedule?: string;
  manufacturer?: string;
  is_discontinued?: boolean;
  category_id?: number;
  subcategory_id?: number | null;
  unit_id?: number;

  // Pricing
  mrp_price?: number;
  selling_price?: number;
  cost_price?: number;
  is_tax_inclusive?: boolean;
  currency_id?: number | null;
  exchange_rate?: number | null;

  // Tax rates
  gst_rate?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cess_rate?: number;
  is_reverse_charge?: boolean;

  // Inventory
  is_composite?: boolean;
  is_inventory_item?: boolean;
  reorder_level?: number;
  danger_level?: number;
  min_stock?: number;
  max_stock?: number;

  // Commission / discounts / sales
  commission_type?: string;
  commission_value?: number;
  max_discount_percent?: number;

  // Misc
  barcode?: string;
  is_serialized?: boolean;
  warranty_months?: number;
  is_active?: boolean;

  // Audit
  created_at?: string;
  created_by?: number | string | null;
  updated_at?: string;
  updated_by?: number | string | null;
  is_deleted?: boolean;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  customer_id: number;
  customer_name: string;
  customer_gstin?: string;
  agency_id?: number;
  agency_name?: string;
  customer_phone?: string;
  customer_tax_id?: string;
  reference_number?: string;
  order_date: string;
  total_amount: number;
  subtotal_amount?: number;
  discount_percent: number;
  discount_amount: number;
  header_discount_percent?: number;
  header_discount_amount?: number;
  taxable_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_amount?: number;
  total_tax_amount?: number;
  roundoff: number;
  net_amount?: number;
  currency_id?: number;
  exchange_rate?: number;
  is_reverse_charge?: boolean;
  is_tax_inclusive?: boolean;
  status: string;
  approval_status?: string;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  free_quantity: number;
  unit_price: number;
  mrp?: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate?: number;
  gst_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_rate?: number;
  cess_amount?: number;
  description?: string;
  discount_percent: number;
  discount_amount: number;
  line_discount_percent?: number;
  line_discount_amount?: number;
  taxable_amount?: number;
  total_tax_amount?: number;
  total_amount: number;
  total_price?: number;
  batch_number?: string;
  expiry_date?: string;
  is_active?: boolean;
  hsn_code?: string;
}

export interface ProductWasteItem {
  id?: number;
  line_no: number;
  product_id: number;
  product_name?: string;
  batch_number?: string;
  quantity: number;
  unit_cost_base: number;
  unit_cost_foreign?: number;
  total_cost?: number;
  reason?: string;
}

export interface ProductWaste {
  id: number;
  waste_number: string;
  warehouse_id?: number;
  warehouse_name?: string;
  waste_date: string;
  reason: string;
  currency_id?: number;
  exchange_rate?: number;
  is_active?: boolean;
  voucher_id?: number;
  items?: ProductWasteItem[];
  // Legacy fields for backward compatibility
  product_id?: number;
  product_name?: string;
  batch_number?: string;
  quantity?: number;
  unit_cost_base?: number;
  unit_cost_foreign?: number;
  total_cost?: number;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  contact_person: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: string;
  account_group_id?: number;
  account_group_name?: string;
  parent_id?: number;
  parent_name?: string;
  opening_balance?: number;
  current_balance?: number;
  is_active: boolean;
  balance: number;
  is_system_account?: boolean;
}

export interface JournalEntry {
  id: number;
  date: string;
  voucher_number: string;
  description: string;
  total_amount: number;
  status: string;
  lines?: JournalLine[];
}

export interface JournalLine {
  account_id: number;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
}

export interface LedgerEntry {
  id: number;
  date: string;
  reference_type: string;
  voucher_number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  voucher_id?: number;
  is_reconciled?: boolean;
}

export interface Voucher {
  id: number;
  voucher_type: string;
  voucher_number: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  reference_number?: string;
  party_account_id?: number;
  payment_method?: string;
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  created_by?: string;
  lines?: VoucherLine[];
}

export interface VoucherLine {
  account_id: number;
  debit: number;
  credit: number;
  description: string;
}

export interface Payment {
  id: number;
  payment_number: string;
  payment_type: string;
  payment_mode?: string;
  payment_method: string;
  payment_date?: string;
  party_type?: string;
  party_id?: number;
  party_name: string;
  party_phone: string;
  account_id?: number;
  reference_type?: string;
  reference_id?: number;
  reference_number?: string;
  amount: number;
  date: string;
  description: string;
  remarks?: string;
  status: string;
  is_allocated?: boolean;
  allocations?: PaymentAllocation[];

}
export interface PaymentAllocation {
  id: number;
  document_type: string;
  document_id: string;
  document_number: string;
  allocated_amount_base: number;
  discount_amount_base: number;
  adjustment_amount_base: number;
  allocation_date: string;
  remarks: string;
}

export interface Patient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: number;
  employee_id: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
  license_number?: string;
  phone: string;
  email?: string;
  schedule_start?: string;
  schedule_end?: string;
  consultation_fee?: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: number;
  appointment_number: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  doctor_id: number;
  doctor_name: string;
  doctor_phone: string;
  doctor_license_number: string;
  doctor_specialization: string;
  agency_id?: number;
  agency_name?: string;
  agency_phone?: string;
  branch_id?: number;
  status: string;
  reason?: string;
  notes?: string;
  created_at?: string;
}

export interface MedicalRecord {
  id: number;
  record_number: string;
  patient_id: number;
  patient_name?: string;
  doctor_id: number;
  doctor_name?: string;
  appointment_id?: number;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  vital_signs?: string;
  lab_results?: string;
  notes?: string;
  created_at: string;
}

export interface Prescription {
  id: number;
  prescription_number: string;
  patient_id: number;
  patient_name?: string;
  patient_phone?: string;
  patient_age?: number;
  doctor_id: number;
  doctor_name?: string;
  doctor_license_number?: string;
  appointment_id?: number;
  appointment_number?: string;
  prescription_date: string;
  instructions?: string;
  items?: PrescriptionItem[];
  test_items?: PrescriptionTestItem[];
  created_at: string;
}

export interface PrescriptionItem {
  id?: number;
  product_id: number;
  product_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
}

export interface PrescriptionTestItem {
  id?: number;
  test_id: number;
  test_name?: string;
  instructions?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  appointment_id?: number;
  appointment_number?: string;
  patient_id: number;
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
  invoice_date: string;
  consultation_fee: number;
  payment_method?: string;
  payment_status: string;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  final_amount: number;
  items?: InvoiceItem[];
  created_at: string;
}

export interface InvoiceItem {
  id?: number;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface BillingMaster {
  id: number;
  description: string;
  note?: string;
  amount: number;
  hsn_code?: string;
  gst_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Agency {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tax_id?: string;
  agency_type?: string;
  created_at?: string;
  created_by?: string;
  modified_at?: string;
  modified_by?: string;
}

export interface Test {
  id: number;
  name: string;
  category_id?: number;
  rate?: number;
  gst?: number;
  cess?: number;
}

export interface PaymentTerm {
  id: number;
  code: string;
  name: string;
  description?: string;
  days: number;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  reference_number?: string;
  invoice_date: string;
  due_date?: string;
  supplier_id: number;
  supplier_name?: string;
  purchase_order_id?: number;
  payment_term_id?: number;
  warehouse_id?: number;
  base_currency_id: number;
  foreign_currency_id?: number;
  exchange_rate?: number;
  cgst_amount_base?: number;
  sgst_amount_base?: number;
  igst_amount_base?: number;
  ugst_amount_base?: number;
  cess_amount_base?: number;
  subtotal_base?: number;
  discount_amount_base?: number;
  tax_amount_base?: number;
  total_amount_base: number;
  subtotal_foreign?: number;
  discount_amount_foreign?: number;
  tax_amount_foreign?: number;
  total_amount_foreign?: number;
  paid_amount_base?: number;
  balance_amount_base?: number;
  status: string;
  notes?: string;
  tags?: string[];
  items?: PurchaseInvoiceItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseInvoiceItem {
  id?: number;
  line_no: number;
  product_id: number;
  product_name?: string;
  description?: string;
  hsn_code?: string;
  batch_number?: string;
  serial_numbers?: string;
  quantity: number;
  uom?: string;
  unit_price_base: number;
  discount_percent?: number;
  discount_amount_base?: number;
  taxable_amount_base: number;
  cgst_rate?: number;
  cgst_amount_base?: number;
  sgst_rate?: number;
  sgst_amount_base?: number;
  igst_rate?: number;
  igst_amount_base?: number;
  ugst_rate?: number;
  ugst_amount_base?: number;
  cess_rate?: number;
  cess_amount_base?: number;
  tax_amount_base?: number;
  total_amount_base: number;
  unit_price_foreign?: number;
  discount_amount_foreign?: number;
  taxable_amount_foreign?: number;
  tax_amount_foreign?: number;
  total_amount_foreign?: number;
  landed_cost_per_unit?: number;
}

// Healthcare Dashboard Types
export interface PatientAnalytics {
  total_patients: number;
  new_patients_month: number;
  active_patients: number;
  gender_distribution: {
    male: number;
    female: number;
    other: number;
  };
  age_groups: {
    under_18: number;
    age_18_35: number;
    age_36_55: number;
    age_56_70: number;
    over_70: number;
  };
}

export interface AppointmentAnalytics {
  total_appointments: number;
  completion_rate: number;
  no_show_rate: number;
  appointment_status: {
    scheduled: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
}

export interface ClinicalOperations {
  medical_records: number;
  prescriptions: number;
  test_orders: number;
  sample_collections: number;
}

export interface DoctorPerformance {
  id: number;
  doctor_name: string;
  specialization: string;
  total_appointments: number;
  completion_rate: number;
  consultation_fee: number;
}

export interface Department {
  id: number;
  department_code: string;
  department_name: string;
  description?: string;
  parent_department_id?: number;
  parent_name?: string;
  branch_id?: number;
  default_cost_center_id?: number;
  org_unit_type?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  employee_name: string;
  email: string;
  phone?: string;
  department_id?: number;
  department_name?: string;
  branch_id?: number;
  qualification?: string;
  specialization?: string;
  license_number?: string;
  license_expiry?: string;
  employee_type?: string;
  employment_type?: string;
  status: string;
  remarks?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}