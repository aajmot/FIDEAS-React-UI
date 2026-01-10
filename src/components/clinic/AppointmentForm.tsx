import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { clinicService, adminService } from '../../services/api';
import { Appointment, Patient, Doctor } from '../../types';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';

interface AppointmentFormProps {
  appointment?: Appointment;
  onSave: (appointmentData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  appointment, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const [patientOptions, setPatientOptions] = useState<{value: string, label: string}[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{value: string, label: string}[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<{value: string, label: string}[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const getDefaultTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const minutes = now.getMinutes();
    now.setMinutes(minutes >= 30 ? 30 : 0);
    return now.toTimeString().slice(0, 5);
  };

  const getDefaultDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = async () => {
    try {
      const response = await clinicService.exportAppointmentTemplate();
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appointments_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await clinicService.importAppointments(text);
    } catch (error) {
      console.error('Error importing appointments:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateAppointmentNumber = () => {
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
    return `APT-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    appointment_number: appointment?.appointment_number || generateAppointmentNumber(),
    patient_id: appointment?.patient_id || '',
    doctor_id: appointment?.doctor_id || '',
    agency_id: appointment?.agency_id || '',
    appointment_date: appointment?.appointment_date || getDefaultDate(),
    appointment_time: appointment?.appointment_time || getDefaultTime(),
    duration_minutes: appointment?.duration_minutes || 30,
    status: appointment?.status || 'SCHEDULED',
    reason: appointment?.reason || '',
    notes: appointment?.notes || ''
  });

  useEffect(() => {
    loadPatients('');
    loadDoctors('');
    loadAgencies('');
  }, []);

  useEffect(() => {
    if (resetForm && !appointment) {
      setFormData({
        appointment_number: generateAppointmentNumber(),
        patient_id: '',
        doctor_id: '',
        agency_id: '',
        appointment_date: getDefaultDate(),
        appointment_time: getDefaultTime(),
        duration_minutes: 30,
        status: 'SCHEDULED',
        reason: '',
        notes: ''
      });
    } else if (appointment) {
      // Handle time format - keep as HH:MM for time input
      let timeValue = appointment.appointment_time;
      if (appointment.appointment_time.includes('T')) {
        const date = new Date(appointment.appointment_time);
        timeValue = date.toTimeString().slice(0, 5);
      } else if (appointment.appointment_time.includes(':') && appointment.appointment_time.split(':').length === 3) {
        // If it's HH:MM:SS, convert to HH:MM
        timeValue = appointment.appointment_time.slice(0, 5);
      }
      
      setFormData({
        appointment_number: appointment.appointment_number || generateAppointmentNumber(),
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        agency_id: appointment.agency_id || '',
        appointment_date: appointment.appointment_date,
        appointment_time: timeValue,
        duration_minutes: appointment.duration_minutes || 30,
        status: appointment.status,
        reason: appointment.reason || '',
        notes: appointment.notes || ''
      });
    }
  }, [appointment, resetForm]);

  const loadPatients = async (search: string) => {
    try {
      setLoadingPatients(true);
      const response = await clinicService.getPatients({ search, per_page: 50 });
      const options = response.data.map((patient: Patient) => ({
        value: patient.id.toString(),
        label: `${patient.phone} | ${patient.first_name} ${patient.last_name}`
      }));
      setPatientOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading patients:', error);
      return [];
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadDoctors = async (search: string) => {
    try {
      setLoadingDoctors(true);
      const response = await clinicService.getDoctors({ search, per_page: 50 });
      const options = response.data.map((doctor: Doctor) => ({
        value: doctor.id.toString(),
        label: `${doctor.phone} | Dr. ${doctor.first_name} ${doctor.last_name}`
      }));
      setDoctorOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading doctors:', error);
      return [];
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadAgencies = async (search: string) => {
    try {
      const response = await adminService.getAgencies({ search, per_page: 50 });
      const options = response.data.map((agency: any) => ({
        value: agency.id.toString(),
        label: `${agency.phone} | ${agency.name}`
      }));
      setAgencyOptions(options);
      return options;
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
      
      setAgencyOptions(prev => [...prev, newAgency]);
      return newAgency;
    } catch (error) {
      console.error('Error creating agency:', error);
      throw error;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patient_id || !formData.doctor_id || !formData.appointment_date || !formData.appointment_time) {
      alert('Please fill in all required fields (Patient, Doctor, Date, Time)');
      return;
    }
    
    // Get patient and doctor details from options
    const selectedPatient = patientOptions.find(p => p.value === formData.patient_id.toString());
    const selectedDoctor = doctorOptions.find(d => d.value === formData.doctor_id.toString());
    const selectedAgency = agencyOptions.find(a => a.value === formData.agency_id.toString());
    
    // Parse patient info from label (format: "phone | name")
    const patientInfo = selectedPatient?.label.split(' | ') || [];
    const patientPhone = patientInfo[0] || '';
    const patientName = patientInfo[1] || '';
    
    // Parse doctor info from label (format: "phone | Dr. firstName lastName")
    const doctorInfo = selectedDoctor?.label.split(' | ') || [];
    const doctorPhone = doctorInfo[0] || '';
    const doctorFullName = doctorInfo[1]?.replace('Dr. ', '') || '';
    
    // Parse agency info from label (format: "phone | name")
    const agencyInfo = selectedAgency?.label.split(' | ') || [];
    const agencyPhone = agencyInfo[0] || '';
    const agencyName = agencyInfo[1] || '';
    
    // Convert time to HH:MM:SS format
    const timeWithSeconds = formData.appointment_time.includes(':') && formData.appointment_time.split(':').length === 2 
      ? `${formData.appointment_time}:00` 
      : formData.appointment_time;
    
    const submitData: any = {
      appointment_number: formData.appointment_number,
      appointment_date: formData.appointment_date,
      appointment_time: timeWithSeconds,
      duration_minutes: parseInt(formData.duration_minutes.toString()),
      patient_id: parseInt(formData.patient_id.toString()),
      patient_name: patientName,
      patient_phone: patientPhone,
      doctor_id: parseInt(formData.doctor_id.toString()),
      doctor_name: doctorFullName,
      doctor_phone: doctorPhone,
      doctor_license_number: '',
      doctor_specialization: '',
      status: formData.status.toUpperCase(),
      reason: formData.reason,
      notes: formData.notes
    };
    
    if (formData.agency_id) {
      submitData.agency_id = parseInt(formData.agency_id.toString());
      submitData.agency_name = agencyName;
      submitData.agency_phone = agencyPhone;
    }
    
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
        <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
          {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
        </h2>
        <div className="flex items-center" style={{ gap: 'var(--erp-spacing-sm)' }}>
          <button
            type="button"
            onClick={handleExportTemplate}
            className="erp-form-btn erp-btn-template"
          >
            <Download className="erp-form-btn-icon" />
            Template
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="erp-form-btn bg-green-600 text-white hover:bg-green-700"
          >
            <Upload className="erp-form-btn-icon" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--erp-spacing-lg)' }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Appointment Number
              </label>
              <input
                type="text"
                name="appointment_number"
                value={formData.appointment_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Patient *
              </label>
              <SearchableDropdown
                options={patientOptions}
                value={formData.patient_id.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, patient_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadPatients}
                placeholder="Search and select patient"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor *
              </label>
              <SearchableDropdown
                options={doctorOptions}
                value={formData.doctor_id.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, doctor_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadDoctors}
                placeholder="Search and select doctor"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date *
              </label>
              <DatePicker
                value={formData.appointment_date}
                onChange={(value) => setFormData(prev => ({ ...prev, appointment_date: value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time *
              </label>
              <input
                type="time"
                name="appointment_time"
                value={formData.appointment_time}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="15"
                max="240"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <SearchableDropdown
                options={[
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'NO_SHOW', label: 'No Show' }
                ]}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: Array.isArray(value) ? value[0].toString() : value.toString() }))}
                placeholder="Select status"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reason for Visit
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Agency <span className="text-xs text-gray-500">(Format: Phone | Name)</span>
              </label>
              <SearchableDropdown
                options={agencyOptions}
                value={formData.agency_id.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, agency_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadAgencies}
                placeholder="Search or add new (Phone | Name)"
                multiple={false}
                searchable={true}
                allowAdd={true}
                onAdd={handleAddAgency}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)', marginTop: 'var(--erp-spacing-lg)' }}>
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
              {appointment ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AppointmentForm;