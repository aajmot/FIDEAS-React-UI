# Health Payment Screen Design

## Layout Structure

### 1. Header Section (Top Row)
- Payment Number (auto-generated, read-only)
- Payment Date (date picker)
- Payment Type (RECEIPT/PAYMENT dropdown)
- Party Type (CUSTOMER/SUPPLIER/EMPLOYEE dropdown)
- Party ID (searchable dropdown - patients/suppliers)
- Branch (dropdown)
- Status (DRAFT/POSTED/RECONCILED/CANCELLED)

### 2. Document Reference Section
- Source Document Type (ORDER/INVOICE/APPOINTMENT dropdown)
- Source Document ID (searchable dropdown based on type)
- Reference Number (text input)

### 3. Currency Section
- Base Currency (dropdown)
- Foreign Currency (dropdown, optional)
- Exchange Rate (number input, default 1)

### 4. Payment Details Table (Multiple Rows)
Columns:
- Line No (auto)
- Payment Mode (CASH/CARD/UPI/CHEQUE/BANK_TRANSFER/GATEWAY)
- Bank Account (dropdown, for non-cash)
- Instrument Number (for cheque/card)
- Instrument Date (date picker)
- Bank Name (text)
- Branch Name (text)
- IFSC Code (text)
- Transaction Reference (text)
- Payment Gateway (text, for online)
- Gateway Transaction ID (text)
- Gateway Status (text)
- Gateway Fee (number)
- Amount (number, required)
- Account ID (dropdown - GL account)
- Description (text)
- Actions (Add/Remove row)

### 5. Allocation Table (Multiple Rows)
Columns:
- Document Type (ORDER/INVOICE dropdown)
- Document Number (searchable dropdown)
- Document Total (read-only)
- Document Balance (read-only)
- Allocated Amount Base (number)
- Allocated Amount Foreign (number)
- Discount Amount (number)
- Adjustment Amount (number)
- Remarks (text)
- Actions (Add/Remove row)

### 6. Summary Section (Right Side)
- Total Amount Base (calculated from details)
- Total Amount Foreign (calculated)
- Allocated Amount Base (calculated from allocations)
- Unallocated Amount Base (calculated)
- TDS Amount Base (number input)
- Advance Amount Base (number input)

### 7. Additional Fields Section
- Is Refund (checkbox)
- Original Payment ID (if refund, searchable dropdown)
- Remarks (textarea)
- Tags (multi-select or comma-separated)

### 8. Action Buttons
- Save as Draft
- Post Payment
- Cancel
- Print Receipt

## Field Validations
- Payment date required
- At least one payment detail line required
- Total payment details amount must match total amount
- Allocated amount cannot exceed total amount
- For refunds, original payment ID required
- Party ID required
- Payment mode required for each detail line

## UI/UX Features
- Collapsible sections for better space management
- Auto-calculation of totals
- Real-time validation
- Smart defaults (date = today, status = DRAFT)
- Quick payment mode buttons for common scenarios
- Invoice search with balance display
- Multi-payment mode support in single transaction
