import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { diagnosticService, careService, clinicService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestOrderFormProps {
  onSave: () => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  editData?: any;
}

interface OrderItem {
  test_id: number;
  test_name: string;
  panel_id: number;
  panel_name: string;
  is_panel: boolean;
  rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate: number;
  disc_percentage: number;
  disc_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
}

const TestOrderForm: React.FC<TestOrderFormProps> = ({ onSave, onCancel, isCollapsed, onToggleCollapse, resetForm, editData }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<{value: string, label: string}[]>([]);
  
  const generateOrderNumber = () => {
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
    return `TO-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    test_order_number: generateOrderNumber(),
    appointment_id: '',
    patient_name: '',
    patient_phone: '',
    doctor_name: '',
    doctor_phone: '',
    doctor_license_number: '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    urgency: 'ROUTINE',
    notes: '',
    agency_id: '',
    disc_percentage: 0,
    roundoff: 0
  });

  const [items, setItems] = useState<OrderItem[]>([{
    test_id: 0,
    test_name: '',
    panel_id: 0,
    panel_name: '',
    is_panel: false,
    rate: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    cess_rate: 0,
    disc_percentage: 0,
    disc_amount: 0,
    taxable_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    cess_amount: 0,
    total_amount: 0
  }]);

  const { showToast } = useToast();

  useEffect(() => {
    loadAppointments('');
    loadTests();
    loadPanels();
    loadAgencies('').then(options => setAgencyOptions(options));
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        test_order_number: generateOrderNumber(),
        appointment_id: '',
        patient_name: '',
        patient_phone: '',
        doctor_name: '',
        doctor_phone: '',
        doctor_license_number: '',
        order_date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        urgency: 'ROUTINE',
        notes: '',
        agency_id: '',
        disc_percentage: 0,
        roundoff: 0
      });
      setItems([{
        test_id: 0,
        test_name: '',
        panel_id: 0,
        panel_name: '',
        is_panel: false,
        rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        cess_rate: 0,
        disc_percentage: 0,
        disc_amount: 0,
        taxable_amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        cess_amount: 0,
        total_amount: 0
      }]);
    }
  }, [resetForm]);

  useEffect(() => {
    if (editData) {
      setFormData({
        test_order_number: editData.test_order_number || '',
        appointment_id: editData.appointment_id?.toString() || '',
        patient_name: editData.patient_name || '',
        patient_phone: editData.patient_phone || '',
        doctor_name: editData.doctor_name || '',
        doctor_phone: editData.doctor_phone || '',
        doctor_license_number: editData.doctor_license_number || '',
        order_date: editData.order_date ? new Date(editData.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: editData.status || 'pending',
        urgency: editData.urgency || 'normal',
        notes: editData.notes || '',
        agency_id: editData.agency_id?.toString() || '',
        disc_percentage: editData.disc_percentage || 0,
        roundoff: editData.roundoff || 0
      });
      
      if (editData.items && editData.items.length > 0) {
        setItems(editData.items.map((item: any) => ({
          test_id: item.test_id || 0,
          test_name: item.test_name || '',
          panel_id: item.panel_id || 0,
          panel_name: item.panel_name || '',
          is_panel: !!item.panel_id,
          rate: item.rate || 0,
          cgst_rate: item.cgst_rate || 0,
          sgst_rate: item.sgst_rate || 0,
          igst_rate: item.igst_rate || 0,
          cess_rate: item.cess_rate || 0,
          disc_percentage: item.disc_percentage || 0,
          disc_amount: item.disc_amount || 0,
          taxable_amount: item.taxable_amount || 0,
          cgst_amount: item.cgst_amount || 0,
          sgst_amount: item.sgst_amount || 0,
          igst_amount: item.igst_amount || 0,
          cess_amount: item.cess_amount || 0,
          total_amount: item.total_amount || 0
        })));
      }
    }
  }, [editData]);

  const loadAppointments = async (search: string = '') => {
    try {
      const response = await clinicService.getAppointments({ search, per_page: 50 });
      setAppointments(response.data);
      return response.data.map((apt: any) => ({
        value: apt.id.toString(),
        label: apt.appointment_number || apt.id.toString()
      }));
    } catch (error) {
      return [];
    }
  };

  const loadTests = async () => {
    try {
      const response = await careService.getTests({ per_page: 1000 });
      setTests(response.data);
    } catch (error) {
      showToast('error', 'Failed to load tests');
    }
  };

  const loadPanels = async () => {
    try {
      const response = await diagnosticService.getTestPanels({ per_page: 1000 });
      setPanels(response.data);
    } catch (error) {
      showToast('error', 'Failed to load panels');
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
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'disc_percentage') {
      setFormData(prev => ({ ...prev, disc_percentage: parseFloat(value) || 0 }));
    } else if (name === 'disc_amount') {
      const discAmount = parseFloat(value) || 0;
      const { itemsTotal } = calculateTotals();
      const discPercentage = itemsTotal > 0 ? (discAmount / itemsTotal) * 100 : 0;
      setFormData(prev => ({ ...prev, disc_percentage: discPercentage }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'roundoff' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleAppointmentChange = (value: string | number | (string | number)[]) => {
    const appointmentId = value.toString();
    const appointment = appointments.find(a => a.id === Number(appointmentId));
    setFormData(prev => ({
      ...prev,
      appointment_id: appointmentId,
      patient_name: appointment?.patient_name || '',
      patient_phone: appointment?.patient_phone || '',
      doctor_name: appointment?.doctor_name || '',
      doctor_phone: appointment?.doctor_phone || '',
      doctor_license_number: appointment?.doctor_license_number || ''
    }));
  };

  const handleTestChange = (index: number, value: string | number | (string | number)[]) => {
    const testId = Array.isArray(value) ? value[0] : value;
    const test = tests.find(t => t.id === Number(testId));
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      test_id: Number(testId),
      test_name: test?.name || '',
      panel_id: 0,
      panel_name: '',
      rate: test?.rate || 0,
      disc_percentage:0,
      cgst_rate: (test?.gst || 0) / 2,
      sgst_rate: (test?.gst || 0) / 2,
      igst_rate: 0,
      cess_rate: test?.cess || 0
    };
    
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const handlePanelChange = (index: number, value: string | number | (string | number)[]) => {
    const panelId = Array.isArray(value) ? value[0] : value;
    const panel = panels.find(p => p.id === Number(panelId));
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      test_id: 0,
      test_name: '',
      panel_id: Number(panelId),
      panel_name: panel?.name || '',
      rate: panel?.cost || 0,
      cgst_rate: (panel?.gst || 0) / 2,
      sgst_rate: (panel?.gst || 0) / 2,
      igst_rate: 0,
      cess_rate: panel?.cess || 0
    };
    
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    calculateItemTotal(index, newItems);
  };

  const calculateItemTotal = (index: number, itemsArray: OrderItem[]) => {
    const item = itemsArray[index];
    const baseAmount = item.rate;
    const discountAmount = baseAmount * (item.disc_percentage / 100);
    const taxableAmount = baseAmount - discountAmount;
    const cgstAmount = taxableAmount * (item.cgst_rate / 100);
    const sgstAmount = taxableAmount * (item.sgst_rate / 100);
    const igstAmount = taxableAmount * (item.igst_rate / 100);
    const cessAmount = taxableAmount * (item.cess_rate / 100);
    const total = taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount;

    itemsArray[index] = {
      ...item,
      disc_amount: discountAmount,
      taxable_amount: taxableAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      cess_amount: cessAmount,
      total_amount: total
    };
    setItems([...itemsArray]);
  };

  const addItem = () => {
    setItems([...items, {
      test_id: 0,
      test_name: '',
      panel_id: 0,
      panel_name: '',
      is_panel: false,
      rate: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      cess_rate: 0,
      disc_percentage: 0,
      disc_amount: 0,
      taxable_amount: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
      total_amount: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.rate, 0);
    const itemsDiscountAmount = items.reduce((sum, item) => sum + item.disc_amount, 0);
    const taxableAmount = items.reduce((sum, item) => sum + item.taxable_amount, 0);
    const cgstAmount = items.reduce((sum, item) => sum + item.cgst_amount, 0);
    const sgstAmount = items.reduce((sum, item) => sum + item.sgst_amount, 0);
    const igstAmount = items.reduce((sum, item) => sum + item.igst_amount, 0);
    const cessAmount = items.reduce((sum, item) => sum + item.cess_amount, 0);
    const itemsTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
    const overallDiscAmount = itemsTotal * (formData.disc_percentage / 100);
    const finalTotal = itemsTotal - overallDiscAmount + formData.roundoff;
    return { subtotal, itemsDiscountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, cessAmount, itemsTotal, overallDiscAmount, finalTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_name) {
      showToast('error', 'Please select a patient');
      return;
    }

    const validItems = items.filter(item => (item.test_id > 0 || item.panel_id > 0)).map((item, idx) => ({
      line_no: idx + 1,
      test_id: item.test_id > 0 ? item.test_id : null,
      test_name: item.test_name,
      panel_id: item.panel_id > 0 ? item.panel_id : null,
      panel_name: item.panel_name,
      rate: item.rate,
      disc_percentage: item.disc_percentage,
      disc_amount: item.disc_amount,
      taxable_amount: item.taxable_amount,
      cgst_rate: item.cgst_rate,
      cgst_amount: item.cgst_amount,
      sgst_rate: item.sgst_rate,
      sgst_amount: item.sgst_amount,
      igst_rate: item.igst_rate,
      igst_amount: item.igst_amount,
      cess_rate: item.cess_rate,
      cess_amount: item.cess_amount,
      total_amount: item.total_amount,
      item_status: 'PENDING',
      remarks: ''
    }));

    if (validItems.length === 0) {
      showToast('error', 'Please add at least one test or panel');
      return;
    }

    try {
      const { subtotal, itemsDiscountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, cessAmount, overallDiscAmount, finalTotal } = calculateTotals();
      
      const selectedAppointment = appointments.find(apt => apt.id === Number(formData.appointment_id));
      
      const orderData = {
        test_order_number: formData.test_order_number,
        order_date: new Date(formData.order_date).toISOString(),
        patient_id: selectedAppointment?.patient_id || null,
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone,
        doctor_id: selectedAppointment?.doctor_id || null,
        doctor_name: formData.doctor_name,
        doctor_phone: formData.doctor_phone,
        doctor_license_number: formData.doctor_license_number,
        appointment_id: formData.appointment_id ? Number(formData.appointment_id) : null,
        agency_id: formData.agency_id ? Number(formData.agency_id) : null,
        subtotal_amount: subtotal,
        items_total_discount_amount: itemsDiscountAmount,
        taxable_amount: taxableAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        cess_amount: cessAmount,
        overall_disc_percentage: formData.disc_percentage,
        overall_disc_amount: overallDiscAmount,
        overall_cess_percentage: 0,
        overall_cess_amount: 0,
        roundoff: formData.roundoff,
        final_amount: finalTotal,
        urgency: formData.urgency,
        status: formData.status,
        notes: formData.notes,
        tags: null,
        items: validItems
      };

      let response;
      if (editData?.id) {
        response = await diagnosticService.updateTestOrder(editData.id, orderData);
      } else {
        response = await diagnosticService.createTestOrder(orderData);
      }
      
      if (response.success) {
        onSave();
      } else {
        showToast('error', response.message || `Failed to ${editData?.id ? 'update' : 'create'} test order`);
      }
    } catch (error) {
      showToast('error', 'Failed to create test order');
    }
  };

  const { subtotal, itemsDiscountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, cessAmount, itemsTotal, overallDiscAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
        <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>Create Test Order</h2>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Number</label>
              <input
                type="text"
                name="test_order_number"
                value={formData.test_order_number}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Appointment</label>
              <SearchableDropdown
                options={appointments.map(apt => ({
                  value: apt.id.toString(),
                  label: apt.appointment_number || apt.id.toString()
                }))}
                value={formData.appointment_id}
                onChange={handleAppointmentChange}
                placeholder="Search appointment"
                multiple={false}
                searchable={true}
                onSearch={loadAppointments}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency <span className="text-xs text-gray-500">(Format: Phone | Name)</span></label>
              <SearchableDropdown
                options={agencyOptions}
                value={formData.agency_id}
                onChange={(value) => setFormData(prev => ({ ...prev, agency_id: value.toString() }))}
                onSearch={async (search) => {
                  const options = await loadAgencies(search);
                  setAgencyOptions(options);
                  return options;
                }}
                onAdd={async (inputValue) => {
                  const parts = inputValue.split('|').map(p => p.trim());
                  const phone = parts[0] || '';
                  const name = parts[1] || parts[0];
                  const response = await adminService.createAgency({ name, phone });
                  const newOption = { value: response.data.id.toString(), label: `${phone} | ${name}` };
                  setAgencyOptions(prev => [...prev, newOption]);
                  return newOption;
                }}
                placeholder="Search agency"
                multiple={false}
                searchable={true}
                allowAdd={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name *</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Phone</label>
              <input
                type="text"
                name="patient_phone"
                value={formData.patient_phone}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
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
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor Phone</label>
              <input
                type="text"
                name="doctor_phone"
                value={formData.doctor_phone}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor License</label>
              <input
                type="text"
                name="doctor_license_number"
                value={formData.doctor_license_number}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <SearchableDropdown
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'COMPLETED', label: 'Completed' },
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
              <SearchableDropdown
                options={[
                  { value: 'ROUTINE', label: 'Routine' },
                  { value: 'URGENT', label: 'Urgent' },
                  { value: 'STAT', label: 'Stat' },
                  { value: 'CRITICAL', label: 'Critical' }
                ]}
                value={formData.urgency}
                onChange={(value) => setFormData(prev => ({ ...prev, urgency: value.toString() }))}
                placeholder="Select urgency"
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
              .test-order-table { table-layout: fixed !important; }
              .test-order-table th:nth-child(1), .test-order-table td:nth-child(1) { width: 5% !important; }
              .test-order-table th:nth-child(2), .test-order-table td:nth-child(2) { width: 15% !important; }
              .test-order-table th:nth-child(3), .test-order-table td:nth-child(3) { width: 7% !important; }
              .test-order-table th:nth-child(4), .test-order-table td:nth-child(4) { width: 6% !important; }
              .test-order-table th:nth-child(5), .test-order-table td:nth-child(5) { width: 6% !important; }
              .test-order-table th:nth-child(6), .test-order-table td:nth-child(6) { width: 6% !important; }
              .test-order-table th:nth-child(7), .test-order-table td:nth-child(7) { width: 7% !important; }
              .test-order-table th:nth-child(8), .test-order-table td:nth-child(8) { width: 8% !important; }
              .test-order-table th:nth-child(9), .test-order-table td:nth-child(9) { width: 8% !important; }
              .test-order-table th:nth-child(10), .test-order-table td:nth-child(10) { width: 8% !important; }
              .test-order-table th:nth-child(11), .test-order-table td:nth-child(11) { width: 8% !important; }
              .test-order-table th:nth-child(12), .test-order-table td:nth-child(12) { width: 8% !important; }
              .test-order-table th:nth-child(13), .test-order-table td:nth-child(13) { width: 4% !important; }
            `}</style>
            <div className="overflow-x-auto">
              <table className="border border-gray-200 test-order-table" style={{ minWidth: '1200px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Panel</th>
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
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2 text-center" style={{ minWidth: '80px' }}>
                        <input
                          type="checkbox"
                          checked={item.is_panel}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index] = { ...newItems[index], is_panel: e.target.checked, test_id: 0, test_name: '', panel_id: 0, panel_name: '' };
                            setItems(newItems);
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2" style={{ minWidth: '180px' }}>
                        {item.is_panel ? (
                          <SearchableDropdown
                            options={panels.map(panel => ({
                              value: panel.id.toString(),
                              label: panel.name
                            }))}
                            value={item.panel_id.toString()}
                            onChange={(value) => handlePanelChange(index, value)}
                            placeholder="Select panel..."
                            multiple={false}
                            searchable={true}
                            className="w-full"
                          />
                        ) : (
                          <SearchableDropdown
                            options={tests.map(test => ({
                              value: test.id.toString(),
                              label: test.name
                            }))}
                            value={item.test_id.toString()}
                            onChange={(value) => handleTestChange(index, value)}
                            placeholder="Select test..."
                            multiple={false}
                            searchable={true}
                            className="w-full"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2 w-20">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.disc_percentage}
                          onChange={(e) => handleItemChange(index, 'disc_percentage', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.disc_amount.toFixed(2)}
                          onChange={(e) => {
                            const discAmount = parseFloat(e.target.value) || 0;
                            const discPercentage = item.rate > 0 ? (discAmount / item.rate) * 100 : 0;
                            handleItemChange(index, 'disc_percentage', discPercentage);
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2 w-20 text-sm text-center">{item.taxable_amount.toFixed(2)}</td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.cgst_rate + item.sgst_rate}
                          onChange={(e) => {
                            const totalGst = parseFloat(e.target.value) || 0;
                            handleItemChange(index, 'cgst_rate', totalGst / 2);
                            handleItemChange(index, 'sgst_rate', totalGst / 2);
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 w-20 text-sm text-center">{(item.cgst_amount + item.sgst_amount + item.igst_amount).toFixed(2)}</td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.cess_rate}
                          onChange={(e) => handleItemChange(index, 'cess_rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 w-20 text-sm text-center">{item.cess_amount.toFixed(2)}</td>
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
            <div className="w-full md:w-1/2 erp-summary-container">
              <h4 className="font-semibold" style={{ marginBottom: 'var(--erp-spacing-lg)' }}>Order Summary</h4>
              <div>
                <div className="erp-summary-row">
                  <span className="erp-summary-label">Subtotal:</span>
                  <span className="erp-summary-value">{subtotal.toFixed(2)}</span>
                </div>
                <div className="erp-summary-row">
                  <span className="erp-summary-label">Discount %:</span>
                  <input
                    type="number"
                    name="disc_percentage"
                    value={formData.disc_percentage}
                    onChange={handleInputChange}
                    className="erp-summary-input"
                    step="0.1"
                  />
                </div>
                <div className="erp-summary-row">
                  <span className="erp-summary-label">Discount Amount:</span>
                  <input
                    type="number"
                    name="disc_amount"
                    value={overallDiscAmount.toFixed(2)}
                    onChange={handleInputChange}
                    className="erp-summary-input"
                    step="0.01"
                  />
                </div>
                <div className="erp-summary-row">
                  <span className="erp-summary-label">Round Off:</span>
                  <input
                    type="number"
                    name="roundoff"
                    value={formData.roundoff}
                    onChange={handleInputChange}
                    className="erp-summary-input"
                    step="0.01"
                  />
                </div>
                <div className="erp-summary-row erp-summary-total">
                  <span className="erp-summary-label">Total:</span>
                  <span className="erp-summary-value">{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)', marginTop: 'var(--erp-spacing-xl)' }}>
            <button
              type="button"
              onClick={onCancel}
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

export default TestOrderForm;
