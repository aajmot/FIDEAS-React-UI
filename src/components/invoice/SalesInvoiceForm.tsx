import React, { useState, useEffect } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface InvoiceItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  discount_percent: number;
  total_amount: number;
}

interface SalesInvoiceFormProps {
  invoice: any;
  onClose: () => void;
}

const SalesInvoiceForm: React.FC<SalesInvoiceFormProps> = ({ invoice, onClose }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    invoice_number: invoice?.invoice_number || `INV-${Date.now()}`,
    customer_id: invoice?.customer_id || '',
    invoice_date: invoice?.invoice_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    payment_term_id: invoice?.payment_term_id || '',
    due_date: invoice?.due_date?.split('T')[0] || '',
    discount_percent: invoice?.discount_percent || 0,
    notes: invoice?.notes || ''
  });

  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || [{
    product_id: 0,
    quantity: 0,
    unit_price: 0,
    gst_rate: 0,
    discount_percent: 0,
    total_amount: 0
  }]);

  useEffect(() => {
    loadCustomers('');
    loadProducts();
    loadPaymentTerms();
  }, []);

  const loadCustomers = async (search: string) => {
    try {
      const response = await inventoryService.getCustomers({ search, per_page: 50 });
      setCustomers(response.data);
      return response.data.map((c: any) => ({ value: c.id, label: `${c.phone} | ${c.name}` }));
    } catch (error) {
      return [];
    }
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts();
      setProducts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load products');
    }
  };

  const loadPaymentTerms = async () => {
    try {
      const response = await api.get('/api/v1/invoice/payment-terms');
      const data = response.data?.data || response.data;
      setPaymentTerms(Array.isArray(data) ? data : []);
      setPaymentTerms(response.data);
    } catch (error) {
      showToast('error', 'Failed to load payment terms');
    }
  };

  const handleProductChange = (index: number, value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    const product = products.find(p => p.id === Number(productId));
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: Number(productId),
      unit_price: product?.price || 0,
      gst_rate: product?.gst_percentage || 0
    };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const calculateItemTotal = (index: number, itemsArray: InvoiceItem[]) => {
    const item = itemsArray[index];
    const baseAmount = item.unit_price * item.quantity;
    const discountAmount = baseAmount * (item.discount_percent / 100);
    const discountedAmount = baseAmount - discountAmount;
    const gstAmount = discountedAmount * (item.gst_rate / 100);
    const total = discountedAmount + gstAmount;

    itemsArray[index] = { ...item, total_amount: total };
    setItems([...itemsArray]);
  };

  const addItem = () => {
    setItems([...items, {
      product_id: 0,
      quantity: 0,
      unit_price: 0,
      gst_rate: 0,
      discount_percent: 0,
      total_amount: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0);
    const discountAmount = subtotal * (formData.discount_percent / 100);
    const finalTotal = subtotal - discountAmount;
    return { subtotal, discountAmount, finalTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      showToast('error', 'Please select a customer');
      return;
    }

    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one item');
      return;
    }

    try {
      const { finalTotal } = calculateTotals();
      
      const invoiceData = {
        invoice_number: formData.invoice_number,
        customer_id: Number(formData.customer_id),
        invoice_date: new Date(formData.invoice_date).toISOString(),
        payment_term_id: formData.payment_term_id ? Number(formData.payment_term_id) : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        total_amount: finalTotal,
        discount_percent: formData.discount_percent,
        notes: formData.notes,
        items: validItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          gst_rate: item.gst_rate,
          discount_percent: item.discount_percent,
          total_price: item.total_amount
        }))
      };

      if (invoice) {
        await api.put(`/api/v1/invoice/sales-invoices/${invoice.id}`, invoiceData);
        showToast('success', 'Invoice updated successfully');
      } else {
        await api.post('/api/v1/invoice/sales-invoices', invoiceData);
        showToast('success', 'Invoice created successfully');
      }
      onClose();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save invoice');
    }
  };

  const { subtotal, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{invoice ? 'Edit' : 'Create'} Sales Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <SearchableDropdown
                options={customers.map(c => ({ value: c.id, label: `${c.phone} | ${c.name}` }))}
                value={formData.customer_id}
                onChange={(value) => setFormData({ ...formData, customer_id: (Array.isArray(value) ? value[0] : value).toString() })}
                onSearch={loadCustomers}
                placeholder="Select customer"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Invoice Date</label>
              <DatePicker
                value={formData.invoice_date}
                onChange={(value) => setFormData({ ...formData, invoice_date: value })}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Terms</label>
              <select
                value={formData.payment_term_id}
                onChange={(e) => setFormData({ ...formData, payment_term_id: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select payment term</option>
                {paymentTerms.map(term => (
                  <option key={term.id} value={term.id}>{term.term_name} ({term.days} days)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <DatePicker
                value={formData.due_date}
                onChange={(value) => setFormData({ ...formData, due_date: value })}
                className="w-full"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold">Invoice Items</h3>
              <button type="button" onClick={addItem} className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                <Plus size={16} className="mr-1" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-xs text-left">Product</th>
                    <th className="px-3 py-2 text-xs text-center">Qty</th>
                    <th className="px-3 py-2 text-xs text-center">Price</th>
                    <th className="px-3 py-2 text-xs text-center">GST%</th>
                    <th className="px-3 py-2 text-xs text-center">Disc%</th>
                    <th className="px-3 py-2 text-xs text-center">Total</th>
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
                          onChange={(value) => handleProductChange(index, value)}
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
                          className="w-20 px-2 py-1 text-sm border rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-sm border rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.gst_rate}
                          onChange={(e) => handleItemChange(index, 'gst_rate', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.discount_percent}
                          onChange={(e) => handleItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-center">{item.total_amount.toFixed(2)}</td>
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

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount %:</span>
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm border rounded"
                    step="0.1"
                  />
                </div>
                <div className="flex justify-between">
                  <span>Discount Amount:</span>
                  <span>₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {invoice ? 'Update' : 'Create'} Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesInvoiceForm;
