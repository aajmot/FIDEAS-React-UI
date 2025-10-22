import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import FormCheckbox from '../common/FormCheckbox';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/api';

interface Tax {
  id: number;
  name: string;
  tax_type: string;
  rate: number;
  is_active: boolean;
}

const TaxManagement: React.FC = () => {
  const { showToast } = useToast();
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tax_type: 'GST',
    rate: 0,
    is_active: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    setLoading(true);
    try {
      const response = await accountService.getTaxes();
      setTaxes(response.data);
    } catch (error) {
      showToast('error', 'Failed to load taxes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTax) {
        await accountService.updateTax(editingTax.id, formData);
        showToast('success', 'Tax updated successfully');
      } else {
        await accountService.createTax(formData);
        showToast('success', 'Tax created successfully');
      }
      loadTaxes();
      resetForm();
    } catch (error) {
      showToast('error', 'Operation failed');
    }
  };

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      tax_type: tax.tax_type,
      rate: tax.rate,
      is_active: tax.is_active
    });
    setIsFormCollapsed(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this tax?')) return;
    try {
      await accountService.deleteTax(id);
      showToast('success', 'Tax deleted successfully');
      loadTaxes();
    } catch (error) {
      showToast('error', 'Failed to delete tax');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', tax_type: 'GST', rate: 0, is_active: true });
    setEditingTax(null);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/account/taxes/export-template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'taxes_template.csv';
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

      const response = await fetch('/api/v1/account/taxes/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success) {
        showToast('success', result.message || 'Import successful');
        loadTaxes();
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
    { key: 'name', label: 'Name' },
    { key: 'tax_type', label: 'Type' },
    { 
      key: 'rate', 
      label: 'Rate (%)',
      render: (value: number) => `${value}%`
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
            {editingTax ? 'Edit Tax' : 'Add New Tax'}
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
                  Tax Name
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
                  Tax Type
                </label>
                <SearchableDropdown
                  options={[
                    { value: 'GST', label: 'GST' },
                    { value: 'VAT', label: 'VAT' },
                    { value: 'SALES_TAX', label: 'Sales Tax' }
                  ]}
                  value={formData.tax_type}
                  onChange={(value) => setFormData({ ...formData, tax_type: value as string })}
                  placeholder="Select Type"
                  multiple={false}
                  searchable={true}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
                {editingTax ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable
        title="Tax Management"
        columns={columns}
        data={taxes}
        onEdit={handleEdit}
        onDelete={(tax: Tax) => handleDelete(tax.id)}
        loading={loading}
      />
    </div>
  );
};

export default TaxManagement;
