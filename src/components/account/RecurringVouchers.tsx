import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const RecurringVouchers: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    voucher_type: 'Journal',
    frequency: 'Monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    is_active: true
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await accountService.getRecurringVouchers();
      setTemplates(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load recurring vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountService.createRecurringVoucher(formData);
      showToast('success', 'Recurring voucher template created successfully');
      resetForm();
      loadTemplates();
    } catch (error) {
      showToast('error', 'Failed to create recurring voucher');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      voucher_type: 'Journal',
      frequency: 'Monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      description: '',
      is_active: true
    });
  };

  const toggleActive = async (template: any) => {
    try {
      await accountService.updateRecurringVoucher(template.id, {
        ...template,
        is_active: !template.is_active
      });
      showToast('success', `Template ${!template.is_active ? 'activated' : 'paused'}`);
      loadTemplates();
    } catch (error) {
      showToast('error', 'Failed to update template');
    }
  };

  const handleDelete = async (template: any) => {
    if (!window.confirm(`Delete recurring voucher "${template.name}"?`)) return;
    try {
      await accountService.deleteRecurringVoucher(template.id);
      showToast('success', 'Recurring voucher deleted successfully');
      loadTemplates();
    } catch (error) {
      showToast('error', 'Failed to delete recurring voucher');
    }
  };

  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'voucher_type', label: 'Type' },
    {
      key: 'frequency',
      label: 'Frequency',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : 'Ongoing'
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Paused'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleActive(row)}
            className={`p-1 rounded ${
              row.is_active 
                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
            }`}
            title={row.is_active ? 'Pause' : 'Activate'}
          >
            {row.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Create Recurring Voucher</h2>
          <button
            type="button"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
        
        {!isFormCollapsed && (
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Voucher Type *
                </label>
                <SearchableDropdown
                  options={[
                    { value: 'Journal', label: 'Journal' },
                    { value: 'Payment', label: 'Payment' },
                    { value: 'Receipt', label: 'Receipt' }
                  ]}
                  value={formData.voucher_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, voucher_type: value as string }))}
                  placeholder="Select type..."
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <SearchableDropdown
                  options={[
                    { value: 'Daily', label: 'Daily' },
                    { value: 'Weekly', label: 'Weekly' },
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Quarterly', label: 'Quarterly' },
                    { value: 'Yearly', label: 'Yearly' }
                  ]}
                  value={formData.frequency}
                  onChange={(value) => setFormData(prev => ({ ...prev, frequency: value as string }))}
                  placeholder="Select frequency..."
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <DatePicker
                  value={formData.end_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, end_date: value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <FormTextarea
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Enter description..."
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
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
              >
                Create
              </button>
            </div>
          </form>
        </div>
        )}
      </div>

      <DataTable
        title="Recurring Voucher Templates"
        columns={columns}
        data={templates}
        loading={loading}
      />
    </div>
  );
};

export default RecurringVouchers;
