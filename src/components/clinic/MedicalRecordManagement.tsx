import React, { useState, useEffect } from 'react';
import { Printer, Trash2, ArrowLeft } from 'lucide-react';
import DataTable from '../common/DataTable';
import MedicalRecordForm from './MedicalRecordForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { clinicService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { MedicalRecord, Tenant } from '../../types';

const MedicalRecordManagement: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'list' | 'view'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadRecords(1);
  }, []);

  const loadRecords = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await clinicService.getMedicalRecords({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setRecords(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: MedicalRecord) => {
    showConfirmation(
      {
        title: 'Delete Medical Record',
        message: `Are you sure you want to delete medical record "${record.record_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deleteMedicalRecord(record.id);
          showToast('success', 'Medical record deleted successfully');
          loadRecords(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete medical record');
        }
      }
    );
  };

  const handleView = async (record: MedicalRecord) => {
    setViewingRecord(record);
    setEditingRecord(undefined);
    setActiveTab('view');
    
    // Load tenant data when viewing record
    try {
      const tenantResponse = await adminService.getTenant();
      setTenant(tenantResponse.data);
    } catch (error) {
      console.error('Failed to load tenant data:', error);
    }
  };

  const handleSave = async (recordData: any) => {
    try {
      // Get appointment details to extract patient and doctor info
      const appointmentResponse = await clinicService.getAppointment(recordData.appointment_id);
      const appointment = appointmentResponse.data;
      
      // Get user info for branch_id
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Format data according to API expectations
      const formattedData = {
        appointment_id: recordData.appointment_id,
        patient_id: appointment.patient_id,
        patient_name: appointment.patient_name,
        doctor_id: appointment.doctor_id,
        doctor_name: appointment.doctor_name,
        visit_date: recordData.visit_date,
        chief_complaint: recordData.chief_complaint || '',
        diagnosis: recordData.diagnosis || '',
        treatment_plan: recordData.treatment_plan || '',
        vital_signs: recordData.vital_signs || '',
        lab_results: recordData.lab_results || '',
        notes: recordData.notes || ''
      };
      
      if (recordData.id) {
        await clinicService.updateMedicalRecord(recordData.id, formattedData);
        showToast('success', 'Medical record updated successfully');
      } else {
        await clinicService.createMedicalRecord(formattedData);
        showToast('success', 'Medical record created successfully');
      }
      setEditingRecord(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadRecords(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save medical record');
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadRecords(1, search);
    } else {
      await loadRecords(1, '');
    }
  };

  const handleCancel = () => {
    setEditingRecord(undefined);
    setViewingRecord(undefined);
    setActiveTab('list');
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const parseVitalSigns = (vitalSigns: string) => {
    if (!vitalSigns) return '-';
    try {
      const vitals = JSON.parse(vitalSigns);
      const parts = [];
      if (vitals.bp) parts.push(`BP: ${vitals.bp}`);
      if (vitals.temp) parts.push(`T: ${vitals.temp}`);
      if (vitals.pulse) parts.push(`P: ${vitals.pulse}`);
      return parts.join(', ') || '-';
    } catch (e) {
      return vitalSigns;
    }
  };

  const columns = [
    { key: 'record_number', label: 'Record #' },
    { 
      key: 'appointment_id', 
      label: 'Appointment #',
      render: (value: string) => value || '-'
    },
    { 
      key: 'patient_name', 
      label: 'Patient',
      render: (value: string) => value || '-'
    },
    { 
      key: 'doctor_name', 
      label: 'Doctor',
      render: (value: string) => value || '-'
    },
    { 
      key: 'visit_date', 
      label: 'Visit Date',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'chief_complaint', 
      label: 'Chief Complaint',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {truncateText(value)}
        </span>
      )
    },
    { 
      key: 'diagnosis', 
      label: 'Diagnosis',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {truncateText(value)}
        </span>
      )
    },
    { 
      key: 'vital_signs', 
      label: 'Vital Signs',
      render: (value: string) => (
        <span className="text-xs" title={parseVitalSigns(value)}>
          {truncateText(parseVitalSigns(value), 20)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: MedicalRecord) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Record"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800"
            title="Delete Record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const handlePrint = () => {
    const printContent = document.querySelector('.medical-record-content');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  if (activeTab === 'view' && viewingRecord) {
    return (
      <div className="p-3 sm:p-6">
        <div className="medical-record-view bg-white min-h-screen">
          {/* Print Controls */}
          <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 print:hidden bg-gray-50">
            <div className="flex items-center">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setViewingRecord(undefined);
                }}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Medical Record Details</h2>
            </div>
            <button
              onClick={() => {
                const printContent = document.querySelector('.medical-record-content');
                const originalContent = document.body.innerHTML;
                if (printContent) {
                  document.body.innerHTML = printContent.innerHTML;
                  window.print();
                  document.body.innerHTML = originalContent;
                  window.location.reload();
                }
              }}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded w-full sm:w-auto justify-center"
            >
              <Printer className="h-3 w-3 mr-1" />
              Print
            </button>
          </div>

          {/* A4 Printable Content */}
          <div className="medical-record-content print-container max-w-4xl mx-auto p-4 sm:p-8 print:p-3 print:max-w-none">
            {/* Company Header */}
            <div className="print-header border-b-2 border-blue-600 pb-3 mb-4 print:pb-2 print:mb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                <div className="flex-1">
                  <h1 className="print-company-name text-xl sm:text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'FIDEAS Healthcare'}</h1>
                  {tenant?.address && (
                    <div className="text-gray-600 mb-2">
                      <div className="whitespace-pre-line text-sm">{tenant.address}</div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                    {tenant?.email && <div>Email: {tenant.email}</div>}
                    {tenant?.tax_id && <div>Tax ID: {tenant.tax_id}</div>}
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <h2 className="print-po-title text-lg sm:text-2xl font-bold text-gray-800 mb-2">MEDICAL RECORD</h2>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <div>Date: {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Record Details */}
            <div className="print-section grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
              <div className="print-order-details bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Patient Information</h3>
                <div className="space-y-1 print:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium text-gray-600 text-xs sm:text-sm">Name:</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">{viewingRecord.patient_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium text-gray-600 text-xs sm:text-sm">Record #:</span>
                    <span className="text-gray-900 text-xs sm:text-sm">{viewingRecord.record_number}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium text-gray-600 text-xs sm:text-sm">Visit Date:</span>
                    <span className="text-gray-900 text-xs sm:text-sm">{formatDate(viewingRecord.visit_date)}</span>
                  </div>
                </div>
              </div>
              
              <div className="print-order-details bg-blue-50 p-3 sm:p-4 rounded-lg print:p-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Attending Physician</h3>
                <div className="space-y-1 print:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium text-gray-600 text-xs sm:text-sm">Doctor:</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">{viewingRecord.doctor_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="print-section mb-4 print:mb-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Vital Signs</h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                <p className="text-gray-700 text-xs sm:text-sm">{parseVitalSigns(viewingRecord.vital_signs || 'Not recorded')}</p>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4 print:space-y-2">
              {viewingRecord.chief_complaint && (
                <div className="print-section">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Chief Complaint</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                    <p className="text-gray-700 text-xs sm:text-sm">{viewingRecord.chief_complaint}</p>
                  </div>
                </div>
              )}

              {viewingRecord.diagnosis && (
                <div className="print-section">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Diagnosis</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                    <p className="text-gray-700 text-xs sm:text-sm">{viewingRecord.diagnosis}</p>
                  </div>
                </div>
              )}

              {viewingRecord.treatment_plan && (
                <div className="print-section">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Treatment Plan</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                    <p className="text-gray-700 text-xs sm:text-sm">{viewingRecord.treatment_plan}</p>
                  </div>
                </div>
              )}

              {viewingRecord.lab_results && (
                <div className="print-section">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Laboratory Results</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                    <p className="text-gray-700 text-xs sm:text-sm">{viewingRecord.lab_results}</p>
                  </div>
                </div>
              )}

              {viewingRecord.notes && (
                <div className="print-section">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Additional Notes</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg print:p-2">
                    <p className="text-gray-700 text-xs sm:text-sm">{viewingRecord.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="print-footer border-t border-gray-200 pt-3 mt-4 print:pt-2 print:mt-2">
              <div className="text-right">
                <div className="print-signature-space mb-8 print:mb-4">
                  <p className="text-xs text-gray-600 mb-1 print:text-xs">Authorized Signature</p>
                  <div className="border-b border-gray-300 w-32 ml-auto print:w-24"></div>
                </div>
                <div className="text-xs text-gray-500 print:text-xs">
                  <p>This is a computer generated medical record.</p>
                  <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewingRecord) {
    return (
      <div className="medical-record-view bg-white min-h-screen">
        {/* Print Controls */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden bg-gray-50">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Medical Record Details</h2>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>

        {/* A4 Printable Content */}
        <div className="medical-record-content print-container max-w-4xl mx-auto p-8 print:p-3 print:max-w-none">
          {/* Company Header */}
          <div className="print-header border-b-2 border-blue-600 pb-3 mb-4 print:pb-2 print:mb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="print-company-name text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'FIDEAS Healthcare'}</h1>
                {tenant?.address && (
                  <div className="text-gray-600 mb-2">
                    <div className="whitespace-pre-line">{tenant.address}</div>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                  {tenant?.email && <div>Email: {tenant.email}</div>}
                  {tenant?.tax_id && <div>Tax ID: {tenant.tax_id}</div>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="print-po-title text-2xl font-bold text-gray-800 mb-2">MEDICAL RECORD</h2>
                <div className="text-sm text-gray-600">
                  <div>Date: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Record Details */}
          <div className="print-section grid grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
            <div className="print-order-details bg-gray-50 p-4 rounded-lg print:p-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Patient Information</h3>
              <div className="space-y-1 print:space-y-0">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="font-semibold text-gray-900">{viewingRecord.patient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Record #:</span>
                  <span className="text-gray-900">{viewingRecord.record_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Visit Date:</span>
                  <span className="text-gray-900">{formatDate(viewingRecord.visit_date)}</span>
                </div>
              </div>
            </div>
            
            <div className="print-order-details bg-blue-50 p-4 rounded-lg print:p-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Attending Physician</h3>
              <div className="space-y-1 print:space-y-0">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Doctor:</span>
                  <span className="font-semibold text-gray-900">{viewingRecord.doctor_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="print-section mb-4 print:mb-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Vital Signs</h3>
            <div className="bg-gray-50 p-4 rounded-lg print:p-2">
              <p className="text-gray-700">{parseVitalSigns(viewingRecord.vital_signs || 'Not recorded')}</p>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4 print:space-y-2">
            {viewingRecord.chief_complaint && (
              <div className="print-section">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Chief Complaint</h3>
                <div className="bg-gray-50 p-4 rounded-lg print:p-2">
                  <p className="text-gray-700">{viewingRecord.chief_complaint}</p>
                </div>
              </div>
            )}

            {viewingRecord.diagnosis && (
              <div className="print-section">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Diagnosis</h3>
                <div className="bg-gray-50 p-4 rounded-lg print:p-2">
                  <p className="text-gray-700">{viewingRecord.diagnosis}</p>
                </div>
              </div>
            )}

            {viewingRecord.treatment_plan && (
              <div className="print-section">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Treatment Plan</h3>
                <div className="bg-gray-50 p-4 rounded-lg print:p-2">
                  <p className="text-gray-700">{viewingRecord.treatment_plan}</p>
                </div>
              </div>
            )}

            {viewingRecord.lab_results && (
              <div className="print-section">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Laboratory Results</h3>
                <div className="bg-gray-50 p-4 rounded-lg print:p-2">
                  <p className="text-gray-700">{viewingRecord.lab_results}</p>
                </div>
              </div>
            )}

            {viewingRecord.notes && (
              <div className="print-section">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Additional Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg print:p-2">
                  <p className="text-gray-700">{viewingRecord.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="print-footer border-t border-gray-200 pt-3 mt-4 print:pt-2 print:mt-2">
            <div className="text-right">
              <div className="print-signature-space mb-8 print:mb-4">
                <p className="text-xs text-gray-600 mb-1 print:text-xs">Authorized Signature</p>
                <div className="border-b border-gray-300 w-32 ml-auto print:w-24"></div>
              </div>
              <div className="text-xs text-gray-500 print:text-xs">
                <p>This is a computer generated medical record.</p>
                <p>Generated on: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <MedicalRecordForm
        record={editingRecord}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Medical Records"
        columns={columns}
        data={records}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadRecords(page)}
        onSearch={handleSearch}
      />
      
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />
    </div>
  );
};

export default MedicalRecordManagement;