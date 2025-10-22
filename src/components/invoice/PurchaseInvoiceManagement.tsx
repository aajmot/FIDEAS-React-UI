import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import PurchaseInvoiceForm from './PurchaseInvoiceForm';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  supplier_id: number;
  supplier_name: string;
  due_date: string;
  total_amount: number;
  status: string;
}

const PurchaseInvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/invoice/purchase-invoices');
      const data = response.data?.data || response.data;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/api/v1/invoice/purchase-invoices/${id}`);
      showToast('success', 'Invoice deleted successfully');
      fetchInvoices();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to delete invoice');
    }
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInvoice(null);
    fetchInvoices();
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', sortable: true },
    { 
      key: 'invoice_date', 
      label: 'Date', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { key: 'supplier_name', label: 'Supplier', sortable: true },
    { 
      key: 'total_amount', 
      label: 'Amount', 
      sortable: true,
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { 
      key: 'due_date', 
      label: 'Due Date', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, invoice: PurchaseInvoice) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(invoice)} className="text-blue-600 hover:text-blue-800">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  if (showForm) {
    return <PurchaseInvoiceForm invoice={editingInvoice} onClose={handleFormClose} />;
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Invoices</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} /> New Invoice
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by invoice number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          title="Purchase Invoices"
          data={filteredInvoices}
          columns={columns}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default PurchaseInvoiceManagement;
