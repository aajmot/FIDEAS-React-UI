import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService, inventoryService, careService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface AgencyCommissionFormProps {
  commission?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm: boolean;
}

const AgencyCommissionForm: React.FC<AgencyCommissionFormProps> = ({
  commission,
  onSave,
  onCancel,
  isCollapsed,
  onToggleCollapse,
  resetForm
}) => {
  const [formData, setFormData] = useState({
    agency_id: '',
    product_type: 'Tests',
    product_id: '',
    product_name: '',
    product_rate: '',
    notes: '',
    commission_type: 'Percentage',
    commission_value: '',
    effective_from: '',
    effective_to: ''
  });
  const [agencies, setAgencies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (formData.product_type) {
      loadProducts(formData.product_type);
    }
  }, [formData.product_type]);

  useEffect(() => {
    if (commission) {
      setFormData({
        agency_id: commission.agency_id || '',
        product_type: commission.product_type || 'Tests',
        product_id: commission.product_id || '',
        product_name: commission.product_name || '',
        product_rate: commission.product_rate || '',
        notes: commission.notes || '',
        commission_type: commission.commission_type || '',
        commission_value: commission.commission_value || '',
        effective_from: commission.effective_from ? commission.effective_from.split('T')[0] : '',
        effective_to: commission.effective_to ? commission.effective_to.split('T')[0] : ''
      });
    } else if (resetForm) {
      setFormData({
        agency_id: '',
        product_type: 'Tests',
        product_id: '',
        product_name: '',
        product_rate: '',
        notes: '',
        commission_type: 'Percentage',
        commission_value: '',
        effective_from: '',
        effective_to: ''
      });
    }
  }, [commission, resetForm]);

  const loadAgencies = async () => {
    try {
      const response = await adminService.getAgencies({ page: 1, per_page: 1000 });
      setAgencies(response.data);
    } catch (error) {
      showToast('error', 'Failed to load agencies');
    }
  };

  const loadProducts = async (productType: string) => {
    try {
      if (productType === 'Products') {
        const response = await inventoryService.getProducts({ page: 1, per_page: 1000 });
        setProducts(response.data);
      } else if (productType === 'Tests') {
        const response = await careService.getTests({ page: 1, per_page: 1000 });
        setProducts(response.data);
      }
    } catch (error) {
      showToast('error', 'Failed to load products');
    }
  };

  const handleProductChange = (value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    const selectedProduct = products.find(p => p.id === productId);
    setFormData({
      ...formData,
      product_id: String(productId),
      product_name: selectedProduct ? selectedProduct.name : '',
      product_rate: selectedProduct ? (selectedProduct.rate || selectedProduct.price || '') : ''
    });
  };

  const handleCommissionValueBlur = () => {
    const commissionValue = parseFloat(formData.commission_value);
    const productRate = parseFloat(formData.product_rate);
    
    if (formData.commission_type === 'Percentage' && commissionValue > 50) {
      showConfirmation(
        {
          title: 'High Commission Warning',
          message: 'Commission value is greater than 50%. This is unusually high. Please verify the value.',
          confirmText: 'OK',
          variant: 'warning'
        },
        () => {}
      );
    } else if (formData.commission_type === 'Fixed' && commissionValue && productRate && commissionValue > (productRate * 0.5)) {
      showConfirmation(
        {
          title: 'High Commission Warning',
          message: `Commission value is greater than 50% of the product rate (${productRate.toFixed(2)}). This is unusually high. Please verify the value.`,
          confirmText: 'OK',
          variant: 'warning'
        },
        () => {}
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agency_id || !formData.product_id) {
      showToast('error', 'Agency and Product are required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {commission ? 'Edit Agency Commission' : 'Add New Agency Commission'}
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency *</label>
              <SearchableDropdown
                options={agencies.map(a => ({ value: a.id, label: a.name }))}
                value={formData.agency_id ? Number(formData.agency_id) : ''}
                onChange={(value) => setFormData({ ...formData, agency_id: String(Array.isArray(value) ? value[0] : value) })}
                placeholder="Select Agency"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Type *</label>
              <SearchableDropdown
                options={[
                  { value: 'Products', label: 'Products' },
                  { value: 'Tests', label: 'Tests' }
                ]}
                value={formData.product_type}
                onChange={(value) => setFormData({ ...formData, product_type: String(Array.isArray(value) ? value[0] : value), product_id: '', product_name: '', product_rate: '' })}
                placeholder="Select Product Type"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
              <SearchableDropdown
                options={products.map(p => ({ value: p.id, label: p.name }))}
                value={formData.product_id ? Number(formData.product_id) : ''}
                onChange={handleProductChange}
                placeholder="Select Product"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={formData.product_name}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Rate</label>
              <input
                type="number"
                step="0.01"
                value={formData.product_rate}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Commission Type</label>
              <SearchableDropdown
                options={[
                  { value: 'Percentage', label: 'Percentage' },
                  { value: 'Fixed', label: 'Fixed' },
                  { value: 'Inherit_default', label: 'Inherit Default' }
                ]}
                value={formData.commission_type}
                onChange={(value) => setFormData({ ...formData, commission_type: String(Array.isArray(value) ? value[0] : value) })}
                placeholder="Select Commission Type"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Commission Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.commission_value}
                onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                onBlur={handleCommissionValueBlur}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Effective From</label>
              <DatePicker
                value={formData.effective_from}
                onChange={(value) => setFormData({ ...formData, effective_from: value })}
                placeholder="Select effective from date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Effective To</label>
              <DatePicker
                value={formData.effective_to}
                onChange={(value) => setFormData({ ...formData, effective_to: value })}
                placeholder="Select effective to date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
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
              {commission ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
      
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />
    </div>
  );
};

export default AgencyCommissionForm;
