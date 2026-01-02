import React, { useState, useEffect } from 'react';
import { Printer, Trash2, ArrowLeft } from 'lucide-react';
import DataTable from '../common/DataTable';
import PrescriptionForm from './PrescriptionForm';
import PrescriptionView from './PrescriptionView';
import ConfirmationModal from '../common/ConfirmationModal';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Prescription } from '../../types';

const PrescriptionManagement: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'list' | 'view'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadPrescriptions();
  }, [currentPage, searchTerm]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await clinicService.getPrescriptions({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm
      });
      setPrescriptions(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load prescriptions');
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



  const handleView = (prescription: Prescription) => {
    setViewingPrescription(prescription);
    setEditingPrescription(undefined);
    setActiveTab('view');
  };

  const handleSave = async (prescriptionData: any) => {
    try {
      if (prescriptionData.id) {
        await clinicService.updatePrescription(prescriptionData.id, prescriptionData);
        showToast('success', 'Prescription updated successfully');
      } else {
        await clinicService.createPrescription(prescriptionData);
        showToast('success', 'Prescription created successfully');
      }
      setEditingPrescription(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadPrescriptions();
    } catch (error) {
      showToast('error', 'Failed to save prescription');
    }
  };

  const handleCancel = () => {
    setEditingPrescription(undefined);
    setViewingPrescription(undefined);
    setActiveTab('list');
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (prescription: Prescription) => {
    showConfirmation(
      {
        title: 'Delete Prescription',
        message: `Are you sure you want to delete prescription "${prescription.prescription_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deletePrescription(prescription.id);
          showToast('success', 'Prescription deleted successfully');
          loadPrescriptions();
        } catch (error) {
          showToast('error', 'Failed to delete prescription');
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

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const columns = [
    { key: 'prescription_number', label: 'RX Number' },
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
      key: 'prescription_date', 
      label: 'Date',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'instructions', 
      label: 'Instructions',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {truncateText(value)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Prescription) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Prescription"
          >
            <Printer className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800"
            title="Delete Prescription"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (activeTab === 'view' && viewingPrescription) {
    return (
      <div className="p-3 sm:p-6">
        <PrescriptionView
          prescriptionId={viewingPrescription.id}
          onBack={() => setActiveTab('list')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <PrescriptionForm
        prescription={editingPrescription}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Prescription Management"
        columns={columns}
        data={prescriptions}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
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

export default PrescriptionManagement;