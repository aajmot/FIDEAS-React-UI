import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import PaymentTermsForm from './PaymentTermsForm';
import ConfirmationModal from '../common/ConfirmationModal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { PaymentTerm } from '../../types';

const PaymentTermsManagement: React.FC = () => {
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingPaymentTerm, setEditingPaymentTerm] = useState<PaymentTerm | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadPaymentTerms();
  }, [currentPage, searchTerm]);

  const loadPaymentTerms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/account/payment-terms', { 
        params: {
          page: currentPage, 
          per_page: pageSize, 
          search: searchTerm || undefined
        }
      });
      const data = response.data?.data || response.data;
      setPaymentTerms(Array.isArray(data) ? data : []);
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      showToast('error', 'Failed to load payment terms');
      setPaymentTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paymentTerm: PaymentTerm) => {
    setEditingPaymentTerm(paymentTerm);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSave = async (paymentTermData: any) => {
    try {
      if (editingPaymentTerm) {
        await api.put(`/api/v1/account/payment-terms/${editingPaymentTerm.id}`, paymentTermData);
        showToast('success', 'Payment term updated successfully');
      } else {
        await api.post('/api/v1/account/payment-terms', paymentTermData);
        showToast('success', 'Payment term created successfully');
      }
      setEditingPaymentTerm(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadPaymentTerms();
    } catch (error) {
      showToast('error', 'Failed to save payment term');
    }
  };

  const handleCancel = () => {
    setEditingPaymentTerm(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (paymentTerm: PaymentTerm) => {
    showConfirmation(
      {
        title: 'Delete Payment Term',
        message: `Are you sure you want to delete "${paymentTerm.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await api.delete(`/api/v1/account/payment-terms/${paymentTerm.id}`);
          showToast('success', 'Payment term deleted successfully');
          loadPaymentTerms();
        } catch (error) {
          showToast('error', 'Failed to delete payment term');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { 
      key: 'code', 
      label: 'Code',
      render: (value: string) => (
        <span className="text-xs font-medium">{value}</span>
      )
    },
    { 
      key: 'name', 
      label: 'Name',
      render: (value: any, row: PaymentTerm) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-xs text-gray-500">{row.description}</div>
          )}
        </div>
      )
    },
    { 
      key: 'days', 
      label: 'Days',
      render: (value: number) => (
        <span className="text-xs">{value} days</span>
      )
    },
    { 
      key: 'is_default', 
      label: 'Default',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    { 
      key: 'is_active', 
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <PaymentTermsForm
        paymentTerm={editingPaymentTerm}
        onSave={handleSave}
        onCancel={handleCancel}
        resetForm={resetForm}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <DataTable
        title="Payment Terms Management"
        columns={columns}
        data={paymentTerms}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />
    </div>
  );
};

export default PaymentTermsManagement;
