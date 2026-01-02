import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer } from 'lucide-react';
import TestInvoiceForm from './TestInvoiceForm';
import TestInvoiceView from './TestInvoiceView';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { healthService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestInvoice {
  id: number;
  invoice_number: string;
  test_order_id: number;
  order?: {
    id: number;
    test_order_number: string;
    order_date: string;
    doctor_name: string;
    urgency: string;
    status: string;
  };
  patient_name: string;
  invoice_date: string;
  final_amount: number;
  paid_amount: number;
  payment_status: string;
  status: string;
}

const TestInvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<TestInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<TestInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceView, setShowInvoiceView] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, invoiceId: null as number | null, invoiceNumber: '' });
  const { showToast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await healthService.getTestInvoices();
      setInvoices(response.data.data || response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load test invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', editingInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
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

  const handlePrint = async (invoice: TestInvoice) => {
    try {
      const response = await healthService.getTestInvoice(invoice.id, true);
      const invoiceData = response.data.data || response.data;
      setSelectedInvoice(invoiceData);
      setShowInvoiceView(true);
    } catch (error) {
      showToast('error', 'Failed to load invoice for printing');
    }
  };

  const handleEdit = async (invoice: TestInvoice) => {
    try {
      const response = await healthService.getTestInvoice(invoice.id);
      const invoiceData = response.data.data || response.data;
      
      setEditingInvoice(invoiceData);
      setIsFormCollapsed(false);
    } catch (error) {
      showToast('error', 'Failed to load invoice details');
    }
  };

  const handleDeleteClick = (invoice: TestInvoice) => {
    setDeleteModal({ isOpen: true, invoiceId: invoice.id, invoiceNumber: invoice.invoice_number });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.invoiceId) return;
    
    try {
      await healthService.deleteTestInvoice(deleteModal.invoiceId);
      setInvoices(invoices.filter(inv => inv.id !== deleteModal.invoiceId));
      showToast('success', 'Invoice deleted successfully');
      setDeleteModal({ isOpen: false, invoiceId: null, invoiceNumber: '' });
    } catch (error) {
      showToast('error', 'Failed to delete invoice');
    }
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', sortable: true },
    { 
      key: 'order', 
      label: 'Order #', 
      sortable: true,
      render: (_: any, invoice: TestInvoice) => invoice.order?.test_order_number || 'N/A'
    },
    { key: 'patient_name', label: 'Patient', sortable: true },
    { 
      key: 'invoice_date', 
      label: 'Date', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'final_amount',
      label: 'Amount',
      sortable: true,
      render: (value: number) => `₹${(value || 0).toFixed(2)}`,
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
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '2px 8px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'POSTED' ? '#dcfce7' : value === 'DRAFT' ? '#fef3c7' : '#fee2e2',
          color: value === 'POSTED' ? '#166534' : value === 'DRAFT' ? '#854d0e' : '#991b1b'
        }}>
          {value || 'DRAFT'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, invoice: TestInvoice) => {
        const isEditable = invoice.payment_status === 'UNPAID' && invoice.status === 'DRAFT';
        return (
          <div className="flex space-x-0">
            <button 
              onClick={() => handlePrint(invoice)} 
              className="text-green-600 hover:text-green-800 cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button 
              onClick={() => isEditable && handleEdit(invoice)} 
              className={`h-4 w-4 ${isEditable ? 'text-blue-600 hover:text-blue-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
              title={isEditable ? 'Edit' : 'Cannot edit - Invoice is paid or posted'}
              disabled={!isEditable}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => isEditable && handleDeleteClick(invoice)} 
              className={`h-4 w-4 ${isEditable ? 'text-red-600 hover:text-red-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
              title={isEditable ? 'Delete' : 'Cannot delete - Invoice is paid or posted'}
              disabled={!isEditable}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  if (showInvoiceView && selectedInvoice) {
    return (
      <TestInvoiceView
        invoice={selectedInvoice}
        onBack={() => {
          setShowInvoiceView(false);
          setSelectedInvoice(null);
        }}
      />
    );
  }

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <TestInvoiceForm
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
        editData={editingInvoice}
      />

      <DataTable
        title="Test Invoices"
        data={invoices}
        columns={columns}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, invoiceId: null, invoiceNumber: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteModal.invoiceNumber}?`}
      />
    </div>
  );
};

export default TestInvoiceManagement;
