import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import AppointmentForm from './AppointmentForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Appointment } from '../../types';

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadAppointments(1);
  }, []);

  const loadAppointments = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await clinicService.getAppointments({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setAppointments(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleSave = async (appointmentData: any) => {
    try {
      if (editingAppointment) {
        await clinicService.updateAppointment(editingAppointment.id, appointmentData);
        showToast('success', 'Appointment updated successfully');
      } else {
        await clinicService.createAppointment(appointmentData);
        showToast('success', 'Appointment scheduled successfully');
      }
      setEditingAppointment(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadAppointments(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save appointment');
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadAppointments(1, search);
    } else {
      await loadAppointments(1, '');
    }
  };

  const handleCancel = () => {
    setEditingAppointment(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (appointment: Appointment) => {
    showConfirmation(
      {
        title: 'Delete Appointment',
        message: `Are you sure you want to delete appointment "${appointment.appointment_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deleteAppointment(appointment.id);
          showToast('success', 'Appointment deleted successfully');
          loadAppointments(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete appointment');
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

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { key: 'appointment_number', label: 'Appointment #' },
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
      key: 'appointment_date', 
      label: 'Date',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'appointment_time', 
      label: 'Time',
      render: (value: string) => formatTime(value)
    },
    { 
      key: 'duration_minutes', 
      label: 'Duration',
      render: (value: number) => value ? `${value} min` : '30 min'
    },
    { 
      key: 'reason', 
      label: 'Reason',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {value && value.length > 20 ? `${value.substring(0, 20)}...` : value || '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value?.toLowerCase() === 'scheduled' ? '#dbeafe' : 
                          value?.toLowerCase() === 'confirmed' ? '#dcfce7' :
                          value?.toLowerCase() === 'completed' ? '#f3f4f6' :
                          value?.toLowerCase() === 'cancelled' ? '#fee2e2' : '#fef3c7',
          color: value?.toLowerCase() === 'scheduled' ? '#1e40af' : 
                value?.toLowerCase() === 'confirmed' ? '#166534' :
                value?.toLowerCase() === 'completed' ? '#6b7280' :
                value?.toLowerCase() === 'cancelled' ? '#991b1b' : '#854d0e'
        }}>
          {value || 'scheduled'}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <AppointmentForm
        appointment={editingAppointment}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      

      
      <DataTable
        title="Appointment Management"
        columns={columns}
        data={appointments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadAppointments(page)}
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

export default AppointmentManagement;