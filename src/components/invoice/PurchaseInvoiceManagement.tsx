import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import PurchaseInvoiceForm from './PurchaseInvoiceForm';
import ConfirmationModal from '../common/ConfirmationModal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { PurchaseInvoice } from '../../types';

const PurchaseInvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadInvoices();
  }, [currentPage, searchTerm]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/inventory/purchase-invoices', {
        params: {
          page: currentPage,
          per_page: pageSize,
          search: searchTerm || undefined
        }
      });
      const data = response.data?.data || response.data;
      setInvoices(Array.isArray(data) ? data : []);
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      showToast('error', 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSaved = () => {
    loadInvoices();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
    showToast('success', 'Purchase invoice created successfully');
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

  const handleDelete = async (invoice: PurchaseInvoice) => {
    showConfirmation(
      {
        title: 'Delete Purchase Invoice',
        message: `Are you sure you want to delete invoice "${invoice.invoice_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await api.delete(`/api/v1/inventory/purchase-invoices/${invoice.id}`);
          showToast('success', 'Invoice deleted successfully');
          loadInvoices();
        } catch (error) {
          showToast('error', 'Failed to delete invoice');
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (value: any, row: PurchaseInvoice) => (
        <div>
          <div className="font-medium text-xs">{row.invoice_number}</div>
          {row.reference_number && (
            <div className="text-xs text-gray-500">Ref: {row.reference_number}</div>
          )}
        </div>
      )
    },
    {
      key: 'invoice_date',
      label: 'Date',
      render: (value: string) => (
        <span className="text-xs">{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'supplier_name',
      label: 'Supplier',
      render: (value: string) => (
        <span className="text-xs">{value}</span>
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
      key: 'due_date',
      label: 'Due Date',
      render: (value: string | undefined) => (
        <span className="text-xs">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
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
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <PurchaseInvoiceForm
        onSave={handleInvoiceSaved}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />

      <DataTable
        title="Purchase Invoices Management"
        columns={columns}
        data={invoices}
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

export default PurchaseInvoiceManagement;
