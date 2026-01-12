import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, FileText, Download, Printer } from 'lucide-react';
import DataTable from '../common/DataTable';
import AppointmentInvoiceForm from './AppointmentInvoiceForm';
import AppointmentInvoiceView from './AppointmentInvoiceView';
import ConfirmationModal from '../common/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';
import { formatUTCToLocal } from '../../utils/dateUtils';

interface AppointmentInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  appointment_id: number;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  final_amount: number;
  status: string;
  notes: string;
}

const AppointmentInvoiceManagement: React.FC = () => {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<AppointmentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AppointmentInvoice | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; invoiceId: number | null }>({
    isOpen: false,
    invoiceId: null
  });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceView, setShowInvoiceView] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/health/appointment-invoices');
      setInvoices(response.data.data || response.data || []);
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to load appointment invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadInvoices();
    setEditingInvoice(null);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleCancel = () => {
    setEditingInvoice(null);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleEdit = async (invoice: AppointmentInvoice) => {
    if (invoice.status !== 'DRAFT') {
      showToast('error', 'Only draft invoices can be edited');
      return;
    }
    
    try {
      // Fetch full invoice details including items
      const response = await apiClient.get(`/api/v1/health/appointment-invoices/${invoice.id}`);
      const fullInvoiceData = response.data.data || response.data;
      setEditingInvoice(fullInvoiceData);
      setIsFormCollapsed(false);
    } catch (error: any) {
      showToast('error', 'Failed to load invoice details');
    }
  };

  const handleDelete = (id: number) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice && invoice.status !== 'DRAFT') {
      showToast('error', 'Only draft invoices can be deleted');
      return;
    }
    setDeleteConfirmation({ isOpen: true, invoiceId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.invoiceId) {
      try {
        await apiClient.delete(`/api/v1/health/appointment-invoices/${deleteConfirmation.invoiceId}`);
        showToast('success', 'Invoice deleted successfully');
        loadInvoices();
      } catch (error: any) {
        showToast('error', error.response?.data?.detail || 'Failed to delete invoice');
      }
    }
    setDeleteConfirmation({ isOpen: false, invoiceId: null });
  };

  const handleView = async (invoice: AppointmentInvoice) => {
    try {
      const response = await apiClient.get(`/api/v1/health/appointment-invoices/${invoice.id}?include_barcode=true`);
      const invoiceData = response.data.data || response.data;
      setSelectedInvoice(invoiceData);
      setShowInvoiceView(true);
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to load invoice for printing');
    }
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice Number' },
    { 
      key: 'invoice_date', 
      label: 'Invoice Date',
      render: (value: string) =>formatUTCToLocal(value)
    },
    // { 
    //   key: 'due_date', 
    //   label: 'Due Date',
    //   render: (value: string) => formatUTCToLocal(value)
    // },
    { key: 'patient_name', label: 'Patient' },
    { key: 'doctor_name', label: 'Doctor' },
    { 
      key: 'final_amount', 
      label: 'Amount',
      render: (value: number) => `${value}`
    },
    { 
      key: 'balance_amount', 
      label: 'Balance Amt',
      render: (value: number) => `${value}`
    },
     {
      key: 'payment_status',
      label: 'Payment Status',
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '2px 8px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'PAID' ? '#dcfce7' : value === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
          color: value === 'PAID' ? '#166534' : value === 'PARTIAL' ? '#854d0e' : '#991b1b'
        }}>
          {value || 'UNPAID'}
        </span>
      ),
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'POSTED' ? 'bg-green-100 text-green-800' :
          value === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, invoice: AppointmentInvoice) => {
        const isEditable = invoice.status === 'DRAFT';
        return (
          <div className="flex space-x-0">
            <button 
              onClick={() => handleView(invoice)} 
              className="text-green-600 hover:text-green-800 cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button 
              onClick={() => isEditable && handleEdit(invoice)} 
              className={`h-4 w-4 ${isEditable ? 'text-blue-600 hover:text-blue-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
              title={isEditable ? 'Edit' : 'Cannot edit - Invoice is not draft'}
              disabled={!isEditable}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => isEditable && handleDelete(invoice.id)} 
              className={`h-4 w-4 ${isEditable ? 'text-red-600 hover:text-red-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
              title={isEditable ? 'Delete' : 'Cannot delete - Invoice is not draft'}
              disabled={!isEditable}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }
  ];



  if (showInvoiceView && selectedInvoice) {
    return (
      <AppointmentInvoiceView
        invoice={selectedInvoice}
        onBack={() => {
          setShowInvoiceView(false);
          setSelectedInvoice(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AppointmentInvoiceForm
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
        editData={editingInvoice}
      />

      <DataTable
        title="Appointment Invoices"
        data={invoices}
        columns={columns}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onCancel={() => setDeleteConfirmation({ isOpen: false, invoiceId: null })}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this appointment invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default AppointmentInvoiceManagement;