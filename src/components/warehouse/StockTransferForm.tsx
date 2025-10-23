import React, { useState, useEffect } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface TransferItem {
  product_id: number;
  quantity: number;
}

interface StockTransferFormProps {
  transfer: any;
  onClose: () => void;
}

const StockTransferForm: React.FC<StockTransferFormProps> = ({ transfer, onClose }) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    transfer_number: transfer?.transfer_number || `ST-${Date.now()}`,
    from_warehouse_id: transfer?.from_warehouse_id || '',
    to_warehouse_id: transfer?.to_warehouse_id || '',
    transfer_date: transfer?.transfer_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: transfer?.notes || ''
  });

  const [items, setItems] = useState<TransferItem[]>(transfer?.items || [{
    product_id: 0,
    quantity: 0
  }]);

  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await api.get('/api/v1/warehouse/warehouses');
      setWarehouses(Array.isArray(response.data) ? response.data : []);
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
      showToast('error', 'Source and destination warehouses must be different');
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

      if (transfer) {
        await api.put(`/api/v1/warehouse/stock-transfers/${transfer.id}`, transferData);
        showToast('success', 'Stock transfer updated successfully');
      } else {
        await api.post('/api/v1/warehouse/stock-transfers', transferData);
        showToast('success', 'Stock transfer created successfully');
      }
      onClose();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save stock transfer');
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{transfer ? 'Edit' : 'Create'} Stock Transfer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Transfer Number</label>
              <input
                type="text"
                value={formData.transfer_number}
                className="w-full px-3 py-2 border rounded bg-gray-100"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">From Warehouse *</label>
              <select
                value={formData.from_warehouse_id}
                onChange={(e) => setFormData({ ...formData, from_warehouse_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.warehouse_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">To Warehouse *</label>
              <select
                value={formData.to_warehouse_id}
                onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.warehouse_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Transfer Date</label>
              <DatePicker
                value={formData.transfer_date}
                onChange={(value) => setFormData({ ...formData, transfer_date: value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold">Transfer Items</h3>
              <button type="button" onClick={addItem} className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                <Plus size={16} className="mr-1" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-xs text-left">Product</th>
                    <th className="px-3 py-2 text-xs text-center">Quantity</th>
                    <th className="px-3 py-2 text-xs text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">
                        <SearchableDropdown
                          options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id}
                          onChange={(value) => handleItemChange(index, 'product_id', Number(Array.isArray(value) ? value[0] : value))}
                          placeholder="Select product"
                          multiple={false}
                          searchable={true}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-sm border rounded text-center"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800" disabled={items.length === 1}>
                          <Minus size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {transfer ? 'Update' : 'Create'} Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferForm;
