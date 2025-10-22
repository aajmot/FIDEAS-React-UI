import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import DoctorForm from './DoctorForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Doctor } from '../../types';

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const pageSize = 10;

  useEffect(() => {
    loadDoctors();
  }, [currentPage, searchTerm]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await clinicService.getDoctors({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm
      });
      setDoctors(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load doctors');
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

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
  };

  const handleSave = async (doctorData: any) => {
    try {
      if (editingDoctor) {
        await clinicService.updateDoctor(editingDoctor.id, doctorData);
        showToast('success', 'Doctor updated successfully');
      } else {
        await clinicService.createDoctor(doctorData);
        showToast('success', 'Doctor created successfully');
      }
      setEditingDoctor(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadDoctors();
    } catch (error) {
      showToast('error', 'Failed to save doctor');
    }
  };

  const handleCancel = () => {
    setEditingDoctor(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Doctors imported successfully');
      loadDoctors();
    } catch (error) {
      showToast('error', 'Failed to import doctors');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (doctor: Doctor) => {
    showConfirmation(
      {
        title: 'Delete Doctor',
        message: `Are you sure you want to delete doctor "${doctor.first_name} ${doctor.last_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deleteDoctor(doctor.id);
          showToast('success', 'Doctor deleted successfully');
          loadDoctors();
        } catch (error) {
          showToast('error', 'Failed to delete doctor');
        }
      }
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    return timeString;
  };

  const formatFee = (fee: number) => {
    if (!fee) return '-';
    return fee.toFixed(2);
  };

  const columns = [
    { key: 'doctor_id', label: 'Doctor ID' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'email', 
      label: 'Email',
      render: (value: string) => value || '-'
    },
    { 
      key: 'specialization', 
      label: 'Specialization',
      render: (value: string) => value || '-'
    },
    { 
      key: 'license_number', 
      label: 'License #',
      render: (value: string) => value || '-'
    },
    { 
      key: 'schedule_start', 
      label: 'Start Time',
      render: (value: string) => formatTime(value)
    },
    { 
      key: 'schedule_end', 
      label: 'End Time',
      render: (value: string) => formatTime(value)
    },
    { 
      key: 'consultation_fee', 
      label: 'Fee',
      render: (value: number) => formatFee(value)
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <DoctorForm
        doctor={editingDoctor}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Doctor Management"
        columns={columns}
        data={doctors}
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

export default DoctorManagement;