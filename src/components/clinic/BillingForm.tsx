import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clinicService } from '../../services/api';
import { Invoice, Patient, Doctor, Appointment, BillingMaster } from '../../types';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';

interface BillingFormProps {
  invoice?: Invoice;
  onSave: (invoiceData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onAppointmentSelect?: (appointmentId: number) => void;
}

const BillingForm: React.FC<BillingFormProps> = ({ 
  invoice, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm,
  onAppointmentSelect
}) => {
  const [patientOptions, setPatientOptions] = useState<{value: string, label: string}[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{value: string, label: string}[]>([]);
  const [appointmentOptions, setAppointmentOptions] = useState<{value: string, label: string}[]>([]);
  const [billingMasters, setBillingMasters] = useState<BillingMaster[]>([]);
  const [billingAmounts, setBillingAmounts] = useState<{[key: number]: string}>({});
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);
  
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
    return `INV-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    invoice_number: invoice?.invoice_number || generateInvoiceNumber(),
    appointment_id: (invoice as any)?.appointment_id || '',
    patient_id: invoice?.patient_id || '',
    doctor_id: (invoice as any)?.doctor_id || '',
    visit_date: (invoice as any)?.visit_date || new Date().toISOString().split('T')[0],
    consultation_fee: invoice?.consultation_fee || 0,
    discount_percentage: invoice?.discount_percentage || 0,
    discount_amount: invoice?.discount_amount || 0,
    payment_method: invoice?.payment_method || 'cash',
    payment_status: invoice?.payment_status || 'paid'
  });

  useEffect(() => {
    loadPatients('');
    loadDoctors('');
    loadAppointments('');
    // Don't load billing masters initially - only when appointment is selected
  }, []);

  const loadBillingMasters = async () => {
    try {
      const response = await clinicService.getBillingMasters();
      const activeData = response.data.filter((item: BillingMaster) => item.is_active);
      setBillingMasters(activeData);
      
      // Initialize billing amounts with default values
      const initialAmounts: {[key: number]: string} = {};
      activeData.forEach((item: BillingMaster) => {
        initialAmounts[item.id] = item.amount.toString();
      });
      setBillingAmounts(initialAmounts);
    } catch (error) {
      console.error('Error loading billing masters:', error);
    }
  };

  useEffect(() => {
    if (resetForm && !invoice) {
      const newInvoiceNumber = generateInvoiceNumber();
      setFormData({
        invoice_number: newInvoiceNumber,
        appointment_id: '',
        patient_id: '',
        doctor_id: '',
        visit_date: new Date().toISOString().split('T')[0],
        consultation_fee: 0,
        discount_percentage: 0,
        discount_amount: 0,
        payment_method: 'cash',
        payment_status: 'paid'
      });
      setBillingMasters([]);
      setBillingAmounts({});
      setExistingInvoice(null);
    } else if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || generateInvoiceNumber(),
        appointment_id: (invoice as any).appointment_id?.toString() || '',
        patient_id: invoice.patient_id?.toString() || '',
        doctor_id: (invoice as any).doctor_id?.toString() || '',
        visit_date: (invoice as any).invoice_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        consultation_fee: invoice.consultation_fee || 0,
        discount_percentage: invoice.discount_percentage || 0,
        discount_amount: invoice.discount_amount || 0,
        payment_method: invoice.payment_method || 'cash',
        payment_status: invoice.payment_status || 'paid'
      });
      
      // Load billing masters and set amounts from existing invoice items
      loadBillingMasters().then(() => {
        if ((invoice as any).items) {
          const existingAmounts: {[key: number]: string} = {};
          (invoice as any).items.forEach((item: any) => {
            if (item.item_type !== 'consultation') {
              // Find matching billing master by description
              const matchingMaster = billingMasters.find(bm => bm.description === item.description);
              if (matchingMaster) {
                existingAmounts[matchingMaster.id] = item.unit_price.toString();
              }
            }
          });
          setBillingAmounts(prev => ({ ...prev, ...existingAmounts }));
        }
      });
    }
  }, [invoice, resetForm]);

  // Separate useEffect to handle invoice prop changes immediately
  useEffect(() => {
    if (invoice && invoice.invoice_number) {
      setFormData(prev => ({
        ...prev,
        invoice_number: invoice.invoice_number,
        consultation_fee: invoice.consultation_fee || prev.consultation_fee,
        discount_percentage: invoice.discount_percentage || prev.discount_percentage,
        discount_amount: invoice.discount_amount || prev.discount_amount,
        payment_method: invoice.payment_method || prev.payment_method,
        payment_status: invoice.payment_status || prev.payment_status
      }));
    }
  }, [invoice?.invoice_number, invoice?.consultation_fee, invoice?.discount_percentage, invoice?.discount_amount, invoice?.payment_method, invoice?.payment_status]);

  const loadPatients = async (search: string) => {
    try {
      const response = await clinicService.getPatients({ search, per_page: 50 });
      const options = response.data.map((patient: Patient) => ({
        value: patient.id.toString(),
        label: `${patient.first_name} ${patient.last_name}`
      }));
      setPatientOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading patients:', error);
      return [];
    }
  };

  const loadDoctors = async (search: string) => {
    try {
      const response = await clinicService.getDoctors({ search, per_page: 50 });
      const options = response.data.map((doctor: Doctor) => ({
        value: doctor.id.toString(),
        label: `Dr. ${doctor.first_name} ${doctor.last_name}`
      }));
      setDoctorOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading doctors:', error);
      return [];
    }
  };

  const loadAppointments = async (search: string) => {
    try {
      const response = await clinicService.getAppointments({ search, per_page: 50 });
      const options = response.data.map((appointment: Appointment) => ({
        value: appointment.id.toString(),
        label: `${appointment.appointment_number} - ${appointment.appointment_date}`
      }));
      setAppointmentOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  };

  const calculateSubtotal = () => {
    const billingMasterTotal = billingMasters.reduce((sum, item) => {
      const amount = parseFloat(billingAmounts[item.id]) || 0;
      return sum + amount;
    }, 0);
    return formData.consultation_fee + billingMasterTotal;
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * formData.discount_percentage) / 100;
  };

  const calculateFinalAmount = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const handleBillingAmountChange = (id: number, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBillingAmounts(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = calculateFinalAmount();
    
    if (total <= 0) {
      alert('Please enter at least one charge amount');
      return;
    }

    // Create invoice items based on charges
    const items = [];
    if (formData.consultation_fee > 0) {
      items.push({
        item_type: 'consultation',
        description: 'Medical Consultation',
        quantity: 1,
        unit_price: formData.consultation_fee,
        total_price: formData.consultation_fee
      });
    }

    // Add billing master charges as items
    billingMasters.forEach(master => {
      const amount = parseFloat(billingAmounts[master.id]) || 0;
      if (amount > 0) {
        items.push({
          item_type: 'service',
          description: master.description,
          quantity: 1,
          unit_price: amount,
          total_price: amount
        });
      }
    });

    
    const submitData = {
      ...(existingInvoice && { id: existingInvoice.id }),
      invoice_number: formData.invoice_number,
      appointment_id: formData.appointment_id ? parseInt(formData.appointment_id.toString()) : null,
      patient_id: parseInt(formData.patient_id.toString()),
      doctor_id: formData.doctor_id ? parseInt(formData.doctor_id.toString()) : null,
      visit_date: formData.visit_date,
      consultation_fee: formData.consultation_fee,
      total_amount: calculateSubtotal(),
      discount_percentage: formData.discount_percentage,
      discount_amount: formData.discount_amount,
      final_amount: calculateFinalAmount(),
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      items: items,
      tenant_id: 1
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('fee') || name.includes('amount') || name.includes('charges') || name.includes('percentage')
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleDiscountPercentChange = (value: number) => {
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * value) / 100;
    setFormData(prev => ({
      ...prev,
      discount_percentage: value,
      discount_amount: discountAmount
    }));
  };

  const handleDiscountAmountChange = (value: number) => {
    const subtotal = calculateSubtotal();
    const discountPercent = subtotal > 0 ? (value / subtotal) * 100 : 0;
    setFormData(prev => ({
      ...prev,
      discount_percentage: discountPercent,
      discount_amount: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
        <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-4" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Appointment
              </label>
              <SearchableDropdown
                options={appointmentOptions}
                value={formData.appointment_id.toString()}
                onChange={async (value) => {
                  if (!value) {
                    setFormData({
                      invoice_number: generateInvoiceNumber(),
                      appointment_id: '',
                      patient_id: '',
                      doctor_id: '',
                      visit_date: new Date().toISOString().split('T')[0],
                      consultation_fee: 0,
                      discount_percentage: 0,
                      discount_amount: 0,
                      payment_method: 'cash',
                      payment_status: 'paid'
                    });
                    setBillingMasters([]);
                    setBillingAmounts({});
                    setExistingInvoice(null);
                    return;
                  }

                  try {
                    const appointmentResponse = await clinicService.getAppointment(parseInt(value as string));
                    const appointment = appointmentResponse.data;
                    
                    // Check if invoice exists for this appointment
                    let existingInvoiceData: Invoice | null = null;
                    try {
                      const invoices = await clinicService.getInvoices();
                      existingInvoiceData = invoices.data.find(inv => 
                        (inv as any).appointment_number === appointment.appointment_number
                      ) || null;
                      if (existingInvoiceData) {
                        const fullInvoice = await clinicService.getInvoice(existingInvoiceData.id);
                        existingInvoiceData = fullInvoice.data;
                        console.log('Found existing invoice:', existingInvoiceData);
                      }
                    } catch (error) {
                      console.log('No existing invoice found for appointment:', value);
                    }
                    
                    // Get doctor's consultation fee
                    const doctorResponse = await clinicService.getDoctor(appointment.doctor_id);
                    const consultationFee = doctorResponse.data.consultation_fee || 0;
                    
                    if (existingInvoiceData) {
                      setFormData({
                        invoice_number: existingInvoiceData.invoice_number,
                        appointment_id: value as string,
                        patient_id: appointment.patient_id.toString(),
                        doctor_id: appointment.doctor_id.toString(),
                        visit_date: appointment.appointment_date,
                        consultation_fee: existingInvoiceData.consultation_fee || consultationFee,
                        discount_percentage: existingInvoiceData.discount_percentage || 0,
                        discount_amount: existingInvoiceData.discount_amount || 0,
                        payment_method: existingInvoiceData.payment_method || 'cash',
                        payment_status: existingInvoiceData.payment_status || 'paid'
                      });
                      setExistingInvoice(existingInvoiceData);
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        appointment_id: value as string,
                        patient_id: appointment.patient_id.toString(),
                        doctor_id: appointment.doctor_id.toString(),
                        visit_date: appointment.appointment_date,
                        consultation_fee: consultationFee,
                        discount_percentage: 0,
                        discount_amount: 0,
                        payment_method: 'cash',
                        payment_status: 'paid'
                      }));
                      setExistingInvoice(null);
                    }
                    
                    // Call parent callback to set editingInvoice
                    if (onAppointmentSelect) {
                      onAppointmentSelect(parseInt(value as string));
                    }
                    
                    // Load billing masters when appointment is selected
                    await loadBillingMasters();
                    
                    // If existing invoice found, populate billing amounts from invoice items after billing masters are loaded
                    if (existingInvoiceData && (existingInvoiceData as any).items) {
                      setTimeout(() => {
                        const existingAmounts: {[key: number]: string} = {};
                        (existingInvoiceData as any).items.forEach((item: any) => {
                          if (item.item_type !== 'consultation') {
                            // Find matching billing master by description
                            setBillingMasters(currentMasters => {
                              const matchingMaster = currentMasters.find(bm => bm.description === item.description);
                              if (matchingMaster) {
                                existingAmounts[matchingMaster.id] = item.unit_price.toString();
                              }
                              return currentMasters;
                            });
                          }
                        });
                        setBillingAmounts(prev => ({ ...prev, ...existingAmounts }));
                      }, 100);
                    }
                    
                    // Ensure appointment option is in the dropdown
                    const appointmentOption = {
                      value: appointment.id.toString(),
                      label: `${appointment.appointment_number} - ${appointment.appointment_date}`
                    };
                    setAppointmentOptions(prev => {
                      const exists = prev.find(opt => opt.value === appointment.id.toString());
                      return exists ? prev : [...prev, appointmentOption];
                    });
                    
                    // Ensure patient and doctor options are loaded
                    if (!patientOptions.find(p => p.value === appointment.patient_id.toString())) {
                      const patientResponse = await clinicService.getPatient(appointment.patient_id);
                      const patient = patientResponse.data;
                      const patientOption = {
                        value: patient.id.toString(),
                        label: `${patient.first_name} ${patient.last_name}`
                      };
                      setPatientOptions(prev => [...prev, patientOption]);
                    }
                    
                    if (!doctorOptions.find(d => d.value === appointment.doctor_id.toString())) {
                      const doctorResponse = await clinicService.getDoctor(appointment.doctor_id);
                      const doctor = doctorResponse.data;
                      const doctorOption = {
                        value: doctor.id.toString(),
                        label: `Dr. ${doctor.first_name} ${doctor.last_name}`
                      };
                      setDoctorOptions(prev => [...prev, doctorOption]);
                    }
                  } catch (error) {
                    console.error('Error loading appointment details:', error);
                  }
                }}
                placeholder="Select Appointment"
                onSearch={loadAppointments}
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Patient * <span className="text-xs text-gray-500">(Auto-filled)</span>
              </label>
              <SearchableDropdown
                options={patientOptions}
                value={formData.patient_id.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, patient_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadPatients}
                placeholder="Auto-filled from appointment"
                multiple={false}
                searchable={false}
                disabled={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor * <span className="text-xs text-gray-500">(Auto-filled)</span>
              </label>
              <SearchableDropdown
                options={doctorOptions}
                value={formData.doctor_id.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, doctor_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadDoctors}
                placeholder="Auto-filled from appointment"
                multiple={false}
                searchable={false}
                disabled={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visit Date * <span className="text-xs text-gray-500">(Auto-filled)</span>
              </label>
              <DatePicker
                value={formData.visit_date}
                onChange={(value) => setFormData(prev => ({ ...prev, visit_date: value }))}
                required
                className="w-full"
                disabled={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Consultation Fee
              </label>
              <input
                type="number"
                name="consultation_fee"
                value={formData.consultation_fee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>



            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <SearchableDropdown
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'insurance', label: 'Insurance' },
                  { value: 'cheque', label: 'Cheque' }
                ]}
                value={formData.payment_method}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as string }))}
                placeholder="Select Payment Method"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <SearchableDropdown
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'partial', label: 'Partial' }
                ]}
                value={formData.payment_status}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as string }))}
                placeholder="Select Payment Status"
                className="w-full"
              />
            </div>


          </div>

          {/* Additional Charges Section */}
          {billingMasters.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold">Additional Charges</h3>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-sm" style={{ minWidth: '600px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 border-b border-gray-200" style={{ minWidth: '150px' }}>Description</th>
                      <th className="px-2 py-2 text-center font-medium text-gray-700 border-b border-gray-200" style={{ minWidth: '80px' }}>HSN</th>
                      <th className="px-2 py-2 text-center font-medium text-gray-700 border-b border-gray-200" style={{ minWidth: '60px' }}>GST%</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 border-b border-gray-200" style={{ minWidth: '120px' }}>Note</th>
                      <th className="px-2 py-2 text-right font-medium text-gray-700 border-b border-gray-200" style={{ minWidth: '100px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingMasters.map((item, index) => (
                      <tr key={item.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                        <td className="px-2 py-2">{item.description}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{item.hsn_code || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{item.gst_percentage}%</td>
                        <td className="px-2 py-2 text-gray-600">{item.note || '-'}</td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="text"
                            value={billingAmounts[item.id] || ''}
                            onChange={(e) => handleBillingAmountChange(item.id, e.target.value)}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 text-right border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Order Summary Section */}
          <div className="flex flex-col md:flex-row justify-end mt-6">
            <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount %:</span>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount Amount:</span>
                  <input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Final Amount:</span>
                  <span>{calculateFinalAmount().toFixed(2)}</span>
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
{existingInvoice || invoice ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BillingForm;