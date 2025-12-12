import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { accountExtensions } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface DebitNoteFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const DebitNoteForm: React.FC<DebitNoteFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
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
    return `DN-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    note_number: generateNoteNumber(),
    note_date: new Date().toISOString().split('T')[0],
    supplier_id: 0,
    original_invoice_id: 0,
    original_invoice_number: '',
    reason: '',
    items: [{ 
      line_no: 1,
      product_id: 0,
      product_name: '',
      hsn_code: '',
      batch_number: '',
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
      ugst_rate: 0,
      ugst_amount_base: 0,
      tax_amount_base: 0,
      total_amount_base: 0
    }]
  });

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (formData.supplier_id) {
      loadPurchaseInvoices(formData.supplier_id);
    } else {
      setPurchaseInvoices([]);
    }
  }, [formData.supplier_id]);

  useEffect(() => {
    if (formData.original_invoice_id && formData.original_invoice_id > 0) {
      loadInvoiceItems(formData.original_invoice_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.original_invoice_id]);

  useEffect(() => {
    if (resetForm) {
      resetFormData();
    }
  }, [resetForm]);

  const loadSuppliers = async () => {
    try {
      const response = await inventoryService.getSuppliers({ per_page: 1000 });
      setSuppliers(response.data);
    } catch (error) {}
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts({ per_page: 1000 });
      setProducts(response.data);
    } catch (error) {}
  };

  const loadPurchaseInvoices = async (supplierId: number) => {
    try {
      const response = await inventoryService.getPurchaseInvoices({ supplier_id: supplierId, per_page: 1000 });
      const invoices: any = response.data;
      setPurchaseInvoices(Array.isArray(invoices) ? invoices : invoices?.data || []);
    } catch (error) {
      setPurchaseInvoices([]);
    }
  };

  const loadInvoiceItems = async (invoiceId: number) => {
    try {
      const response = await inventoryService.getPurchaseInvoiceById(invoiceId);
      const invoice: any = response;
      
      if (invoice?.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
        const mappedItems = invoice.items.map((item: any, idx: number) => {
          let hsn_code = item.hsn_code || '';
          
          if (!hsn_code && item.product_id) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              hsn_code = product.hsn_code || '';
            }
          }
          
          return {
            line_no: idx + 1,
            product_id: item.product_id || 0,
            product_name: item.product_name || '',
            hsn_code: hsn_code,
            batch_number: item.batch_number || '',
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
            ugst_rate: parseFloat(item.ugst_rate) || 0,
            ugst_amount_base: parseFloat(item.ugst_amount_base) || 0,
            tax_amount_base: parseFloat(item.tax_amount_base) || 0,
            total_amount_base: parseFloat(item.total_amount_base) || 0
          };
        });
        setFormData(prev => ({ ...prev, items: mappedItems }));
      }
    } catch (error: any) {
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
        ugst_rate: 0,
        ugst_amount_base: 0,
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
        items[index].unit_price_base = product.cost_price || product.selling_price || 0;
        const gstRate = product.gst_rate || 0;
        items[index].cgst_rate = gstRate / 2;
        items[index].sgst_rate = gstRate / 2;
        items[index].igst_rate = 0;
        items[index].ugst_rate = 0;
      }
    }
    
    if (field === 'product_id' || field === 'quantity' || field === 'unit_price_base' || field === 'discount_percent' || field === 'cgst_rate' || field === 'sgst_rate' || field === 'igst_rate' || field === 'ugst_rate') {
      const qty = parseFloat(String(items[index].quantity)) || 0;
      const rate = parseFloat(String(items[index].unit_price_base)) || 0;
      const discountPercent = parseFloat(String(items[index].discount_percent)) || 0;
      
      const baseAmount = qty * rate;
      const discountAmount = baseAmount * (discountPercent / 100);
      const taxableAmount = baseAmount - discountAmount;
      
      const cgstRate = parseFloat(String(items[index].cgst_rate)) || 0;
      const sgstRate = parseFloat(String(items[index].sgst_rate)) || 0;
      const igstRate = parseFloat(String(items[index].igst_rate)) || 0;
      const ugstRate = parseFloat(String(items[index].ugst_rate)) || 0;
      
      const cgstAmount = (taxableAmount * cgstRate) / 100;
      const sgstAmount = (taxableAmount * sgstRate) / 100;
      const igstAmount = (taxableAmount * igstRate) / 100;
      const ugstAmount = (taxableAmount * ugstRate) / 100;
      const taxAmount = cgstAmount + sgstAmount + igstAmount + ugstAmount;
      
      items[index].taxable_amount_base = taxableAmount;
      items[index].cgst_amount_base = cgstAmount;
      items[index].sgst_amount_base = sgstAmount;
      items[index].igst_amount_base = igstAmount;
      items[index].ugst_amount_base = ugstAmount;
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
    const ugst_amount = formData.items.reduce((sum: number, item: any) => sum + (item.ugst_amount_base || 0), 0);
    const tax_amount = cgst_amount + sgst_amount + igst_amount + ugst_amount;
    const total = formData.items.reduce((sum: number, item: any) => sum + (item.total_amount_base || 0), 0);
    return { subtotal, cgst_amount, sgst_amount, igst_amount, ugst_amount, tax_amount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      showToast('error', 'Please select a supplier');
      return;
    }

    const validItems = formData.items.filter((item: any) => item.product_id && item.quantity && item.unit_price_base);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one valid item');
      return;
    }

    try {
      const { subtotal, cgst_amount, sgst_amount, igst_amount, ugst_amount, tax_amount, total } = calculateTotals();
      await accountExtensions.createDebitNote({
        note_number: formData.note_number,
        note_date: formData.note_date,
        supplier_id: formData.supplier_id,
        original_invoice_number: formData.original_invoice_number || null,
        reason: formData.reason,
        status: "POSTED",
        subtotal_base: subtotal,
        cgst_amount_base: cgst_amount,
        sgst_amount_base: sgst_amount,
        igst_amount_base: igst_amount,
        ugst_amount_base: ugst_amount,
        tax_amount_base: tax_amount,
        total_amount_base: total,
        items: validItems
      });
      showToast('success', 'Debit note created successfully');
      onSave();
      resetFormData();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMessage = 'Failed to create debit note';
      
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
      supplier_id: 0,
      original_invoice_id: 0,
      original_invoice_number: '',
      reason: '',
      items: [{ 
        line_no: 1,
        product_id: 0,
        product_name: '',
        hsn_code: '',
        batch_number: '',
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
        ugst_rate: 0,
        ugst_amount_base: 0,
        tax_amount_base: 0,
        total_amount_base: 0
      }]
    });
  };

  const { subtotal, cgst_amount, sgst_amount, igst_amount, ugst_amount, tax_amount, total } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Debit Note (Purchase Return)</h2>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
              <SearchableDropdown options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                value={formData.supplier_id} onChange={(val) => setFormData(prev => ({ ...prev, supplier_id: val as number }))}
                placeholder="Select supplier..." multiple={false} searchable={true} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Original Invoice No</label>
              <SearchableDropdown 
                options={purchaseInvoices.map(inv => ({ value: inv.id, label: `${inv.invoice_number} - ₹${parseFloat(inv.total_amount_base || '0').toFixed(2)}` }))}
                value={formData.original_invoice_id} 
                onChange={(val) => {
                  const selectedInvoice = purchaseInvoices.find(inv => inv.id === val);
                  setFormData(prev => ({ 
                    ...prev, 
                    original_invoice_id: val as number,
                    original_invoice_number: selectedInvoice?.invoice_number || ''
                  }));
                }}
                placeholder={formData.supplier_id ? "Select invoice..." : "Select supplier first..."} 
                multiple={false} 
                searchable={true}
                disabled={!formData.supplier_id} />
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
                        <input type="number" value={(item.cgst_rate + item.sgst_rate + item.igst_rate + item.ugst_rate) || 0} step="0.1"
                          onChange={(e) => {
                            const gstRate = parseFloat(e.target.value) || 0;
                            updateItem(index, 'cgst_rate', gstRate / 2);
                            updateItem(index, 'sgst_rate', gstRate / 2);
                            updateItem(index, 'igst_rate', 0);
                            updateItem(index, 'ugst_rate', 0);
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
                  {ugst_amount > 0 && (
                    <div className="flex justify-between">
                      <span>UGST:</span>
                      <span>₹{ugst_amount.toFixed(2)}</span>
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
              Create Debit Note
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DebitNoteForm;
