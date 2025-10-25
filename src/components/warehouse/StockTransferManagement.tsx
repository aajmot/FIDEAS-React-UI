import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
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
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const [transfersResponse, warehousesResponse] = await Promise.all([
        api.get('/api/v1/warehouse/stock-transfers'),
        api.get('/api/v1/warehouse/warehouses')
      ]);
      
      const transfersData = transfersResponse.data?.data || transfersResponse.data;
      const warehousesData = warehousesResponse.data?.data || warehousesResponse.data;
      const warehouses = Array.isArray(warehousesData) ? warehousesData : [];
      
      const transfersWithNames = Array.isArray(transfersData) ? transfersData.map((transfer: any) => {
        const fromWarehouse = warehouses.find((w: any) => w.id === transfer.from_warehouse_id);
        const toWarehouse = warehouses.find((w: any) => w.id === transfer.to_warehouse_id);
        return {
          ...transfer,
          from_warehouse_name: fromWarehouse?.name || 'Unknown',
          to_warehouse_name: toWarehouse?.name || 'Unknown'
        };
      }) : [];
      
      setTransfers(transfersWithNames);
    } catch (error) {
      showToast('error', 'Failed to load stock transfers');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', 'Stock transfer saved successfully');
    loadTransfers();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleEdit = (transfer: StockTransfer) => {
    setEditingTransfer(transfer);
    setIsFormCollapsed(false);
  };





  const columns = [
    {
      key: 'transfer_number',
      label: 'Transfer #',
      sortable: true,
    },
    {
      key: 'transfer_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    },
    {
      key: 'from_warehouse_name',
      label: 'From Warehouse',
      sortable: true,
    },
    {
      key: 'to_warehouse_name',
      label: 'To Warehouse',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'reversed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, transfer: StockTransfer) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(transfer)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit Transfer"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-6">
      <StockTransferForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
        editingTransfer={editingTransfer}
        onCancelEdit={() => setEditingTransfer(null)}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Stock Transfers</h2>
        </div>
        <div className="p-6">
          <DataTable
            title="Stock Transfers"
            data={transfers}
            columns={columns}
            loading={loading}
          />
        </div>
      </div>

    </div>
  );
};

export default StockTransferManagement;
