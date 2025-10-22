import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { JournalEntry } from '../../types';

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadJournalEntries();
  }, []);

  const loadJournalEntries = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await accountService.getJournalEntries({
        page,
        per_page: 10,
        search
      });
      setEntries(response.data);
      setTotalItems(response.total);
      setCurrentPage(page);
    } catch (error) {
      showToast('error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/account/vouchers');
  };

  const handleRowClick = (entry: JournalEntry) => {
    navigate(`/account/vouchers?id=${entry.id}`);
  };

  const handlePageChange = (page: number) => {
    loadJournalEntries(page);
  };

  const handleSearch = (searchTerm: string) => {
    setCurrentPage(1);
    loadJournalEntries(1, searchTerm);
  };





  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { key: 'voucher_number', label: 'Voucher No.' },
    { key: 'description', label: 'Description' },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value: number) => (value || 0).toLocaleString()
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Posted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },

  ];

  return (
    <div className="p-3 sm:p-6">
      <DataTable
        title="Journal Entries"
        columns={columns}
        data={entries}
        onRowClick={handleRowClick}
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

export default Journal;