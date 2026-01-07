import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TenantProvider } from './context/TenantContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import TenantRegistration from './components/auth/TenantRegistration';
import UserManagement from './components/admin/UserManagement';
import RoleManagement from './components/admin/RoleManagement';
import UserRoleMapping from './components/admin/UserRoleMapping';
import MenuAccessScreen from './components/admin/RoleMenuMapping';
import TenantUpdate from './components/admin/TenantUpdate';
import LegalEntityManagement from './components/admin/LegalEntityManagement';
import FinancialYearManagement from './components/admin/FinancialYearManagement';
import AgencyManagement from './components/admin/AgencyManagement';
import AgencyCommissionManagement from './components/admin/AgencyCommissionManagement';
import OrderCommissionManagement from './components/admin/OrderCommissionManagement';
import TransactionTemplates from './components/admin/TransactionTemplates';
import AccountTypeMappings from './components/admin/AccountTypeMappings';
import UnitManagement from './components/inventory/UnitManagement';
import CategoryManagement from './components/inventory/CategoryManagement';
import ProductManagement from './components/inventory/ProductManagement';
import StockDetails from './components/inventory/StockDetails';
import CustomerManagement from './components/inventory/CustomerManagement';
import SupplierManagement from './components/inventory/SupplierManagement';
import PurchaseOrderManagement from './components/inventory/PurchaseOrderManagement';
import SalesOrderManagement from './components/inventory/SalesOrderManagement';
import ProductWasteManagement from './components/inventory/ProductWasteManagement';
import StockAdjustmentManagement from './components/inventory/StockAdjustmentManagement';
import StockMeter from './components/inventory/StockMeter';
import StockTracking from './components/inventory/StockTracking';
import ChartOfAccounts from './components/account/ChartOfAccounts';
import AccountGroupManagement from './components/account/AccountGroupManagement';
import VoucherSeriesManagement from './components/account/VoucherSeriesManagement';
import Ledger from './components/account/Ledger';
import Journal from './components/account/Journal';
import VoucherManagement from './components/account/VoucherManagement';
import PaymentManagement from './components/account/PaymentManagement';
import ReceiptManagement from './components/account/ReceiptManagement';
import RecurringVouchers from './components/account/RecurringVouchers';
import DayBook from './components/account/DayBook';
import CashBook from './components/account/CashBook';
import BankBook from './components/account/BankBook';
import Reports from './components/account/Reports';
import OutstandingReports from './components/account/OutstandingReports';
import ComparativeReports from './components/account/ComparativeReports';

import PatientManagement from './components/clinic/PatientManagement';
import DoctorManagement from './components/clinic/DoctorManagement';
import AppointmentManagement from './components/clinic/AppointmentManagement';
import MedicalRecordManagement from './components/clinic/MedicalRecordManagement';
import PrescriptionManagement from './components/clinic/PrescriptionManagement';
import BillingManagement from './components/clinic/BillingManagement';
import BillingMasterManagement from './components/clinic/BillingMasterManagement';
import TaxManagement from './components/account/TaxManagement';
import CurrencyManagement from './components/admin/CurrencyManagement';
import BankReconciliation from './components/account/BankReconciliation';
import CostCenterManagement from './components/account/CostCenterManagement';
import BudgetManagement from './components/account/BudgetManagement';
import ContraManagement from './components/account/ContraManagement';
import CreditNoteManagement from './components/account/CreditNoteManagement';
import DebitNoteManagement from './components/account/DebitNoteManagement';
import AgingAnalysis from './components/account/AgingAnalysis';
import TDSManagement from './components/account/TDSManagement';
import TestCategoryManagement from './components/care/TestCategoryManagement';
import TestManagement from './components/care/TestManagement';
import TestPanelManagement from './components/diagnostic/TestPanelManagement';
import DiagnosticTestCategoryManagement from './components/care/TestCategoryManagement';
import DiagnosticTestManagement from './components/care/TestManagement';
import DiagnosticPatientManagement from './components/clinic/PatientManagement';
import DiagnosticDoctorManagement from './components/clinic/DoctorManagement';
import TestOrderManagement from './components/diagnostic/TestOrderManagement';
import TestResultManagement from './components/diagnostic/TestResultManagement';
import TestInvoiceManagement from './components/health/TestInvoiceManagement';
import HealthPaymentManagement from './components/health/HealthPaymentManagement';
import HealthAdvancePayment from './components/health/HealthAdvancePayment';
import HealthInvoicePayment from './components/health/HealthInvoicePayment';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ARAgingPage from './pages/ARAgingPage';
import APAgingPage from './pages/APAgingPage';
import AuditTrailPage from './pages/AuditTrailPage';
import GSTCalculatorPage from './pages/GSTCalculatorPage';
import ComparativeReportsPage from './pages/ComparativeReportsPage';
import BudgetVsActualPage from './pages/BudgetVsActualPage';
import GSTReports from './components/account/GSTReports';
import StockValuation from './components/inventory/StockValuation';
import StockAging from './components/inventory/StockAging';
import BatchManagement from './components/inventory/BatchManagement';
import Notifications from './components/admin/Notifications';
import SalesInvoiceManagement from './components/invoice/SalesInvoiceManagement';
import PurchaseInvoiceManagement from './components/invoice/PurchaseInvoiceManagement';
import WarehouseManagement from './components/warehouse/WarehouseManagement';
import StockTransferManagement from './components/warehouse/StockTransferManagement';
import FixedAssetManagement from './components/assets/FixedAssetManagement';
import PendingApprovals from './components/approvals/PendingApprovals';
import EInvoiceManagement from './components/account/EInvoiceManagement';
import EWayBillManagement from './components/account/EWayBillManagement';
import GSTR1Management from './components/account/GSTR1Management';
import TDSReturns from './components/account/TDSReturns';
import CustomReports from './components/account/CustomReports';
import ScheduledReports from './components/account/ScheduledReports';
import AssetCategoryManagement from './components/account/AssetCategoryManagement';
import DepreciationManagement from './components/account/DepreciationManagement';
import ApprovalWorkflowManagement from './components/admin/ApprovalWorkflowManagement';
import PaymentTermsManagement from './components/admin/PaymentTermsManagement';
import DocumentTemplates from './components/admin/DocumentTemplates';
import StockByLocation from './components/inventory/StockByLocation';

const DashboardHome: React.FC = () => {
  const appName = process.env.REACT_APP_NAME || 'FIDEAS';
  
  return (
    <div className="p-3 sm:p-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Welcome to {appName}</h1>
        <p className="text-lg text-gray-600 mb-4">Enterprise Management System</p>
        <p className="text-sm text-gray-500">Select a menu item from the top menu bar to get started</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<TenantRegistration />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/home/dashboard" replace />} />
                <Route path="home/dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin/user-management" element={<UserManagement />} />
                <Route path="admin/role-management" element={<RoleManagement />} />
                <Route path="admin/user-role-mapping" element={<UserRoleMapping />} />
                <Route path="admin/menu-access" element={<MenuAccessScreen />} />
                <Route path="admin/tenant-update" element={<TenantUpdate />} />
                <Route path="admin/transaction-templates" element={<TransactionTemplates />} />
                <Route path="admin/account-type-mappings" element={<AccountTypeMappings />} />
                <Route path="admin/legal-entity" element={<LegalEntityManagement />} />
                <Route path="admin/financial-years" element={<FinancialYearManagement />} />
                <Route path="admin/agency-management" element={<AgencyManagement />} />
                <Route path="admin/agency-commission-setup" element={<AgencyCommissionManagement />} />
                <Route path="inventory/units" element={<UnitManagement />} />
                <Route path="inventory/unit-management" element={<UnitManagement />} />
                <Route path="inventory/category-management" element={<CategoryManagement />} />
                <Route path="inventory/product-management" element={<ProductManagement />} />
                <Route path="inventory/customer-management" element={<CustomerManagement />} />
                <Route path="inventory/supplier-management" element={<SupplierManagement />} />
                <Route path="inventory/purchase-order" element={<PurchaseOrderManagement />} />
                <Route path="inventory/sales-order" element={<SalesOrderManagement />} />
                <Route path="inventory/order-commission" element={<OrderCommissionManagement />} />
                <Route path="inventory/product-waste" element={<ProductWasteManagement />} />
                <Route path="inventory/stock-adjustment" element={<StockAdjustmentManagement />} />
                <Route path="inventory/stock-details" element={<StockDetails />} />
                <Route path="inventory/stock-meter" element={<StockMeter />} />
                <Route path="inventory/stock-tracking" element={<StockTracking />} />
                <Route path="account/chart-accounts" element={<ChartOfAccounts />} />
                <Route path="account/account-groups" element={<AccountGroupManagement />} />
                <Route path="account/voucher-series" element={<VoucherSeriesManagement />} />
                <Route path="account/cost-centers" element={<CostCenterManagement />} />
                <Route path="account/budgets" element={<BudgetManagement />} />
                <Route path="account/tax-management" element={<TaxManagement />} />
                <Route path="admin/currency-management" element={<CurrencyManagement />} />
                <Route path="account/bank-reconciliation" element={<BankReconciliation />} />
                <Route path="account/journal" element={<Journal />} />
                <Route path="account/vouchers" element={<VoucherManagement />} />
                <Route path="account/payments" element={<PaymentManagement />} />
                <Route path="account/receipts" element={<ReceiptManagement />} />
                <Route path="account/recurring-vouchers" element={<RecurringVouchers />} />
                <Route path="account/contra" element={<ContraManagement />} />
                <Route path="account/credit-notes" element={<CreditNoteManagement />} />
                <Route path="account/debit-notes" element={<DebitNoteManagement />} />
                <Route path="account/aging-analysis" element={<AgingAnalysis />} />
                <Route path="account/tds-management" element={<TDSManagement />} />
                <Route path="account/ledger" element={<Ledger />} />
                <Route path="account/day-book" element={<DayBook />} />
                <Route path="account/cash-book" element={<CashBook />} />
                <Route path="account/bank-book" element={<BankBook />} />
                <Route path="account/reports" element={<Reports />} />
                <Route path="account/outstanding-reports" element={<OutstandingReports />} />
                <Route path="account/comparative-reports" element={<ComparativeReports />} />
                <Route path="account/reports/ar-aging" element={<ARAgingPage />} />
                <Route path="account/reports/ap-aging" element={<APAgingPage />} />
                <Route path="account/audit-trail" element={<AuditTrailPage />} />
                <Route path="account/utilities/gst-calculator" element={<GSTCalculatorPage />} />
                <Route path="account/reports/comparative" element={<ComparativeReportsPage />} />
                <Route path="account/reports/budget-vs-actual" element={<BudgetVsActualPage />} />
                <Route path="account/gst-reports" element={<GSTReports />} />
                <Route path="inventory/stock-valuation" element={<StockValuation />} />
                <Route path="inventory/stock-aging" element={<StockAging />} />
                <Route path="inventory/batch-management" element={<BatchManagement />} />
                <Route path="inventory/sales-invoice" element={<SalesInvoiceManagement />} />
                <Route path="inventory/purchase-invoice" element={<PurchaseInvoiceManagement />} />
                <Route path="inventory/warehouses" element={<WarehouseManagement />} />
                <Route path="inventory/stock-transfer" element={<StockTransferManagement />} />
                <Route path="account/fixed-assets" element={<FixedAssetManagement />} />
                <Route path="account/asset-categories" element={<AssetCategoryManagement />} />
                <Route path="account/depreciation" element={<DepreciationManagement />} />
                <Route path="account/einvoice" element={<EInvoiceManagement />} />
                <Route path="account/eway-bill" element={<EWayBillManagement />} />
                <Route path="account/gstr1" element={<GSTR1Management />} />
                <Route path="account/tds-returns" element={<TDSReturns />} />
                <Route path="account/custom-reports" element={<CustomReports />} />
                <Route path="account/scheduled-reports" element={<ScheduledReports />} />
                <Route path="admin/pending-approvals" element={<PendingApprovals />} />
                <Route path="admin/approval-workflows" element={<ApprovalWorkflowManagement />} />
                <Route path="admin/payment-terms" element={<PaymentTermsManagement />} />
                <Route path="admin/document-templates" element={<DocumentTemplates />} />
                <Route path="inventory/stock-by-location" element={<StockByLocation />} />
                <Route path="admin/notifications" element={<Notifications />} />
                <Route path="clinic/patient-management" element={<PatientManagement />} />
                <Route path="clinic/doctor-management" element={<DoctorManagement />} />
                <Route path="clinic/appointments" element={<AppointmentManagement />} />
                <Route path="clinic/medical-records" element={<MedicalRecordManagement />} />
                <Route path="clinic/prescriptions" element={<PrescriptionManagement />} />
                <Route path="clinic/billings" element={<BillingManagement />} />
                <Route path="clinic/billing-master" element={<BillingMasterManagement />} />
                <Route path="clinic/test-category" element={<TestCategoryManagement />} />
                <Route path="clinic/test-master" element={<TestManagement />} />
                <Route path="diagnostic/patient-management" element={<DiagnosticPatientManagement />} />
                <Route path="diagnostic/doctor-management" element={<DiagnosticDoctorManagement />} />
                <Route path="diagnostic/test-category" element={<DiagnosticTestCategoryManagement />} />
                <Route path="diagnostic/test-master" element={<DiagnosticTestManagement />} />
                <Route path="diagnostic/test-panel" element={<TestPanelManagement />} />
                <Route path="diagnostic/test-order" element={<TestOrderManagement />} />
                <Route path="diagnostic/test-result" element={<TestResultManagement />} />
                <Route path="diagnostic/order-commission" element={<OrderCommissionManagement />} />
                <Route path="health/test-invoice" element={<TestInvoiceManagement />} />
                <Route path="health/payments" element={<HealthPaymentManagement />} />
                <Route path="health/payment/advance" element={<HealthAdvancePayment />} />
                <Route path="health/payment/invoice" element={<HealthInvoicePayment />} />

              </Route>
            </Routes>
          </div>
        </Router>
        </ToastProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;