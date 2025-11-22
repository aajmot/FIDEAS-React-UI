import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Supplier, Product } from '../../types';

interface InvoiceItem {
  product_id: number;
  product_name: string;
  quantity: number;
  free_quantity: number;
  unit_price: number;
  mrp: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  discount_percent: number;
  discount_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  total_amount: number;
  total_price: number;
  batch_number: string;
  expiry_date: string;
  hsn_code: string;
  description: string;
  cgst_amount: number;
  sgst_amount: number;
  taxable_amount: number;
  total_tax_amount: number;
  line_discount_percent: number;
  line_discount_amount: number;
}

interface PaymentDetail {
  line_no: number;
  payment_mode: 'CASH' | 'BANK';
  account_id: number;
  bank_account_id?: number;
  amount_base: number;
  transaction_reference?: string;
  description?: string;
}

interface PurchaseInvoiceFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const createEmptyItem = (): InvoiceItem => ({
  product_id: 0,
  product_name: '',
  quantity: 0,
  free_quantity: 0,
  unit_price: 0,
  mrp: 0,
  gst_rate: 0,
  cgst_rate: 0,
  sgst_rate: 0,
  discount_percent: 0,
  discount_amount: 0,
  igst_rate: 0,
  igst_amount: 0,
  cess_rate: 0,
  cess_amount: 0,
  total_amount: 0,
  total_price: 0,
  batch_number: '',
  expiry_date: '',
  hsn_code: '',
  description: '',
  cgst_amount: 0,
  sgst_amount: 0,
  taxable_amount: 0,
  total_tax_amount: 0,
  line_discount_percent: 0,
  line_discount_amount: 0
});

const PurchaseInvoiceForm: React.FC<PurchaseInvoiceFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([createEmptyItem()]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  
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
    return `PINV-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    invoice_number: generateInvoiceNumber(),
    reference_number: '',
    supplier_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_term_id: '',
    due_date: new Date().toISOString().split('T')[0],
    discount_percent: 0,
    roundoff: 0
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadPaymentTerms();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        invoice_number: generateInvoiceNumber(),
        reference_number: '',
        supplier_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        payment_term_id: '',
        due_date: new Date().toISOString().split('T')[0],
        discount_percent: 0,
        roundoff: 0
      });
      setItems([createEmptyItem()]);
      setPaymentDetails([]);
    }
  }, [resetForm]);

  // Update default payment when total changes
  useEffect(() => {
    const { finalTotal } = calculateTotals();
    // Round to 2 decimal places to match display
    const roundedTotal = Math.round(finalTotal * 100) / 100;
    
    if (paymentDetails.length === 0 && roundedTotal > 0 && accounts.length > 0) {
      // Find default cash account
      const cashAccount = accounts.find((acc: any) => 
        acc.code?.startsWith('CASH') || acc.name?.toLowerCase().includes('cash')
      );
      
      // Create default cash payment for full amount
      setPaymentDetails([{
        line_no: 1,
        payment_mode: 'CASH',
        account_id: cashAccount?.id || 0,
        amount_base: roundedTotal,
        description: 'Full payment',
        transaction_reference: ''
      }]);
    } else if (paymentDetails.length === 1 && paymentDetails[0].description === 'Full payment') {
      // Update the default payment amount if it's still the auto-generated one
      setPaymentDetails([{
        ...paymentDetails[0],
        amount_base: roundedTotal
      }]);
    }
  }, [items, formData.discount_percent, formData.roundoff, accounts]);

  const loadSuppliers = async () => {
    try {
      const response = await inventoryService.getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      showToast('error', 'Failed to load suppliers');
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
      const response = await api.get('/api/v1/account/payment-terms');
      const data = response.data?.data || response.data;
      setPaymentTerms(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load payment terms');
      setPaymentTerms([]);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await api.get('/api/v1/account/account-masters');
      const accountData = response.data?.data || response.data;
      const accountList = Array.isArray(accountData) ? accountData : [];
      setAccounts(accountList);
      
      // Filter bank accounts for bank payment mode
      const banks = accountList.filter((acc: any) => 
        acc.code?.startsWith('BANK') || acc.account_type?.toLowerCase().includes('bank')
      );
      setBankAccounts(banks);

      // Find default cash account
      const cashAccount = accountList.find((acc: any) => 
        acc.code?.startsWith('CASH') || acc.name?.toLowerCase().includes('cash')
      );
      
      // Create default payment entry with cash account
      const { finalTotal } = calculateTotals();
      // Round to 2 decimal places to match display
      const roundedTotal = Math.round(finalTotal * 100) / 100;
      if (cashAccount && roundedTotal > 0) {
        setPaymentDetails([{
          line_no: 1,
          payment_mode: 'CASH',
          account_id: cashAccount.id,
          amount_base: roundedTotal,
          description: 'Full payment',
          transaction_reference: ''
        }]);
      }
    } catch (error) {
      showToast('error', 'Failed to load accounts');
      setAccounts([]);
      setBankAccounts([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('percent') || name === 'roundoff' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSupplierChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, supplier_id: value as string }));
  };

  const getSelectedSupplier = () => {
    return suppliers.find(supplier => supplier.id === Number(formData.supplier_id));
  };

  const handleProductChange = async (index: number, value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    let product = products.find(p => p.id === Number(productId));
    
    // If product not found in current list, fetch it
    if (!product && productId) {
      try {
        const response = await inventoryService.getProducts({ search: '', per_page: 1000 });
        const foundProduct = response.data.find(p => p.id === Number(productId));
        if (foundProduct) {
          product = foundProduct;
          setProducts(prev => [...prev, foundProduct]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    }
    
    const newItems = [...items];
    const gstRate = product?.gst_rate ?? 0;
    const mrpValue = product?.mrp_price ?? product?.selling_price ?? 0;
    // For purchase invoices, prioritize cost_price, if 0 then calculate 70% of MRP
    let calculatedUnitPrice = product?.cost_price ?? 0;
    if (calculatedUnitPrice === 0 && mrpValue > 0) {
      calculatedUnitPrice = Math.floor(mrpValue * 0.7 * 100) / 100;
    }
    
    newItems[index] = {
      ...newItems[index],
      product_id: Number(productId),
      product_name: product?.name || '',
      mrp: mrpValue,
      unit_price: calculatedUnitPrice,
      gst_rate: gstRate,
      cgst_rate: gstRate / 2,
      sgst_rate: gstRate / 2,
      discount_percent: 0,
      discount_amount: 0,
      taxable_amount: calculatedUnitPrice,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_rate: 0,
      igst_amount: 0,
      cess_rate: 0,
      cess_amount: 0,
      total_tax_amount: 0,
      total_price: calculatedUnitPrice,
      total_amount: calculatedUnitPrice,
      hsn_code: product?.hsn_code || '',
      description: product?.description || ''
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
    const discountedAmount = baseAmount - discountAmount;
    const cgstAmount = discountedAmount * (item.cgst_rate / 100);
    const sgstAmount = discountedAmount * (item.sgst_rate / 100);
    const totalTaxAmount = cgstAmount + sgstAmount;
    const total = discountedAmount + totalTaxAmount;

    itemsArray[index] = {
      ...item,
      discount_amount: discountAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      taxable_amount: discountedAmount,
      total_tax_amount: totalTaxAmount,
      total_price: total,
      total_amount: total,
      igst_amount: 0,
      cess_amount: 0,
      line_discount_percent: item.discount_percent,
      line_discount_amount: discountAmount
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
      account_id: 0,
      amount_base: 0,
      description: '',
      transaction_reference: ''
    };
    setPaymentDetails([...paymentDetails, newPayment]);
  };

  const removePaymentDetail = (index: number) => {
    const updatedPayments = paymentDetails.filter((_, i) => i !== index);
    // Re-number the line_no
    const renumbered = updatedPayments.map((payment, idx) => ({
      ...payment,
      line_no: idx + 1
    }));
    setPaymentDetails(renumbered);
  };

  const handlePaymentDetailChange = (index: number, field: keyof PaymentDetail, value: any) => {
    const newPayments = [...paymentDetails];
    newPayments[index] = { ...newPayments[index], [field]: value };
    
    // Clear bank_account_id if payment mode is changed to CASH
    if (field === 'payment_mode' && value === 'CASH') {
      newPayments[index].bank_account_id = undefined;
    }
    
    setPaymentDetails(newPayments);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const discountAmount = subtotal * (formData.discount_percent / 100);
    const finalTotal = subtotal - discountAmount + formData.roundoff;
    return { subtotal, discountAmount, finalTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      showToast('error', 'Please select a supplier');
      return;
    }

    const validItems = items.filter(item => item.product_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one item');
      return;
    }

    try {
      const { finalTotal, discountAmount, subtotal } = calculateTotals();
      const selectedSupplier = getSelectedSupplier();
      
      // Calculate total tax amounts
      const totalTaxes = validItems.reduce((acc, item) => {
        const taxableAmount = item.unit_price * item.quantity * (1 - (item.discount_percent / 100));
        const cgstAmount = taxableAmount * (item.cgst_rate / 100);
        const sgstAmount = taxableAmount * (item.sgst_rate / 100);
        return {
          cgst_amount: acc.cgst_amount + cgstAmount,
          sgst_amount: acc.sgst_amount + sgstAmount,
          total_tax_amount: acc.total_tax_amount + cgstAmount + sgstAmount,
          taxable_amount: acc.taxable_amount + taxableAmount
        };
      }, { cgst_amount: 0, sgst_amount: 0, total_tax_amount: 0, taxable_amount: 0 });

      // Prepare payment details if any
      const validPaymentDetails = paymentDetails.filter(p => p.account_id > 0 && p.amount_base > 0);

      const invoiceData: any = {
        invoice_number: formData.invoice_number,
        reference_number: formData.reference_number || "",
        supplier_id: Number(formData.supplier_id),
        invoice_date: new Date(formData.invoice_date).toISOString(),
        payment_term_id: formData.payment_term_id ? Number(formData.payment_term_id) : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        base_currency_id: 1,
        subtotal_base: subtotal,
        discount_percent_base: formData.discount_percent,
        discount_amount_base: discountAmount,
        cgst_amount_base: totalTaxes.cgst_amount,
        sgst_amount_base: totalTaxes.sgst_amount,
        igst_amount_base: 0,
        ugst_amount_base: 0,
        cess_amount_base: 0,
        tax_amount_base: totalTaxes.total_tax_amount,
        roundoff_base: formData.roundoff,
        total_amount_base: finalTotal,
        status: "DRAFT",
        items: validItems.map((item, idx) => {
          const taxableAmount = item.unit_price * item.quantity * (1 - (item.discount_percent / 100));
          return {
            line_no: idx + 1,
            product_id: item.product_id,
            quantity: item.quantity,
            free_quantity: item.free_quantity || 0,
            uom: "",
            unit_price_base: item.unit_price,
            mrp_base: item.mrp || 0,
            discount_percent: item.discount_percent,
            discount_amount_base: item.discount_amount,
            taxable_amount_base: taxableAmount,
            cgst_rate: item.cgst_rate,
            cgst_amount_base: taxableAmount * (item.cgst_rate / 100),
            sgst_rate: item.sgst_rate,
            sgst_amount_base: taxableAmount * (item.sgst_rate / 100),
            igst_rate: 0,
            igst_amount_base: 0,
            ugst_rate: 0,
            ugst_amount_base: 0,
            cess_rate: 0,
            cess_amount_base: 0,
            tax_amount_base: taxableAmount * (item.cgst_rate / 100) + taxableAmount * (item.sgst_rate / 100),
            total_amount_base: item.total_amount,
            batch_number: item.batch_number || "",
            expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString() : undefined,
            hsn_code: item.hsn_code || "",
            description: item.description || ""
          };
        })
      };

      // Add payment details if present
      if (validPaymentDetails.length > 0) {
        invoiceData.payment_details = validPaymentDetails.map(payment => {
          const paymentDetail: any = {
            line_no: payment.line_no,
            payment_mode: payment.payment_mode,
            account_id: payment.account_id,
            amount_base: payment.amount_base,
            description: payment.description || "",
            transaction_reference: payment.transaction_reference || ""
          };
          
          // Add bank_account_id only for BANK payment mode
          if (payment.payment_mode === 'BANK' && payment.bank_account_id) {
            paymentDetail.bank_account_id = payment.bank_account_id;
          }
          
          return paymentDetail;
        });
      }

      await api.post('/api/v1/inventory/purchase-invoices', invoiceData);
      onSave();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create purchase invoice';
      console.error('Purchase invoice creation error:', error);
      showToast('error', errorMessage);
    }
  };

  const { subtotal, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Purchase Invoice</h2>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                placeholder="Reference #"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
              <DatePicker
                value={formData.invoice_date}
                onChange={(value) => setFormData(prev => ({ ...prev, invoice_date: value }))}
                placeholder="Select invoice date"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
              <SearchableDropdown
                options={suppliers.map(supplier => ({
                  value: supplier.id,
                  label: `${supplier.phone} | ${supplier.name}`
                }))}
                value={formData.supplier_id}
                onChange={handleSupplierChange}
                placeholder="Select supplier..."
                multiple={false}
                searchable={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
              <input
                type="text"
                value={getSelectedSupplier()?.name || ''}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={getSelectedSupplier()?.email || ''}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID</label>
              <input
                type="text"
                value={getSelectedSupplier()?.tax_id || ''}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                name="payment_term_id"
                value={formData.payment_term_id}
                onChange={(e) => setFormData({ ...formData, payment_term_id: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              >
                <option value="">Select payment term</option>
                {paymentTerms.map(term => (
                  <option key={term.id} value={term.id}>{term.name} ({term.days} days)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
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
            <style>{`
              .purchase-invoice-table { table-layout: fixed !important; }
              .purchase-invoice-table th:nth-child(1), .purchase-invoice-table td:nth-child(1) { width: 22% !important; }
              .purchase-invoice-table th:nth-child(2), .purchase-invoice-table td:nth-child(2) { width: 9% !important; }
              .purchase-invoice-table th:nth-child(3), .purchase-invoice-table td:nth-child(3) { width: 9% !important; }
              .purchase-invoice-table th:nth-child(4), .purchase-invoice-table td:nth-child(4) { width: 9% !important; }
              .purchase-invoice-table th:nth-child(5), .purchase-invoice-table td:nth-child(5) { width: 9% !important; }
              .purchase-invoice-table th:nth-child(6), .purchase-invoice-table td:nth-child(6) { width: 8% !important; }
              .purchase-invoice-table th:nth-child(7), .purchase-invoice-table td:nth-child(7) { width: 8% !important; }
              .purchase-invoice-table th:nth-child(8), .purchase-invoice-table td:nth-child(8) { width: 8% !important; }
              .purchase-invoice-table th:nth-child(9), .purchase-invoice-table td:nth-child(9) { width: 8% !important; }
              .purchase-invoice-table th:nth-child(10), .purchase-invoice-table td:nth-child(10) { width: 10% !important; }
              .purchase-invoice-table th:nth-child(11), .purchase-invoice-table td:nth-child(11) { width: 5% !important; }
            `}</style>
            <div className="overflow-x-auto">
              <table className="border border-gray-200 purchase-invoice-table" style={{ minWidth: '900px', width: '100%' }}>
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
                          options={products.map(product => ({
                            value: product.id,
                            label: product.name
                          }))}
                          value={item.product_id}
                          onChange={(value) => handleProductChange(index, value)}
                          placeholder="Select product..."
                          multiple={false}
                          searchable={true}
                          className="w-full"
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
                      <td className="px-3 py-2 w-20">
                        <input
                          type="text"
                          value={item.hsn_code || ''}
                          onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="HSN"
                        />
                      </td>
                      <td className="px-3 py-2 w-20">
                        <input
                          type="text"
                          value={item.batch_number || ''}
                          onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          placeholder="Batch"
                        />
                      </td>
                      <td className="px-3 py-2 w-20">
                        <input
                          type="number"
                          value={item.mrp || 0}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2 w-20">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.free_quantity}
                          onChange={(e) => handleItemChange(index, 'free_quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.discount_percent}
                          onChange={(e) => handleItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.gst_rate}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 w-24 text-sm text-center">{(item.total_amount ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2 w-16 text-center">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side - Invoice Summary */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount %:</span>
                  <input
                    type="number"
                    name="discount_percent"
                    value={formData.discount_percent}
                    onChange={handleInputChange}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div className="flex justify-between">
                  <span>Discount Amount:</span>
                  <span>{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Round Off:</span>
                  <input
                    type="number"
                    name="roundoff"
                    value={formData.roundoff}
                    onChange={handleInputChange}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{finalTotal.toFixed(2)}</span>
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
                        {paymentDetails.reduce((sum, p) => sum + (p.amount_base || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  invoice_number: generateInvoiceNumber(),
                  reference_number: '',
                  supplier_id: '',
                  invoice_date: new Date().toISOString().split('T')[0],
                  payment_term_id: '',
                  due_date: new Date().toISOString().split('T')[0],
                  discount_percent: 0,
                  roundoff: 0
                });
                setItems([createEmptyItem()]);
                setPaymentDetails([]);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              Save Invoice
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PurchaseInvoiceForm;
