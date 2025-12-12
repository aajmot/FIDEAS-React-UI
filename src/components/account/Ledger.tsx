import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, FileText } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { accountService, ledgerService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { LedgerEntry } from '../../types';

const Ledger: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    account_id: '',
    from_date: '',
    to_date: '',
    reference_type: ''
  });
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAccounts();
    loadLedger();
  }, []);

  useEffect(() => {
    loadSummary();
  }, [filters]);

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      setAccounts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load accounts');
    }
  };

  const loadLedger = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await ledgerService.getLedgerEntries({
        ...filters,
        page,
        per_page: 10,
        search
      });
      const entriesData = Array.isArray(response.data) ? response.data : [];
      setEntries(entriesData);
      setTotalItems(response.total);
      setCurrentPage(page);
      calculateTotals(entriesData);
      
      // Load summary only on first page or when filters change
      if (page === 1) {
        loadSummary();
      }
    } catch (error) {
      showToast('error', 'Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadLedger(1);
  };

  const clearFilters = () => {
    const newFilters = {
      account_id: '',
      from_date: '',
      to_date: '',
      reference_type: ''
    };
    setFilters(newFilters);
    setCurrentPage(1);
    // Use setTimeout to ensure filters are updated before API call
    setTimeout(() => {
      loadLedger(1);
    }, 0);
  };

  const handlePageChange = (page: number) => {
    loadLedger(page);
  };

  const handleSearch = (searchTerm: string) => {
    setCurrentPage(1);
    loadLedger(1, searchTerm);
  };

  const [totals, setTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    closingBalance: 0
  });
  const [overallTotals, setOverallTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    closingBalance: 0
  });

  const calculateTotals = (entriesData: LedgerEntry[]) => {
    const totalDebit = entriesData.reduce((sum, entry: any) => sum + (parseFloat(entry.debit_amount) || 0), 0);
    const totalCredit = entriesData.reduce((sum, entry: any) => sum + (parseFloat(entry.credit_amount) || 0), 0);
    const netChange = totalDebit - totalCredit;
    setTotals({ totalDebit, totalCredit, closingBalance: netChange });
  };

  const loadSummary = async () => {
    try {
      const response = await ledgerService.getLedgerSummary(filters);
      setOverallTotals({
        totalDebit: response.data.total_debit || 0,
        totalCredit: response.data.total_credit || 0,
        closingBalance: response.data.closing_balance || 0
      });
    } catch (error) {
      console.error('Failed to load ledger summary:', error);
    }
  };

  const columns = [
    {
      key: 'transaction_date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { key: 'reference_type', label: 'Reference Type' },
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
    { key: 'narration', label: 'Description' },
    {
      key: 'debit_amount',
      label: 'Debit',
      render: (value: number) => {
        const debitValue = Number(value) || 0;
        return debitValue > 0 ? debitValue.toLocaleString() : '-';
      }
    },
    {
      key: 'credit_amount',
      label: 'Credit',
      render: (value: number) => {
        const creditValue = Number(value) || 0;
        return creditValue > 0 ? creditValue.toLocaleString() : '-';
      }
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value: number) => {
        const balance = value || 0;
        return (
          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(balance).toLocaleString()} {balance >= 0 ? 'Dr' : 'Cr'}
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
          <h2 className="text-lg font-semibold text-gray-900">Ledger</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Accounts' },
                  ...accounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.code} - ${acc.name}`
                  }))
                ]}
                value={filters.account_id}
                onChange={(value) => handleFilterChange('account_id', value as string)}
                placeholder="Select account..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <DatePicker
                value={filters.from_date}
                onChange={(value) => handleFilterChange('from_date', value)}
                placeholder="From date"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <DatePicker
                value={filters.to_date}
                onChange={(value) => handleFilterChange('to_date', value)}
                placeholder="To date"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Type</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'SALES_INVOICE', label: 'Sales Invoice' },
                  { value: 'PURCHASE_INVOICE', label: 'Purchase Invoice' },
                  { value: 'RECEIPT', label: 'Receipt' },
                  { value: 'PAYMENT', label: 'Payment' },
                  { value: 'JOURNAL', label: 'Journal' },
                  { value: 'CONTRA', label: 'Contra' }
                ]}
                value={filters.reference_type}
                onChange={(value) => handleFilterChange('reference_type', value as string)}
                placeholder="Select type..."
                multiple={false}
                searchable={false}
                className="w-full"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Overall Totals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Totals</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{overallTotals.totalDebit.toLocaleString()}</div>
              <div className="text-xs text-green-600">Total Debit</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{overallTotals.totalCredit.toLocaleString()}</div>
              <div className="text-xs text-red-600">Total Credit</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${overallTotals.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(overallTotals.closingBalance).toLocaleString()} {overallTotals.closingBalance >= 0 ? 'Dr' : 'Cr'}
              </div>
              <div className="text-xs text-blue-600">Closing Balance</div>
            </div>
          </div>
        </div>
        
        {/* Current Page Totals */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Page Totals</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{totals.totalDebit.toLocaleString()}</div>
              <div className="text-xs text-green-600">Page Debit</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{totals.totalCredit.toLocaleString()}</div>
              <div className="text-xs text-red-600">Page Credit</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${totals.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(totals.closingBalance).toLocaleString()} {totals.closingBalance >= 0 ? 'Dr' : 'Cr'}
              </div>
              <div className="text-xs text-blue-600">Page Balance</div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="Ledger Entries"
        columns={columns}
        data={entries}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        pageSize={10}
      />
    </div>
  );
};

export default Ledger;