import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Payment } from '../../types';

const ReceiptManagement: React.FC = () => {
  const [receipts, setReceipts] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await accountService.getPayments({
        page,
        per_page: 10,
        search,
        payment_mode: 'RECEIVED'
      });
      setReceipts(response.data);
      setTotalItems(response.total);
      setCurrentPage(page);
    } catch (error) {
      showToast('error', 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/account/vouchers?type=Receipt');
  };

  const handleRowClick = (receipt: Payment) => {
    navigate(`/account/vouchers?id=${receipt.id}`);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'payment_number', label: 'Receipt No.' },
    {
      key: 'payment_type',
      label: 'Type',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'CASH' ? 'bg-blue-100 text-blue-800' : 
          value === 'BANK' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'payment_method', label: 'Method' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => `₹${(value || 0).toLocaleString()}`
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { key: 'reference_number', label: 'Reference' },
    { key: 'remarks', label: 'Remarks' }
  ];

  return (
    <div className="p-3 sm:p-6">
      <DataTable
        title="Receipt Entries (Incoming)"
        columns={columns}
        data={receipts}
        onRowClick={handleRowClick}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadReceipts(page)}
        onSearch={(searchTerm) => {
          setCurrentPage(1);
          loadReceipts(1, searchTerm);
        }}
        pageSize={10}
      />
    </div>
  );
};

export default ReceiptManagement;
