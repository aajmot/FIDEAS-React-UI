import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PaymentTerm } from '../../types';
import FormCheckbox from '../common/FormCheckbox';
import FormTextarea from '../common/FormTextarea';

interface PaymentTermsFormProps {
  paymentTerm?: PaymentTerm;
  onSave: (data: any) => void;
  onCancel: () => void;
  resetForm?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const PaymentTermsForm: React.FC<PaymentTermsFormProps> = ({
  paymentTerm,
  onSave,
  onCancel,
  resetForm,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    days: 0,
    is_active: true,
    is_default: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resetForm && !paymentTerm) {
      setFormData({
        code: '',
        name: '',
        description: '',
        days: 0,
        is_active: true,
        is_default: false,
      });
      setErrors({});
    } else if (paymentTerm) {
      setFormData({
        code: paymentTerm.code || '',
        name: paymentTerm.name || '',
        description: paymentTerm.description || '',
        days: paymentTerm.days || 0,
        is_active: paymentTerm.is_active ?? true,
        is_default: paymentTerm.is_default ?? false,
      });
    }
  }, [paymentTerm, resetForm]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.days < 0) {
      newErrors.days = 'Days must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const dataToSave = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        days: Number(formData.days),
        is_active: formData.is_active,
        is_default: formData.is_default,
      };
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {paymentTerm ? 'Edit Payment Term' : 'Add New Payment Term'}
        </h2>
        <div className="flex items-center space-x-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., NET30"
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Net 30 Days"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Days <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="days"
                value={formData.days}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
              {errors.days && (
                <p className="text-red-500 text-xs mt-1">{errors.days}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <FormTextarea
                name="description"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Additional details..."
                rows={1}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <FormCheckbox
                checked={formData.is_active}
                onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                label="Active"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Set as Default
              </label>
              <FormCheckbox
                checked={formData.is_default}
                onChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                label="Default"
              />
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
              {paymentTerm ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentTermsForm;
