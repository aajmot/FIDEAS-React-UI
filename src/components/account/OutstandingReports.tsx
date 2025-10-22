import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import DataTable from '../common/DataTable';
import DatePicker from '../common/DatePicker';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const OutstandingReports: React.FC = () => {
  const [reportType, setReportType] = useState<'receivables' | 'payables'>('receivables');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    total_outstanding: 0,
    count: 0
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadOutstanding();
  }, [reportType]);

  const loadOutstanding = async () => {
    try {
      setLoading(true);
      const response = await accountService.getAccounts();
      
      // Filter accounts based on report type
      let filteredAccounts = response.data.filter((acc: any) => {
        if (reportType === 'receivables') {
          // Debtors, Sundry Debtors, Accounts Receivable
          return acc.account_group_name?.toLowerCase().includes('debtor') ||
                 acc.account_group_name?.toLowerCase().includes('receivable') ||
                 acc.name?.toLowerCase().includes('debtor');
        } else {
          // Creditors, Sundry Creditors, Accounts Payable
          return acc.account_group_name?.toLowerCase().includes('creditor') ||
                 acc.account_group_name?.toLowerCase().includes('payable') ||
                 acc.name?.toLowerCase().includes('creditor');
        }
      });

      // Filter only accounts with non-zero balance
      filteredAccounts = filteredAccounts.filter((acc: any) => 
        Math.abs(acc.current_balance || 0) > 0.01
      );

      setEntries(filteredAccounts);
      
      const totalOutstanding = filteredAccounts.reduce((sum: number, acc: any) => 
        sum + Math.abs(acc.current_balance || 0), 0
      );
      
      setSummary({
        total_outstanding: totalOutstanding,
        count: filteredAccounts.length
      });
    } catch (error) {
      showToast('error', 'Failed to load outstanding report');
    } finally {
      setLoading(false);
    }
  };

  const getAgeCategory = (balance: number) => {
    // This is simplified - in real scenario, you'd calculate based on invoice dates
    const amount = Math.abs(balance);
    if (amount > 100000) return '90+ Days';
    if (amount > 50000) return '60-90 Days';
    if (amount > 20000) return '30-60 Days';
    return '0-30 Days';
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Party Name' },
    {
      key: 'current_balance',
      label: 'Outstanding Amount',
      render: (value: number) => {
        const amount = Math.abs(value || 0);
        return (
          <span className="font-semibold text-red-600">
            {amount.toLocaleString()}
          </span>
        );
      }
    },
    {
      key: 'current_balance',
      label: 'Age',
      render: (value: number) => {
        const category = getAgeCategory(value);
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${
            category === '90+ Days' ? 'bg-red-100 text-red-800' :
            category === '60-90 Days' ? 'bg-orange-100 text-orange-800' :
            category === '30-60 Days' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {category}
          </span>
        );
      }
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Outstanding Reports</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="receivables">Receivables (To Receive)</option>
                <option value="payables">Payables (To Pay)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
              <DatePicker
                value={asOfDate}
                onChange={setAsOfDate}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadOutstanding}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">{summary.total_outstanding.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Number of Parties</div>
          <div className="text-2xl font-bold text-blue-600">{summary.count}</div>
        </div>
        {['0-30 Days', '30-60 Days', '60-90 Days', '90+ Days'].slice(0, 3).map((age, idx) => {
          const ageEntries = entries.filter(e => getAgeCategory(e.current_balance) === age);
          const ageTotal = ageEntries.reduce((sum, e) => sum + Math.abs(e.current_balance || 0), 0);
          const colors = ['text-green-600', 'text-yellow-600', 'text-orange-600'];
          return (
            <div key={age} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">{age}</div>
              <div className={`text-2xl font-bold ${colors[idx]}`}>{ageTotal.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* Results Table */}
      <DataTable
        title={`Outstanding ${reportType === 'receivables' ? 'Receivables' : 'Payables'}`}
        columns={columns}
        data={entries}
        loading={loading}
      />
    </div>
  );
};

export default OutstandingReports;
