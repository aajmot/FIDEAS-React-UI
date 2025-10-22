import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';

interface ProductWasteFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const ProductWasteForm: React.FC<ProductWasteFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    waste_number: `WS-${Date.now()}`,
    product_id: '',
    batch_number: '',
    quantity: 0,
    unit_cost: 0,
    total_cost: 0,
    reason: '',
    waste_date: new Date().toISOString().split('T')[0]
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        waste_number: `WS-${Date.now()}`,
        product_id: '',
        batch_number: '',
        quantity: 0,
        unit_cost: 0,
        total_cost: 0,
        reason: '',
        waste_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [resetForm]);

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts();
      setProducts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load products');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = ['quantity', 'unit_cost'].includes(name) ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: numericValue };
      if (name === 'quantity' || name === 'unit_cost') {
        updated.total_cost = updated.quantity * updated.unit_cost;
      }
      return updated;
    });
  };

  const handleProductChange = async (value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    let product = products.find(p => p.id === Number(productId));
    
    // If product not found in current list, fetch it
    if (!product && productId) {
      try {
        const response = await inventoryService.getProducts({ search: '', per_page: 1000 });
        const foundProduct = response.data.find(p => p.id === Number(productId));
        if (foundProduct) {
          product = foundProduct;
          setProducts(prev => [...prev, foundProduct]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      product_id: productId as string,
      unit_cost: product?.price || 0,
      total_cost: prev.quantity * (product?.price || 0)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity || !formData.unit_cost || !formData.reason.trim()) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    if (formData.quantity <= 0 || formData.unit_cost <= 0) {
      showToast('error', 'Quantity and unit cost must be greater than 0');
      return;
    }

    try {
      const wasteData = {
        waste_number: formData.waste_number,
        product_id: Number(formData.product_id),
        batch_number: formData.batch_number || null,
        quantity: formData.quantity,
        unit_cost: formData.unit_cost,
        reason: formData.reason,
        waste_date: formData.waste_date
      };

      const response = await inventoryService.createProductWaste(wasteData);
      if (response.success) {
        onSave();
      } else {
        showToast('error', response.message || 'Failed to record product waste');
      }
    } catch (error) {
      showToast('error', 'Failed to record product waste');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Record Product Waste</h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Waste Number</label>
              <input
                type="text"
                name="waste_number"
                value={formData.waste_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <DatePicker
                value={formData.waste_date}
                onChange={(value) => setFormData(prev => ({ ...prev, waste_date: value }))}
                placeholder="Select waste date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
              <SearchableDropdown
                options={products.map(product => ({
                  value: product.id,
                  label: product.name
                }))}
                value={formData.product_id}
                onChange={handleProductChange}
                placeholder="Select product..."
                multiple={false}
                searchable={true}
                onSearch={async (searchTerm) => {
                  try {
                    const response = await inventoryService.getProducts({ search: searchTerm, per_page: 50 });
                    return response.data.map(product => ({
                      value: product.id,
                      label: product.name
                    }));
                  } catch (error) {
                    console.error('Product search error:', error);
                    return [];
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number</label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                placeholder="Optional"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost *</label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Cost</label>
              <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 font-semibold">
                {formData.total_cost.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Reason for waste"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setFormData({
                waste_number: `WS-${Date.now()}`,
                product_id: '',
                batch_number: '',
                quantity: 0,
                unit_cost: 0,
                total_cost: 0,
                reason: '',
                waste_date: new Date().toISOString().split('T')[0]
              })}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              Record Waste
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductWasteForm;