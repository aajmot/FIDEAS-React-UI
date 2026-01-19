import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { invoicePaymentReportService } from '../services/modules/health';
import { userService } from '../services/modules/admin';
import { InvoicePaymentReportItem } from '../types/invoicePaymentReport';
import { useToast } from '../context/ToastContext';
import DatePicker from '../components/common/DatePicker';
import SearchableDropdown from '../components/common/SearchableDropdown';
import DataTable from '../components/common/DataTable';
import { formatUTCToLocal } from '../utils/dateUtils';

interface Option {
  value: string | number;
  label: string;
}

const InvoicePaymentReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [reportData, setReportData] = useState<InvoicePaymentReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const { showToast } = useToast();

  // Set default dates (start of current month to today)
  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(startOfMonth.toISOString().split('T')[0]);
  }, []);

  // Load users for dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userService.getUsers({ per_page: 1000 });
        const users = response.data || [];
        
        const options: Option[] = users.map((user: any) => ({
          value: user.id,
          label: `${user.first_name} ${user.last_name} (${user.username})`
        }));
        
        setUserOptions(options);
      } catch (error) {
        showToast('error', 'Failed to load users');
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [showToast]);

  const validateDateRange = (): boolean => {
    if (!startDate || !endDate) {
      showToast('error', 'Please select both start and end dates');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      showToast('error', 'Start date must be before end date');
      return false;
    }

    // Check if date range exceeds one year
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYearInMs) {
      showToast('error', 'Date range cannot exceed one year');
      return false;
    }

    if (selectedUserIds.length === 0) {
      showToast('error', 'Please select at least one user');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDateRange()) {
      return;
    }

    try {
      setLoading(true);
      
      // Convert dates to ISO format with timezone
      const startDateISO = new Date(startDate + 'T00:00:00').toISOString();
      const endDateISO = new Date(endDate + 'T23:59:59').toISOString();
      
      const response = await invoicePaymentReportService.getInvoicePaymentReport({
        start_date: startDateISO,
        end_date: endDateISO,
        user_ids: selectedUserIds
      });

      setReportData(response.data || []);
      showToast('success', response.message || 'Report generated successfully');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to generate report';
      showToast('error', errorMessage);
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (value: string | number | (string | number)[]) => {
    if (Array.isArray(value)) {
      setSelectedUserIds(value.map(v => Number(v)));
    }
  };

  // Calculate summary data grouped by user
  const calculateSummary = () => {
    const userSummary = new Map<string, { 
      invoices: Map<string, number>; 
      payments: Map<string, number> 
    }>();

    reportData.forEach(item => {
      const userName = item.created_by_user_name;
      if (!userSummary.has(userName)) {
        userSummary.set(userName, { 
          invoices: new Map(), 
          payments: new Map() 
        });
      }

      const summary = userSummary.get(userName)!;
      
      // Track unique invoices
      if (item.invoice_number && item.invoice_number !== 'N/A' && item.invoice_amount !== null) {
        summary.invoices.set(item.invoice_number, item.invoice_amount);
      }
      
      // Track unique payments
      if (item.payment_number && item.payment_amount !== null) {
        summary.payments.set(item.payment_number, item.payment_amount);
      }
    });

    return Array.from(userSummary.entries()).map(([userName, data]) => {
      const totalInvoice = Array.from(data.invoices.values()).reduce((sum, amount) => sum + amount, 0);
      const totalPayment = Array.from(data.payments.values()).reduce((sum, amount) => sum + amount, 0);
      
      return {
        userName,
        totalInvoiceCount: data.invoices.size,
        totalInvoice,
        totalPaymentCount: data.payments.size,
        totalPayment
      };
    });
  };

  const summaryData = calculateSummary();
  const grandTotalInvoiceCount = summaryData.reduce((sum, item) => sum + item.totalInvoiceCount, 0);
  const grandTotalInvoice = summaryData.reduce((sum, item) => sum + item.totalInvoice, 0);
  const grandTotalPaymentCount = summaryData.reduce((sum, item) => sum + item.totalPaymentCount, 0);
  const grandTotalPayment = summaryData.reduce((sum, item) => sum + item.totalPayment, 0);

  // Define columns for DataTable
  const columns = [
    {
      key: 'transaction_type',
      label: 'Transaction Type',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          value === 'PAYMENT' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'transaction_datetime',
      label: 'Transaction DateTime',
      render: (value: string) => <span className="whitespace-nowrap">{value ? formatUTCToLocal(value) : 'N/A'}</span>
    },
    {
      key: 'created_by_user_name',
      label: 'Created By'
    },
    {
      key: 'invoice_number',
      label: 'Invoice Number',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'invoice_date',
      label: 'Invoice Date',
      render: (value: string) => <span className="whitespace-nowrap">{value ? formatUTCToLocal(value) : 'N/A'}</span>
    },
    {
      key: 'invoice_type',
      label: 'Invoice Type',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'invoice_amount',
      label: 'Invoice Amount',
      render: (value: number | null) => <span className="text-right block">{value !== null ? value.toFixed(2) : 'N/A'}</span>
    },
    {
      key: 'payment_number',
      label: 'Payment Number',
      render: (value: string | null) => value || 'N/A'
    },
    {
      key: 'payment_date',
      label: 'Payment Date',
      render: (value: string) => <span className="whitespace-nowrap">{value ? formatUTCToLocal(value) : 'N/A'}</span>
    },
    {
      key: 'payment_amount',
      label: 'Payment Amount',
      render: (value: number | null) => <span className="text-right block">{value !== null ? value.toFixed(2) : 'N/A'}</span>
    },
    {
      key: 'allocated_amount',
      label: 'Allocated Amount',
      render: (value: number | null) => <span className="text-right block">{value !== null ? value.toFixed(2) : 'N/A'}</span>
    },
    {
      key: 'unallocated_amount',
      label: 'Unallocated Amount',
      render: (value: number | null) => <span className="text-right block">{value !== null ? value.toFixed(2) : 'N/A'}</span>
    },
    {
      key: 'allocation_document_type',
      label: 'Allocation Doc Type',
      render: (value: string) => value || 'N/A'
    },
    {
      key: 'balance_amount',
      label: 'Balance Amount',
      render: (value: number | null) => <span className="text-right block">{value !== null ? value.toFixed(2) : 'N/A'}</span>
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      {/* Filter Form */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
            Invoice Payment Report
          </h2>
          <button 
            type="button" 
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)} 
            className="text-gray-500 hover:text-gray-700"
          >
            {isFilterCollapsed ? 
              <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : 
              <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />
            }
          </button>
        </div>

        {!isFilterCollapsed && (
          <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date"
                  required
                  className="w-full"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                  required
                  className="w-full"
                />
              </div>

              {/* Users Multi-Select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Users <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={userOptions}
                  value={selectedUserIds}
                  onChange={handleUserSelection}
                  placeholder={loadingUsers ? "Loading users..." : "Select users"}
                  multiple={true}
                  searchable={true}
                  disabled={loadingUsers}
                  className="w-full"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || loadingUsers}
                className="erp-form-btn text-white bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Summary by User</h2>
        {reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Invoices
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Invoice Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Payments
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Payment Received
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.userName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.totalInvoiceCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.totalInvoice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.totalPaymentCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {item.totalPayment.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    {grandTotalInvoiceCount}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    {grandTotalInvoice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    {grandTotalPaymentCount}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    {grandTotalPayment.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No summary data available. Please select filters and generate report.
          </div>
        )}
      </div>

      {/* Report Table using DataTable */}
      <DataTable
        title="Invoice Payment Report"
        columns={columns}
        data={reportData}
        loading={loading}
        pageSize={1000}
      />

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      )}
    </div>
  );
};

export default InvoicePaymentReportPage;
