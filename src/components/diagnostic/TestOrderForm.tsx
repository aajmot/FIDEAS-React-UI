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
  gst: number;
  cess: number;
  disc_percentage: number;
  disc_amount: number;
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
    status: 'pending',
    urgency: 'normal',
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
    gst: 0,
    cess: 0,
    disc_percentage: 0,
    disc_amount: 0,
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
        status: 'pending',
        urgency: 'normal',
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
        gst: 0,
        cess: 0,
        disc_percentage: 0,
        disc_amount: 0,
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
          gst: item.gst || 0,
          cess: item.cess || 0,
          disc_percentage: item.disc_percentage || 0,
          disc_amount: item.disc_amount || 0,
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
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('percentage') || name === 'roundoff' ? parseFloat(value) || 0 : value
    }));
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
      gst: test?.gst || 0,
      cess: test?.cess || 0
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
      gst: panel?.gst || 0,
      cess: panel?.cess || 0
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
    const discountedAmount = baseAmount - discountAmount;
    const gstAmount = discountedAmount * (item.gst / 100);
    const cessAmount = discountedAmount * (item.cess / 100);
    const total = discountedAmount + gstAmount + cessAmount;

    itemsArray[index] = {
      ...item,
      disc_amount: discountAmount,
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
      gst: 0,
      cess: 0,
      disc_percentage: 0,
      disc_amount: 0,
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
    const discountAmount = subtotal * (formData.disc_percentage / 100);
    const finalTotal = subtotal - discountAmount + formData.roundoff;
    return { subtotal, discountAmount, finalTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_name) {
      showToast('error', 'Please select a patient');
      return;
    }

    const validItems = items.filter(item => (item.test_id > 0 || item.panel_id > 0)).map(item => ({
      test_id: item.test_id || null,
      test_name: item.test_name,
      panel_id: item.panel_id || null,
      panel_name: item.panel_name,
      rate: item.rate,
      gst: item.gst,
      cess: item.cess,
      disc_percentage: item.disc_percentage,
      disc_amount: item.disc_amount,
      total_amount: item.total_amount
    }));

    if (validItems.length === 0) {
      showToast('error', 'Please add at least one test or panel');
      return;
    }

    try {
      const { subtotal, discountAmount, finalTotal } = calculateTotals();
      
      const orderData = {
        test_order_number: formData.test_order_number,
        appointment_id: formData.appointment_id ? Number(formData.appointment_id) : null,
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone,
        doctor_name: formData.doctor_name,
        doctor_phone: formData.doctor_phone,
        doctor_license_number: formData.doctor_license_number,
        order_date: new Date(formData.order_date).toISOString(),
        status: formData.status,
        urgency: formData.urgency,
        notes: formData.notes,
        agency_id: formData.agency_id ? Number(formData.agency_id) : null,
        total_amount: subtotal,
        disc_percentage: formData.disc_percentage,
        disc_amount: discountAmount,
        roundoff: formData.roundoff,
        final_amount: finalTotal,
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

  const { subtotal, discountAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Create Test Order</h2>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
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
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
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
                  { value: 'normal', label: 'Normal' },
                  { value: 'urgent', label: 'Urgent' }
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
              .test-order-table th:nth-child(1), .test-order-table td:nth-child(1) { width: 8% !important; }
              .test-order-table th:nth-child(2), .test-order-table td:nth-child(2) { width: 25% !important; }
              .test-order-table th:nth-child(3), .test-order-table td:nth-child(3) { width: 12% !important; }
              .test-order-table th:nth-child(4), .test-order-table td:nth-child(4) { width: 10% !important; }
              .test-order-table th:nth-child(5), .test-order-table td:nth-child(5) { width: 10% !important; }
              .test-order-table th:nth-child(6), .test-order-table td:nth-child(6) { width: 10% !important; }
              .test-order-table th:nth-child(7), .test-order-table td:nth-child(7) { width: 15% !important; }
              .test-order-table th:nth-child(8), .test-order-table td:nth-child(8) { width: 10% !important; }
            `}</style>
            <div className="overflow-x-auto">
              <table className="border border-gray-200 test-order-table" style={{ minWidth: '800px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Is Panel</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ minWidth: '180px' }}>Test/Panel</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '70px' }}>Rate</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>GST%</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>CESS%</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Disc%</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '80px' }}>Total</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ minWidth: '60px' }}>Action</th>
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
                          value={item.gst}
                          onChange={(e) => handleItemChange(index, 'gst', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.cess}
                          onChange={(e) => handleItemChange(index, 'cess', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                          step="0.1"
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
                    name="disc_percentage"
                    value={formData.disc_percentage}
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
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
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
