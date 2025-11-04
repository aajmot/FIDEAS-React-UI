import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface TransferItem {
  line_no: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  batch_number: string;
  unit_cost_base: number;
  uom: string;
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
  const [units, setUnits] = useState<any[]>([]);
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
    transfer_type: 'INTERNAL',
    status: 'DRAFT',
    reason: ''
  });

  const [items, setItems] = useState<TransferItem[]>([{
    line_no: 1,
    product_id: 0,
    product_name: '',
    quantity: 0,
    batch_number: '',
    unit_cost_base: 0,
    uom: 'NOS'
  }]);

  useEffect(() => {
    loadWarehouses();
    loadProducts();
    loadUnits();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        transfer_number: generateTransferNumber(),
        from_warehouse_id: '',
        to_warehouse_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        transfer_type: 'INTERNAL',
        status: 'DRAFT',
        reason: ''
      });
      setItems([{
        line_no: 1,
        product_id: 0,
        product_name: '',
        quantity: 0,
        batch_number: '',
        unit_cost_base: 0,
        uom: 'NOS'
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
        transfer_type: editingTransfer.transfer_type || 'INTERNAL',
        status: editingTransfer.status || 'DRAFT',
        reason: editingTransfer.reason || ''
      });
    }
  }, [editingTransfer]);

  const loadWarehouses = async () => {
    try {
  const response = await api.get('/api/v1/inventory/warehouses');
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

  const loadUnits = async () => {
    try {
      const response: any = await inventoryService.getUnits();
      let unitsData;
      if (Array.isArray(response)) {
        unitsData = response;
      } else if (response?.data) {
        unitsData = response.data?.data || response.data;
      } else {
        unitsData = [];
      }
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (error) {
      showToast('error', 'Failed to load units');
      setUnits([]);
    }
  };

  const loadTransferItems = async (transferId: number) => {
    try {
      const response = await api.get(`/api/v1/inventory/stock-transfers/${transferId}`);
      const transferData = response.data?.data || response.data;
      if (transferData.items && Array.isArray(transferData.items)) {
        setItems(transferData.items);
      }
    } catch (error) {
      showToast('error', 'Failed to load transfer items');
    }
  };

  const handleItemChange = (index: number, field: keyof TransferItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleProductChange = async (index: number, productId: number) => {
    const newItems = [...items];
    const product = products.find(p => p.id === productId);
    
    // Find the unit name from unit_id
    let unitName = 'NOS'; // default
    if (product?.unit_id) {
      const unit = units.find(u => u.id === product.unit_id);
      unitName = unit?.name || 'NOS';
    }
    
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      product_name: product?.name || '',
      unit_cost_base: product?.mrp || 0,
      uom: unitName
    };
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      line_no: items.length + 1,
      product_id: 0,
      product_name: '',
      quantity: 0,
      batch_number: '',
      unit_cost_base: 0,
      uom: 'NOS'
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      // Renumber line_no
      newItems.forEach((item, idx) => {
        item.line_no = idx + 1;
      });
      setItems(newItems);
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

    if (!formData.reason) {
      showToast('error', 'Please provide a reason for the transfer');
      return;
    }

    try {
      const transferData = {
        transfer_number: formData.transfer_number,
        from_warehouse_id: Number(formData.from_warehouse_id),
        to_warehouse_id: Number(formData.to_warehouse_id),
        transfer_date: new Date(formData.transfer_date).toISOString(),
        transfer_type: formData.transfer_type,
        status: formData.status,
        reason: formData.reason,
        items: validItems.map(item => ({
          line_no: item.line_no,
          product_id: item.product_id,
          quantity: item.quantity,
          batch_number: item.batch_number,
          unit_cost_base: item.unit_cost_base,
          uom: item.uom
        }))
      };

      if (editingTransfer) {
        await api.put(`/api/v1/inventory/stock-transfers/${editingTransfer.id}`, transferData);
      } else {
        await api.post('/api/v1/inventory/stock-transfers', transferData);
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Type</label>
              <select
                value={formData.transfer_type}
                onChange={(e) => setFormData({ ...formData, transfer_type: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              >
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
              <FormTextarea
                value={formData.reason}
                onChange={(value) => setFormData({ ...formData, reason: value })}
                placeholder="Enter reason for transfer"
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
              <table className="border border-gray-200" style={{ minWidth: '1000px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '50px' }}>Line#</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ minWidth: '200px' }}>Product *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '100px' }}>Batch</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '100px' }}>Quantity *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '100px' }}>Unit Cost</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>UOM</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2 text-center">
                        <span className="text-sm text-gray-600">{item.line_no}</span>
                      </td>
                      <td className="px-2 py-2" style={{ minWidth: '200px' }}>
                        <SearchableDropdown
                          options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id}
                          onChange={(value) => handleProductChange(index, Number(Array.isArray(value) ? value[0] : value))}
                          placeholder="Select product..."
                          multiple={false}
                          searchable={true}
                          className="w-full"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.batch_number}
                          onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="Batch"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.unit_cost_base}
                          onChange={(e) => handleItemChange(index, 'unit_cost_base', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <SearchableDropdown
                          options={units.map(u => ({ value: u.name, label: u.name }))}
                          value={item.uom}
                          onChange={(value) => handleItemChange(index, 'uom', Array.isArray(value) ? value[0] : value)}
                          placeholder="Select UOM..."
                          multiple={false}
                          searchable={true}
                          className="w-full"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
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
                  transfer_type: 'INTERNAL',
                  status: 'DRAFT',
                  reason: ''
                });
                setItems([{
                  line_no: 1,
                  product_id: 0,
                  product_name: '',
                  quantity: 0,
                  batch_number: '',
                  unit_cost_base: 0,
                  uom: 'NOS'
                }]);
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
