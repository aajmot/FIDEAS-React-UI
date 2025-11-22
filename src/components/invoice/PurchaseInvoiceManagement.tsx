import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import DataTable from '../common/DataTable';
import PurchaseInvoiceForm from './PurchaseInvoiceForm';
import PurchaseInvoiceView from './PurchaseInvoiceView';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PurchaseInvoice } from '../../types';

const PurchaseInvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);
  const { showToast } = useToast();

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



  const handlePrint = (invoice: PurchaseInvoice) => {
    setViewingInvoiceId(invoice.id);
  };

  const handleBackFromView = () => {
    setViewingInvoiceId(null);
    loadInvoices();
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
        <span className="text-xs">
          {new Date(value).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
          })}
        </span>
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
        return <span className="text-xs font-medium">{amount.toFixed(2)}</span>;
      }
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (value: string | undefined) => (
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
      render: (value: any, row: PurchaseInvoice) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row);
            }}
            className="text-gray-600 hover:text-gray-900"
            title="Print Invoice"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // If viewing an invoice, show the view component
  if (viewingInvoiceId !== null) {
    return <PurchaseInvoiceView invoiceId={viewingInvoiceId} onBack={handleBackFromView} />;
  }

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

export default PurchaseInvoiceManagement;
