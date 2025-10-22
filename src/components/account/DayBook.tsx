import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import DatePicker from '../common/DatePicker';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DayBook: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  });
  const [summary, setSummary] = useState({
    total_debit: 0,
    total_credit: 0
  });
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDayBook();
  }, []);

  const loadDayBook = async () => {
    try {
      setLoading(true);
      const response = await accountService.getLedgerEntries({
        ...filters,
        page: 1,
        per_page: 1000
      });
      setEntries(response.data);
      
      const totalDebit = response.data.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
      const totalCredit = response.data.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);
      setSummary({ total_debit: totalDebit, total_credit: totalCredit });
    } catch (error) {
      showToast('error', 'Failed to load day book');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadDayBook();
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { 
      key: 'voucher_number', 
      label: 'Voucher No.',
      render: (value: string, row: any) => (
        <button
          onClick={() => navigate(`/account/vouchers?id=${row.voucher_id}`)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {value}
        </button>
      )
    },
    { key: 'voucher_type', label: 'Type' },
    { key: 'description', label: 'Particulars' },
    {
      key: 'debit',
      label: 'Debit',
      render: (value: number) => {
        const debitValue = Number(value) || 0;
        return debitValue > 0 ? debitValue.toLocaleString() : '-';
      }
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (value: number) => {
        const creditValue = Number(value) || 0;
        return creditValue > 0 ? creditValue.toLocaleString() : '-';
      }
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            type="button"
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFilterCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
        
        {!isFilterCollapsed && (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date *</label>
                <DatePicker
                  value={filters.from_date}
                  onChange={(value) => handleFilterChange('from_date', value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date *</label>
                <DatePicker
                  value={filters.to_date}
                  onChange={(value) => handleFilterChange('to_date', value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFilters({
                  from_date: new Date().toISOString().split('T')[0],
                  to_date: new Date().toISOString().split('T')[0]
                })}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.total_debit.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Debit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.total_credit.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Credit</div>
          </div>
        </div>
      </div>

      <DataTable
        title="Day Book Entries"
        columns={columns}
        data={entries}
        loading={loading}
      />
    </div>
  );
};

export default DayBook;
