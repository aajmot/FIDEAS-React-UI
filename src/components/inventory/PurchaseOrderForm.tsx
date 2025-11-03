import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Supplier, Product, PurchaseOrderItem } from '../../types';

interface PurchaseOrderFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const createEmptyItem = (): PurchaseOrderItem => ({
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
  is_active: true,
  hsn_code: '',
  description: '',
  cgst_amount: 0,
  sgst_amount: 0,
  taxable_amount: 0,
  total_tax_amount: 0,
  line_discount_percent: 0,
  line_discount_amount: 0
});

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseOrderItem[]>([createEmptyItem()]);
  const generatePONumber = () => {
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
    return `PO-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    po_number: generatePONumber(),
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    discount_percent: 0,
    roundoff: 0
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        po_number: generatePONumber(),
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        discount_percent: 0,
        roundoff: 0
      });
      setItems([createEmptyItem()]);
    }
  }, [resetForm]);

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
    const basePrice = product?.selling_price ?? product?.cost_price ?? mrpValue;
    const calculatedUnitPrice = basePrice ? Math.round(basePrice * 0.8 * 100) / 100 : 0;
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

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: number | string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const calculateItemTotal = (index: number, itemsArray: PurchaseOrderItem[]) => {
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

      const orderData = {
        po_number: formData.po_number,
        supplier_id: Number(formData.supplier_id),
        reference_number: "",
        order_date: new Date(formData.order_date).toISOString(),
        supplier_name: selectedSupplier?.name || "",
        supplier_gstin: selectedSupplier?.tax_id || "",
        subtotal_amount: subtotal,
        header_discount_percent: formData.discount_percent,
        header_discount_amount: discountAmount,
        taxable_amount: totalTaxes.taxable_amount,
        cgst_amount: totalTaxes.cgst_amount,
        sgst_amount: totalTaxes.sgst_amount,
        igst_amount: 0,
        cess_amount: 0,
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
            expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString() : '',
            is_active: true,
            hsn_code: item.hsn_code || "",
            description: item.description || ""
          };
        })
      };

      await inventoryService.createPurchaseOrder(orderData);
      onSave();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create purchase order';
      console.error('Purchase order creation error:', error);
      showToast('error', errorMessage);
    }
  };

  const { subtotal, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Purchase Order</h2>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">PO Number</label>
            <input
              type="text"
              name="po_number"
              value={formData.po_number}
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

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
            <input
              type="text"
              value={getSelectedSupplier()?.name || ''}
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
            .purchase-order-table { table-layout: fixed !important; }
            .purchase-order-table th:nth-child(1), .purchase-order-table td:nth-child(1) { width: 22% !important; }
            .purchase-order-table th:nth-child(2), .purchase-order-table td:nth-child(2) { width: 9% !important; }
            .purchase-order-table th:nth-child(3), .purchase-order-table td:nth-child(3) { width: 9% !important; }
            .purchase-order-table th:nth-child(4), .purchase-order-table td:nth-child(4) { width: 9% !important; }
            .purchase-order-table th:nth-child(5), .purchase-order-table td:nth-child(5) { width: 9% !important; }
            .purchase-order-table th:nth-child(6), .purchase-order-table td:nth-child(6) { width: 8% !important; }
            .purchase-order-table th:nth-child(7), .purchase-order-table td:nth-child(7) { width: 8% !important; }
            .purchase-order-table th:nth-child(8), .purchase-order-table td:nth-child(8) { width: 8% !important; }
            .purchase-order-table th:nth-child(9), .purchase-order-table td:nth-child(9) { width: 8% !important; }
            .purchase-order-table th:nth-child(10), .purchase-order-table td:nth-child(10) { width: 10% !important; }
            .purchase-order-table th:nth-child(11), .purchase-order-table td:nth-child(11) { width: 5% !important; }
          `}</style>
          <div className="overflow-x-auto">
            <table className="border border-gray-200 purchase-order-table" style={{ minWidth: '900px', width: '100%' }}>
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

export default PurchaseOrderForm;