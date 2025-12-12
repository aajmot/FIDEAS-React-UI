import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
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

interface WasteItem {
  line_no: number;
  product_id: string | number;
  product_name?: string;
  batch_number: string;
  quantity: number;
  unit_cost_base: number;
  total_cost: number;
  reason: string;
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

  const initialHeaderData = () => ({
    waste_number: generateWasteNumber(),
    waste_date: new Date().toISOString(),
    reason: '',
    warehouse_id: '',
    currency_id: 1,
    is_active: true
  });

  const initialItemData = (): WasteItem => ({
    line_no: 1,
    product_id: '',
    product_name: '',
    batch_number: '',
    quantity: 0,
    unit_cost_base: 0,
    total_cost: 0,
    reason: ''
  });

  const [headerData, setHeaderData] = useState(initialHeaderData());
  const [items, setItems] = useState<WasteItem[]>([initialItemData()]);

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
      setHeaderData(initialHeaderData());
      setItems([initialItemData()]);
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
      setWarehouses(response.data.data || response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load warehouses');
      setWarehouses([]);
    }
  };

  const handleAddItem = () => {
    const newItem: WasteItem = {
      ...initialItemData(),
      line_no: items.length + 1
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      showToast('error', 'At least one item is required');
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    // Resequence line numbers
    newItems.forEach((item, idx) => {
      item.line_no = idx + 1;
    });
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof WasteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total cost when quantity or unit_cost_base changes
    if (field === 'quantity' || field === 'unit_cost_base') {
      newItems[index].total_cost = newItems[index].quantity * newItems[index].unit_cost_base;
    }
    
    setItems(newItems);
  };

  const handleProductChange = async (index: number, value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    
    if (!productId) {
      handleItemChange(index, 'product_id', '');
      handleItemChange(index, 'product_name', '');
      handleItemChange(index, 'unit_cost_base', 0);
      handleItemChange(index, 'total_cost', 0);
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
        
        const newItems = [...items];
        newItems[index] = {
          ...newItems[index],
          product_id: productId,
          product_name: product.name,
          unit_cost_base: unitCost,
          total_cost: newItems[index].quantity * unitCost
        };
        setItems(newItems);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('error', 'Failed to fetch product details');
    }
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate header
    if (!headerData.reason.trim()) {
      showToast('error', 'Please enter a general reason for waste');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        showToast('error', `Please select a product for line ${i + 1}`);
        return;
      }
      if (item.quantity <= 0) {
        showToast('error', `Quantity must be greater than 0 for line ${i + 1}`);
        return;
      }
      if (item.unit_cost_base <= 0) {
        showToast('error', `Unit cost must be greater than 0 for line ${i + 1}`);
        return;
      }
    }

    try {
      const wasteData = {
        waste_number: headerData.waste_number,
        waste_date: headerData.waste_date,
        reason: headerData.reason,
        warehouse_id: headerData.warehouse_id ? Number(headerData.warehouse_id) : null,
        currency_id: headerData.currency_id,
        is_active: headerData.is_active,
        items: items.map(item => ({
          line_no: item.line_no,
          product_id: Number(item.product_id),
          batch_number: item.batch_number || null,
          quantity: item.quantity,
          unit_cost_base: item.unit_cost_base,
          reason: item.reason || null
        }))
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

  const handleClear = () => {
    setHeaderData(initialHeaderData());
    setItems([initialItemData()]);
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
          {/* Header Section */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Waste Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Waste Number</label>
                <input
                  type="text"
                  value={headerData.waste_number}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  value={headerData.waste_date}
                  onChange={(value) => setHeaderData(prev => ({ ...prev, waste_date: value }))}
                  placeholder="Select waste date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse</label>
                <SearchableDropdown
                  options={warehouses.map(warehouse => ({
                    value: warehouse.id,
                    label: warehouse.name
                  }))}
                  value={headerData.warehouse_id}
                  onChange={(value) => {
                    const warehouseId = Array.isArray(value) ? value[0] : value;
                    setHeaderData(prev => ({ ...prev, warehouse_id: warehouseId as string }));
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
                <label className="block text-xs font-medium text-gray-700 mb-1">General Reason *</label>
                <FormTextarea
                  name="reason"
                  value={headerData.reason}
                  onChange={(value) => setHeaderData(prev => ({ ...prev, reason: value }))}
                  placeholder="Enter general reason for waste (e.g., Monthly expired products disposal)"
                  rows={2}
                  required={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Waste Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b w-12">#</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">Product *</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">Batch</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 border-b w-24">Quantity *</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 border-b w-28">Unit Cost *</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 border-b w-28">Total</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">Item Reason</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900 border-b">{item.line_no}</td>
                      <td className="px-2 py-2 border-b">
                        <SearchableDropdown
                          options={products.map(product => ({
                            value: product.id,
                            label: product.name
                          }))}
                          value={item.product_id}
                          onChange={(value) => handleProductChange(index, value)}
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
                      </td>
                      <td className="px-2 py-2 border-b">
                        <input
                          type="text"
                          value={item.batch_number}
                          onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                          placeholder="Batch"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-2 py-2 border-b">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-2 py-2 border-b">
                        <input
                          type="number"
                          value={item.unit_cost_base}
                          onChange={(e) => handleItemChange(index, 'unit_cost_base', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900 border-b">
                        {item.total_cost.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 border-b">
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                          placeholder="Optional (overrides general)"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2 text-center border-b">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-gray-900 border-t">Total Amount:</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-blue-600 border-t">{calculateTotalAmount().toFixed(2)}</td>
                    <td colSpan={2} className="border-t"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!headerData.reason.trim() || items.length === 0}
              className={`px-4 py-2 text-sm font-medium text-white rounded ${
                !headerData.reason.trim() || items.length === 0
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
