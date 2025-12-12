# Services Directory

Modular API service layer for FIDEAS React UI application.

## Structure

```
services/
├── apiClient.ts          # Base axios instance with auth interceptors
├── index.ts              # Main export file - import from here
├── MIGRATION_GUIDE.md    # Guide for migrating from old structure
└── modules/
    ├── auth/             # Authentication
    ├── admin/            # User, role, tenant management
    ├── account/          # Financial accounting
    ├── inventory/        # Product, customer, supplier
    └── care/             # Healthcare (clinic + diagnostic)
```

## Quick Start

### Import Services
```typescript
import { 
  authService,
  userService,
  accountService,
  ledgerService,
  productService,
  patientService
} from '../../services';
```

### Use Services
```typescript
// Authentication
await authService.login({ username, password });

// Ledger operations
const entries = await ledgerService.getLedgerEntries(filters);

// Patient management
const patients = await patientService.getPatients({ page: 1 });
```

## Modules

### 🔐 Auth Module
- `authService` - Login, logout

### 👥 Admin Module
- `userService` - User CRUD, import/export
- `roleService` - Role management, permissions, user-role mappings
- `tenantService` - Tenant settings, legal entities, financial years, agencies

### 💰 Account Module
- `accountService` - Chart of accounts, account groups
- `ledgerService` - Ledger entries, summaries
- `journalService` - Journal entries
- `voucherService` - Voucher management, series
- `paymentService` - Payments, receipts
- `reportService` - Trial balance, P&L, balance sheet, cash flow, GST reports

### 📦 Inventory Module
- `productService` - Product CRUD, import/export
- `customerService` - Customer management
- `supplierService` - Supplier management

### 🏥 Care Module (Clinic + Diagnostic)
- `patientService` - Patient management
- `doctorService` - Doctor management
- `appointmentService` - Appointment scheduling
- `diagnosticService` - Tests, test panels, test orders, test results, test categories
- `prescriptionService` - Prescriptions, medical records
- `billingService` - Invoices, billing masters

## API Client

The `apiClient` is a configured axios instance with:
- Base URL configuration
- JWT token authentication
- Automatic token refresh
- 401 redirect to login
- Request/response interceptors

## Best Practices

1. **Import from main index**: Always import from `'../../services'`
2. **Use specific services**: Import only what you need
3. **Type safety**: All services return typed responses
4. **Error handling**: Wrap service calls in try-catch
5. **Loading states**: Manage loading states in components

## Example Component

```typescript
import React, { useState, useEffect } from 'react';
import { ledgerService, accountService } from '../../services';

const LedgerComponent = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ledgerService.getLedgerEntries({
        page: 1,
        per_page: 10
      });
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to load ledger', error);
    } finally {
      setLoading(false);
    }
  };

  return <div>{/* Component JSX */}</div>;
};
```

## Adding New Services

1. Create service file in appropriate module directory
2. Export from module's `index.ts`
3. Export from main `services/index.ts`
4. Update this README

See `MIGRATION_GUIDE.md` for detailed migration instructions.
