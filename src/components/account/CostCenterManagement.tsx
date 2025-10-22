import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import FormCheckbox from '../common/FormCheckbox';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/api';

interface CostCenter {
  id: number;
  name: string;
  code: string;
  parent_id?: number | null;
  is_active: boolean;
}

const CostCenterManagement: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', parent_id: '', is_active: true });
  const { showToast } = useToast();

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showToast('error', 'Not authenticated');
        return;
      }
      const response = await fetch('/api/v1/account/cost-centers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setCostCenters(result.data);
      }
    } catch (error) {
      showToast('error', 'Failed to fetch cost centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showToast('error', 'Not authenticated');
        return;
      }
      const payload = { ...formData, parent_id: formData.parent_id ? parseInt(formData.parent_id) : null };
      const url = editingId 
        ? `/api/v1/account/cost-centers/${editingId}`
        : '/api/v1/account/cost-centers';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        showToast('success', `Cost center ${editingId ? 'updated' : 'created'} successfully`);
        fetchCostCenters();
        resetForm();
      } else {
        showToast('error', result.message || 'Operation failed');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save cost center');
    }
  };

  const handleEdit = (cc: CostCenter) => {
    setEditingId(cc.id);
    setFormData({ name: cc.name, code: cc.code, parent_id: cc.parent_id?.toString() || '', is_active: cc.is_active });
    setIsFormCollapsed(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this cost center?')) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showToast('error', 'Not authenticated');
        return;
      }
      const response = await fetch(`/api/v1/account/cost-centers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        showToast('success', 'Cost center deleted successfully');
        fetchCostCenters();
      } else {
        showToast('error', result.message || 'Failed to delete');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete cost center');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', parent_id: '', is_active: true });
    setEditingId(null);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/account/cost-centers/export-template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cost_centers_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showToast('error', 'Failed to download template');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showToast('error', 'Not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/account/cost-centers/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success) {
        showToast('success', result.message || 'Import successful');
        fetchCostCenters();
      } else {
        showToast('error', result.message || 'Import failed');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to import');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { 
      key: 'parent_id', 
      label: 'Parent Cost Center',
      render: (value: number) => {
        const parent = costCenters.find(cc => cc.id === value);
        return parent ? parent.name : '-';
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Cost Center' : 'Add New Cost Center'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="h-3 w-3 mr-1" />
              Template
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <div className="animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              {importing ? 'Importing...' : 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="text-gray-500 hover:text-gray-700"
            >
              {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Parent Cost Center
                </label>
                <SearchableDropdown
                  options={[{ value: '', label: 'None' }, ...costCenters.map(cc => ({ value: cc.id, label: cc.name }))]}
                  value={formData.parent_id}
                  onChange={(value) => setFormData({ ...formData, parent_id: value as string })}
                  placeholder="Select parent..."
                  multiple={false}
                  searchable={true}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <FormCheckbox
                  checked={formData.is_active}
                  onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable
        title="Cost Centers"
        columns={columns}
        data={costCenters}
        onEdit={handleEdit}
        onDelete={(cc: CostCenter) => handleDelete(cc.id)}
        loading={loading}
      />
    </div>
  );
};

export default CostCenterManagement;
