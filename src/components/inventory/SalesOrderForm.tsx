import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Customer, Product, SalesOrderItem } from '../../types';

interface SalesOrderFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const SalesOrderForm: React.FC<SalesOrderFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<{value: string, label: string}[]>([]);
  const generateSONumber = () => {
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
    return `SO-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    so_number: generateSONumber(),
    customer_id: '',
    agency_id: '',
    order_date: new Date().toISOString().split('T')[0],
    discount_percent: 0,
    roundoff: 0
  });
  const createEmptyItem = (): SalesOrderItem => ({
    product_id: 0,
    product_name: '',
    quantity: 0,
    free_quantity: 0,
    unit_price: 0,
    mrp: 0,
    gst_rate: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    igst_amount: 0,
    cess_rate: 0,
    cess_amount: 0,
    discount_percent: 0,
    discount_amount: 0,
    line_discount_percent: 0,
    line_discount_amount: 0,
    taxable_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    gst_amount: 0,
    total_tax_amount: 0,
    total_amount: 0,
    total_price: 0,
    batch_number: '',
    expiry_date: '',
    is_active: true,
    hsn_code: '',
    description: ''
  });

  const [items, setItems] = useState<SalesOrderItem[]>([createEmptyItem()]);
  const { showToast } = useToast();

  useEffect(() => {
    loadCustomers('');
    loadProducts();
    loadAgencies('').then(options => setAgencyOptions(options));
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        so_number: generateSONumber(),
        customer_id: '',
        agency_id: '',
        order_date: new Date().toISOString().split('T')[0],
        discount_percent: 0,
        roundoff: 0
      });
      setItems([createEmptyItem()]);
    }
  }, [resetForm]);

  const loadCustomers = async (search: string = '') => {
    try {
      const response = await inventoryService.getCustomers({ search, per_page: 50 });
      setCustomers(response.data);
      return response.data.map((customer: Customer) => ({
        value: customer.id.toString(),
        label: `${customer.phone} | ${customer.name}`
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
      return newCustomer;
    } catch (error) {
      showToast('error', 'Failed to create customer');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('percent') || name === 'roundoff' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCustomerChange = (value: string | number | (string | number)[]) => {
    setFormData(prev => ({ ...prev, customer_id: value as string }));
  };

  const loadAgencies = async (search: string) => {
    try {
      const response = await adminService.getAgencies({ search, per_page: 50 });
      return response.data.map((agency: any) => ({
        value: agency.id.toString(),
        label: `${agency.phone} | ${agency.name}`
      }));
    } catch (error) {
      console.error('Error loading agencies:', error);
      return [];
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
        name,
        phone,
        tenant_id: 1
      };
      
      const response = await adminService.createAgency(agencyData);
      const newAgency = {
        value: response.data.id.toString(),
        label: `${phone} | ${name}`
      };
      
      return newAgency;
    } catch (error) {
      console.error('Error creating agency:', error);
      throw error;
    }
  };

  const getSelectedCustomer = () => {
    return customers.find(customer => customer.id === Number(formData.customer_id));
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
    const sellingPrice = product?.selling_price ?? product?.cost_price ?? 0;
    const mrpValue = product?.mrp_price ?? sellingPrice;
    newItems[index] = {
      ...newItems[index],
      product_id: Number(productId),
      product_name: product?.name || '',
      unit_price: sellingPrice,
      mrp: mrpValue,
      gst_rate: gstRate,
      cgst_rate: gstRate / 2,
      sgst_rate: gstRate / 2,
      igst_rate: 0,
      igst_amount: 0,
      cess_rate: 0,
      cess_amount: 0,
      discount_percent: 0,
      discount_amount: 0,
      line_discount_percent: 0,
      line_discount_amount: 0,
      taxable_amount: sellingPrice,
      cgst_amount: 0,
      sgst_amount: 0,
      gst_amount: 0,
      total_tax_amount: 0,
      total_price: sellingPrice,
      total_amount: sellingPrice,
      hsn_code: product?.hsn_code || '',
      description: product?.description || ''
    };
    
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: number | string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const calculateItemTotal = (index: number, itemsArray: SalesOrderItem[]) => {
    const item = itemsArray[index];
    const baseAmount = item.unit_price * item.quantity;
    const discountAmount = baseAmount * (item.discount_percent / 100);
    const discountedAmount = baseAmount - discountAmount;
    const cgstAmount = discountedAmount * (item.cgst_rate / 100);
    const sgstAmount = discountedAmount * (item.sgst_rate / 100);
    const igstAmount = discountedAmount * ((item.igst_rate || 0) / 100);
    const cessAmount = discountedAmount * ((item.cess_rate || 0) / 100);
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;
    const total = discountedAmount + totalTaxAmount;

    itemsArray[index] = {
      ...item,
      discount_amount: discountAmount,
      line_discount_percent: item.discount_percent,
      line_discount_amount: discountAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      cess_amount: cessAmount,
      taxable_amount: discountedAmount,
      gst_amount: cgstAmount + sgstAmount + igstAmount,
      total_tax_amount: totalTaxAmount,
      total_price: total,
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

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0);
    const discountAmount = subtotal * (formData.discount_percent / 100);
    const finalTotal = subtotal - discountAmount + formData.roundoff;
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
      const { finalTotal, discountAmount, subtotal } = calculateTotals();
      const selectedCustomer = getSelectedCustomer();
      
      // Calculate total tax amounts
      const totalTaxes = validItems.reduce((acc, item) => {
        const taxableAmount = item.unit_price * item.quantity * (1 - (item.discount_percent / 100));
        const cgstAmount = taxableAmount * (item.cgst_rate / 100);
        const sgstAmount = taxableAmount * (item.sgst_rate / 100);
        const igstAmount = taxableAmount * ((item.igst_rate || 0) / 100);
        const cessAmount = taxableAmount * ((item.cess_rate || 0) / 100);
        return {
          cgst_amount: acc.cgst_amount + cgstAmount,
          sgst_amount: acc.sgst_amount + sgstAmount,
          igst_amount: acc.igst_amount + igstAmount,
          cess_amount: acc.cess_amount + cessAmount,
          total_tax_amount: acc.total_tax_amount + cgstAmount + sgstAmount + igstAmount + cessAmount,
          taxable_amount: acc.taxable_amount + taxableAmount
        };
      }, { cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0, total_tax_amount: 0, taxable_amount: 0 });

      const orderData = {
        so_number: formData.so_number,
        customer_id: Number(formData.customer_id),
        agency_id: formData.agency_id ? Number(formData.agency_id) : undefined,
        reference_number: "",
        order_date: new Date(formData.order_date).toISOString(),
        customer_name: selectedCustomer?.name || "",
        customer_gstin: selectedCustomer?.tax_id || "",
        subtotal_amount: subtotal,
        header_discount_percent: formData.discount_percent,
        header_discount_amount: discountAmount,
        taxable_amount: totalTaxes.taxable_amount,
        cgst_amount: totalTaxes.cgst_amount,
        sgst_amount: totalTaxes.sgst_amount,
        igst_amount: totalTaxes.igst_amount,
        cess_amount: totalTaxes.cess_amount,
        total_tax_amount: totalTaxes.total_tax_amount,
        roundoff: formData.roundoff,
        net_amount: finalTotal,
        currency_id: 1,
        exchange_rate: 1,
        is_reverse_charge: false,
        is_tax_inclusive: false,
        status: "DRAFT",
        approval_status: "DRAFT",
        items: validItems.map(item => {
          const taxableAmount = item.unit_price * item.quantity * (1 - (item.discount_percent / 100));
          return {
            product_id: item.product_id,
            product_name: item.product_name || '',
            quantity: item.quantity,
            free_quantity: item.free_quantity,
            unit_price: item.unit_price,
            mrp: item.mrp,
            line_discount_percent: item.discount_percent,
            line_discount_amount: item.discount_amount,
            taxable_amount: taxableAmount,
            cgst_rate: item.cgst_rate,
            cgst_amount: taxableAmount * (item.cgst_rate / 100),
            sgst_rate: item.sgst_rate,
            sgst_amount: taxableAmount * (item.sgst_rate / 100),
            igst_rate: item.igst_rate ?? 0,
            igst_amount: item.igst_amount ?? 0,
            cess_rate: item.cess_rate ?? 0,
            cess_amount: item.cess_amount ?? 0,
            total_price: item.total_price,
            batch_number: item.batch_number || "",
            expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString() : undefined,
            is_active: true,
            hsn_code: item.hsn_code || "",
            description: item.description || ""
          };
        })
      };

      await inventoryService.createSalesOrder(orderData);
      onSave();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create sales order';
      console.error('Sales order creation error:', error);
      showToast('error', errorMessage);
    }
  };

  const { subtotal, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Sales Order</h2>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">SO Number</label>
            <input
              type="text"
              name="so_number"
              value={formData.so_number}
              onChange={handleInputChange}
              readOnly
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <DatePicker
              value={formData.order_date}
              onChange={(value) => setFormData(prev => ({ ...prev, order_date: value }))}
              placeholder="Select order date"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Customer * <span className="text-xs text-gray-500">(Format: Phone | Name)</span></label>
            <SearchableDropdown
              options={customers.map(customer => ({
                value: customer.id,
                label: `${customer.phone} | ${customer.name}`
              }))}
              value={formData.customer_id}
              onChange={handleCustomerChange}
              placeholder="Search or add new (Phone | Name)"
              multiple={false}
              searchable={true}
              allowAdd={true}
              onSearch={loadCustomers}
              onAdd={handleAddCustomer}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={getSelectedCustomer()?.name || ''}
              readOnly
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={getSelectedCustomer()?.email || ''}
              readOnly
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID</label>
            <input
              type="text"
              value={getSelectedCustomer()?.tax_id || ''}
              readOnly
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Agency <span className="text-xs text-gray-500">(Format: Phone | Name)</span></label>
            <SearchableDropdown
              options={agencyOptions}
              value={formData.agency_id}
              onChange={(value) => setFormData(prev => ({ ...prev, agency_id: (Array.isArray(value) ? value[0] : value).toString() }))}
              onSearch={async (search) => {
                const options = await loadAgencies(search);
                setAgencyOptions(options);
                return options;
              }}
              placeholder="Search or add new (Phone | Name)"
              multiple={false}
              searchable={true}
              allowAdd={true}
              onAdd={async (inputValue) => {
                const newAgency = await handleAddAgency(inputValue);
                setAgencyOptions(prev => [...prev, newAgency]);
                return newAgency;
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold">Order Items</h3>
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
            .sales-order-table { table-layout: fixed !important; }
            .sales-order-table th:nth-child(1), .sales-order-table td:nth-child(1) { width: 22% !important; }
            .sales-order-table th:nth-child(2), .sales-order-table td:nth-child(2) { width: 10% !important; }
            .sales-order-table th:nth-child(3), .sales-order-table td:nth-child(3) { width: 10% !important; }
            .sales-order-table th:nth-child(4), .sales-order-table td:nth-child(4) { width: 8% !important; }
            .sales-order-table th:nth-child(5), .sales-order-table td:nth-child(5) { width: 8% !important; }
            .sales-order-table th:nth-child(6), .sales-order-table td:nth-child(6) { width: 9% !important; }
            .sales-order-table th:nth-child(7), .sales-order-table td:nth-child(7) { width: 10% !important; }
            .sales-order-table th:nth-child(8), .sales-order-table td:nth-child(8) { width: 13% !important; }
            .sales-order-table th:nth-child(9), .sales-order-table td:nth-child(9) { width: 10% !important; }
          `}</style>
          <div className="overflow-x-auto">
            <table className="border border-gray-200 sales-order-table" style={{ minWidth: '800px', width: '100%' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ minWidth: '180px' }}>Product</th>
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
                {items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-2 py-2" style={{ minWidth: '180px' }}>
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
                      value={item.batch_number || ''}
                      onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                      placeholder="Batch"
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
                      disabled
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100 cursor-not-allowed"
                      step="0.1"
                    />
                  </td>
                  <td className="px-3 py-2 w-24 text-sm text-center">{item.total_amount.toFixed(2)}</td>
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

        <div className="flex flex-col md:flex-row justify-end">
          <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-3">Order Summary</h4>
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
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
          >
            Save Order
          </button>
        </div>
        </form>
      )}
    </div>
  );
};

export default SalesOrderForm;