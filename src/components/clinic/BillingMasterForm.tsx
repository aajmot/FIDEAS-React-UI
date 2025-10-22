import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { BillingMaster } from '../../types';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface BillingMasterFormProps {
  billingMaster?: BillingMaster;
  onSave: (data: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onImport?: () => void;
}

const BillingMasterForm: React.FC<BillingMasterFormProps> = ({
  billingMaster,
  onSave,
  onCancel,
  isCollapsed,
  onToggleCollapse,
  resetForm,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    description: billingMaster?.description || '',
    note: billingMaster?.note || '',
    amount: billingMaster?.amount?.toString() || '',
    hsn_code: billingMaster?.hsn_code || '',
    gst_percentage: billingMaster?.gst_percentage?.toString() || '',
    is_active: billingMaster?.is_active ?? true
  });
  const { showToast } = useToast();

  useEffect(() => {
    if (resetForm && !billingMaster) {
      setFormData({
        description: '',
        note: '',
        amount: '',
        hsn_code: '',
        gst_percentage: '',
        is_active: true
      });
    } else if (billingMaster) {
      setFormData({
        description: billingMaster.description,
        note: billingMaster.note || '',
        amount: billingMaster.amount.toString(),
        hsn_code: billingMaster.hsn_code || '',
        gst_percentage: billingMaster.gst_percentage.toString(),
        is_active: billingMaster.is_active
      });
    }
  }, [billingMaster, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      gst_percentage: parseFloat(formData.gst_percentage),
      tenant_id: 1 // Default tenant ID
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const downloadTemplate = async () => {
    try {
      const blob = await clinicService.downloadBillingMastersTemplate();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'billing_masters_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;
    
    try {
      const text = await file.text();
      await clinicService.importBillingMasters(text);
      if (onImport) onImport();
    } catch (error) {
      console.error('Error importing file:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {billingMaster ? 'Edit Billing Master' : 'Add New Billing Master'}
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
            className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Upload className="h-3 w-3 mr-1" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleChange}
                maxLength={20}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                GST % *
              </label>
              <input
                type="number"
                name="gst_percentage"
                value={formData.gst_percentage}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto h-9"
              />
            </div>

            <div className="flex items-center pt-5">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label className="ml-1 block text-xs text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              {billingMaster ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BillingMasterForm;