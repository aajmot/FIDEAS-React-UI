import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/api';

const Reports: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    from_date: today,
    to_date: today,
    account_type: '',
    report_format: 'pdf'
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const { showToast } = useToast();

  const reportTypes = [
    {
      id: 'trial_balance',
      name: 'Trial Balance',
      description: 'Summary of all account balances',
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />
    },
    {
      id: 'profit_loss',
      name: 'Profit & Loss Statement',
      description: 'Income and expense summary',
      icon: <FileText className="h-8 w-8 text-green-600" />
    },
    {
      id: 'balance_sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities and equity',
      icon: <Calendar className="h-8 w-8 text-purple-600" />
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow Statement',
      description: 'Cash inflows and outflows',
      icon: <Download className="h-8 w-8 text-orange-600" />
    }
  ];

  const handleGenerateReport = async (reportType: string) => {
    setLoading(true);
    try {
      let response: any;
      if (reportType === 'trial_balance') {
        response = await accountService.getTrialBalance(filters.from_date || '', filters.to_date || '');
      } else if (reportType === 'profit_loss') {
        response = await accountService.getProfitLoss(filters.from_date || '', filters.to_date || '');
      } else if (reportType === 'balance_sheet') {
        response = await accountService.getBalanceSheet(filters.to_date || '');
      } else if (reportType === 'cash_flow') {
        response = await accountService.getCashFlow(filters.from_date || '', filters.to_date || '');
      }
      
      if (response) {
        setReportData({ type: reportType, data: response.data });
        showToast('success', `${reportTypes.find(r => r.id === reportType)?.name} generated successfully`);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadReport = async (reportType: string) => {
    if (reportType !== 'balance_sheet' && (!filters.from_date || !filters.to_date)) {
      showToast('error', 'Please select date range');
      return;
    }
    
    setLoading(true);
    try {
      const format = filters.report_format.toLowerCase();
      let url = '';
      
      if (reportType === 'trial_balance') {
        url = `/api/v1/account/reports/trial-balance/export?format=${format}&from_date=${filters.from_date}&to_date=${filters.to_date}`;
      } else if (reportType === 'profit_loss') {
        url = `/api/v1/account/reports/profit-loss/export?format=${format}&from_date=${filters.from_date}&to_date=${filters.to_date}`;
      } else if (reportType === 'balance_sheet') {
        const asOfDate = filters.to_date || new Date().toISOString().split('T')[0];
        url = `/api/v1/account/reports/balance-sheet/export?format=${format}&as_of_date=${asOfDate}`;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${reportType}_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      showToast('success', 'Report downloaded successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Reports</h1>
        <p className="text-gray-600">Generate and download financial reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <DatePicker
                value={filters.from_date}
                onChange={(value) => handleFilterChange('from_date', value)}
                placeholder="Select start date"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <DatePicker
                value={filters.to_date}
                onChange={(value) => handleFilterChange('to_date', value)}
                placeholder="Select end date"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'Asset', label: 'Asset' },
                  { value: 'Liability', label: 'Liability' },
                  { value: 'Equity', label: 'Equity' },
                  { value: 'Revenue', label: 'Revenue' },
                  { value: 'Expense', label: 'Expense' }
                ]}
                value={filters.account_type}
                onChange={(value) => handleFilterChange('account_type', value as string)}
                placeholder="Select type..."
                multiple={false}
                searchable={false}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <SearchableDropdown
                options={[
                  { value: 'pdf', label: 'PDF' },
                  { value: 'excel', label: 'Excel' }
                ]}
                value={filters.report_format}
                onChange={(value) => handleFilterChange('report_format', value as string)}
                placeholder="Select format..."
                multiple={false}
                searchable={false}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                {report.icon}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={loading}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadReport(report.id)}
                    disabled={loading}
                    className="flex items-center px-3 py-2 bg-primary text-white rounded hover:bg-secondary text-sm disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600">{report.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {reportTypes.find(r => r.id === reportData.type)?.name}
            </h2>
          </div>
          <div className="p-6 overflow-x-auto">
            {reportData.type === 'trial_balance' && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.data.accounts?.map((acc: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm">{acc.account_name}</td>
                      <td className="px-4 py-2 text-sm text-right">{acc.debit.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right">{acc.credit.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right">{acc.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td className="px-4 py-2 text-sm">Total</td>
                    <td className="px-4 py-2 text-sm text-right">{reportData.data.grand_total_debit?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">{reportData.data.grand_total_credit?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right"></td>
                  </tr>
                </tbody>
              </table>
            )}
            {reportData.type === 'profit_loss' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Income</h3>
                  {reportData.data.income?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.name}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold border-t">
                    <span>Total Income</span>
                    <span>{reportData.data.total_income?.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Expenses</h3>
                  {reportData.data.expenses?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.name}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold border-t">
                    <span>Total Expenses</span>
                    <span>{reportData.data.total_expense?.toFixed(2)}</span>
                  </div>
                </div>
                <div className={`flex justify-between py-2 font-bold text-lg border-t-2 ${reportData.data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Net Profit</span>
                  <span>{reportData.data.net_profit?.toFixed(2)}</span>
                </div>
              </div>
            )}
            {reportData.type === 'cash_flow' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Cash Inflows</h3>
                  {reportData.data.inflows?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.description}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold border-t">
                    <span>Total Inflows</span>
                    <span>{reportData.data.total_inflows?.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cash Outflows</h3>
                  {reportData.data.outflows?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.description}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold border-t">
                    <span>Total Outflows</span>
                    <span>{reportData.data.total_outflows?.toFixed(2)}</span>
                  </div>
                </div>
                <div className={`flex justify-between py-2 font-bold text-lg border-t-2 ${reportData.data.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <span>Net Cash Flow</span>
                  <span>{reportData.data.net_cash_flow?.toFixed(2)}</span>
                </div>
              </div>
            )}
            {reportData.type === 'balance_sheet' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Assets</h3>
                  {reportData.data.assets?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.name}</span>
                      <span>{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold border-t">
                    <span>Total Assets</span>
                    <span>{reportData.data.total_assets?.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Liabilities</h3>
                    {reportData.data.liabilities?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 font-bold border-t">
                      <span>Total Liabilities</span>
                      <span>{reportData.data.total_liabilities?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Equity</h3>
                    {reportData.data.equity?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 font-bold border-t">
                      <span>Total Equity</span>
                      <span>{reportData.data.total_equity?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;