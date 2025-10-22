import React, { useState, useEffect } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { useConfirmation } from '../../hooks/useConfirmation';
import BillingForm from './BillingForm';
import InvoiceView from './InvoiceView';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Invoice } from '../../types';

const BillingManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);

  const [viewingInvoice, setViewingInvoice] = useState<Invoice | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'list' | 'view'>('list');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await clinicService.getInvoices();
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('error', 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };



  const handlePrint = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details including items
      const response = await clinicService.getInvoice(invoice.id);
      setViewingInvoice(response.data);
      setActiveTab('view');
    } catch (error) {
      showToast('error', 'Failed to load invoice details');
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    showConfirmation(
      {
        title: 'Delete Invoice',
        message: `Are you sure you want to delete invoice "${invoice.invoice_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deleteInvoice(invoice.id);
          showToast('success', 'Invoice deleted successfully');
          loadInvoices();
        } catch (error) {
          showToast('error', 'Failed to delete invoice');
        }
      }
    );
  };

  const handleSave = async (invoiceData: any) => {
    try {
      if (invoiceData.id) {
        // Update existing invoice
        await clinicService.updateInvoice(invoiceData.id, invoiceData);
        showToast('success', 'Invoice updated successfully');
      } else {
        // Create new invoice
        await clinicService.createInvoice(invoiceData);
        showToast('success', 'Invoice created successfully');
      }
      setEditingInvoice(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadInvoices();
    } catch (error) {
      showToast('error', invoiceData.id ? 'Failed to update invoice' : 'Failed to create invoice');
    }
  };

  const handleCancel = () => {
    setEditingInvoice(undefined);
    setViewingInvoice(undefined);
    setActiveTab('list');
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleAppointmentSelect = async (appointmentId: number) => {
    // Form handles existing invoice detection internally
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return (amount || 0).toFixed(2);
  };



  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice #' },
    { 
      key: 'appointment_number', 
      label: 'Appointment #',
      render: (value: string) => value || '-'
    },
    { 
      key: 'consultation_fee', 
      label: 'Consultation Fee',
      render: (value: number) => formatAmount(value)
    },
    { 
      key: 'payment_method', 
      label: 'Payment Method',
      render: (value: string) => value || '-'
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value || 'pending'}
        </span>
      )
    },
    { 
      key: 'total_amount', 
      label: 'Total Amount',
      render: (value: number) => formatAmount(value)
    },
    { 
      key: 'discount_percentage', 
      label: 'Disc %',
      render: (value: number) => `${value || 0}%`
    },
    { 
      key: 'discount_amount', 
      label: 'Discount Amount',
      render: (value: number) => formatAmount(value || 0)
    },
    { 
      key: 'final_amount', 
      label: 'Final Amount',
      render: (value: number) => (
        <span className="font-semibold">{formatAmount(value)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Invoice) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handlePrint(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Invoice"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800"
            title="Delete Invoice"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];



  if (activeTab === 'view' && viewingInvoice) {
    return (
      <div className="p-3 sm:p-6">
        <InvoiceView
          invoice={viewingInvoice}
          onBack={() => setActiveTab('list')}
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <BillingForm
        invoice={editingInvoice}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onAppointmentSelect={handleAppointmentSelect}
      />
      
      <DataTable
        title="Clinic Invoices"
        data={invoices}
        columns={columns}
        loading={loading}
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

export default BillingManagement;