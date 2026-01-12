import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';
import { accountService, ledgerService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CashBook: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    account_id: ''
  });
  const [summary, setSummary] = useState({
    opening_balance: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    closing_balance: 0
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadCashAccounts();
  }, []);

  useEffect(() => {
    if (filters.account_id) {
      loadCashBook();
    }
  }, [filters.account_id]);

  const loadCashAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      const cashOnly = response.data.filter((acc: any) => acc.code?.startsWith('CASH'));
      setCashAccounts(cashOnly);
      if (cashOnly.length > 0) {
        setFilters(prev => ({ ...prev, account_id: cashOnly[0].id }));
      }
    } catch (error) {
      showToast('error', 'Failed to load cash accounts');
    }
  };

  const loadCashBook = async () => {
    try {
      setLoading(true);
      const response = await ledgerService.getBooks({
        book_type: 'CASH_BOOK',
        account_id: parseInt(filters.account_id),
        from_date: filters.from_date,
        to_date: filters.to_date,
        page: 1,
        per_page: 1000
      });

      const ledgerData = response.data || [];

      const totalCashIn = ledgerData.reduce((sum: number, e: any) => sum + (e.debit_amount || 0), 0);
      const totalCashOut = ledgerData.reduce((sum: number, e: any) => sum + (e.credit_amount || 0), 0);
      const closingBalance = totalCashIn - totalCashOut;

      setEntries(ledgerData);

      setSummary({
        opening_balance: 0,
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        closing_balance: closingBalance
      });
    } catch (error) {
      showToast('error', 'Failed to load cash book');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadCashBook();
  };

  const columns = [
    {
      key: 'transaction_date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { key: 'voucher_number', label: 'Voucher No.' },
    { key: 'voucher_type', label: 'Type' },
    { key: 'narration', label: 'Particulars' },
    {
      key: 'debit_amount',
      label: 'Cash In',
      render: (value: number) => {
        const cashIn = Number(value) || 0;
        return cashIn > 0 ? `${cashIn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
      }
    },
    {
      key: 'credit_amount',
      label: 'Cash Out',
      render: (value: number) => {
        const cashOut = Number(value) || 0;
        return cashOut > 0 ? `${cashOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
      }
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value: number) => {
        const balance = Number(value) || 0;
        return (
          <span className={balance >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Cash Account *</label>
                <SearchableDropdown
                  options={cashAccounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.code})` }))}
                  value={filters.account_id}
                  onChange={(value) => handleFilterChange('account_id', value as string)}
                  placeholder="Select cash account..."
                  multiple={false}
                  searchable={true}
                />
              </div>
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
                  to_date: new Date().toISOString().split('T')[0],
                  account_id: cashAccounts[0]?.id || ''
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{summary.opening_balance.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Opening Balance</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{summary.total_cash_in.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Cash In</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{summary.total_cash_out.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Cash Out</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${summary.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.closing_balance.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Closing Balance</div>
          </div>
        </div>
      </div>

      <DataTable
        title="Cash Book"
        columns={columns}
        data={entries}
        loading={loading}
      />
    </div>
  );
};

export default CashBook;
