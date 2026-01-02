import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import DateTimePicker from '../common/DateTimePicker';
import { healthService, diagnosticService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestInvoiceFormProps {
  onSave: () => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm: boolean;
  editData?: any;
}

interface OrderOption {
  value: number;
  label: string;
}

interface InvoiceItem {
  test_name: string;
  panel_name: string;
  rate: number;
  disc_percentage: number;
  disc_amount: number;
  taxable_amount: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
}

const TestInvoiceForm: React.FC<TestInvoiceFormProps> = ({
  onSave,
  onCancel,
  isCollapsed,
  onToggleCollapse,
  resetForm,
  editData
}) => {
  const { showToast } = useToast();
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const generateInvoiceNumber = useCallback(() => {
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
    return `TINV-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  }, []);

  const [formData, setFormData] = useState(() => ({
    invoice_number: '',
    invoice_datetime: new Date().toISOString().slice(0, 16),
    due_date: new Date().toISOString().split('T')[0],
    test_order_id: '',
    patient_name: '',
    patient_phone: '',
    doctor_name: '',
    status: 'POSTED',
    notes: ''
  }));

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      loadOrders();
      if (!editData) {
        setFormData(prev => ({ ...prev, invoice_number: generateInvoiceNumber() }));
      }
      setIsInitialized(true);
    }
  }, [isInitialized, editData, generateInvoiceNumber]);

  useEffect(() => {
    if (resetForm) {
      resetFormData();
    }
  }, [resetForm]);

  useEffect(() => {
    if (editData) {
      setFormData({
        invoice_number: editData.invoice_number || generateInvoiceNumber(),
        invoice_datetime: editData.invoice_date?.slice(0, 16) || new Date().toISOString().slice(0, 16),
        due_date: editData.due_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        test_order_id: editData.test_order_id?.toString() || '',
        patient_name: editData.patient_name || '',
        patient_phone: editData.patient_phone || '',
        doctor_name: editData.doctor_name || editData.order?.doctor_name || '',
        status: editData.status || 'POSTED',
        notes: editData.notes || ''
      });
      
      // Load order details and items for edit mode
      if (editData.test_order_id) {
        loadOrderDetails(editData.test_order_id);
      }
      
      // Set items from edit data if available
      if (editData.items) {
        setItems(editData.items);
      }
      
      // Set selected order from edit data
      if (editData.order || editData.test_order_id) {
        setSelectedOrder(editData);
      }
    }
  }, [editData]);

  const loadOrders = async () => {
    try {
      const response = await diagnosticService.getTestOrders();
      const options = response.data.map((order: any) => ({
        value: order.id,
        label: `${order.test_order_number} - ${order.patient_name}`
      }));
      setOrderOptions(options);
    } catch (error) {
      showToast('error', 'Failed to load orders');
    }
  };

  const loadOrderDetails = async (orderId: number) => {
    try {
      const response = await diagnosticService.getTestOrder(orderId);
      const order = response.data;
      setSelectedOrder(order);
      setFormData(prev => ({
        ...prev,
        test_order_id: orderId.toString(),
        patient_name: order.patient_name || '',
        patient_phone: order.patient_phone || '',
        doctor_name: order.doctor_name || ''
      }));
      setItems(order.items || []);
    } catch (error) {
      showToast('error', 'Failed to load order details');
    }
  };

  const resetFormData = useCallback(() => {
    setFormData({
      invoice_number: generateInvoiceNumber(),
      invoice_datetime: new Date().toISOString().slice(0, 16),
      due_date: new Date().toISOString().split('T')[0],
      test_order_id: '',
      patient_name: '',
      patient_phone: '',
      doctor_name: '',
      status: 'POSTED',
      notes: ''
    });
    setSelectedOrder(null);
    setItems([]);
  }, [generateInvoiceNumber]);

  const handleOrderChange = async (value: string | number | (string | number)[]) => {
    const orderId = value as number;
    if (!orderId || orderId === 0) {
      // Reset form when dropdown is cleared
      setFormData(prev => ({
        ...prev,
        test_order_id: '',
        patient_name: '',
        patient_phone: '',
        doctor_name: ''
      }));
      setSelectedOrder(null);
      setItems([]);
      return;
    }
    await loadOrderDetails(orderId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editData && (!formData.test_order_id || !selectedOrder)) {
      showToast('error', 'Please select an order');
      return;
    }

    try {
      let payload;
      
      if (editData?.id) {
        // Edit mode - only send editable fields
        payload = {
          invoice_date: new Date(formData.invoice_datetime).toISOString(),
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes
        };
        await healthService.updateTestInvoice(editData.id, payload);
      } else {
        // Create mode - send all fields
        payload = {
          invoice_number: formData.invoice_number,
          invoice_datetime: new Date(formData.invoice_datetime).toISOString(),
          due_date: formData.due_date,
          test_order_id: parseInt(formData.test_order_id),
          patient_id: selectedOrder.patient_id,
          patient_name: formData.patient_name,
          patient_phone: formData.patient_phone,
          doctor_name: formData.doctor_name,
          subtotal_amount: selectedOrder.subtotal_amount || 0,
          items_total_discount_amount: selectedOrder.items_total_discount_amount || 0,
          taxable_amount: selectedOrder.taxable_amount || 0,
          cgst_amount: selectedOrder.cgst_amount || 0,
          sgst_amount: selectedOrder.sgst_amount || 0,
          igst_amount: selectedOrder.igst_amount || 0,
          cess_amount: selectedOrder.cess_amount || 0,
          overall_disc_percentage: selectedOrder.overall_disc_percentage || 0,
          overall_disc_amount: selectedOrder.overall_disc_amount || 0,
          roundoff: selectedOrder.roundoff || 0,
          final_amount: selectedOrder.final_amount || 0,
          status: formData.status,
          notes: formData.notes,
          items: items
        };
        await healthService.createTestInvoice(payload);
      }
      
      onSave();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save invoice');
    }
  };

  const handleCancelClick = () => {
    resetFormData();
    onCancel();
  };

  const calculateTotals = () => {
    const subtotal = selectedOrder?.subtotal_amount || 0;
    const itemsDiscountAmount = selectedOrder?.items_total_discount_amount || 0;
    const taxableAmount = selectedOrder?.taxable_amount || 0;
    const cgstAmount = selectedOrder?.cgst_amount || 0;
    const sgstAmount = selectedOrder?.sgst_amount || 0;
    const igstAmount = selectedOrder?.igst_amount || 0;
    const cessAmount = selectedOrder?.cess_amount || 0;
    const overallDiscAmount = selectedOrder?.overall_disc_amount || 0;
    const roundoff = selectedOrder?.roundoff || 0;
    const finalTotal = selectedOrder?.final_amount || 0;
    return { subtotal, itemsDiscountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, cessAmount, overallDiscAmount, roundoff, finalTotal };
  };

  const { subtotal, itemsDiscountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, cessAmount, overallDiscAmount, roundoff, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
        <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>Create Test Invoice</h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-6" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice DateTime</label>
              <DateTimePicker
                value={formData.invoice_datetime}
                onChange={(value) => setFormData(prev => ({ ...prev, invoice_datetime: value }))}
                placeholder="Select invoice date and time"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <DatePicker
                value={formData.due_date}
                onChange={(value) => setFormData(prev => ({ ...prev, due_date: value }))}
                placeholder="Select due date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Test Order *</label>
              <SearchableDropdown
                options={orderOptions}
                value={formData.test_order_id ? parseInt(formData.test_order_id) : ''}
                onChange={handleOrderChange}
                placeholder="Search order"
                multiple={false}
                searchable={true}
                disabled={!!editData}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Phone</label>
              <input
                type="text"
                name="patient_phone"
                value={formData.patient_phone}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor Name</label>
              <input
                type="text"
                name="doctor_name"
                value={formData.doctor_name}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <SearchableDropdown
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'POSTED', label: 'Posted' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value.toString() }))}
                placeholder="Select status"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {items.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold">Invoice Items</h3>
              </div>

              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="border border-gray-200" style={{ minWidth: '1200px', width: '100%' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Test/Panel</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Rate</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Disc%</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Disc Amt</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Taxable</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">GST%</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">GST Amt</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">CESS%</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">CESS Amt</th>
                        <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-2 py-2 text-sm">{item.test_name || item.panel_name}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.rate?.toFixed(2)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.disc_percentage?.toFixed(1)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.disc_amount?.toFixed(2)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.taxable_amount?.toFixed(2)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{(item?.cgst_rate + item?.sgst_rate)?.toFixed(1)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{(item?.cgst_amount + item?.sgst_amount + item?.igst_amount).toFixed(2)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.cess_rate?.toFixed(1)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.cess_amount?.toFixed(2)??0}</td>
                          <td className="px-2 py-2 text-sm text-center">{item?.total_amount?.toFixed(2)??0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end">
                <div className="w-full md:w-1/2 erp-summary-container">
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--erp-spacing-lg)' }}>Invoice Summary</h4>
                  <div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">Subtotal:</span>
                      <span className="erp-summary-value">{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">Items Discount:</span>
                      <span className="erp-summary-value">{itemsDiscountAmount.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">Taxable Amount:</span>
                      <span className="erp-summary-value">{taxableAmount.toFixed(2)}</span>
                    </div>
                    {/* <div className="erp-summary-row">
                      <span className="erp-summary-label">CGST:</span>
                      <span className="erp-summary-value">{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">SGST:</span>
                      <span className="erp-summary-value">{sgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">IGST:</span>
                      <span className="erp-summary-value">{igstAmount.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">CESS:</span>
                      <span className="erp-summary-value">{cessAmount.toFixed(2)}</span>
                    </div> */}
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">Overall Discount:</span>
                      <span className="erp-summary-value">{overallDiscAmount.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row">
                      <span className="erp-summary-label">Round Off:</span>
                      <span className="erp-summary-value">{roundoff.toFixed(2)}</span>
                    </div>
                    <div className="erp-summary-row erp-summary-total">
                      <span className="erp-summary-label">Total:</span>
                      <span className="erp-summary-value">{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)', marginTop: 'var(--erp-spacing-xl)' }}>
            <button
              type="button"
              onClick={handleCancelClick}
              className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="erp-form-btn text-white bg-primary hover:bg-secondary"
            >
              {editData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TestInvoiceForm;
