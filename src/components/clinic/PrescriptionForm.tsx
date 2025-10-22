import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { clinicService, inventoryService, careService } from '../../services/api';
import { Prescription, Patient, Doctor, Product, PrescriptionItem, Appointment, Test } from '../../types';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';

interface PrescriptionFormProps {
  prescription?: Prescription;
  onSave: (prescriptionData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ 
  prescription, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const [patientOptions, setPatientOptions] = useState<{value: string, label: string}[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{value: string, label: string}[]>([]);
  const [appointmentOptions, setAppointmentOptions] = useState<{value: string, label: string}[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const generateRXNumber = () => {
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
    return `RX-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    prescription_number: prescription?.prescription_number || generateRXNumber(),
    appointment_id: prescription?.appointment_id || '',
    patient_id: prescription?.patient_id || '',
    doctor_id: prescription?.doctor_id || '',
    prescription_date: prescription?.prescription_date || new Date().toISOString().split('T')[0],
    instructions: prescription?.instructions || ''
  });
  const [items, setItems] = useState<PrescriptionItem[]>(
    prescription?.items || [{ product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]
  );
  const [testItems, setTestItems] = useState<any[]>(
    prescription?.test_items || []
  );
  const [tests, setTests] = useState<Test[]>([]);
  const [existingPrescription, setExistingPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (resetForm && !prescription) {
      setFormData({
        prescription_number: generateRXNumber(),
        appointment_id: '',
        patient_id: '',
        doctor_id: '',
        prescription_date: new Date().toISOString().split('T')[0],
        instructions: ''
      });
      setItems([{ product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]);
      setTestItems([]);
    } else if (prescription) {
      setFormData({
        prescription_number: prescription.prescription_number,
        appointment_id: prescription.appointment_id || '',
        patient_id: prescription.patient_id,
        doctor_id: prescription.doctor_id,
        prescription_date: prescription.prescription_date,
        instructions: prescription.instructions || ''
      });
      setItems(prescription.items || [{ product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]);
      setTestItems(prescription.test_items || []);
    }
  }, [prescription, resetForm]);

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

  const loadDropdownData = async () => {
    try {
      const [productsRes, testsRes] = await Promise.all([
        inventoryService.getProducts(),
        careService.getTests()
      ]);
      setProducts(productsRes.data);
      setTests(testsRes.data);
      loadPatients('');
      loadDoctors('');
      loadAppointments('');
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => item.product_id && item.product_id > 0);
    const validTestItems = testItems.filter(item => item.test_id && item.test_id > 0);
    
    const submitData = {
      ...(existingPrescription && { id: existingPrescription.id }),
      prescription_number: formData.prescription_number,
      appointment_id: formData.appointment_id ? parseInt(formData.appointment_id.toString()) : null,
      patient_id: parseInt(formData.patient_id.toString()),
      doctor_id: parseInt(formData.doctor_id.toString()),
      prescription_date: formData.prescription_date,
      instructions: formData.instructions,
      items: validItems,
      test_items: validTestItems,
      tenant_id: 1
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // If product_id is being changed, also update product_name
        if (field === 'product_id' && value) {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.product_name = product.name;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleTestItemChange = (index: number, field: string, value: string | number) => {
    setTestItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'test_id' && value) {
          const test = tests.find(t => t.id === value);
          if (test) {
            updatedItem.test_name = test.name;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addTestItem = () => {
    setTestItems(prev => [...prev, { test_id: 0, instructions: '' }]);
  };

  const removeTestItem = (index: number) => {
    setTestItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {prescription ? 'Edit Prescription' : 'Create New Prescription'}
        </h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                RX Number
              </label>
              <input
                type="text"
                name="prescription_number"
                value={formData.prescription_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none font-mono text-xs"
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
                      prescription_number: generateRXNumber(),
                      appointment_id: '',
                      patient_id: '',
                      doctor_id: '',
                      prescription_date: new Date().toISOString().split('T')[0],
                      instructions: ''
                    });
                    setItems([{ product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]);
                    setTestItems([]);
                    setExistingPrescription(null);
                    return;
                  }

                  try {
                    const appointmentResponse = await clinicService.getAppointment(parseInt(value as string));
                    const appointment = appointmentResponse.data;
                    
                    // Check if prescription exists for this appointment
                    let existingPrescriptionData: Prescription | null = null;
                    try {
                      const prescriptions = await clinicService.getPrescriptions({ per_page: 100 });
                      existingPrescriptionData = prescriptions.data.find(p => p.appointment_id === appointment.appointment_number || p.appointment_id === appointment.id) || null;
                      if (existingPrescriptionData) {
                        const fullPrescription = await clinicService.getPrescription(existingPrescriptionData.id);
                        existingPrescriptionData = fullPrescription.data;
                        console.log('Found existing prescription:', existingPrescriptionData);
                      }
                    } catch (error) {
                      console.log('No existing prescription found for appointment:', value);
                    }

                    if (existingPrescriptionData) {
                      setFormData({
                        prescription_number: existingPrescriptionData.prescription_number,
                        appointment_id: value as string,
                        patient_id: appointment.patient_id.toString(),
                        doctor_id: appointment.doctor_id.toString(),
                        prescription_date: existingPrescriptionData.prescription_date,
                        instructions: existingPrescriptionData.instructions || ''
                      });
                      
                      // Load prescription items and ensure product options are available
                      const itemsWithProducts = existingPrescriptionData.items || [];
                      setItems(itemsWithProducts.length > 0 ? itemsWithProducts : [{ product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]);
                      setTestItems(existingPrescriptionData.test_items || []);
                      
                      // Ensure all products used in items are in the products list
                      for (const item of itemsWithProducts) {
                        if (item.product_id && !products.find(p => p.id === item.product_id)) {
                          try {
                            const productResponse = await inventoryService.getProducts({ search: item.product_name || '', per_page: 1 });
                            if (productResponse.data.length > 0) {
                              setProducts(prev => [...prev, productResponse.data[0]]);
                            }
                          } catch (error) {
                            console.error('Error loading product for item:', error);
                          }
                        }
                      }
                      
                      setExistingPrescription(existingPrescriptionData);
                    } else {
                      setFormData({
                        prescription_number: generateRXNumber(),
                        appointment_id: value as string,
                        patient_id: appointment.patient_id.toString(),
                        doctor_id: appointment.doctor_id.toString(),
                        prescription_date: appointment.appointment_date,
                        instructions: ''
                      });
                      setItems([{ product_id: 0, dosage: '', frequency: '', duration: '', instructions: '' }]);
                      setTestItems([]);
                      setExistingPrescription(null);
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
                Date *
              </label>
              <DatePicker
                value={formData.prescription_date}
                onChange={(value) => setFormData(prev => ({ ...prev, prescription_date: value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <input
                type="text"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Prescription Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 p-3 border border-gray-200 rounded">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Medicine/Product *
                    </label>
                    <SearchableDropdown
                      options={products.map(product => ({
                        value: product.id,
                        label: product.name
                      }))}
                      value={item.product_id || ''}
                      onChange={(value) => handleItemChange(index, 'product_id', parseInt(value as string))}
                      placeholder="Select Product"
                      onSearch={async (searchTerm) => {
                        try {
                          const response = await inventoryService.getProducts({ search: searchTerm, per_page: 20 });
                          return response.data.map(product => ({
                            value: product.id,
                            label: product.name
                          }));
                        } catch (error) {
                          return [];
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                      placeholder="e.g., 3 times daily"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                      placeholder="Additional notes"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Prescribed Tests</h3>
              <button
                type="button"
                onClick={addTestItem}
                className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Test
              </button>
            </div>

            {testItems.length > 0 && (
              <div className="space-y-2">
                {testItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 border border-gray-200 rounded">
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Test *
                      </label>
                      <SearchableDropdown
                        options={tests.map(test => ({
                          value: test.id,
                          label: test.name
                        }))}
                        value={item.test_id || ''}
                        onChange={(value) => handleTestItemChange(index, 'test_id', parseInt(value as string))}
                        placeholder="Select Test"
                        onSearch={async (searchTerm) => {
                          try {
                            const response = await careService.getTests({ search: searchTerm, per_page: 20 });
                            return response.data.map(test => ({
                              value: test.id,
                              label: test.name
                            }));
                          } catch (error) {
                            return [];
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={item.instructions || ''}
                        onChange={(e) => handleTestItemChange(index, 'instructions', e.target.value)}
                        placeholder="Additional notes"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-end lg:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeTestItem(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
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
              {existingPrescription ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PrescriptionForm;