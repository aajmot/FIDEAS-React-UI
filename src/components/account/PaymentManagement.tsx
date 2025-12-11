import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import DataTable from '../common/DataTable';
import PaymentForm from './PaymentForm';
import PaymentView from './PaymentView';
import { accountService, inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Payment } from '../../types';

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPaymentId, setViewingPaymentId] = useState<number | null>(null);
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
      
      // Fetch accounts, suppliers, and customers to map names
      try {
        const [accountsResponse, suppliersResponse, customersResponse] = await Promise.all([
          accountService.getAccounts(),
          inventoryService.getSuppliers({ per_page: 1000 }).catch(() => ({ data: [] })),
          inventoryService.getCustomers({ per_page: 1000 }).catch(() => ({ data: [] }))
        ]);
        
        const accounts = accountsResponse.data || [];
        const suppliers = suppliersResponse.data || [];
        const customers = customersResponse.data || [];
        
        // Map account names and party names
        const enrichedPayments = paymentsData.map((payment: any) => {
          const account = accounts.find((a: any) => a.id === payment.account_id);
          let partyName = '';
          
          if (payment.party_type === 'SUPPLIER' && payment.party_id) {
            const supplier = suppliers.find((s: any) => s.id === payment.party_id);
            partyName = supplier?.name || `Supplier ${payment.party_id}`;
          } else if (payment.party_type === 'CUSTOMER' && payment.party_id) {
            const customer = customers.find((c: any) => c.id === payment.party_id);
            partyName = customer?.name || `Customer ${payment.party_id}`;
          }
          
          return {
            ...payment,
            account_name: account?.name || `Account ${payment.account_id || ''}`,
            party_name: partyName,
            payment_date: payment.payment_date || payment.date
          };
        });
        
        setPayments(enrichedPayments);
      } catch (accountError) {
        console.error('Failed to fetch data:', accountError);
        setPayments(paymentsData.map((payment: any) => ({
          ...payment,
          account_name: `Account ${payment.account_id || ''}`,
          party_name: '',
          payment_date: payment.payment_date || payment.date
        })));
      }
      
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
      showToast('success', 'Payment created successfully');
      loadPayments();
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
    } catch (error) {
      showToast('error', 'Failed to create payment');
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

  const handlePrint = (payment: Payment) => {
    setViewingPaymentId(payment.id);
  };

  const handleBackFromView = () => {
    setViewingPaymentId(null);
    loadPayments();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'payment_number',
      label: 'Payment #',
      render: (value: any, row: Payment) => (
        <div>
          <div className="font-medium text-xs">{row.payment_number}</div>
        </div>
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
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'CASH' ? 'bg-blue-100 text-blue-800' : 
          value === 'BANK' ? 'bg-green-100 text-green-800' : 
          'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'party_name',
      label: 'Party',
      render: (value: string) => (
        <span className="text-xs">{value || '-'}</span>
      )
    },
    // {
    //   key: 'account_name',
    //   label: 'Account',
    //   render: (value: string) => (
    //     <span className="text-xs">{value || '-'}</span>
    //   )
    // },
    {
      key: 'total_amount_base',
      label: 'Amount',
      render: (value: any) => {
        const amount = typeof value === 'number' ? value : parseFloat(value) || 0;
        return <span className="text-xs font-medium">{amount.toFixed(2)}</span>;
      }
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (value: string) => (
        <span className="text-xs">{value || '-'}</span>
      )
    },
    {
      key: 'reference_number',
      label: 'Reference',
      render: (value: string) => (
        <span className="text-xs">{value || '-'}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Payment) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row);
            }}
            className="text-gray-600 hover:text-gray-900"
            title="Print Payment"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // If viewing a payment, show the view component
  if (viewingPaymentId !== null) {
    return (
      <PaymentView
        paymentId={viewingPaymentId}
        onBack={handleBackFromView}
      />
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <PaymentForm
        onSave={handlePaymentSaved}
        onCancel={() => {}}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />

      <DataTable
        title="Payment Entries (Outgoing)"
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

export default PaymentManagement;