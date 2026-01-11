import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, FileText, Download } from 'lucide-react';
import DataTable from '../common/DataTable';
import AppointmentInvoiceForm from './AppointmentInvoiceForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

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

  const handleView = async (id: number) => {
    try {
      const response = await apiClient.get(`/api/v1/health/appointment-invoices/${id}`);
      const invoice = response.data;
      
      // Create a new window to display the invoice
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Appointment Invoice - ${invoice.invoice_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .section h3 { margin-bottom: 10px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Appointment Invoice</h1>
                <h2>${invoice.invoice_number}</h2>
              </div>
              
              <div class="invoice-details">
                <div class="section">
                  <h3>Patient Information</h3>
                  <p><strong>Name:</strong> ${invoice.patient_name}</p>
                  <p><strong>Phone:</strong> ${invoice.patient_phone}</p>
                  <p><strong>Email:</strong> ${invoice.patient_email || 'N/A'}</p>
                </div>
                
                <div class="section">
                  <h3>Doctor Information</h3>
                  <p><strong>Name:</strong> ${invoice.doctor_name}</p>
                  <p><strong>Speciality:</strong> ${invoice.doctor_speciality || 'N/A'}</p>
                  <p><strong>License:</strong> ${invoice.doctor_license_number || 'N/A'}</p>
                </div>
              </div>
              
              <div class="section">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${invoice.status}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items?.map((item: any) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.rate.toFixed(2)}</td>
                      <td>₹${item.disc_amount.toFixed(2)}</td>
                      <td class="text-right">₹${item.total_amount.toFixed(2)}</td>
                    </tr>
                  `).join('') || ''}
                  <tr class="total-row">
                    <td colspan="4"><strong>Total Amount</strong></td>
                    <td class="text-right"><strong>₹${invoice.final_amount.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
              
              ${invoice.notes ? `
                <div class="section">
                  <h3>Notes</h3>
                  <p>${invoice.notes}</p>
                </div>
              ` : ''}
              
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to load invoice details');
    }
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice Number' },
    { 
      key: 'invoice_date', 
      label: 'Invoice Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'due_date', 
      label: 'Due Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { key: 'patient_name', label: 'Patient' },
    { key: 'doctor_name', label: 'Doctor' },
    { 
      key: 'final_amount', 
      label: 'Amount',
      render: (value: number) => `₹${value.toFixed(2)}`
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
    }
  ];

  const actions = [
    {
      label: 'View',
      icon: Eye,
      onClick: (invoice: AppointmentInvoice) => handleView(invoice.id),
      className: 'text-blue-600 hover:text-blue-800'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
      className: 'text-green-600 hover:text-green-800'
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: (invoice: AppointmentInvoice) => handleDelete(invoice.id),
      className: 'text-red-600 hover:text-red-800'
    }
  ];

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
        onEdit={handleEdit}
        onDelete={(invoice: AppointmentInvoice) => handleDelete(invoice.id)}
        loading={loading}
        canEdit={(invoice: AppointmentInvoice) => invoice.status === 'DRAFT'}
        canDelete={(invoice: AppointmentInvoice) => invoice.status === 'DRAFT'}
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