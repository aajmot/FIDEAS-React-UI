import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { accountExtensions } from '../../services/api';
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
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  const generateNoteNumber = () => {
    const now = new Date();
    const tenantId = user?.tenant_id || 1;
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    return `CNT-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    note_number: generateNoteNumber(),
    note_date: new Date().toISOString().split('T')[0],
    customer_id: 0,
    original_invoice_id: 0,
    original_invoice_number: '',
    reason: '',
    items: [{ 
      line_no: 1,
      product_id: 0,
      product_name: '',
      hsn_code: '',
      batch_number: '',
      mrp: 0,
      quantity: 0,
      free_quantity: 0,
      unit_price_base: 0,
      discount_percent: 0,
      taxable_amount_base: 0,
      cgst_rate: 0,
      cgst_amount_base: 0,
      sgst_rate: 0,
      sgst_amount_base: 0,
      igst_rate: 0,
      igst_amount_base: 0,
      tax_amount_base: 0,
      total_amount_base: 0
    }]
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (formData.customer_id) {
      loadSalesInvoices(formData.customer_id);
    } else {
      setSalesInvoices([]);
    }
  }, [formData.customer_id]);

  useEffect(() => {
    console.log('Invoice ID changed:', formData.original_invoice_id);
    if (formData.original_invoice_id && formData.original_invoice_id > 0) {
      console.log('Loading invoice items for ID:', formData.original_invoice_id);
      loadInvoiceItems(formData.original_invoice_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.original_invoice_id]);

  useEffect(() => {
    if (resetForm) {
      resetFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadSalesInvoices = async (customerId: number) => {
    try {
      const response = await inventoryService.getSalesInvoices({ customer_id: customerId, per_page: 1000 });
      const invoices: any = response.data;
      setSalesInvoices(Array.isArray(invoices) ? invoices : invoices?.data || []);
    } catch (error) {
      setSalesInvoices([]);
    }
  };

  const loadInvoiceItems = async (invoiceId: number) => {
    console.log('loadInvoiceItems called with ID:', invoiceId);
    try {
      const response = await inventoryService.getSalesInvoiceById(invoiceId);
      console.log('API Response:', response);
      const invoice: any = response;
      console.log('Invoice data:', invoice);
      console.log('Invoice items:', invoice?.items);
      
      if (invoice?.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
        console.log('Processing items, count:', invoice.items.length);
        const mappedItems = invoice.items.map((item: any, idx: number) => {
          let hsn_code = item.hsn_code || '';
          let mrp = 0;
          
          if (!hsn_code && item.product_id) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              hsn_code = product.hsn_code || '';
              mrp = product.mrp || 0;
            }
          }
          
          return {
            line_no: idx + 1,
            product_id: item.product_id || 0,
            product_name: item.product_name || '',
            hsn_code: hsn_code,
            batch_number: item.batch_number || '',
            mrp: mrp,
            quantity: parseFloat(item.quantity) || 0,
            free_quantity: parseFloat(item.free_quantity) || 0,
            unit_price_base: parseFloat(item.unit_price_base) || 0,
            discount_percent: parseFloat(item.discount_percent) || 0,
            taxable_amount_base: parseFloat(item.taxable_amount_base) || 0,
            cgst_rate: parseFloat(item.cgst_rate) || 0,
            cgst_amount_base: parseFloat(item.cgst_amount_base) || 0,
            sgst_rate: parseFloat(item.sgst_rate) || 0,
            sgst_amount_base: parseFloat(item.sgst_amount_base) || 0,
            igst_rate: parseFloat(item.igst_rate) || 0,
            igst_amount_base: parseFloat(item.igst_amount_base) || 0,
            tax_amount_base: parseFloat(item.tax_amount_base) || 0,
            total_amount_base: parseFloat(item.total_amount_base) || 0
          };
        });
        console.log('Mapped items:', mappedItems);
        setFormData(prev => ({ ...prev, items: mappedItems }));
        console.log('Items set in formData');
      } else {
        console.log('No items found or invalid items array');
      }
    } catch (error: any) {
      console.error('Error loading invoice items:', error);
      showToast('error', error.response?.data?.detail || 'Failed to load invoice items');
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        line_no: prev.items.length + 1,
        product_id: 0,
        product_name: '',
        hsn_code: '',
        batch_number: '',
        mrp: 0,
        quantity: 0,
        free_quantity: 0,
        unit_price_base: 0,
        discount_percent: 0,
        taxable_amount_base: 0,
        cgst_rate: 0,
        cgst_amount_base: 0,
        sgst_rate: 0,
        sgst_amount_base: 0,
        igst_rate: 0,
        igst_amount_base: 0,
        tax_amount_base: 0,
        total_amount_base: 0
      }]
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
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === Number(value));
      if (product) {
        items[index].product_name = product.name || '';
        items[index].hsn_code = product.hsn_code || '';
        items[index].unit_price_base = product.selling_price || product.cost_price || 0;
        items[index].mrp = product.mrp || 0;
        const gstRate = product.gst_rate || 0;
        items[index].cgst_rate = gstRate / 2;
        items[index].sgst_rate = gstRate / 2;
        items[index].igst_rate = 0;
      }
    }
    
    if (field === 'product_id' || field === 'quantity' || field === 'unit_price_base' || field === 'discount_percent' || field === 'cgst_rate' || field === 'sgst_rate' || field === 'igst_rate') {
      const qty = parseFloat(String(items[index].quantity)) || 0;
      const rate = parseFloat(String(items[index].unit_price_base)) || 0;
      const discountPercent = parseFloat(String(items[index].discount_percent)) || 0;
      
      const baseAmount = qty * rate;
      const discountAmount = baseAmount * (discountPercent / 100);
      const taxableAmount = baseAmount - discountAmount;
      
      const cgstRate = parseFloat(String(items[index].cgst_rate)) || 0;
      const sgstRate = parseFloat(String(items[index].sgst_rate)) || 0;
      const igstRate = parseFloat(String(items[index].igst_rate)) || 0;
      
      const cgstAmount = (taxableAmount * cgstRate) / 100;
      const sgstAmount = (taxableAmount * sgstRate) / 100;
      const igstAmount = (taxableAmount * igstRate) / 100;
      const taxAmount = cgstAmount + sgstAmount + igstAmount;
      
      items[index].taxable_amount_base = taxableAmount;
      items[index].cgst_amount_base = cgstAmount;
      items[index].sgst_amount_base = sgstAmount;
      items[index].igst_amount_base = igstAmount;
      items[index].tax_amount_base = taxAmount;
      items[index].total_amount_base = taxableAmount + taxAmount;
    }
    
    setFormData(prev => ({ ...prev, items }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum: number, item: any) => sum + (item.taxable_amount_base || 0), 0);
    const cgst_amount = formData.items.reduce((sum: number, item: any) => sum + (item.cgst_amount_base || 0), 0);
    const sgst_amount = formData.items.reduce((sum: number, item: any) => sum + (item.sgst_amount_base || 0), 0);
    const igst_amount = formData.items.reduce((sum: number, item: any) => sum + (item.igst_amount_base || 0), 0);
    const tax_amount = cgst_amount + sgst_amount + igst_amount;
    const total = formData.items.reduce((sum: number, item: any) => sum + (item.total_amount_base || 0), 0);
    return { subtotal, cgst_amount, sgst_amount, igst_amount, tax_amount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      showToast('error', 'Please select a customer');
      return;
    }

    const validItems = formData.items.filter((item: any) => item.product_id && item.quantity && item.unit_price_base);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one valid item');
      return;
    }

    try {
      const { subtotal, cgst_amount, sgst_amount, igst_amount, tax_amount, total } = calculateTotals();
      await accountExtensions.createCreditNote({
        note_number: formData.note_number,
        note_date: formData.note_date,
        customer_id: formData.customer_id,
        original_invoice_number: formData.original_invoice_number || null,
        reason: formData.reason,
        status: "POSTED",
        subtotal_base: subtotal,
        cgst_amount_base: cgst_amount,
        sgst_amount_base: sgst_amount,
        igst_amount_base: igst_amount,
        tax_amount_base: tax_amount,
        total_amount_base: total,
        items: validItems
      });
      showToast('success', 'Credit note created successfully');
      onSave();
      resetFormData();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMessage = 'Failed to create credit note';
      
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      }
      
      showToast('error', errorMessage);
    }
  };

  const resetFormData = () => {
    setFormData({
      note_number: generateNoteNumber(),
      note_date: new Date().toISOString().split('T')[0],
      customer_id: 0,
      original_invoice_id: 0,
      original_invoice_number: '',
      reason: '',
      items: [{ 
        line_no: 1,
        product_id: 0,
        product_name: '',
        hsn_code: '',
        batch_number: '',
        mrp: 0,
        quantity: 0,
        free_quantity: 0,
        unit_price_base: 0,
        discount_percent: 0,
        taxable_amount_base: 0,
        cgst_rate: 0,
        cgst_amount_base: 0,
        sgst_rate: 0,
        sgst_amount_base: 0,
        igst_rate: 0,
        igst_amount_base: 0,
        tax_amount_base: 0,
        total_amount_base: 0
      }]
    });
  };

  const { subtotal, cgst_amount, sgst_amount, igst_amount, tax_amount, total } = calculateTotals();

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
              <SearchableDropdown 
                options={salesInvoices.map(inv => ({ value: inv.id, label: `${inv.invoice_number} - ₹${parseFloat(inv.total_amount_base || '0').toFixed(2)}` }))}
                value={formData.original_invoice_id} 
                onChange={(val) => {
                  const selectedInvoice = salesInvoices.find(inv => inv.id === val);
                  setFormData(prev => ({ 
                    ...prev, 
                    original_invoice_id: val as number,
                    original_invoice_number: selectedInvoice?.invoice_number || ''
                  }));
                }}
                placeholder={formData.customer_id ? "Select invoice..." : "Select customer first..."} 
                multiple={false} 
                searchable={true}
                disabled={!formData.customer_id} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
              <input type="text" value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Invoice Items</h3>
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
              <table className="border border-gray-200" style={{ minWidth: '1200px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ minWidth: '180px' }}>Product</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>HSN</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Batch</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '70px' }}>Price</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Qty</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Free</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Disc%</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '70px' }}>GST%</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Total</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        <SearchableDropdown options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id} onChange={(val) => updateItem(index, 'product_id', val)}
                          placeholder="Select product..." multiple={false} searchable={true} className="w-full" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.hsn_code || ''}
                          onChange={(e) => updateItem(index, 'hsn_code', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="HSN" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.batch_number || ''}
                          onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="Batch" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" value={item.unit_price_base} step="0.01"
                          onChange={(e) => updateItem(index, 'unit_price_base', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="0.00" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="0" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" value={item.free_quantity}
                          onChange={(e) => updateItem(index, 'free_quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="0" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" value={item.discount_percent} step="0.1"
                          onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="0" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" value={(item.cgst_rate + item.sgst_rate + item.igst_rate) || 0} step="0.1"
                          onChange={(e) => {
                            const gstRate = parseFloat(e.target.value) || 0;
                            updateItem(index, 'cgst_rate', gstRate / 2);
                            updateItem(index, 'sgst_rate', gstRate / 2);
                            updateItem(index, 'igst_rate', 0);
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center" placeholder="0" />
                      </td>
                      <td className="px-2 py-2 text-sm text-center font-medium">{(item.total_amount_base || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800" disabled={formData.items.length === 1}>
                          <Minus className="h-4 w-4" />
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
                  {cgst_amount > 0 && (
                    <div className="flex justify-between">
                      <span>CGST:</span>
                      <span>₹{cgst_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {sgst_amount > 0 && (
                    <div className="flex justify-between">
                      <span>SGST:</span>
                      <span>₹{sgst_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {igst_amount > 0 && (
                    <div className="flex justify-between">
                      <span>IGST:</span>
                      <span>₹{igst_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total Tax:</span>
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
