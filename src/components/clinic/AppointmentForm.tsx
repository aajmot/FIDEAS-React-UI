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
    status: appointment?.status || 'scheduled',
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
        status: 'scheduled',
        reason: '',
        notes: ''
      });
    } else if (appointment) {
      setFormData({
        appointment_number: appointment.appointment_number || generateAppointmentNumber(),
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        agency_id: appointment.agency_id || '',
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
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
    
    const submitData: any = {
      appointment_number: formData.appointment_number,
      patient_id: parseInt(formData.patient_id.toString()),
      doctor_id: parseInt(formData.doctor_id.toString()),
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      duration_minutes: parseInt(formData.duration_minutes.toString()),
      status: formData.status,
      reason: formData.reason,
      notes: formData.notes,
      tenant_id: 1
    };
    
    if (formData.agency_id) {
      submitData.agency_id = parseInt(formData.agency_id.toString());
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
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportTemplate}
            className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="h-3 w-3 mr-1" />
            Template
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Upload className="h-3 w-3 mr-1" />
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
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'no-show', label: 'No Show' }
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
              {appointment ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AppointmentForm;