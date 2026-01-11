import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import DateTimePicker from '../common/DateTimePicker';
import { appointmentService, billingService } from '../../services/modules/health';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';

interface AppointmentInvoiceFormProps {
  onSave: () => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm: boolean;
  editData?: any;
}

interface AppointmentOption {
  value: number;
  label: string;
}

interface BillingMasterOption {
  value: number;
  label: string;
  rate: number;
  hsn_code?: string;
}

interface InvoiceItem {
  line_no: number;
  billing_master_id: number | null;
  description: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  rate: number;
  disc_percentage: number;
  disc_amount: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  total_amount: number;
  remarks: string;
}

const AppointmentInvoiceForm: React.FC<AppointmentInvoiceFormProps> = ({
  onSave,
  onCancel,
  isCollapsed,
  onToggleCollapse,
  resetForm,
  editData
}) => {
  const { showToast } = useToast();
  const [appointmentOptions, setAppointmentOptions] = useState<AppointmentOption[]>([]);
  const [billingMasterOptions, setBillingMasterOptions] = useState<BillingMasterOption[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
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
    return `AINV-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  }, []);

  const [formData, setFormData] = useState(() => ({
    invoice_number: '',
    invoice_date: new Date().toISOString(),
    due_date: new Date().toISOString().split('T')[0],
    branch_id: null,
    appointment_id: '',
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    patient_address: '',
    patient_dob: null,
    patient_gender: '',
    doctor_id: '',
    doctor_name: '',
    doctor_phone: '',
    doctor_email: '',
    doctor_address: '',
    doctor_license_number: '',
    doctor_speciality: '',
    status: 'DRAFT',
    notes: '',
    tags: [] as string[]
  }));

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      loadAppointments();
      loadBillingMasters();
      if (!editData) {
        setFormData(prev => ({ ...prev, invoice_number: generateInvoiceNumber() }));
      }
      setIsInitialized(true);
    }
  }, [isInitialized, editData, generateInvoiceNumber]);

  useEffect(() => {
    if (editData) {
      setFormData({
        invoice_number: editData.invoice_number || generateInvoiceNumber(),
        invoice_date: editData.invoice_date || new Date().toISOString(),
        due_date: editData.due_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        branch_id: editData.branch_id || null,
        appointment_id: editData.appointment_id?.toString() || '',
        patient_id: editData.patient_id?.toString() || '',
        patient_name: editData.patient_name || '',
        patient_phone: editData.patient_phone || '',
        patient_email: editData.patient_email || '',
        patient_address: editData.patient_address || '',
        patient_dob: editData.patient_dob || null,
        patient_gender: editData.patient_gender || '',
        doctor_id: editData.doctor_id?.toString() || '',
        doctor_name: editData.doctor_name || '',
        doctor_phone: editData.doctor_phone || '',
        doctor_email: editData.doctor_email || '',
        doctor_address: editData.doctor_address || '',
        doctor_license_number: editData.doctor_license_number || '',
        doctor_speciality: editData.doctor_speciality || '',
        status: editData.status || 'DRAFT',
        notes: editData.notes || '',
        tags: editData.tags || []
      });
      
      if (editData.items) {
        setItems(editData.items);
      }
    }
  }, [editData, generateInvoiceNumber]);

  const loadAppointments = async () => {
    try {
      const response = await appointmentService.getAppointments({
        page: 1,
        per_page: 100,
        appointment_invoice_generated:false
      });
      const options = response.data.map((appointment: any) => ({
        value: appointment.id,
        //label: `${appointment.appointment_number || appointment.id} - ${appointment.patient_name} - ${appointment.doctor_name}`
        label: `${appointment.appointment_number}`
      }));
      setAppointmentOptions(options);
    } catch (error) {
      showToast('error', 'Failed to load appointments');
    }
  };

  const loadBillingMasters = async () => {
    try {
      const response = await billingService.getBillingMasters();
      const options = response.data.map((billing: any) => ({
        value: billing.id,
        label: billing.description,
        rate: billing.amount || billing.rate || 0,
        hsn_code: billing.hsn_code || ''
      }));
      setBillingMasterOptions(options);
    } catch (error) {
      showToast('error', 'Failed to load billing masters');
    }
  };

  const loadAppointmentDetails = async (appointmentId: number) => {
    try {
      const response = await appointmentService.getAppointment(appointmentId);
      const appointment = response.data;
      setSelectedAppointment(appointment);
      
      // Load patient details
      let patientData: any = {};
      if (appointment.patient_id) {
        try {
          const patientResponse = await apiClient.get(`/api/v1/health/patients/${appointment.patient_id}`);
          patientData = patientResponse.data;
          console.log('Patient data:', patientData); // Debug log
        } catch (error) {
          console.error('Failed to load patient details:', error);
        }
      }
      
      // Load doctor details
      let doctorData: any = {};
      if (appointment.doctor_id) {
        try {
          const doctorResponse = await apiClient.get(`/api/v1/health/doctors/${appointment.doctor_id}`);
          doctorData = doctorResponse.data;
        } catch (error) {
          console.error('Failed to load doctor details:', error);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        appointment_id: appointmentId.toString(),
        patient_id: appointment.patient_id?.toString() || '',
        patient_name: `${patientData.data?.first_name || ''} ${patientData.data?.last_name || ''}`.trim() || patientData.name || appointment.patient_name || '',
        patient_phone: patientData.data?.phone || patientData.phone || appointment.patient_phone || '',
        patient_email: patientData.data?.email || patientData.email || appointment.patient_email || '',
        patient_address: patientData.data?.address || patientData.address || appointment.patient_address || '',
        patient_dob: patientData.data?.date_of_birth || patientData.date_of_birth || patientData.dob || appointment.patient_dob || null,
        patient_gender: patientData.data?.gender || patientData.gender || appointment.patient_gender || '',
        doctor_id: appointment.doctor_id?.toString() || '',
        doctor_name: `${doctorData.data?.first_name || ''} ${doctorData.data?.last_name || ''}`.trim() || doctorData.name || appointment.doctor_name || '',
        doctor_phone: doctorData.data?.phone || doctorData.phone || appointment.doctor_phone || '',
        doctor_email: doctorData.data?.email || doctorData.email || appointment.doctor_email || '',
        doctor_address: doctorData.data?.address || doctorData.address || appointment.doctor_address || '',
        doctor_license_number: doctorData.data?.license_number || doctorData.license_number || appointment.doctor_license_number || '',
        doctor_speciality: doctorData.data?.specialization || doctorData.specialization || appointment.doctor_specialization || appointment.doctor_speciality || ''
      }));

      // Add doctor consultation fee as first item
      if (doctorData.data?.consultation_fee && doctorData.data.consultation_fee > 0) {
        const doctorFeeItem: InvoiceItem = {
          line_no: 1,
          billing_master_id: null,
          description: `Consultation Fee - Dr. ${`${doctorData.data?.first_name || ''} ${doctorData.data?.last_name || ''}`.trim() || appointment.doctor_name}`,
          hsn_code: '998314',
          quantity: 1,
          unit_price: doctorData.data.consultation_fee,
          rate: doctorData.data.consultation_fee,
          disc_percentage: 0,
          disc_amount: 0,
          taxable_amount: doctorData.data.consultation_fee,
          cgst_rate: 0,
          cgst_amount: 0,
          sgst_rate: 0,
          sgst_amount: 0,
          igst_rate: 0,
          igst_amount: 0,
          cess_rate: 0,
          cess_amount: 0,
          total_amount: doctorData.data.consultation_fee,
          remarks: 'Doctor consultation fee'
        };
        setItems([doctorFeeItem]);
      }
    } catch (error) {
      showToast('error', 'Failed to load appointment details');
    }
  };

  const resetFormData = useCallback(() => {
    setFormData({
      invoice_number: generateInvoiceNumber(),
      invoice_date: new Date().toISOString(),
      due_date: new Date().toISOString().split('T')[0],
      branch_id: null,
      appointment_id: '',
      patient_id: '',
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      patient_address: '',
      patient_dob: null,
      patient_gender: '',
      doctor_id: '',
      doctor_name: '',
      doctor_phone: '',
      doctor_email: '',
      doctor_address: '',
      doctor_license_number: '',
      doctor_speciality: '',
      status: 'DRAFT',
      notes: '',
      tags: []
    });
    setSelectedAppointment(null);
    setItems([]);
  }, [generateInvoiceNumber]);

  const handleAppointmentChange = async (value: string | number | (string | number)[]) => {
    const appointmentId = value as number;
    if (!appointmentId || appointmentId === 0) {
      resetFormData();
      return;
    }
    await loadAppointmentDetails(appointmentId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      line_no: items.length + 1,
      billing_master_id: null,
      description: '',
      hsn_code: '',
      quantity: 1,
      unit_price: 0,
      rate: 0,
      disc_percentage: 0,
      disc_amount: 0,
      taxable_amount: 0,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: 0,
      igst_amount: 0,
      cess_rate: 0,
      cess_amount: 0,
      total_amount: 0,
      remarks: ''
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // Renumber line_no
    updatedItems.forEach((item, i) => {
      item.line_no = i + 1;
    });
    setItems(updatedItems);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If billing master is selected, update description and rate
    if (field === 'billing_master_id' && value && value > 0) {
      const billingMaster = billingMasterOptions.find(b => b.value === value);
      if (billingMaster) {
        updatedItems[index].description = billingMaster.label;
        updatedItems[index].rate = billingMaster.rate;
        updatedItems[index].unit_price = billingMaster.rate;
        updatedItems[index].hsn_code = billingMaster.hsn_code || '';
      }
    }

    // Convert billing_master_id 0 to null for API
    if (field === 'billing_master_id' && value === 0) {
      updatedItems[index].billing_master_id = null;
    }

    // Recalculate amounts
    const item = updatedItems[index];
    const lineTotal = item.quantity * item.rate;
    item.disc_amount = 0;
    item.taxable_amount = lineTotal;
    item.total_amount = item.taxable_amount;

    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const itemsDiscountAmount = items.reduce((sum, item) => sum + item.disc_amount, 0);
    const taxableAmount = subtotal - itemsDiscountAmount;
    const finalTotal = taxableAmount;
    
    return { 
      subtotal, 
      itemsDiscountAmount, 
      taxableAmount, 
      cgstAmount: 0, 
      sgstAmount: 0, 
      igstAmount: 0, 
      cessAmount: 0, 
      overallDiscAmount: 0, 
      roundoff: 0, 
      finalTotal 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editData && (!formData.appointment_id || !selectedAppointment)) {
      showToast('error', 'Please select an appointment');
      return;
    }

    if (items.length === 0) {
      showToast('error', 'Please add at least one item');
      return;
    }

    try {
      const totals = calculateTotals();
      let payload;
      
      if (editData?.id) {
        // Edit mode - only send editable fields
        payload = {
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          status: formData.status,
          notes: formData.notes,
          items: items
        };
        await apiClient.put(`/api/v1/health/appointment-invoices/${editData.id}`, payload);
      } else {
        // Create mode - send all fields
        payload = {
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          branch_id: formData.branch_id,
          appointment_id: parseInt(formData.appointment_id),
          patient_id: parseInt(formData.patient_id),
          patient_name: formData.patient_name,
          patient_phone: formData.patient_phone,
          patient_email: formData.patient_email,
          patient_address: formData.patient_address,
          patient_dob: formData.patient_dob,
          patient_gender: formData.patient_gender,
          doctor_id: parseInt(formData.doctor_id),
          doctor_name: formData.doctor_name,
          doctor_phone: formData.doctor_phone,
          doctor_email: formData.doctor_email,
          doctor_address: formData.doctor_address,
          doctor_license_number: formData.doctor_license_number,
          doctor_speciality: formData.doctor_speciality,
          subtotal_amount: totals.subtotal,
          items_total_discount_amount: totals.itemsDiscountAmount,
          taxable_amount: totals.taxableAmount,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          cess_amount: 0,
          overall_disc_percentage: 0,
          overall_disc_amount: 0,
          roundoff: 0,
          final_amount: totals.finalTotal,
          status: formData.status,
          notes: formData.notes,
          tags: formData.tags,
          items: items
        };
        await apiClient.post('/api/v1/health/appointment-invoices', payload);
      }
      showToast('success', 'Appointment invoice created successfully');
      onSave();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save appointment invoice');
    }
  };

  const handleCancelClick = () => {
    resetFormData();
    onCancel();
  };

  const { subtotal, itemsDiscountAmount, taxableAmount, finalTotal } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
        <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>Create Appointment Invoice</h2>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
              <DateTimePicker
                value={formData.invoice_date.slice(0, 16)}
                onChange={(value) => setFormData(prev => ({ ...prev, invoice_date: new Date(value).toISOString() }))}
                placeholder="Select invoice date"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Appointment *</label>
              <SearchableDropdown
                options={appointmentOptions}
                value={formData.appointment_id ? parseInt(formData.appointment_id) : ''}
                onChange={handleAppointmentChange}
                placeholder="Search appointment"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name</label>
              <input
                type="text"
                value={formData.patient_name}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patient Phone</label>
              <input
                type="text"
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
                value={formData.doctor_name}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Doctor Phone</label>
              <input
                type="text"
                value={formData.doctor_phone}
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



          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold">Invoice Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="erp-form-btn text-white bg-primary hover:bg-secondary"
            >
              <Plus className="erp-form-btn-icon" />
              Add Item
            </button>
          </div>

          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '1000px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Description</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Amount</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Total</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        {(item.billing_master_id === null || item.billing_master_id === 0) && !item.description.includes('Consultation Fee') ? (
                          <SearchableDropdown
                            options={[{ value: 0, label: 'Custom Item' }, ...billingMasterOptions]}
                            value={item.billing_master_id === null ? 0 : item.billing_master_id}
                            onChange={(value) => updateItem(index, 'billing_master_id', value)}
                            placeholder="Select billing item"
                            multiple={false}
                            searchable={true}
                          />
                        ) : (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full px-1 py-1 text-sm border border-gray-300 rounded"
                            readOnly={item.description.includes('Consultation Fee')}
                            placeholder="Enter description"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 text-sm border border-gray-300 rounded text-center"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-2 text-sm text-center">{item.total_amount.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
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
              onClick={handleCancelClick}
              className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="erp-form-btn text-white bg-primary hover:bg-secondary"
            >
              {editData ? 'Update Invoice' : 'Create Appointment Invoice'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AppointmentInvoiceForm;