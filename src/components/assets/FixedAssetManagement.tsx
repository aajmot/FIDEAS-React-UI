import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import FixedAssetForm from './FixedAssetForm';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface FixedAsset {
  id: number;
  asset_code: string;
  asset_name: string;
  category_name: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  status: string;
}

const FixedAssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/fixed-assets/fixed-assets');
      const data = response.data?.data || response.data;
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await api.delete(`/api/v1/fixed-assets/fixed-assets/${id}`);
      showToast('success', 'Asset deleted successfully');
      fetchAssets();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to delete asset');
    }
  };

  const handleEdit = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAsset(null);
    fetchAssets();
  };

  const filteredAssets = assets.filter(asset =>
    asset.asset_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      disposed: 'bg-red-100 text-red-800',
      under_maintenance: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { key: 'asset_code', label: 'Asset Code', sortable: true },
    { key: 'asset_name', label: 'Asset Name', sortable: true },
    { key: 'category_name', label: 'Category', sortable: true },
    { 
      key: 'purchase_date', 
      label: 'Purchase Date', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'purchase_cost', 
      label: 'Purchase Cost', 
      sortable: true,
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { 
      key: 'current_value', 
      label: 'Current Value', 
      sortable: true,
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, asset: FixedAsset) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(asset)} className="text-blue-600 hover:text-blue-800">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  if (showForm) {
    return <FixedAssetForm asset={editingAsset} onClose={handleFormClose} />;
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fixed Assets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} /> New Asset
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by code, name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          title="Fixed Assets"
          data={filteredAssets}
          columns={columns}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default FixedAssetManagement;
