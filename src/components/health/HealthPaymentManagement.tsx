import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import DataTable from '../common/DataTable';
import HealthPaymentForm from './HealthPaymentForm';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const HealthPaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const pageSize = 10;

  useEffect(() => {
    loadPayments();
  }, [currentPage, searchTerm]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await accountService.getPayments({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined,
        payment_type: 'PAYMENT'
      });
      
      const paymentsData = Array.isArray(response.data) ? response.data : [];
      setPayments(paymentsData);
      setTotalItems(response.total || 0);
    } catch (error) {
      showToast('error', 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSaved = async (paymentData: any) => {
    try {
      await accountService.createPayment(paymentData);
      showToast('success', 'Health payment created successfully');
      loadPayments();
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
    } catch (error) {
      showToast('error', 'Failed to create health payment');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      POSTED: 'bg-green-100 text-green-800',
      RECONCILED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REVERSED: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'payment_number',
      label: 'Payment #',
      render: (value: any) => (
        <div className="font-medium text-xs">{value}</div>
      )
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (value: string) => (
        <span className="text-xs">
          {value ? new Date(value).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
          }) : '-'}
        </span>
      )
    },
    {
      key: 'payment_type',
      label: 'Type',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
          {value}
        </span>
      )
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'CASH' ? 'bg-blue-100 text-blue-800' : 
          value === 'CARD' ? 'bg-green-100 text-green-800' : 
          value === 'UPI' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'total_amount_base',
      label: 'Amount',
      render: (value: any) => {
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return <span className="text-xs font-medium">₹{amount.toFixed(2)}</span>;
      }
    },
    {
      key: 'allocated_amount_base',
      label: 'Allocated',
      render: (value: any) => {
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return <span className="text-xs">₹{amount.toFixed(2)}</span>;
      }
    },
    {
      key: 'unallocated_amount_base',
      label: 'Unallocated',
      render: (value: any) => {
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return <span className="text-xs text-orange-600">₹{amount.toFixed(2)}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <HealthPaymentForm
        onSave={handlePaymentSaved}
        onCancel={() => {}}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />

      <DataTable
        title="Health Payments"
        columns={columns}
        data={payments}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default HealthPaymentManagement;
