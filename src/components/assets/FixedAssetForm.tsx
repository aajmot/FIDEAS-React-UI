import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DatePicker from '../common/DatePicker';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface FixedAssetFormProps {
  asset: any;
  onClose: () => void;
}

const FixedAssetForm: React.FC<FixedAssetFormProps> = ({ asset, onClose }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    asset_code: asset?.asset_code || `AST-${Date.now()}`,
    asset_name: asset?.asset_name || '',
    category_id: asset?.category_id || '',
    purchase_date: asset?.purchase_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    purchase_cost: asset?.purchase_cost || 0,
    salvage_value: asset?.salvage_value || 0,
    useful_life_years: asset?.useful_life_years || 5,
    depreciation_method: asset?.depreciation_method || 'SLM',
    location: asset?.location || '',
    serial_number: asset?.serial_number || '',
    status: asset?.status || 'active'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/v1/fixed-assets/categories');
      const data = response.data?.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_name || !formData.category_id) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    try {
      const assetData = {
        ...formData,
        category_id: Number(formData.category_id),
        purchase_date: new Date(formData.purchase_date).toISOString(),
        purchase_cost: Number(formData.purchase_cost),
        salvage_value: Number(formData.salvage_value),
        useful_life_years: Number(formData.useful_life_years)
      };

      if (asset) {
        await api.put(`/api/v1/fixed-assets/fixed-assets/${asset.id}`, assetData);
        showToast('success', 'Asset updated successfully');
      } else {
        await api.post('/api/v1/fixed-assets/fixed-assets', assetData);
        showToast('success', 'Asset created successfully');
      }
      onClose();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save asset');
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{asset ? 'Edit' : 'Create'} Fixed Asset</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Asset Code</label>
              <input
                type="text"
                value={formData.asset_code}
                className="w-full px-3 py-2 border rounded bg-gray-100"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Asset Name *</label>
              <input
                type="text"
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Date</label>
              <DatePicker
                value={formData.purchase_date}
                onChange={(value) => setFormData({ ...formData, purchase_date: value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Purchase Cost</label>
              <input
                type="number"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Salvage Value</label>
              <input
                type="number"
                value={formData.salvage_value}
                onChange={(e) => setFormData({ ...formData, salvage_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Useful Life (Years)</label>
              <input
                type="number"
                value={formData.useful_life_years}
                onChange={(e) => setFormData({ ...formData, useful_life_years: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Depreciation Method</label>
              <select
                value={formData.depreciation_method}
                onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="SLM">Straight Line Method (SLM)</option>
                <option value="WDV">Written Down Value (WDV)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <label className="block text-sm font-medium mb-1">Serial Number</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {asset ? 'Update' : 'Create'} Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FixedAssetForm;
