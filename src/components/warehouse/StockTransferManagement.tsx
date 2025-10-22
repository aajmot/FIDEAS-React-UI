import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import StockTransferForm from './StockTransferForm';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface StockTransfer {
  id: number;
  transfer_number: string;
  from_warehouse_name: string;
  to_warehouse_name: string;
  transfer_date: string;
  status: string;
}

const StockTransferManagement: React.FC = () => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/warehouse/stock-transfers');
      const data = response.data?.data || response.data;
      setTransfers(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load stock transfers');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this transfer?')) return;
    try {
      await api.delete(`/api/v1/warehouse/stock-transfers/${id}`);
      showToast('success', 'Transfer deleted successfully');
      fetchTransfers();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to delete transfer');
    }
  };

  const handleEdit = (transfer: StockTransfer) => {
    setEditingTransfer(transfer);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransfer(null);
    fetchTransfers();
  };

  const filteredTransfers = transfers.filter(t =>
    t.transfer_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.from_warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.to_warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'transfer_number', label: 'Transfer #', sortable: true },
    { 
      key: 'transfer_date', 
      label: 'Date', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { key: 'from_warehouse_name', label: 'From Warehouse', sortable: true },
    { key: 'to_warehouse_name', label: 'To Warehouse', sortable: true },
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
      render: (_: any, transfer: StockTransfer) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(transfer)} className="text-blue-600 hover:text-blue-800">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(transfer.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  if (showForm) {
    return <StockTransferForm transfer={editingTransfer} onClose={handleFormClose} />;
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stock Transfers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} /> New Transfer
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by transfer number or warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          title="Stock Transfers"
          data={filteredTransfers}
          columns={columns}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default StockTransferManagement;
