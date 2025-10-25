import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface TransferItem {
  product_id: number;
  quantity: number;
}

interface StockTransferFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm: boolean;
  editingTransfer?: any;
  onCancelEdit?: () => void;
}

const StockTransferForm: React.FC<StockTransferFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm, editingTransfer, onCancelEdit }) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { showToast } = useToast();

  const generateTransferNumber = () => {
    const now = new Date();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantId = user.tenant_id || 1;
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    return `ST-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    transfer_number: generateTransferNumber(),
    from_warehouse_id: '',
    to_warehouse_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [items, setItems] = useState<TransferItem[]>([{
    product_id: 0,
    quantity: 0
  }]);

  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        transfer_number: generateTransferNumber(),
        from_warehouse_id: '',
        to_warehouse_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setItems([{
        product_id: 0,
        quantity: 0
      }]);
    }
  }, [resetForm]);

  useEffect(() => {
    if (editingTransfer) {
      loadTransferItems(editingTransfer.id);
      setFormData({
        transfer_number: editingTransfer.transfer_number,
        from_warehouse_id: editingTransfer.from_warehouse_id?.toString() || '',
        to_warehouse_id: editingTransfer.to_warehouse_id?.toString() || '',
        transfer_date: editingTransfer.transfer_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: editingTransfer.notes || ''
      });
    }
  }, [editingTransfer]);

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/api/v1/warehouse/warehouses');
      const data = response.data?.data || response.data;
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load warehouses');
      setWarehouses([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showToast('error', 'Failed to load products');
      setProducts([]);
    }
  };

  const loadTransferItems = async (transferId: number) => {
    try {
      const response = await api.get(`/api/v1/warehouse/stock-transfers/${transferId}`);
      const transferData = response.data?.data || response.data;
      if (transferData.items && Array.isArray(transferData.items)) {
        setItems(transferData.items);
      }
    } catch (error) {
      showToast('error', 'Failed to load transfer items');
    }
  };

  const handleItemChange = (index: number, field: keyof TransferItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.from_warehouse_id || !formData.to_warehouse_id) {
      showToast('error', 'Please select both warehouses');
      return;
    }

    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      showToast('error', 'From and To warehouses cannot be the same');
      return;
    }

    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one item');
      return;
    }

    try {
      const transferData = {
        transfer_number: formData.transfer_number,
        from_warehouse_id: Number(formData.from_warehouse_id),
        to_warehouse_id: Number(formData.to_warehouse_id),
        transfer_date: new Date(formData.transfer_date).toISOString(),
        notes: formData.notes,
        items: validItems
      };

      if (editingTransfer) {
        await api.put(`/api/v1/warehouse/stock-transfers/${editingTransfer.id}`, transferData);
      } else {
        await api.post('/api/v1/warehouse/stock-transfers', transferData);
      }
      onSave();
      if (onCancelEdit) onCancelEdit();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save stock transfer');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingTransfer ? 'Edit Stock Transfer' : 'Create New Stock Transfer'}
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Number</label>
              <input
                type="text"
                value={formData.transfer_number}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Date</label>
              <DatePicker
                value={formData.transfer_date}
                onChange={(value) => setFormData({ ...formData, transfer_date: value })}
                placeholder="Select transfer date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From Warehouse *</label>
              <SearchableDropdown
                options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                value={formData.from_warehouse_id}
                onChange={(value) => setFormData({ ...formData, from_warehouse_id: (Array.isArray(value) ? value[0] : value).toString() })}
                placeholder="Select from warehouse..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Warehouse *</label>
              <SearchableDropdown
                options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                value={formData.to_warehouse_id}
                onChange={(value) => setFormData({ ...formData, to_warehouse_id: (Array.isArray(value) ? value[0] : value).toString() })}
                placeholder="Select to warehouse..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <FormTextarea
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Transfer Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </button>
          </div>

          <div className="mb-6">

            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '600px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ minWidth: '200px' }}>Product</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '100px' }}>Quantity</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2" style={{ minWidth: '200px' }}>
                        <SearchableDropdown
                          options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id}
                          onChange={(value) => handleItemChange(index, 'product_id', Number(Array.isArray(value) ? value[0] : value))}
                          placeholder="Select product..."
                          multiple={false}
                          searchable={true}
                          className="w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={items.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  transfer_number: generateTransferNumber(),
                  from_warehouse_id: '',
                  to_warehouse_id: '',
                  transfer_date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setItems([{ product_id: 0, quantity: 0 }]);
                if (onCancelEdit) onCancelEdit();
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              {editingTransfer ? 'Update Transfer' : 'Save Transfer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StockTransferForm;
