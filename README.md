# FIDEAS React UI

A modern React TypeScript application that provides a web interface for the FIDEAS Enterprise Management System, matching the design and functionality of the desktop application.

## Features

- **Modern UI**: Clean, responsive design using Tailwind CSS
- **Authentication**: JWT-based authentication with the FIDEAS API
- **Role-based Navigation**: Dynamic menu system based on user permissions
- **Modular Architecture**: Reusable components and services
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **TypeScript**: Full type safety and better development experience

## Quick Start

1. **Install Dependencies**:
   ```bash
   cd fideas-react-ui
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```
   The app will open at http://localhost:3000

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── admin/          # Admin module components
│   ├── account/        # Account module components
│   ├── inventory/      # Inventory module components
│   ├── clinic/         # Clinic module components
│   ├── common/         # Shared components (DataTable, DatePicker, etc.)
│   └── layout/         # Layout components (Header, Layout)
├── context/            # React contexts (AuthContext)
├── pages/              # Page components (Dashboard, Login)
├── services/           # API services and utilities
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Environment Configuration

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://localhost:8000
```

## API Integration

The React app integrates with the FIDEAS API server:

- **Authentication**: `/api/v1/auth/login`, `/api/v1/auth/logout`
- **Admin Module**: `/api/v1/admin/*`
- **Inventory Module**: `/api/v1/inventory/*`
- **Account Module**: `/api/v1/account/*`
- **Clinic Module**: `/api/v1/clinic/*`

## Design System

The app uses a consistent design system matching the desktop application:

- **Primary Color**: `#2563eb` (Blue 600)
- **Secondary Color**: `#3b82f6` (Blue 500)
- **Accent Color**: `#1d4ed8` (Blue 700)
- **Typography**: System fonts with proper hierarchy
- **Icons**: Lucide React icons and emoji for consistency

### Compact Theme Configuration

The application uses a centralized CSS variable system for managing visual density and spacing. All theme settings are controlled from a single location in `src/index.css`.

**Quick Adjustment:**
```css
/* Edit these variables in src/index.css to change app density */
:root {
  --erp-font-size: 13px;        /* Base font size */
  --erp-input-height: 28px;     /* Input field height */
  --erp-row-padding: 4px 8px;   /* Table row padding */
  --erp-header-height: 48px;    /* Header height */
}
```

**Documentation:**
- 📖 **[Complete Theme Guide](THEME_CONFIG.md)** - Full documentation with presets
- 🎯 **[Quick Reference](THEME_QUICK_REF.md)** - Developer quick reference card
- 📝 **[Refactoring Summary](REFACTORING_SUMMARY.md)** - Implementation details

**Benefits:**
- ✅ Centralized control - adjust entire app from one place
- ✅ Compact density - 20-30% more content visible on screen
- ✅ Consistent spacing - uniform padding and margins
- ✅ Easy customization - switch between preset configurations
- ✅ No code changes - pure CSS solution

## Modules

### Account Module

Comprehensive financial management functionality:

#### Components
- **Chart of Accounts**: Hierarchical account structure with parent-child relationships
- **Journal Entries**: Double-entry bookkeeping system with multiple journal lines
- **Ledger**: Account-wise transaction history with advanced filtering
- **Voucher Management**: Receipt, Payment, Journal, Contra vouchers
- **Payment Management**: Multiple payment methods and status tracking
- **Financial Reports**: Trial Balance, P&L Statement, Balance Sheet, Cash Flow

#### Features
- ✅ Double-entry bookkeeping system
- ✅ Chart of accounts with hierarchical structure
- ✅ Journal entries with multiple lines
- ✅ Ledger with running balances
- ✅ Voucher management system
- ✅ Payment tracking and management
- ✅ Financial reporting framework

#### Routes
- `/account/chart-accounts` - Chart of Accounts management
- `/account/ledger` - Ledger view with filtering
- `/account/journal` - Journal entry creation and management
- `/account/vouchers` - Voucher management
- `/account/payments` - Payment management
- `/account/reports` - Financial reports generation

### Inventory Module

#### Customer Management
- **Location**: `src/components/inventory/CustomerManagement.tsx`
- **Features**:
  - Customer CRUD operations
  - Form validation (Name and Phone required)
  - Import/Export functionality with CSV templates
  - Search and pagination
  - Status management (Active/Inactive)

#### Purchase Order Management
- **Enhanced View**: Modern invoice-style layout optimized for A4 printing
- **Features**:
  - Professional company header with tenant information
  - Print-optimized styling for business use
  - Comprehensive order details and supplier information
  - Professional footer with terms and signature area

#### Other Inventory Features
- Product management
- Category management
- Unit management
- Supplier management
- Sales order management
- Stock tracking and movements
- Product waste management

### Admin Module
- User management
- Role management
- User-role mappings
- Tenant management
- Legal entity management
- Financial year management

### Clinic Module
- Patient management
- Doctor management
- Appointment scheduling
- Medical records
- Prescriptions
- Billing/Invoices

## Components

### Reusable Components

#### DatePicker Component
A modern, feature-rich date picker with:
- **Multi-Level Navigation**: Day, Month, Year views
- **Date Restrictions**: Min/Max date support
- **User Experience**: Today button, keyboard support, smooth animations
- **Modern Styling**: Consistent with form design

**Usage**:
```tsx
<DatePicker
  value={date}
  onChange={setDate}
  placeholder="Select date"
  minDate="2024-01-01"
  maxDate="2024-12-31"
  required
/>
```

#### DataTable
Generic table component with CRUD operations, search, and pagination.

#### Other Components
- **ProtectedRoute**: Route wrapper for authentication
- **Header**: Top navigation with dropdown menus
- **Layout**: Main application layout wrapper

## Data Models

### Key TypeScript Interfaces

```typescript
interface Account {
  id: number;
  code: string;
  name: string;
  account_type: string;
  parent_id?: number;
  parent_name?: string;
  is_active: boolean;
  balance: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  address?: string;
  is_active: boolean;
}

interface JournalEntry {
  id: number;
  date: string;
  voucher_number: string;
  description: string;
  total_amount: number;
  status: string;
  lines?: JournalLine[];
}

interface Payment {
  id: number;
  payment_number: string;
  payment_type: string;
  payment_method: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}
```

## Development

### Adding New Modules

1. Create component in `src/components/[module]/`
2. Add API service methods in `src/services/api.ts`
3. Update menu structure in `Layout.tsx`
4. Add route in `App.tsx`

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow responsive design principles
- Maintain consistent spacing and colors
- Use semantic HTML elements

## Testing

```bash
npm test
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `build/` folder to your web server

3. Configure your web server to serve the React app and proxy API requests to the FIDEAS API server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Print Features

The application includes print-optimized components:
- Purchase Order View: A4-optimized invoice layout
- Financial Reports: Professional report formatting
- Print-specific CSS for proper formatting

## Import/Export Features

Multiple modules support CSV import/export:
- Customer data with templates
- User management with bulk operations
- Financial data export
- Template downloads for data consistency

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new components
3. Add proper error handling and loading states
4. Test components thoroughly before submitting
5. Maintain responsive design principles
6. Follow the established API integration patterns

## Future Enhancements

### Account Module
- Bank reconciliation functionality
- Advanced financial analytics
- Multi-currency support
- Automated report scheduling
- Integration with external accounting systems

### General
- Advanced audit trail features
- Real-time notifications
- Mobile app development
- Advanced reporting dashboard
- Integration with third-party services