import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { accountService, ledgerService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const BankBook: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    account_id: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  });
  const [summary, setSummary] = useState({
    opening_balance: 0,
    total_receipts: 0,
    total_payments: 0,
    closing_balance: 0
  });
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !filters.account_id) {
      const firstAccount = accounts[0];
      setFilters(prev => ({ ...prev, account_id: firstAccount.id.toString() }));
      // Auto-load entries for first account
      setTimeout(() => loadBankBook(), 100);
    }
  }, [accounts]);

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      const bankAccounts = response.data.filter((acc: any) => 
        acc.account_group_name?.toLowerCase().includes('bank') || 
        acc.name?.toLowerCase().includes('bank')
      );
      setAccounts(bankAccounts);
    } catch (error) {
      showToast('error', 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadBankBook = async () => {
    if (!filters.account_id) {
      return;
    }

    try {
      setLoading(true);
      const response = await ledgerService.getLedgerEntries({
        ...filters,
        page: 1,
        per_page: 1000
      });
      setEntries(response.data);
      
      const totalReceipts = response.data.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);
      const totalPayments = response.data.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
      const closingBalance = (response.data[response.data.length - 1]?.balance || 0);
      
      setSummary({
        opening_balance: 0,
        total_receipts: totalReceipts,
        total_payments: totalPayments,
        closing_balance: closingBalance
      });
    } catch (error) {
      showToast('error', 'Failed to load bank book');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadBankBook();
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
    { key: 'description', label: 'Particulars' },
    {
      key: 'credit',
      label: 'Deposits',
      render: (value: number) => {
        const creditValue = Number(value) || 0;
        return creditValue > 0 ? <span className="text-green-600 font-semibold">{creditValue.toLocaleString()}</span> : '-';
      }
    },
    {
      key: 'debit',
      label: 'Withdrawals',
      render: (value: number) => {
        const debitValue = Number(value) || 0;
        return debitValue > 0 ? <span className="text-red-600 font-semibold">{debitValue.toLocaleString()}</span> : '-';
      }
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value: number) => {
        const balance = value || 0;
        return (
          <span className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(balance).toLocaleString()} {balance >= 0 ? 'Dr' : 'Cr'}
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Bank Account *</label>
                <SearchableDropdown
                  options={accounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.code} - ${acc.name}`
                  }))}
                  value={filters.account_id}
                  onChange={(value) => handleFilterChange('account_id', value as string)}
                  placeholder="Select bank account..."
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
                  account_id: '',
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

      {filters.account_id && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{summary.opening_balance.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Opening Balance</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{summary.total_receipts.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Deposits</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{summary.total_payments.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Withdrawals</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{summary.closing_balance.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Closing Balance</div>
            </div>
          </div>
        </div>
      )}

      <DataTable
        title="Bank Book Entries"
        columns={columns}
        data={entries}
        loading={loading}
      />
    </div>
  );
};

export default BankBook;
