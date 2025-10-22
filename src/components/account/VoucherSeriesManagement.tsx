import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import FormCheckbox from '../common/FormCheckbox';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const VoucherSeriesManagement: React.FC = () => {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [selectedVoucherType, setSelectedVoucherType] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    prefix: '',
    is_active: true
  });
  const { showToast } = useToast();
  const [tenantId] = useState(1); // Get from auth context

  const generateNextVoucherNumber = () => {
    if (!formData.prefix) return '';
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    return `${formData.prefix}${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const response = await accountService.getVoucherSeries();
      setSeries(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load voucher series');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSeries) {
        await accountService.updateVoucherSeries(editingSeries.id, formData);
        showToast('success', 'Voucher series updated successfully');
      } else {
        await accountService.createVoucherSeries(formData);
        showToast('success', 'Voucher series created successfully');
      }
      resetForm();
      loadSeries();
    } catch (error) {
      showToast('error', 'Failed to save voucher series');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      prefix: '',
      is_active: true
    });
    setEditingSeries(null);
    setSelectedVoucherType('');
  };

  const handleEdit = (item: any) => {
    setEditingSeries(item);
    setSelectedVoucherType(item.name);
    setFormData({
      name: item.name,
      code: item.code,
      prefix: item.prefix,
      is_active: item.is_active
    });
    setIsFormCollapsed(false);
  };

  const handleVoucherTypeSelect = (value: string) => {
    setSelectedVoucherType(value);
    const existing = series.find(s => s.name === value);
    if (existing) {
      setEditingSeries(existing);
      setFormData({
        name: existing.name,
        code: existing.code,
        prefix: existing.prefix,
        is_active: existing.is_active
      });
    } else {
      setEditingSeries(null);
      setFormData({
        name: value,
        code: value.substring(0, 3).toUpperCase(),
        prefix: value.substring(0, 3).toUpperCase() + '-',
        is_active: true
      });
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete series for ${item.voucher_type}?`)) return;
    try {
      await accountService.deleteVoucherSeries(item.id);
      showToast('success', 'Voucher series deleted successfully');
      loadSeries();
    } catch (error) {
      showToast('error', 'Failed to delete voucher series');
    }
  };



  const columns = [
    { key: 'name', label: 'Voucher Type' },
    { key: 'code', label: 'Code' },
    { key: 'prefix', label: 'Prefix' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
            {editingSeries ? 'Edit Voucher Series' : 'Add Voucher Series'}
          </h2>
          <button
            type="button"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
        
        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Voucher Type *
                </label>
                <SearchableDropdown
                  options={[
                    { value: 'Journal', label: 'Journal' },
                    { value: 'Payment', label: 'Payment' },
                    { value: 'Receipt', label: 'Receipt' },
                    { value: 'Sales', label: 'Sales' },
                    { value: 'Purchase', label: 'Purchase' }
                  ]}
                  value={selectedVoucherType}
                  onChange={(value) => handleVoucherTypeSelect(value as string)}
                  placeholder="Select voucher type..."
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                  disabled
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Prefix *
                </label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={!selectedVoucherType}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <FormCheckbox
                  label="Active"
                  checked={formData.is_active}
                  onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  disabled={!selectedVoucherType}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Next Voucher Number
                </label>
                <input
                  type="text"
                  value={generateNextVoucherNumber()}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-yellow-50 font-mono"
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedVoucherType}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSeries ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable
        title="Voucher Series Configuration"
        columns={columns}
        data={series}
        onEdit={handleEdit}
        loading={loading}
      />
    </div>
  );
};

export default VoucherSeriesManagement;
