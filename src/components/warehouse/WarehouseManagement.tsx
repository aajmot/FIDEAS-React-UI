import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  is_active: boolean;
}

const WarehouseManagement: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id: 0,
    warehouse_code: '',
    warehouse_name: '',
    location: '',
    is_active: true
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/warehouse/warehouses');
      const data = response.data?.data || response.data;
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load warehouses');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/api/v1/warehouse/warehouses/${formData.id}`, formData);
        showToast('success', 'Warehouse updated successfully');
      } else {
        await api.post('/api/v1/warehouse/warehouses', formData);
        showToast('success', 'Warehouse created successfully');
      }
      setShowForm(false);
      resetForm();
      fetchWarehouses();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save warehouse');
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setFormData(warehouse);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try {
      await api.delete(`/api/v1/warehouse/warehouses/${id}`);
      showToast('success', 'Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to delete warehouse');
    }
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      warehouse_code: '',
      warehouse_name: '',
      location: '',
      is_active: true
    });
  };

  const filteredWarehouses = warehouses.filter(w =>
    w.warehouse_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'warehouse_code', label: 'Code', sortable: true },
    { key: 'warehouse_name', label: 'Name', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, warehouse: Warehouse) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(warehouse)} className="text-blue-600 hover:text-blue-800">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(warehouse.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package size={28} /> Warehouse Management
        </h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} /> New Warehouse
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">{formData.id ? 'Edit' : 'Create'} Warehouse</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  value={formData.warehouse_code}
                  onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  value={formData.warehouse_name}
                  onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {formData.id ? 'Update' : 'Create'} Warehouse
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          title="Warehouses"
          data={filteredWarehouses}
          columns={columns}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default WarehouseManagement;
