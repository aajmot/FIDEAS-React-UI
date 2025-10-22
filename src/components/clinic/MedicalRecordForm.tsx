import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { clinicService } from '../../services/api';
import { MedicalRecord, Patient, Doctor, Appointment } from '../../types';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';

interface MedicalRecordFormProps {
  record?: MedicalRecord;
  onSave: (recordData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({ 
  record, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const [patientOptions, setPatientOptions] = useState<{value: string, label: string}[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{value: string, label: string}[]>([]);
  const [appointmentOptions, setAppointmentOptions] = useState<{value: string, label: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateRecordNumber = () => {
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
    return `MR-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState({
    record_number: record?.record_number || generateRecordNumber(),
    appointment_id: record?.appointment_id || '',
    patient_id: record?.patient_id || '',
    doctor_id: record?.doctor_id || '',
    visit_date: record?.visit_date || new Date().toISOString().split('T')[0],
    chief_complaint: record?.chief_complaint || '',
    diagnosis: record?.diagnosis || '',
    treatment_plan: record?.treatment_plan || '',
    bp: '',
    temp: '',
    pulse: '',
    weight: '',
    lab_results: record?.lab_results || '',
    notes: record?.notes || ''
  });
  const [existingRecord, setExistingRecord] = useState<MedicalRecord | null>(null);
  const [isReadonly, setIsReadonly] = useState(true);

  useEffect(() => {
    loadPatients('');
    loadDoctors('');
    loadAppointments('');
  }, []);

  useEffect(() => {
    if (resetForm && !record) {
      setFormData({
        record_number: generateRecordNumber(),
        appointment_id: '',
        patient_id: '',
        doctor_id: '',
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: '',
        diagnosis: '',
        treatment_plan: '',
        bp: '',
        temp: '',
        pulse: '',
        weight: '',
        lab_results: '',
        notes: ''
      });
      setExistingRecord(null);
      setIsReadonly(true);
    } else if (record) {
      // Parse vital signs if available
      let vitals = { bp: '', temp: '', pulse: '', weight: '' };
      if (record.vital_signs) {
        try {
          vitals = JSON.parse(record.vital_signs);
        } catch (e) {
          // If parsing fails, keep empty values
        }
      }
      
      // Load appointment and get patient/doctor from it
      if (record.appointment_id) {
        clinicService.getAppointment(record.appointment_id).then(response => {
          const appointment = response.data;
          
          setFormData({
            record_number: record.record_number || generateRecordNumber(),
            appointment_id: record.appointment_id!.toString(),
            patient_id: appointment.patient_id.toString(),
            doctor_id: appointment.doctor_id.toString(),
            visit_date: record.visit_date,
            chief_complaint: record.chief_complaint || '',
            diagnosis: record.diagnosis || '',
            treatment_plan: record.treatment_plan || '',
            bp: vitals.bp || '',
            temp: vitals.temp || '',
            pulse: vitals.pulse || '',
            weight: vitals.weight || '',
            lab_results: record.lab_results || '',
            notes: record.notes || ''
          });
          
          // Ensure appointment option is in the dropdown
          const appointmentOption = {
            value: appointment.id.toString(),
            label: `${appointment.appointment_number} - ${appointment.appointment_date}`
          };
          setAppointmentOptions(prev => {
            const exists = prev.find(opt => opt.value === appointment.id.toString());
            return exists ? prev : [...prev, appointmentOption];
          });
          
          // Ensure patient option is in the dropdown
          const patientOption = {
            value: appointment.patient_id.toString(),
            label: appointment.patient_name
          };
          setPatientOptions(prev => {
            const exists = prev.find(opt => opt.value === appointment.patient_id.toString());
            return exists ? prev : [...prev, patientOption];
          });
          
          // Ensure doctor option is in the dropdown
          const doctorOption = {
            value: appointment.doctor_id.toString(),
            label: appointment.doctor_name
          };
          setDoctorOptions(prev => {
            const exists = prev.find(opt => opt.value === appointment.doctor_id.toString());
            return exists ? prev : [...prev, doctorOption];
          });
        });
      }
      setExistingRecord(record);
      setIsReadonly(true);
    }
  }, [record, resetForm]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.appointment_id) {
      alert('Please select an appointment');
      return;
    }
    if (!formData.patient_id) {
      alert('Patient is required');
      return;
    }
    if (!formData.doctor_id) {
      alert('Doctor is required');
      return;
    }
    
    const vitalSigns = JSON.stringify({
      bp: formData.bp,
      temp: formData.temp,
      pulse: formData.pulse,
      weight: formData.weight
    });
    
    const submitData = {
      record_number: formData.record_number,
      appointment_id: parseInt(formData.appointment_id.toString()),
      visit_date: formData.visit_date,
      chief_complaint: formData.chief_complaint,
      diagnosis: formData.diagnosis,
      treatment_plan: formData.treatment_plan,
      vital_signs: vitalSigns,
      lab_results: formData.lab_results,
      notes: formData.notes,
      tenant_id: 1
    };
    
    if (existingRecord) {
      // Update existing record
      try {
        await clinicService.updateMedicalRecord(existingRecord.id, submitData);
        onSave({ ...submitData, id: existingRecord.id });
      } catch (error) {
        console.error('Error updating medical record:', error);
        alert('Error updating medical record. Please try again.');
      }
    } else {
      // Create new record
      onSave(submitData);
    }
  };

  const handleAppointmentChange = async (appointmentId: string) => {
    if (!appointmentId) {
      setFormData({
        record_number: generateRecordNumber(),
        appointment_id: '',
        patient_id: '',
        doctor_id: '',
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: '',
        diagnosis: '',
        treatment_plan: '',
        bp: '',
        temp: '',
        pulse: '',
        weight: '',
        lab_results: '',
        notes: ''
      });
      setExistingRecord(null);
      setIsReadonly(true);
      return;
    }

    try {
      // Get appointment details
      const appointmentResponse = await clinicService.getAppointment(parseInt(appointmentId));
      const appointment = appointmentResponse.data;
      
      // Check if medical record exists for this appointment
      let existingMedicalRecord: MedicalRecord | null = null;
      try {
        const medicalRecordResponse = await clinicService.getMedicalRecordByAppointment(parseInt(appointmentId));
        existingMedicalRecord = medicalRecordResponse.data;
        console.log('Found existing medical record:', existingMedicalRecord);
      } catch (error) {
        // No existing record found, which is fine
        console.log('No existing medical record found for appointment:', appointmentId);
      }

      if (existingMedicalRecord) {
        // Parse vital signs if available
        let vitals = { bp: '', temp: '', pulse: '', weight: '' };
        if (existingMedicalRecord.vital_signs) {
          try {
            vitals = JSON.parse(existingMedicalRecord.vital_signs);
          } catch (e) {
            // If parsing fails, keep empty values
          }
        }
        
        setFormData({
          record_number: existingMedicalRecord.record_number || generateRecordNumber(),
          appointment_id: appointmentId,
          patient_id: appointment.patient_id.toString(),
          doctor_id: appointment.doctor_id.toString(),
          visit_date: existingMedicalRecord.visit_date,
          chief_complaint: existingMedicalRecord.chief_complaint || '',
          diagnosis: existingMedicalRecord.diagnosis || '',
          treatment_plan: existingMedicalRecord.treatment_plan || '',
          bp: vitals.bp || '',
          temp: vitals.temp || '',
          pulse: vitals.pulse || '',
          weight: vitals.weight || '',
          lab_results: existingMedicalRecord.lab_results || '',
          notes: existingMedicalRecord.notes || ''
        });
        setExistingRecord(existingMedicalRecord);
      } else {
        // No existing record, create new one
        setFormData({
          record_number: generateRecordNumber(),
          appointment_id: appointmentId,
          patient_id: appointment.patient_id.toString(),
          doctor_id: appointment.doctor_id.toString(),
          visit_date: appointment.appointment_date,
          chief_complaint: '',
          diagnosis: '',
          treatment_plan: '',
          bp: '',
          temp: '',
          pulse: '',
          weight: '',
          lab_results: '',
          notes: ''
        });
        setExistingRecord(null);
      }
      setIsReadonly(true);
      
      // Ensure doctor and patient options are loaded with selected values
      if (appointment.patient_id && !patientOptions.find(p => p.value === appointment.patient_id.toString())) {
        const patientResponse = await clinicService.getPatient(appointment.patient_id);
        const patient = patientResponse.data;
        const patientOption = {
          value: patient.id.toString(),
          label: `${patient.first_name} ${patient.last_name}`
        };
        setPatientOptions(prev => [...prev, patientOption]);
      }
      
      if (appointment.doctor_id && !doctorOptions.find(d => d.value === appointment.doctor_id.toString())) {
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExportTemplate = async () => {
    try {
      const response = await clinicService.exportMedicalRecordTemplate();
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medical_records_import_template.csv';
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
      await clinicService.importMedicalRecords(text);
    } catch (error) {
      console.error('Error importing medical records:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {record ? 'Edit Medical Record' : 'Create New Medical Record'}
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
                Record Number
              </label>
              <input
                type="text"
                name="record_number"
                value={formData.record_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Appointment *
              </label>
              <SearchableDropdown
                options={appointmentOptions}
                value={formData.appointment_id.toString()}
                onChange={(value) => handleAppointmentChange((Array.isArray(value) ? value[0] : value).toString())}
                onSearch={loadAppointments}
                placeholder="Search and select appointment"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Patient * {isReadonly && <span className="text-xs text-gray-500">(Auto-filled)</span>}
              </label>
              <SearchableDropdown
                options={patientOptions}
                value={formData.patient_id.toString()}
                onChange={(value) => !isReadonly && setFormData(prev => ({ ...prev, patient_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadPatients}
                placeholder={isReadonly ? "Auto-filled from appointment" : "Search and select patient"}
                multiple={false}
                searchable={!isReadonly}
                disabled={isReadonly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Doctor * {isReadonly && <span className="text-xs text-gray-500">(Auto-filled)</span>}
              </label>
              <SearchableDropdown
                options={doctorOptions}
                value={formData.doctor_id.toString()}
                onChange={(value) => !isReadonly && setFormData(prev => ({ ...prev, doctor_id: Array.isArray(value) ? value[0] : value }))}
                onSearch={loadDoctors}
                placeholder={isReadonly ? "Auto-filled from appointment" : "Search and select doctor"}
                multiple={false}
                searchable={!isReadonly}
                disabled={isReadonly}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Visit Date *
              </label>
              <DatePicker
                value={formData.visit_date}
                onChange={(value) => setFormData(prev => ({ ...prev, visit_date: value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Blood Pressure
              </label>
              <input
                type="text"
                name="bp"
                value={formData.bp}
                onChange={handleChange}
                placeholder="120/80"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <input
                type="text"
                name="temp"
                value={formData.temp}
                onChange={handleChange}
                placeholder="98.6°F"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pulse
              </label>
              <input
                type="text"
                name="pulse"
                value={formData.pulse}
                onChange={handleChange}
                placeholder="72 bpm"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Weight
              </label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="70 kg"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chief Complaint
              </label>
              <textarea
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Diagnosis
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Treatment Plan
              </label>
              <textarea
                name="treatment_plan"
                value={formData.treatment_plan}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Lab Results
              </label>
              <textarea
                name="lab_results"
                value={formData.lab_results}
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
              className={`px-3 py-1.5 text-xs font-medium text-white rounded ${
                !formData.appointment_id || !formData.patient_id || !formData.doctor_id
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-secondary'
              }`}
              disabled={!formData.appointment_id || !formData.patient_id || !formData.doctor_id}
            >
              {existingRecord ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MedicalRecordForm;