import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import { adminService, inventoryService, diagnosticService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface OrderCommissionFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

interface CommissionItem {
  item_type: string;
  item_id: number;
  item_name: string;
  item_rate: number;
  commission_percentage: number;
  commission_value: number;
  gst_percentage: number;
  gst_amount: number;
  cess_percentage: number;
  cess_amount: number;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  roundoff: number;
  final_amount: number;
}

const OrderCommissionForm: React.FC<OrderCommissionFormProps> = ({ onSave, isCollapsed, onToggleCollapse, resetForm }) => {
  const [agencyOptions, setAgencyOptions] = useState<{value: string, label: string}[]>([]);
  const { showToast } = useToast();

  const generateOrderNumber = () => {
    const now = new Date();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantId = user.tenant_id || 1;
    const timestamp = now.getTime();
    return `OC-${tenantId}${timestamp}`;
  };

  const [formData, setFormData] = useState({
    order_commission_number: generateOrderNumber(),
    order_type: 'Products',
    order_id: '',
    order_number: '',
    agency_id: '',
    agency_name: '',
    agency_phone: '',
    notes: '',
    disc_percentage: 0,
    roundoff: 0
  });

  const [orderOptions, setOrderOptions] = useState<{value: string, label: string}[]>([]);

  const [items, setItems] = useState<CommissionItem[]>([{
    item_type: 'Products',
    item_id: 0,
    item_name: '',
    item_rate: 0,
    commission_percentage: 0,
    commission_value: 0,
    gst_percentage: 0,
    gst_amount: 0,
    cess_percentage: 0,
    cess_amount: 0,
    total_amount: 0,
    discount_percentage: 0,
    discount_amount: 0,
    roundoff: 0,
    final_amount: 0
  }]);

  useEffect(() => {
    loadAgencies('').then(options => setAgencyOptions(options));
    loadOrders();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        order_commission_number: generateOrderNumber(),
        order_type: 'Products',
        order_id: '',
        order_number: '',
        agency_id: '',
        agency_name: '',
        agency_phone: '',
        notes: '',
        disc_percentage: 0,
        roundoff: 0
      });
      setItems([{
        item_type: 'Products',
        item_id: 0,
        item_name: '',
        item_rate: 0,
        commission_percentage: 0,
        commission_value: 0,
        gst_percentage: 0,
        gst_amount: 0,
        cess_percentage: 0,
        cess_amount: 0,
        total_amount: 0,
        discount_percentage: 0,
        discount_amount: 0,
        roundoff: 0,
        final_amount: 0
      }]);
    }
  }, [resetForm]);

  const loadAgencies = async (search: string) => {
    try {
      const response = await adminService.getAgencies({ search, per_page: 50 });
      return response.data.map((agency: any) => ({
        value: agency.id.toString(),
        label: `${agency.phone} | ${agency.name}`
      }));
    } catch (error) {
      return [];
    }
  };

  const loadOrders = async (orderType: string = formData.order_type) => {
    try {
      if (orderType === 'Products') {
        const response = await inventoryService.getSalesOrders();
        const ordersWithAgency = response.data.filter((order: any) => order.agency_id != null && order.agency_id !== '');
        const options = ordersWithAgency.map((order: any) => ({
          value: order.id.toString(),
          label: `${order.so_number || 'N/A'} - ${order.customer_name || 'N/A'}`
        }));
        setOrderOptions(options);
      } else {
        const response = await diagnosticService.getTestOrders();
        const ordersWithAgency = response.data.filter((order: any) => order.agency_id != null && order.agency_id !== '');
        const options = ordersWithAgency.map((order: any) => ({
          value: order.id.toString(),
          label: `${order.test_order_number || 'N/A'} - ${order.patient_name || 'N/A'}`
        }));
        setOrderOptions(options);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrderOptions([]);
    }
  };

  const handleOrderTypeChange = async (value: string | number | (string | number)[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setOrderOptions([]);
      setFormData(prev => ({ 
        ...prev, 
        order_id: '',
        order_number: '',
        agency_id: '',
        agency_name: '',
        agency_phone: ''
      }));
      return;
    }
    const orderType = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({ 
      ...prev, 
      order_type: orderType.toString(),
      order_id: '',
      order_number: '',
      agency_id: '',
      agency_name: '',
      agency_phone: ''
    }));
    await loadOrders(orderType.toString());
  };

  const [editingCommissionId, setEditingCommissionId] = useState<number | null>(null);

  const handleOrderChange = async (value: string | number | (string | number)[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setFormData(prev => ({ 
        ...prev, 
        order_id: '',
        order_number: '',
        agency_id: '',
        agency_name: '',
        agency_phone: ''
      }));
      setItems([{
        item_type: formData.order_type,
        item_id: 0,
        item_name: '',
        item_rate: 0,
        commission_percentage: 0,
        commission_value: 0,
        gst_percentage: 0,
        gst_amount: 0,
        cess_percentage: 0,
        cess_amount: 0,
        total_amount: 0,
        discount_percentage: 0,
        discount_amount: 0,
        roundoff: 0,
        final_amount: 0
      }]);
      setEditingCommissionId(null);
      return;
    }
    const orderId = Array.isArray(value) ? value[0] : value;
    const order = orderOptions.find(o => o.value === orderId.toString());
    
    // Check if commission already exists for this order
    try {
      const commissionsResponse = await adminService.getOrderCommissions();
      const existingCommission = commissionsResponse.data.find(
        (c: any) => c.order_id === Number(orderId) && c.order_type === formData.order_type
      );
      
      if (existingCommission) {
        // Load existing commission data
        const commissionDetails = await adminService.getOrderCommission(existingCommission.id);
        const data = commissionDetails.data;
        
        setEditingCommissionId(data.id);
        setFormData(prev => ({
          ...prev,
          order_commission_number: data.commission_number || prev.order_commission_number,
          order_id: orderId.toString(),
          order_number: data.order_number,
          agency_id: data.agency_id?.toString() || '',
          agency_name: data.agency_name || '',
          agency_phone: data.agency_phone || '',
          notes: data.notes || '',
          disc_percentage: data.disc_percentage || 0,
          roundoff: data.roundoff || 0
        }));
        
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
        return;
      }
    } catch (error) {
      console.error('Error checking existing commission:', error);
    }
    
    // No existing commission, load order details
    setEditingCommissionId(null);
    try {
      let orderDetails: any = {};
      if (formData.order_type === 'Products') {
        const response = await inventoryService.getSalesOrder(Number(orderId));
        orderDetails = response.data;
      } else {
        const response = await diagnosticService.getTestOrder(Number(orderId));
        orderDetails = response.data;
      }
      
      // Find agency details if agency_id exists
      let agencyName = '';
      let agencyPhone = '';
      if (orderDetails.agency_id) {
        try {
          const agencies = await loadAgencies('');
          const agency = agencies.find(a => a.value === orderDetails.agency_id.toString());
          if (agency) {
            const [phone, name] = agency.label.split('|').map(s => s.trim());
            agencyName = name;
            agencyPhone = phone;
          }
        } catch (error) {
          console.error('Error loading agency:', error);
        }
      }
      
      setFormData(prev => ({ 
        ...prev,
        order_commission_number: generateOrderNumber(),
        order_id: orderId.toString(),
        order_number: order ? order.label.split(' - ')[0] : '',
        agency_id: orderDetails.agency_id?.toString() || '',
        agency_name: agencyName,
        agency_phone: agencyPhone
      }));
      
      // Populate commission items from order items
      if (orderDetails.items && orderDetails.items.length > 0) {
        const commissionItems = orderDetails.items.map((item: any) => {
          const itemType = formData.order_type;
          const itemId = itemType === 'Products' ? item.product_id : item.test_id;
          const itemName = itemType === 'Products' ? item.product_name : item.test_name;
          const itemRate = item.total_amount || 0;
          const gstRate = item.gst_rate || item.gst || 0;
          const cessRate = item.cess || 0;
          const discPercentage = item.discount_percent || item.disc_percentage || 0;
          
          return {
            item_type: itemType,
            item_id: itemId,
            item_name: itemName,
            item_rate: itemRate,
            commission_percentage: 0,
            commission_value: 0,
            gst_percentage: gstRate,
            gst_amount: 0,
            cess_percentage: cessRate,
            cess_amount: 0,
            total_amount: 0,
            discount_percentage: discPercentage,
            discount_amount: 0,
            roundoff: 0,
            final_amount: 0
          };
        });
        setItems(commissionItems);
      }
    } catch (error) {
      setFormData(prev => ({ 
        ...prev, 
        order_id: orderId.toString(),
        order_number: order ? order.label.split(' - ')[0] : ''
      }));
    }
  };

  const handleAgencyChange = (value: string | number | (string | number)[]) => {
    const agencyId = Array.isArray(value) ? value[0] : value;
    const agency = agencyOptions.find(a => a.value === agencyId.toString());
    if (agency) {
      const [phone, name] = agency.label.split('|').map(s => s.trim());
      setFormData(prev => ({ 
        ...prev, 
        agency_id: agencyId.toString(),
        agency_name: name,
        agency_phone: phone
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('percentage') || name === 'roundoff' ? parseFloat(value) || 0 : value
    }));
  };

  const handleItemChange = (index: number, field: keyof CommissionItem, value: number | string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    calculateItemTotal(index, newItems, field);
  };

  const calculateItemTotal = (index: number, itemsArray: CommissionItem[], field?: string) => {
    const item = itemsArray[index];
    
    // Calculate commission_value from percentage or vice versa
    let commissionValue = item.commission_value;
    let commissionPercentage = item.commission_percentage;
    
    if (field === 'commission_percentage') {
      commissionValue = parseFloat((item.item_rate * (item.commission_percentage / 100)).toFixed(2));
    } else if (field === 'commission_value') {
      commissionPercentage = parseFloat((item.item_rate > 0 ? (item.commission_value / item.item_rate) * 100 : 0).toFixed(2));
    }
    
    const gstAmount = parseFloat((commissionValue * (item.gst_percentage / 100)).toFixed(2));
    const cessAmount = parseFloat((commissionValue * (item.cess_percentage / 100)).toFixed(2));
    const totalAmount = parseFloat((commissionValue + gstAmount + cessAmount).toFixed(2));
    const discountAmount = parseFloat((totalAmount * (item.discount_percentage / 100)).toFixed(2));
    const finalAmount = parseFloat((totalAmount - discountAmount + item.roundoff).toFixed(2));

    itemsArray[index] = {
      ...item,
      commission_percentage: commissionPercentage,
      commission_value: commissionValue,
      gst_amount: gstAmount,
      cess_amount: cessAmount,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount
    };
    setItems([...itemsArray]);
  };

  const addItem = () => {
    setItems([...items, {
      item_type: formData.order_type,
      item_id: 0,
      item_name: '',
      item_rate: 0,
      commission_percentage: 0,
      commission_value: 0,
      gst_percentage: 0,
      gst_amount: 0,
      cess_percentage: 0,
      cess_amount: 0,
      total_amount: 0,
      discount_percentage: 0,
      discount_amount: 0,
      roundoff: 0,
      final_amount: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const total = items.reduce((sum, item) => sum + item.final_amount, 0);
    const discAmount = total * (formData.disc_percentage / 100);
    const final = total - discAmount + formData.roundoff;
    return { total, discAmount, final };
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!formData.agency_id) {
      showToast('error', 'Please select an agency');
      return;
    }

    const validItems = items.filter(item => item.item_name && item.item_rate > 0);
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const { total, discAmount, final } = calculateTotals();
      
      const commissionData = {
        order_commission_number: formData.order_commission_number,
        order_type: formData.order_type,
        order_id: Number(formData.order_id),
        order_number: formData.order_number,
        agency_id: Number(formData.agency_id),
        agency_name: formData.agency_name,
        agency_phone: formData.agency_phone,
        notes: formData.notes,
        total_amount: total,
        disc_percentage: formData.disc_percentage,
        disc_amount: discAmount,
        roundoff: formData.roundoff,
        final_amount: final,
        items: validItems
      };

      if (editingCommissionId) {
        await adminService.updateOrderCommission(editingCommissionId, commissionData);
        showToast('success', 'Order commission updated successfully');
      } else {
        await adminService.createOrderCommission(commissionData);
        showToast('success', 'Order commission created successfully');
      }
      setEditingCommissionId(null);
      onSave();
    } catch (error) {
      showToast('error', 'Failed to create order commission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { total, discAmount, final } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Order Commission</h2>
        <button type="button" onClick={onToggleCollapse} className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Commission #</label>
              <input
                type="text"
                value={formData.order_commission_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Type *</label>
              <SearchableDropdown
                options={[
                  { value: 'Products', label: 'Products' },
                  { value: 'Tests', label: 'Tests' }
                ]}
                value={formData.order_type}
                onChange={handleOrderTypeChange}
                placeholder="Select order type"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order *</label>
              <SearchableDropdown
                key={`order-${formData.order_type}-${orderOptions.length}`}
                options={orderOptions}
                value={formData.order_id}
                onChange={handleOrderChange}
                placeholder="Select order"
                multiple={false}
                searchable={true}
                onSearch={async () => orderOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Number</label>
              <input
                type="text"
                value={formData.order_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency Name</label>
              <input
                type="text"
                value={formData.agency_name}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency Phone</label>
              <input
                type="text"
                value={formData.agency_phone}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
                placeholder="Enter notes..."
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Commission Items</h3>
            <button type="button" onClick={addItem} className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </button>
          </div>

          <div className="mb-6 overflow-x-auto">
            <table className="border border-gray-200 w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Item Name</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Rate</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Comm%</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Comm Val</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">GST%</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">CESS%</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Disc%</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Final</th>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={item.item_name}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.item_rate}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.commission_percentage}
                        onChange={(e) => handleItemChange(index, 'commission_percentage', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        step="0.1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.commission_value}
                        onChange={(e) => handleItemChange(index, 'commission_value', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.gst_percentage}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.cess_percentage}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.discount_percentage}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center bg-gray-100"
                      />
                    </td>
                    <td className="px-2 py-2 text-sm text-center">{item.final_amount.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center">
                      <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800" disabled={items.length === 1}>
                        <Minus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-end">
            <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-3">Commission Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount %:</span>
                  <input
                    type="number"
                    name="disc_percentage"
                    value={formData.disc_percentage}
                    onChange={handleInputChange}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div className="flex justify-between">
                  <span>Discount Amount:</span>
                  <span>{discAmount.toFixed(2)}</span>
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
                  <span>Final Total:</span>
                  <span>{final.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  order_commission_number: generateOrderNumber(),
                  order_type: 'Products',
                  order_id: '',
                  order_number: '',
                  agency_id: '',
                  agency_name: '',
                  agency_phone: '',
                  notes: '',
                  disc_percentage: 0,
                  roundoff: 0
                });
                setItems([{
                  item_type: 'Products',
                  item_id: 0,
                  item_name: '',
                  item_rate: 0,
                  commission_percentage: 0,
                  commission_value: 0,
                  gst_percentage: 0,
                  gst_amount: 0,
                  cess_percentage: 0,
                  cess_amount: 0,
                  total_amount: 0,
                  discount_percentage: 0,
                  discount_amount: 0,
                  roundoff: 0,
                  final_amount: 0
                }]);
                setEditingCommissionId(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Saving...' : (editingCommissionId ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OrderCommissionForm;
