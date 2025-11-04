import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { inventoryService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Product, Warehouse } from '../../types';

interface ProductWasteFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const ProductWasteForm: React.FC<ProductWasteFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tenantId, setTenantId] = useState<string>('1');
  const { showToast } = useToast();
  
  const generateWasteNumber = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    return `WST-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    waste_number: generateWasteNumber(),
    product_id: '',
    warehouse_id: '',
    batch_number: '',
    quantity: 0,
    unit_cost_base: 0,
    total_cost: 0,
    reason: '',
    waste_date: new Date().toISOString(),
    currency_id: 1,
    exchange_rate: 1,
    is_active: true
  });

  useEffect(() => {
    loadProducts();
    loadWarehouses();
    loadTenantId();
  }, []);

  const loadTenantId = async () => {
    try {
      const response = await adminService.getTenant();
      if (response.success && response.data?.id) {
        setTenantId(String(response.data.id));
      }
    } catch (error) {
      console.error('Failed to load tenant ID');
    }
  };

  useEffect(() => {
    if (resetForm) {
      setFormData({
        waste_number: generateWasteNumber(),
        product_id: '',
        warehouse_id: '',
        batch_number: '',
        quantity: 0,
        unit_cost_base: 0,
        total_cost: 0,
        reason: '',
        waste_date: new Date().toISOString(),
        currency_id: 1,
        exchange_rate: 1,
        is_active: true
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

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.getWarehouses();
      setWarehouses(response.data);
    } catch (error) {
      showToast('error', 'Failed to load warehouses');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = ['quantity', 'unit_cost_base'].includes(name) ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: numericValue };
      if (name === 'quantity' || name === 'unit_cost_base') {
        updated.total_cost = updated.quantity * updated.unit_cost_base;
      }
      return updated;
    });
  };

  const handleProductChange = async (value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    
    if (!productId) {
      setFormData(prev => ({
        ...prev,
        product_id: '',
        unit_cost_base: 0,
        total_cost: 0
      }));
      return;
    }

    try {
      // Fetch the specific product to get accurate pricing
      const response = await inventoryService.getProduct(Number(productId));
      const product = response.data;
      
      if (product) {
        // Add to local products list if not already there
        setProducts(prev => {
          const exists = prev.find(p => p.id === product.id);
          return exists ? prev : [...prev, product];
        });
        
        // Set unit cost from mrp_price
        const unitCost = product.mrp_price ?? product.cost_price ?? product.selling_price ?? 0;
        
        setFormData(prev => ({
          ...prev,
          product_id: productId as string,
          unit_cost_base: unitCost,
          total_cost: prev.quantity * unitCost
        }));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('error', 'Failed to fetch product details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity || !formData.unit_cost_base || !formData.reason.trim()) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    if (formData.quantity <= 0 || formData.unit_cost_base <= 0) {
      showToast('error', 'Quantity and unit cost must be greater than 0');
      return;
    }

    try {
      const wasteData = {
        warehouse_id: formData.warehouse_id ? Number(formData.warehouse_id) : null,
        waste_number: formData.waste_number,
        product_id: Number(formData.product_id),
        quantity: formData.quantity,
        unit_cost_base: formData.unit_cost_base,
        reason: formData.reason,
        waste_date: formData.waste_date,
        batch_number: formData.batch_number || null,
        currency_id: formData.currency_id,
        exchange_rate: formData.exchange_rate,
        is_active: formData.is_active
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse</label>
              <SearchableDropdown
                options={warehouses.map(warehouse => ({
                  value: warehouse.id,
                  label: warehouse.name
                }))}
                value={formData.warehouse_id}
                onChange={(value) => {
                  const warehouseId = Array.isArray(value) ? value[0] : value;
                  setFormData(prev => ({ ...prev, warehouse_id: warehouseId as string }));
                }}
                placeholder="Select warehouse..."
                multiple={false}
                searchable={true}
                onSearch={async (searchTerm) => {
                  try {
                    const response = await inventoryService.getWarehouses({ search: searchTerm, per_page: 50 });
                    return response.data.map((warehouse: Warehouse) => ({
                      value: warehouse.id,
                      label: warehouse.name
                    }));
                  } catch (error) {
                    console.error('Warehouse search error:', error);
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
                name="unit_cost_base"
                value={formData.unit_cost_base}
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

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
              <FormTextarea
                name="reason"
                value={formData.reason}
                onChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                placeholder="Enter reason for waste"
                rows={3}
                required={true}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setFormData({
                waste_number: generateWasteNumber(),
                product_id: '',
                warehouse_id: '',
                batch_number: '',
                quantity: 0,
                unit_cost_base: 0,
                total_cost: 0,
                reason: '',
                waste_date: new Date().toISOString(),
                currency_id: 1,
                exchange_rate: 1,
                is_active: true
              })}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!formData.quantity || !formData.reason.trim()}
              className={`px-3 py-1.5 text-xs font-medium text-white rounded ${
                !formData.quantity || !formData.reason.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-secondary'
              }`}
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