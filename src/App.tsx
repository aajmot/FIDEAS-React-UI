import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TenantProvider } from './context/TenantContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import PublicTestResultView from './components/public/PublicTestResultView';
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
import AppointmentInvoicePage from './pages/AppointmentInvoicePage';
import HealthPaymentManagement from './components/health/HealthPaymentManagement';
import HealthAdvancePayment from './components/health/HealthAdvancePayment';
import HealthInvoicePayment from './components/health/HealthInvoicePayment';
import PaymentAllocation from './components/health/PaymentAllocation';
import Dashboard from './pages/Dashboard';
import HealthDashboard from './pages/HealthDashboard';
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
import DepartmentManagement from './components/people/DepartmentManagement';
import EmployeeManagement from './components/people/EmployeeManagement';

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
                <Route path="/public/health/test-result/:resultNo" element={<PublicTestResultView />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<TenantRegistration />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  <Route path="profile" element={<Profile />} />
                  <Route index element={<Navigate to="/home/dashboard" replace />} />
                  <Route path="home/dashboard" element={<Dashboard />} />
                  <Route path="home/health-dashboard" element={<HealthDashboard />} />

                  {/* admin routes */}
                  <Route path="admin">
                    <Route path="user-management" element={<UserManagement />} />
                    <Route path="role-management" element={<RoleManagement />} />
                    <Route path="user-role-mapping" element={<UserRoleMapping />} />
                    <Route path="menu-access" element={<MenuAccessScreen />} />
                    <Route path="tenant-update" element={<TenantUpdate />} />
                    <Route path="transaction-templates" element={<TransactionTemplates />} />
                    <Route path="account-type-mappings" element={<AccountTypeMappings />} />
                    <Route path="legal-entity" element={<LegalEntityManagement />} />
                    <Route path="financial-years" element={<FinancialYearManagement />} />
                    <Route path="agency-management" element={<AgencyManagement />} />
                    <Route path="agency-commission-setup" element={<AgencyCommissionManagement />} />
                    <Route path="currency-management" element={<CurrencyManagement />} />
                    <Route path="pending-approvals" element={<PendingApprovals />} />
                    <Route path="approval-workflows" element={<ApprovalWorkflowManagement />} />
                    <Route path="payment-terms" element={<PaymentTermsManagement />} />
                    <Route path="document-templates" element={<DocumentTemplates />} />
                    <Route path="notifications" element={<Notifications />} />

                  </Route>

                  {/* Inventory Routes */}
                  <Route path='inventory'>
                    <Route path="units" element={<UnitManagement />} />
                    <Route path="unit-management" element={<UnitManagement />} />
                    <Route path="category-management" element={<CategoryManagement />} />
                    <Route path="product-management" element={<ProductManagement />} />
                    <Route path="customer-management" element={<CustomerManagement />} />
                    <Route path="supplier-management" element={<SupplierManagement />} />
                    <Route path="purchase-order" element={<PurchaseOrderManagement />} />
                    <Route path="sales-order" element={<SalesOrderManagement />} />
                    <Route path="order-commission" element={<OrderCommissionManagement />} />
                    <Route path="product-waste" element={<ProductWasteManagement />} />
                    <Route path="stock-adjustment" element={<StockAdjustmentManagement />} />
                    <Route path="stock-details" element={<StockDetails />} />
                    <Route path="stock-meter" element={<StockMeter />} />
                    <Route path="stock-tracking" element={<StockTracking />} />
                    <Route path="stock-valuation" element={<StockValuation />} />
                    <Route path="stock-aging" element={<StockAging />} />
                    <Route path="batch-management" element={<BatchManagement />} />
                    <Route path="sales-invoice" element={<SalesInvoiceManagement />} />
                    <Route path="purchase-invoice" element={<PurchaseInvoiceManagement />} />
                    <Route path="warehouses" element={<WarehouseManagement />} />
                    <Route path="stock-transfer" element={<StockTransferManagement />} />
                    <Route path="stock-by-location" element={<StockByLocation />} />
                  </Route>

                  {/* account route */}
                  <Route path="account">
                    <Route path="chart-accounts" element={<ChartOfAccounts />} />
                    <Route path="account-groups" element={<AccountGroupManagement />} />
                    <Route path="voucher-series" element={<VoucherSeriesManagement />} />
                    <Route path="cost-centers" element={<CostCenterManagement />} />
                    <Route path="budgets" element={<BudgetManagement />} />
                    <Route path="tax-management" element={<TaxManagement />} />
                    <Route path="bank-reconciliation" element={<BankReconciliation />} />
                    <Route path="journal" element={<Journal />} />
                    <Route path="vouchers" element={<VoucherManagement />} />
                    <Route path="payments" element={<PaymentManagement />} />
                    <Route path="receipts" element={<ReceiptManagement />} />
                    <Route path="recurring-vouchers" element={<RecurringVouchers />} />
                    <Route path="contra" element={<ContraManagement />} />
                    <Route path="credit-notes" element={<CreditNoteManagement />} />
                    <Route path="debit-notes" element={<DebitNoteManagement />} />
                    <Route path="aging-analysis" element={<AgingAnalysis />} />
                    <Route path="tds-management" element={<TDSManagement />} />
                    <Route path="ledger" element={<Ledger />} />
                    <Route path="day-book" element={<DayBook />} />
                    <Route path="cash-book" element={<CashBook />} />
                    <Route path="bank-book" element={<BankBook />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="outstanding-reports" element={<OutstandingReports />} />
                    <Route path="comparative-reports" element={<ComparativeReports />} />
                    <Route path="audit-trail" element={<AuditTrailPage />} />
                    <Route path="utilities/gst-calculator" element={<GSTCalculatorPage />} />
                    <Route path="reports">
                      <Route path="comparative" element={<ComparativeReportsPage />} />
                      <Route path="budget-vs-actual" element={<BudgetVsActualPage />} />
                      <Route path="ar-aging" element={<ARAgingPage />} />
                      <Route path="ap-aging" element={<APAgingPage />} />
                    </Route>
                    <Route path="gst-reports" element={<GSTReports />} />
                    <Route path="fixed-assets" element={<FixedAssetManagement />} />
                    <Route path="asset-categories" element={<AssetCategoryManagement />} />
                    <Route path="depreciation" element={<DepreciationManagement />} />
                    <Route path="einvoice" element={<EInvoiceManagement />} />
                    <Route path="eway-bill" element={<EWayBillManagement />} />
                    <Route path="gstr1" element={<GSTR1Management />} />
                    <Route path="tds-returns" element={<TDSReturns />} />
                    <Route path="custom-reports" element={<CustomReports />} />
                    <Route path="scheduled-reports" element={<ScheduledReports />} />
                  </Route>

                  {/* Clinic Route */}
                  <Route path="clinic">
                    <Route path="patient-management" element={<PatientManagement />} />
                    <Route path="doctor-management" element={<DoctorManagement />} />
                    <Route path="appointments" element={<AppointmentManagement />} />
                    <Route path="medical-records" element={<MedicalRecordManagement />} />
                    <Route path="prescriptions" element={<PrescriptionManagement />} />
                    <Route path="billings" element={<BillingManagement />} />
                    <Route path="billing-master" element={<BillingMasterManagement />} />
                    <Route path="test-category" element={<TestCategoryManagement />} />
                    <Route path="test-master" element={<TestManagement />} />
                  </Route>
                  <Route path="diagnostic">
                    <Route path="patient-management" element={<DiagnosticPatientManagement />} />
                    <Route path="doctor-management" element={<DiagnosticDoctorManagement />} />
                    <Route path="test-category" element={<DiagnosticTestCategoryManagement />} />
                    <Route path="test-master" element={<DiagnosticTestManagement />} />
                    <Route path="test-panel" element={<TestPanelManagement />} />
                    <Route path="test-order" element={<TestOrderManagement />} />
                    <Route path="test-result" element={<TestResultManagement />} />
                    <Route path="order-commission" element={<OrderCommissionManagement />} />
                  </Route>
                  <Route path="health">
                    <Route path="test-invoice" element={<TestInvoiceManagement />} />
                    <Route path="appointment-invoice" element={<AppointmentInvoicePage />} />
                    <Route path="payment" element={<HealthPaymentManagement />}>
                      <Route path="advance" element={<HealthAdvancePayment />} />
                      <Route path="invoice" element={<HealthInvoicePayment />} />
                      <Route path="allocation" element={<PaymentAllocation />} />
                    </Route>
                  </Route>
                  <Route path="people">
                    <Route path="departments" element={<DepartmentManagement />} />
                    <Route path="employees" element={<EmployeeManagement />} />
                  </Route>



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