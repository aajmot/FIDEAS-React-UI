import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { inventoryService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Product, Warehouse } from '../../types';

interface StockAdjustmentFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

interface AdjustmentItem {
  line_no: number;
  product_id: string | number;
  product_name?: string;
  warehouse_id: string | number;
  warehouse_name?: string;
  batch_number: string;
  current_quantity: number;
  adjusted_quantity: number;
  difference: number;
  unit_cost_base: number;
  total_cost: number;
  adjustment_type: 'IN' | 'OUT';
  reason: string;
}

const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [tenantId, setTenantId] = useState<string>('1');
  const { showToast } = useToast();
  
  const generateAdjustmentNumber = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    return `STA-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const initialHeaderData = () => ({
    adjustment_number: generateAdjustmentNumber(),
    adjustment_date: new Date().toISOString(),
    reference_number: '',
    reason: '',
    currency_id: 1,
    is_active: true
  });

  const initialItemData = () => ({
    line_no: 1,
    product_id: '',
    product_name: '',
    warehouse_id: '',
    warehouse_name: '',
    batch_number: '',
    current_quantity: 0,
    adjusted_quantity: 0,
    difference: 0,
    unit_cost_base: 0,
    total_cost: 0,
    adjustment_type: 'IN' as 'IN' | 'OUT',
    reason: ''
  });

  const [headerData, setHeaderData] = useState(initialHeaderData());
  const [items, setItems] = useState<AdjustmentItem[]>([initialItemData()]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (resetForm) {
      handleClear();
    }
  }, [resetForm]);

  const loadInitialData = async () => {
    try {
      const [productsRes, warehousesRes, tenantRes] = await Promise.all([
        inventoryService.getProducts({ per_page: 100 }),
        inventoryService.getWarehouses({ per_page: 100 }),
        adminService.getTenant()
      ]);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
      setTenantId(tenantRes.data.id?.toString() || '1');
      
      // Regenerate adjustment number with correct tenant ID
      setHeaderData(prev => ({ ...prev, adjustment_number: generateAdjustmentNumber() }));
    } catch (error) {
      showToast('error', 'Failed to load data');
    }
  };

  const handleProductChange = async (index: number, value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    if (!productId) return;

    try {
      const response = await inventoryService.getProduct(Number(productId));
      const product = response.data;
      
      setItems(prev => prev.map((item, i) => i === index ? {
        ...item,
        product_id: productId,
        product_name: product.name,
        unit_cost_base: product.mrp || 0
      } : item));
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const handleWarehouseChange = (index: number, value: string | number | (string | number)[]) => {
    const warehouseId = Array.isArray(value) ? value[0] : value;
    if (!warehouseId) return;

    const warehouse = warehouses.find(w => w.id === warehouseId);
    setItems(prev => prev.map((item, i) => i === index ? {
      ...item,
      warehouse_id: warehouseId,
      warehouse_name: warehouse?.name || ''
    } : item));
  };

  const calculateItemDifference = (item: AdjustmentItem) => {
    const difference = item.adjusted_quantity - item.current_quantity;
    return {
      difference,
      adjustment_type: difference >= 0 ? 'IN' as 'IN' : 'OUT' as 'OUT',
      total_cost: Math.abs(difference) * item.unit_cost_base
    };
  };

  const handleItemChange = (index: number, field: keyof AdjustmentItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      const updated = { ...item, [field]: value };
      
      if (field === 'current_quantity' || field === 'adjusted_quantity') {
        const calculated = calculateItemDifference(updated);
        return { ...updated, ...calculated };
      }
      
      return updated;
    }));
  };

  const handleAddItem = () => {
    const newItem = initialItemData();
    newItem.line_no = items.length + 1;
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      showToast('error', 'At least one item is required');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, line_no: i + 1 })));
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!headerData.reason.trim()) {
      showToast('error', 'Please provide a general reason for adjustment');
      return;
    }

    if (items.length === 0) {
      showToast('error', 'At least one item is required');
      return;
    }

    const invalidItems = items.filter(item => 
      !item.product_id || 
      !item.warehouse_id || 
      item.adjusted_quantity === item.current_quantity ||
      !item.reason.trim()
    );

    if (invalidItems.length > 0) {
      showToast('error', 'Please fill all required fields for all items and ensure adjusted quantity differs from current quantity');
      return;
    }

    try {
      const payload = {
        ...headerData,
        adjustment_date: new Date(headerData.adjustment_date).toISOString(),
        items: items.map(item => ({
          line_no: item.line_no,
          product_id: Number(item.product_id),
          warehouse_id: Number(item.warehouse_id),
          batch_number: item.batch_number || null,
          current_quantity: item.current_quantity,
          adjusted_quantity: item.adjusted_quantity,
          difference: item.difference,
          unit_cost_base: item.unit_cost_base,
          adjustment_type: item.adjustment_type,
          reason: item.reason
        }))
      };

      await inventoryService.createStockAdjustment(payload);
      showToast('success', 'Stock adjustment created successfully');
      handleClear();
      onSave();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to create stock adjustment');
    }
  };

  const handleClear = () => {
    setHeaderData(initialHeaderData());
    setItems([initialItemData()]);
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Stock Adjustment</h2>
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
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Adjustment Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adjustment Number</label>
                <input
                  type="text"
                  value={headerData.adjustment_number}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <DatePicker
                  value={headerData.adjustment_date}
                  onChange={(value) => setHeaderData(prev => ({ ...prev, adjustment_date: value }))}
                  placeholder="Select adjustment date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={headerData.reference_number}
                  onChange={(e) => setHeaderData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Optional reference"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">General Reason *</label>
                <FormTextarea
                  name="reason"
                  value={headerData.reason}
                  onChange={(value) => setHeaderData(prev => ({ ...prev, reason: value }))}
                  placeholder="Enter general reason for adjustment (e.g., Annual stock verification)"
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
              <h3 className="text-sm font-semibold text-gray-800">Adjustment Items</h3>
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
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Line</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left border-b">Product *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left border-b">Warehouse *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Batch</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Current Qty</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Adjusted Qty *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Difference</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Type</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Unit Cost</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-right border-b">Total Cost</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left border-b">Item Reason *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center border-b">Action</th>
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
                        <SearchableDropdown
                          options={warehouses.map(warehouse => ({
                            value: warehouse.id,
                            label: warehouse.name
                          }))}
                          value={item.warehouse_id}
                          onChange={(value) => handleWarehouseChange(index, value)}
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
                          value={item.current_quantity}
                          onChange={(e) => handleItemChange(index, 'current_quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-2 py-2 border-b">
                        <input
                          type="number"
                          value={item.adjusted_quantity}
                          onChange={(e) => handleItemChange(index, 'adjusted_quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-center font-semibold border-b" 
                          style={{ color: item.difference >= 0 ? '#10b981' : '#ef4444' }}>
                        {item.difference >= 0 ? '+' : ''}{item.difference.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-sm text-center border-b">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.adjustment_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.adjustment_type}
                        </span>
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
                          placeholder="Item-specific reason"
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
                    <td colSpan={9} className="px-3 py-2 text-right text-sm font-semibold text-gray-900 border-t">Total Cost Impact:</td>
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90"
            >
              Create Adjustment
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StockAdjustmentForm;
