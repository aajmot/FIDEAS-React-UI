# Health Payment Screen - Visual Layout Guide

## Screen Organization

```
┌─────────────────────────────────────────────────────────────────────┐
│ Payment Entry                                          [Collapse ▼] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌─── HEADER SECTION ────────────────────────────────────────────┐  │
│ │                                                                 │  │
│ │  Payment Number    Payment Date    Payment Type    Status      │  │
│ │  [PAY-1-xxxxx]    [2026-01-02]    [RECEIPT ▼]    [DRAFT ▼]   │  │
│ │                                                                 │  │
│ │  Party Type        Patient         Reference #     Exchange    │  │
│ │  [CUSTOMER ▼]     [Search... ▼]   [REF-001]      [1.0000]    │  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ ┌─── PAYMENT DETAILS TABLE ─────────────────────────────────────┐  │
│ │ Payment Details                              [+ Add Line]      │  │
│ │                                                                 │  │
│ │ ┌─────────────────────────────────────────────────────────────┐│  │
│ │ │Mode  │Instrument#│Date      │Bank    │Ref    │Amount│Acct││││  │
│ │ ├──────┼───────────┼──────────┼────────┼───────┼──────┼────┤││  │
│ │ │CASH▼ │CH-001     │2026-01-02│HDFC    │TXN123 │5000  │101▼│🗑││  │
│ │ │CARD▼ │           │          │        │       │3000  │102▼│🗑││  │
│ │ │UPI▼  │           │          │        │UPI456 │2000  │103▼│🗑││  │
│ │ └─────────────────────────────────────────────────────────────┘│  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ ┌─── INVOICE ALLOCATIONS TABLE ─────────────────────────────────┐  │
│ │ Invoice Allocations                      [+ Add Allocation]    │  │
│ │                                                                 │  │
│ │ ┌─────────────────────────────────────────────────────────────┐│  │
│ │ │Type   │Invoice#  │Total   │Balance │Allocated│Discount│Rem││││  │
│ │ ├───────┼──────────┼────────┼────────┼─────────┼────────┼───┤││  │
│ │ │ORDER▼ │INV-001▼  │₹10,000 │₹5,000  │5000     │0       │   │🗑││  │
│ │ │INVOICE│INV-002▼  │₹8,000  │₹3,000  │3000     │100     │   │🗑││  │
│ │ └─────────────────────────────────────────────────────────────┘│  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ ┌─── SUMMARY SECTION ───────────────────────────────────────────┐  │
│ │                                                                 │  │
│ │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────┐│  │
│ │  │Total Amount  │  │Allocated Amt │  │Unallocated   │  │TDS ││  │
│ │  │₹10,000.00    │  │₹8,000.00     │  │₹2,000.00     │  │[0] ││  │
│ │  └──────────────┘  └──────────────┘  └──────────────┘  └────┘│  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ ┌─── ADDITIONAL FIELDS ─────────────────────────────────────────┐  │
│ │                                                                 │  │
│ │  ☐ Is Refund                                                   │  │
│ │                                                                 │  │
│ │  Remarks:                                                       │  │
│ │  [Text area for remarks...]                                    │  │
│ │                                                                 │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│                                    [Cancel]  [Save Payment]          │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features Implemented

### 1. Header Section (8 fields in 2 rows)
- **Row 1**: Payment Number, Payment Date, Payment Type, Status
- **Row 2**: Party Type, Patient, Reference Number, Exchange Rate

### 2. Payment Details Table (Multi-line support)
Each row contains:
- Payment Mode (CASH/CARD/UPI/CHEQUE/BANK_TRANSFER/GATEWAY)
- Instrument Number (for cheque/card)
- Instrument Date
- Bank Name
- Transaction Reference
- Amount (required)
- GL Account
- Delete action

**Features**:
- Add multiple payment lines
- Support for split payments (Cash + Card + UPI)
- Auto-calculate total from all lines

### 3. Invoice Allocations Table (Multi-line support)
Each row contains:
- Document Type (ORDER/INVOICE)
- Invoice Number (searchable dropdown)
- Invoice Total (read-only, auto-filled)
- Invoice Balance (read-only, auto-filled)
- Allocated Amount (editable)
- Discount Amount
- Remarks
- Delete action

**Features**:
- Link payment to multiple invoices
- Auto-populate invoice details on selection
- Track allocated vs unallocated amounts

### 4. Summary Section (Real-time calculations)
- **Total Amount**: Sum of all payment detail lines
- **Allocated Amount**: Sum of all allocation lines
- **Unallocated Amount**: Total - Allocated (auto-calculated)
- **TDS Amount**: Manual entry for tax deduction

### 5. Additional Fields
- Is Refund checkbox
- Remarks textarea

## Data Flow

1. **Select Patient** → Loads available invoices
2. **Add Payment Details** → Auto-calculates total amount
3. **Add Allocations** → Select invoices and allocate amounts
4. **Real-time Summary** → Shows total, allocated, unallocated
5. **Submit** → Validates and saves complete payment record

## Validation Rules

✓ Payment date required
✓ Patient required
✓ At least one payment detail line required
✓ Payment detail amount > 0
✓ Allocated amount ≤ Total amount
✓ Allocated amount ≤ Invoice balance
✓ GL Account required for each payment line

## Usage Example

**Scenario**: Patient pays ₹10,000 for two invoices

1. Select Patient: "John Doe"
2. Add Payment Details:
   - Line 1: CASH - ₹6,000
   - Line 2: CARD - ₹4,000
   - **Total: ₹10,000**

3. Add Allocations:
   - Invoice INV-001 (Balance: ₹7,000) → Allocate: ₹7,000
   - Invoice INV-002 (Balance: ₹5,000) → Allocate: ₹3,000
   - **Total Allocated: ₹10,000**

4. Summary shows:
   - Total: ₹10,000
   - Allocated: ₹10,000
   - Unallocated: ₹0

## File Location

Component: `src/components/health/ComprehensivePaymentForm.tsx`

## Integration

Replace the existing HealthPaymentForm import in HealthPaymentManagement.tsx:

```tsx
import ComprehensivePaymentForm from './ComprehensivePaymentForm';

// Then use:
<ComprehensivePaymentForm
  onSave={handlePaymentSaved}
  onCancel={() => {}}
  isCollapsed={isFormCollapsed}
  onToggleCollapse={handleToggleCollapse}
  resetForm={resetForm}
/>
```
