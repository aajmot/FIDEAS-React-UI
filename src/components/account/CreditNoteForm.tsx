import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { accountExtensions } from '../../services/apiExtensions';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface CreditNoteFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const CreditNoteForm: React.FC<CreditNoteFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  const generateNoteNumber = () => {
    const now = new Date();
    const tenantId = user?.tenant_id || 1;
    return `CN-${tenantId}${now.getTime()}`;
  };

  const [formData, setFormData] = useState({
    note_number: generateNoteNumber(),
    note_date: new Date().toISOString().split('T')[0],
    customer_id: 0,
    original_invoice_number: '',
    reason: '',
    items: [{ product_id: 0, quantity: '', rate: '', tax_rate: 0, amount: 0 }]
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (resetForm) {
      resetFormData();
    }
  }, [resetForm]);

  const loadCustomers = async () => {
    try {
      const response = await inventoryService.getCustomers({ per_page: 1000 });
      setCustomers(response.data);
    } catch (error) {}
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts({ per_page: 1000 });
      setProducts(response.data);
    } catch (error) {}
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: 0, quantity: '', rate: '', tax_rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      showToast('error', 'At least one item is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(items[index].quantity) || 0;
      const rate = parseFloat(items[index].rate) || 0;
      items[index].amount = qty * rate;
    }
    
    setFormData(prev => ({ ...prev, items }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const tax_amount = formData.items.reduce((sum: number, item: any) => sum + (item.amount * item.tax_rate / 100), 0);
    return { subtotal, tax_amount, total: subtotal + tax_amount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      showToast('error', 'Please select a customer');
      return;
    }

    if (formData.items.some((item: any) => !item.product_id || !item.quantity || !item.rate)) {
      showToast('error', 'Please fill all item details');
      return;
    }

    try {
      const { subtotal, tax_amount, total } = calculateTotals();
      await accountExtensions.createCreditNote({
        ...formData,
        subtotal,
        tax_amount,
        total_amount: total
      });
      showToast('success', 'Credit note created successfully');
      onSave();
      resetFormData();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to create credit note');
    }
  };

  const resetFormData = () => {
    setFormData({
      note_number: generateNoteNumber(),
      note_date: new Date().toISOString().split('T')[0],
      customer_id: 0,
      original_invoice_number: '',
      reason: '',
      items: [{ product_id: 0, quantity: '', rate: '', tax_rate: 0, amount: 0 }]
    });
  };

  const { subtotal, tax_amount, total } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Credit Note (Sales Return)</h2>
        <button type="button" onClick={onToggleCollapse} className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Note Number</label>
              <input type="text" value={formData.note_number} readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <DatePicker value={formData.note_date}
                onChange={(value) => setFormData(prev => ({ ...prev, note_date: value }))} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
              <SearchableDropdown options={customers.map(c => ({ value: c.id, label: c.name }))}
                value={formData.customer_id} onChange={(val) => setFormData(prev => ({ ...prev, customer_id: val as number }))}
                placeholder="Select customer..." multiple={false} searchable={true} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Original Invoice No</label>
              <input type="text" value={formData.original_invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, original_invoice_number: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
              <input type="text" value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Items</h3>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-secondary">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '600px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ minWidth: '180px' }}>Product *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Qty *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '90px' }}>Rate *</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '70px' }}>Tax %</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '90px' }}>Amount</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2" style={{ minWidth: '180px' }}>
                        <SearchableDropdown options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id} onChange={(val) => updateItem(index, 'product_id', val)}
                          placeholder="Select..." multiple={false} searchable={true} />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" step="0.01" value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" step="0.01" value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" step="0.01" value={item.tax_rate}
                          onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" />
                      </td>
                      <td className="px-2 py-2 text-sm text-center font-medium">₹{item.amount.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <div className="w-full sm:w-80">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-3 text-sm">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={resetFormData}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded">
              Cancel
            </button>
            <button type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded">
              Create Credit Note
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreditNoteForm;
