// Auth
export { authService } from './modules/auth/authService';

// Admin
export { 
  userService, 
  roleService, 
  tenantService 
} from './modules/admin';

// Account
export { 
  accountService, 
  ledgerService, 
  journalService, 
  voucherService, 
  paymentService, 
  reportService 
} from './modules/account';

// Inventory
export { 
  productService, 
  customerService, 
  supplierService 
} from './modules/inventory';

// Care (includes Clinic and Diagnostic)
export { 
  patientService, 
  doctorService, 
  appointmentService, 
  diagnosticService, 
  prescriptionService, 
  billingService 
} from './modules/care';

// Dashboard
export { 
  dashboardService, 
  accountServiceExtensions 
} from './modules/dashboard';

// Re-export apiClient for backward compatibility
export { default as api } from './apiClient';
