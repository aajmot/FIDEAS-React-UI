import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import PatientForm from './PatientForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Patient } from '../../types';

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const pageSize = 10;

  useEffect(() => {
    loadPatients();
  }, [currentPage, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await clinicService.getPatients({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm
      });
      setPatients(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
  };

  const handleSave = async (patientData: any) => {
    try {
      if (editingPatient) {
        await clinicService.updatePatient(editingPatient.id, patientData);
        showToast('success', 'Patient updated successfully');
      } else {
        await clinicService.createPatient(patientData);
        showToast('success', 'Patient created successfully');
      }
      setEditingPatient(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadPatients();
    } catch (error) {
      showToast('error', 'Failed to save patient');
    }
  };

  const handleCancel = () => {
    setEditingPatient(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Patients imported successfully');
      loadPatients();
    } catch (error) {
      showToast('error', 'Failed to import patients');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (patient: Patient) => {
    showConfirmation(
      {
        title: 'Delete Patient',
        message: `Are you sure you want to delete patient "${patient.first_name} ${patient.last_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deletePatient(patient.id);
          showToast('success', 'Patient deleted successfully');
          loadPatients();
        } catch (error) {
          showToast('error', 'Failed to delete patient');
        }
      }
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const columns = [
    { key: 'patient_number', label: 'Patient #' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'email', 
      label: 'Email',
      render: (value: string) => value || '-'
    },
    { 
      key: 'date_of_birth', 
      label: 'DOB',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'age', 
      label: 'Age',
      render: (value: string, row: any) => calculateAge(row.date_of_birth)
    },
    { 
      key: 'gender', 
      label: 'Gender',
      render: (value: string) => value || '-'
    },
    { 
      key: 'blood_group', 
      label: 'Blood Group',
      render: (value: string) => value || '-'
    },
    { 
      key: 'emergency_contact', 
      label: 'Emergency Contact',
      render: (value: string) => value || '-'
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value ? '#dcfce7' : '#f3f4f6',
          color: value ? '#166534' : '#6b7280'
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <PatientForm
        patient={editingPatient}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Patient Management"
        columns={columns}
        data={patients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
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

export default PatientManagement;