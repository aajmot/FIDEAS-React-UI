import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { clinicService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Prescription, Tenant } from '../../types';
import './PrescriptionPrint.css';

interface PrescriptionViewProps {
  prescriptionId: number;
  onBack: () => void;
}

const PrescriptionView: React.FC<PrescriptionViewProps> = ({ prescriptionId, onBack }) => {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<any>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [prescriptionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prescriptionResponse, tenantResponse] = await Promise.all([
        clinicService.getPrescription(prescriptionId),
        adminService.getTenant()
      ]);
      setPrescription(prescriptionResponse.data);
      setTenant(tenantResponse.data);
      
      // Load medical record if appointment_id exists
      console.log('Prescription data:', prescriptionResponse.data);
      if (prescriptionResponse.data.appointment_id) {
        console.log('Loading medical record for appointment:', prescriptionResponse.data.appointment_id);
        try {
          const medicalRecordResponse = await clinicService.getMedicalRecordByAppointment(prescriptionResponse.data.appointment_id);
          console.log('Medical record loaded:', medicalRecordResponse.data);
          setMedicalRecord(medicalRecordResponse.data);
        } catch (error) {
          console.log('No medical record found for this appointment:', error);
        }
      } else {
        console.log('No appointment_id found in prescription');
      }
    } catch (error) {
      showToast('error', 'Failed to load prescription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.querySelector('.prescription-content');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Prescription not found</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="prescription-view bg-white min-h-screen">
      {/* Print Controls */}
      <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 print:hidden bg-gray-50">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Prescription Details</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded w-full sm:w-auto justify-center"
        >
          <Printer className="h-3 w-3 mr-1" />
          Print
        </button>
      </div>

      {/* A4 Printable Content */}
      <div className="prescription-content print-container max-w-4xl mx-auto p-8 print:p-3 print:max-w-none">
        {/* Clinic Header */}
        <div className="print-header border-b-2 border-blue-600 pb-3 mb-4 print:pb-2 print:mb-2">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
            <div className="flex-1">
              <h1 className="print-clinic-name text-2xl md:text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'Clinic Name'}</h1>
              {tenant?.address && (
                <div className="text-gray-600 mb-2">
                  <div className="whitespace-pre-line text-sm">{tenant.address}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                {tenant?.email && <div>Email: {tenant.email}</div>}
                {tenant?.tax_id && <div>Registration: {tenant.tax_id}</div>}
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <h2 className="print-rx-title text-xl md:text-2xl font-bold text-gray-800 mb-2">PRESCRIPTION</h2>
              <div className="text-xs md:text-sm text-gray-600">
                <div>Date: {new Date(prescription.prescription_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-prescription-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Prescription Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">RX Number:</span>
                <span className="font-semibold text-gray-900">{prescription.prescription_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-900">{new Date(prescription.prescription_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Doctor:</span>
                <span className="text-gray-900">{prescription.doctor_name}</span>
              </div>
              {prescription.doctor_license_number && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">License:</span>
                  <span className="text-gray-900">{prescription.doctor_license_number}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="print-prescription-details bg-blue-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Patient Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{prescription.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{prescription.patient_phone || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Age:</span>
                <span className="text-gray-900">{prescription.patient_age || ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Appointment#:</span>
                <span className="text-gray-900">{prescription.appointment_number || ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Record and Prescribed Tests in same row */}
        {((medicalRecord && (medicalRecord.chief_complaint || medicalRecord.diagnosis || medicalRecord.vital_signs || medicalRecord.treatment_plan)) || (prescription.test_items && prescription.test_items.length > 0)) && (
          <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
            {/* Medical Record Section */}
            {medicalRecord && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Medical Record</h3>
                <div className="bg-gray-50 p-3 rounded print:p-2 space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Chief Complaint: </span>
                    <span className="text-sm text-gray-600 print:text-xs">{medicalRecord.chief_complaint || ''}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Diagnosis: </span>
                    <span className="text-sm text-gray-600 print:text-xs">{medicalRecord.diagnosis || ''}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Vital Signs: </span>
                    <span className="text-sm text-gray-600 print:text-xs">
                      {(() => {
                        if (!medicalRecord.vital_signs) return '';
                        try {
                          const vitals = JSON.parse(medicalRecord.vital_signs);
                          const parts = [];
                          if (vitals.bp) parts.push(`BP: ${vitals.bp}`);
                          if (vitals.temp) parts.push(`Temp: ${vitals.temp}`);
                          if (vitals.pulse) parts.push(`Pulse: ${vitals.pulse}`);
                          if (vitals.weight) parts.push(`Weight: ${vitals.weight}`);
                          return parts.join(', ');
                        } catch (e) {
                          return medicalRecord.vital_signs;
                        }
                      })()} 
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-700">Treatment Plan: </span>
                    <span className="text-sm text-gray-600 print:text-xs">{medicalRecord.treatment_plan || ''}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Prescribed Tests */}
            {prescription.test_items && prescription.test_items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Prescribed Tests</h3>
                <div className="bg-gray-50 p-3 rounded print:p-2 space-y-2">
                  {prescription.test_items.map((item, index) => (
                    <div key={index}>
                      <span className="text-xs font-semibold text-gray-700">{item.test_name}</span>
                      {item.instructions && (
                        <span className="text-sm text-gray-600 print:text-xs"> - {item.instructions}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medications Table */}
        <div className="print-section mb-4 print:mb-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Prescribed Medications</h3>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
            <table className="print-table w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '120px' }}>Medicine</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '80px' }}>Dosage</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '80px' }}>Frequency</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '80px' }}>Duration</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '120px' }}>Instructions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prescription.items?.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">{item.product_name}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.dosage || '-'}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.frequency || '-'}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.duration || '-'}</td>
                    <td className="px-2 py-2 text-sm text-gray-700 border-b">{item.instructions || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Instructions */}
        {prescription.instructions && (
          <div className="print-section mb-4 print:mb-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">General Instructions</h3>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 print:p-2">
              <p className="text-sm text-gray-700 print:text-xs">{prescription.instructions}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="print-footer border-t border-gray-200 pt-3 mt-4 print:pt-2 print:mt-2">
          <div className="flex flex-col print:flex-row md:flex-row justify-between items-start gap-4 md:gap-0 mb-4">
            <div>
              <div className="text-xs text-gray-600 print:text-xs">
                <p><strong>Note:</strong> Please follow the prescribed dosage and duration.</p>
                <p>Consult your doctor if you experience any adverse effects.</p>
              </div>
            </div>
            <div className="text-right">
              <div className="print-signature-space">
                <p className="text-xs text-gray-600 mb-1 print:text-xs">Doctor's Signature</p>
                <div className="border-b border-gray-300 w-32 ml-auto print:w-24"></div>
                <p className="text-xs text-gray-600 mt-1 print:text-xs">{prescription.doctor_name}</p>
                {prescription.doctor_license_number && (
                  <p className="text-xs text-gray-500 print:text-xs">License: {prescription.doctor_license_number}</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 print:text-xs">
              <p>This is a computer generated prescription.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView;