import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DataTable from '../common/DataTable';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Payment } from '../../types';

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await accountService.getPayments({
        page,
        per_page: 10,
        search,
        payment_mode: 'PAID'
      });
      setPayments(response.data);
      setTotalItems(response.total);
      setCurrentPage(page);
    } catch (error) {
      showToast('error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/account/vouchers?type=Payment');
  };

  const handleRowClick = (payment: Payment) => {
    navigate(`/account/vouchers?id=${payment.id}`);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'payment_number', label: 'Payment No.' },
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
      render: (value: number) => (value || 0).toLocaleString()
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <DataTable
        title="Payment Entries (Outgoing)"
        columns={columns}
        data={payments}
        onRowClick={handleRowClick}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadPayments(page)}
        onSearch={(searchTerm) => {
          setCurrentPage(1);
          loadPayments(1, searchTerm);
        }}
        pageSize={10}
      />
    </div>
  );
};

export default PaymentManagement;