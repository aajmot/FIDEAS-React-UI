import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface InvoiceItem {
  product_id: number;
  product_name?: string;
  hsn_code: string;
  batch_number: string;
  mrp: number;
  quantity: number;
  free_quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  taxable_amount: number;
  total_tax_amount: number;
  total_amount: number;
  line_discount_percent: number;
  line_discount_amount: number;
  description: string;
}

interface PaymentDetail {
  line_no: number;
  payment_mode: string;
  amount_base: number;
  description?: string;
}

interface SalesInvoiceFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const SalesInvoiceForm: React.FC<SalesInvoiceFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<{value: string, label: string}[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const { showToast } = useToast();

  const generateInvoiceNumber = () => {
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
    return `SI-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    invoice_number: generateInvoiceNumber(),
    customer_id: '',
    agency_id: '',
    warehouse_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_percent: 0,
    roundoff: 0
  });

  const createEmptyItem = (): InvoiceItem => ({
    product_id: 0,
    product_name: '',
    hsn_code: '',
    batch_number: '',
    mrp: 0,
    quantity: 0,
    free_quantity: 0,
    unit_price: 0,
    discount_percent: 0,
    gst_rate: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    taxable_amount: 0,
    total_tax_amount: 0,
    total_amount: 0,
    line_discount_percent: 0,
    line_discount_amount: 0,
    description: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([createEmptyItem()]);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);

  useEffect(() => {
    loadCustomers('');
    loadProducts();
    loadAgencies('').then(options => setAgencyOptions(options));
    loadWarehouses();
  }, []);

  // Update default payment amount when total changes
  useEffect(() => {
    const { finalTotal } = calculateTotals();
    const roundedTotal = Math.round(finalTotal * 100) / 100;
    
    if (paymentDetails.length === 0 && roundedTotal > 0) {
      setPaymentDetails([{
        line_no: 1,
        payment_mode: 'CASH',
        amount_base: roundedTotal,
        description: ''
      }]);
    } else if (paymentDetails.length === 1 && paymentDetails[0].description === 'Full payment') {
      setPaymentDetails([{
        ...paymentDetails[0],
        amount_base: roundedTotal
      }]);
    }
  }, [items, formData.discount_percent, formData.roundoff]);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        invoice_number: generateInvoiceNumber(),
        customer_id: '',
        agency_id: '',
        warehouse_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        discount_percent: 0,
        roundoff: 0
      });
      setItems([createEmptyItem()]);
      setPaymentDetails([]);
    }
  }, [resetForm]);

  const loadCustomers = async (search: string = '') => {
    try {
      const response = await inventoryService.getCustomers({ search, per_page: 50 });
      setCustomers(response.data);
      return response.data.map((c: any) => ({
        value: c.id.toString(),
        label: `${c.phone} | ${c.name}`
      }));
    } catch (error) {
      showToast('error', 'Failed to load customers');
      return [];
    }
  };

  const handleAddCustomer = async (inputValue: string) => {
    try {
      const parts = inputValue.split('|').map(p => p.trim());
      const phone = parts[0];
      const name = parts[1] || '';
      
      if (!phone || !name) {
        throw new Error('Phone and name are required');
      }
      
      const customerData = {
        phone,
        name,
        tenant_id: 1,
        is_active: true
      };
      
      const response = await inventoryService.createCustomer(customerData);
      const newCustomer = {
        value: response.data.id.toString(),
        label: `${phone} | ${name}`
      };
      
      await loadCustomers('');
      
      // Set the newly created customer as selected
      setFormData({ ...formData, customer_id: response.data.id.toString() });
      
      return newCustomer;
    } catch (error) {
      showToast('error', 'Failed to create customer');
      throw error;
    }
  };

  const handleAddAgency = async (inputValue: string) => {
    try {
      const parts = inputValue.split('|').map(p => p.trim());
      const phone = parts[0];
      const name = parts[1] || '';
      
      if (!phone || !name) {
        throw new Error('Phone and name are required');
      }
      
      const agencyData = {
        phone,
        name,
        tenant_id: 1,
        is_active: true
      };
      
      const response = await adminService.createAgency(agencyData);
      const newAgency = {
        value: response.data.id.toString(),
        label: `${phone} | ${name}`
      };
      
      const updatedAgencies = await loadAgencies('');
      setAgencyOptions(updatedAgencies);
      
      // Set the newly created agency as selected
      setFormData({ ...formData, agency_id: response.data.id.toString() });
      
      return newAgency;
    } catch (error) {
      showToast('error', 'Failed to create agency');
      throw error;
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

  const loadAgencies = async (search: string) => {
    try {
      const response = await adminService.getAgencies({ search, per_page: 50 });
      return response.data.map((agency: any) => ({
        value: agency.id.toString(),
        label: `${agency.phone} | ${agency.name}`
      }));
    } catch (error) {
      showToast('error', 'Failed to load agencies');
      return [];
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.getWarehouses({ per_page: 100 });
      setWarehouses(response.data);
    } catch (error) {
      showToast('error', 'Failed to load warehouses');
    }
  };

  const handleProductChange = (index: number, value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    const product = products.find(p => p.id === Number(productId));
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      product_id: Number(productId),
      product_name: product?.name ?? '',
      unit_price: product?.selling_price ?? product?.cost_price ?? 0,
      gst_rate: product?.gst_rate ?? 0
    };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: number | string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const calculateItemTotal = (index: number, itemsArray: InvoiceItem[]) => {
    const item = itemsArray[index];
    const baseAmount = item.unit_price * item.quantity;
    const discountAmount = baseAmount * (item.discount_percent / 100);
    const taxableAmount = baseAmount - discountAmount;
    
    // Split GST into CGST and SGST (assuming intra-state)
    const cgstRate = item.gst_rate / 2;
    const sgstRate = item.gst_rate / 2;
    const cgstAmount = taxableAmount * (cgstRate / 100);
    const sgstAmount = taxableAmount * (sgstRate / 100);
    const totalTaxAmount = cgstAmount + sgstAmount;
    const total = taxableAmount + totalTaxAmount;

    itemsArray[index] = { 
      ...item, 
      cgst_rate: cgstRate,
      sgst_rate: sgstRate,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      taxable_amount: taxableAmount,
      total_tax_amount: totalTaxAmount,
      line_discount_amount: discountAmount,
      total_amount: total 
    };
    setItems([...itemsArray]);
  };

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const addPaymentDetail = () => {
    const newPayment: PaymentDetail = {
      line_no: paymentDetails.length + 1,
      payment_mode: 'CASH',
      amount_base: 0,
      description: ''
    };
    setPaymentDetails([...paymentDetails, newPayment]);
  };

  const removePaymentDetail = (index: number) => {
    setPaymentDetails(paymentDetails.filter((_, i) => i !== index));
  };

  const handlePaymentDetailChange = (index: number, field: keyof PaymentDetail, value: string | number) => {
    const newPayments = [...paymentDetails];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPaymentDetails(newPayments);
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
      const { finalTotal, subtotal, discountAmount } = calculateTotals();
      
      // Calculate total tax and CGST/SGST totals
      const cgstTotal = validItems.reduce((sum, item) => sum + item.cgst_amount, 0);
      const sgstTotal = validItems.reduce((sum, item) => sum + item.sgst_amount, 0);
      const taxTotal = validItems.reduce((sum, item) => sum + item.total_tax_amount, 0);
      
      const invoiceData = {
        invoice_number: formData.invoice_number,
        customer_id: Number(formData.customer_id),
        warehouse_id: formData.warehouse_id ? Number(formData.warehouse_id) : 1, // Default to warehouse 1 if not selected
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || undefined,
        total_amount_base: finalTotal,
        subtotal_base: subtotal,
        discount_amount_base: discountAmount,
        tax_amount_base: taxTotal,
        cgst_amount_base: cgstTotal,
        sgst_amount_base: sgstTotal,
        igst_amount_base: 0,
        cess_amount_base: 0,
        items: validItems.map((item, index) => ({
          line_no: index + 1,
          product_id: item.product_id,
          product_name: item.product_name || '',
          quantity: item.quantity,
          free_quantity: item.free_quantity,
          uom: 'NOS',
          unit_price_base: item.unit_price,
          unit_cost_base: item.unit_price * 0.7, // Assuming 30% margin
          discount_percent: item.discount_percent,
          discount_amount_base: item.line_discount_amount,
          taxable_amount_base: item.taxable_amount,
          cgst_rate: item.cgst_rate,
          cgst_amount_base: item.cgst_amount,
          sgst_rate: item.sgst_rate,
          sgst_amount_base: item.sgst_amount,
          igst_rate: 0,
          igst_amount_base: 0,
          cess_rate: 0,
          cess_amount_base: 0,
          tax_amount_base: item.total_tax_amount,
          total_amount_base: item.total_amount,
          hsn_code: item.hsn_code || undefined,
          batch_number: item.batch_number || undefined,
          description: item.description || undefined
        })),
        payment_details: paymentDetails.filter(p => p.amount_base > 0).map(p => ({
          line_no: p.line_no,
          payment_mode: p.payment_mode,
          amount_base: p.amount_base,
          description: p.description || undefined
        }))
      };

      await api.post('/api/v1/invoice/sales-invoices', invoiceData);
      onSave();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let errorMessage = 'Failed to save invoice';
      
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      }
      
      showToast('error', errorMessage);
    }
  };

  const { subtotal, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Sales Invoice</h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
              <SearchableDropdown
                options={customers.map(c => ({ value: c.id.toString(), label: `${c.phone} | ${c.name}` }))}
                value={formData.customer_id}
                onChange={(value) => setFormData({ ...formData, customer_id: (Array.isArray(value) ? value[0] : value).toString() })}
                onSearch={loadCustomers}
                allowAdd={true}
                onAdd={handleAddCustomer}
                placeholder="Type phone | name to add or search..."
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency</label>
              <SearchableDropdown
                options={agencyOptions}
                value={formData.agency_id}
                onChange={(value) => setFormData({ ...formData, agency_id: (Array.isArray(value) ? value[0] : value).toString() })}
                onSearch={loadAgencies}
                allowAdd={true}
                onAdd={handleAddAgency}
                placeholder="Type phone | name to add or search..."
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse *</label>
              <SearchableDropdown
                options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                value={formData.warehouse_id}
                onChange={(value) => setFormData({ ...formData, warehouse_id: (Array.isArray(value) ? value[0] : value).toString() })}
                placeholder="Select warehouse..."
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date *</label>
              <DatePicker
                value={formData.invoice_date}
                onChange={(value) => setFormData({ ...formData, invoice_date: value })}
                placeholder="Select date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <DatePicker
                value={formData.due_date}
                onChange={(value) => setFormData({ ...formData, due_date: value })}
                placeholder="Select due date"
                className="w-full"
              />
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
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '70px' }}>MRP</th>
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
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        <SearchableDropdown
                          options={products.map(p => ({ value: p.id.toString(), label: p.name }))}
                          value={item.product_id.toString()}
                          onChange={(value) => handleProductChange(index, value)}
                          placeholder="Select product..."
                          multiple={false}
                          searchable={true}
                          className="w-full"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.hsn_code || ''}
                          onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="HSN"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.batch_number || ''}
                          onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="Batch"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.mrp}
                          onChange={(e) => handleItemChange(index, 'mrp', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.free_quantity}
                          onChange={(e) => handleItemChange(index, 'free_quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.discount_percent}
                          onChange={(e) => handleItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.gst_rate}
                          onChange={(e) => handleItemChange(index, 'gst_rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-2 text-sm text-center font-medium">{item.total_amount.toFixed(2)}</td>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Side - Summary */}
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount %:</span>
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div className="flex justify-between">
                  <span>Discount Amount:</span>
                  <span className="font-medium text-red-600">-{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-blue-200 pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Details */}
            <div className="bg-blue-50 p-4 rounded">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Payment Details</h4>
                <button
                  type="button"
                  onClick={addPaymentDetail}
                  className="flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              </div>
              
              {paymentDetails.length > 0 && (
                <div className="space-y-3">
                  {paymentDetails.map((payment, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500">Payment #{payment.line_no}</span>
                        <button
                          type="button"
                          onClick={() => removePaymentDetail(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mode</label>
                            <select
                              value={payment.payment_mode}
                              onChange={(e) => handlePaymentDetailChange(index, 'payment_mode', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            >
                              <option value="CASH">CASH</option>
                              <option value="BANK">BANK</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                            <input
                              type="number"
                              value={payment.amount_base}
                              onChange={(e) => handlePaymentDetailChange(index, 'amount_base', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={payment.description || ''}
                            onChange={(e) => handlePaymentDetailChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            placeholder="Payment description"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-white px-3 py-2 rounded border border-blue-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Payments:</span>
                      <span className="text-sm font-semibold text-blue-700">
                        ₹{paymentDetails.reduce((sum, p) => sum + (p.amount_base || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              Create Invoice
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SalesInvoiceForm;
