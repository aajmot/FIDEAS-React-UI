import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import AgencyForm from './AgencyForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Agency } from '../../types';

const AgencyManagement: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadAgencies(1);
  }, []);

  const loadAgencies = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await adminService.getAgencies({ 
        page, 
        per_page: 10, 
        search: searchText
      });
      setAgencies(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadAgencies(1, search);
    } else {
      await loadAgencies(1, '');
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
  };

  const handleSave = async (agencyData: any) => {
    try {
      if (editingAgency) {
        await adminService.updateAgency(editingAgency.id, agencyData);
        showToast('success', 'Agency updated successfully');
      } else {
        await adminService.createAgency(agencyData);
        showToast('success', 'Agency created successfully');
      }
      setEditingAgency(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadAgencies(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save agency');
    }
  };

  const handleCancel = () => {
    setEditingAgency(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Agencies imported successfully');
      loadAgencies(1);
    } catch (error) {
      showToast('error', 'Failed to import agencies');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (agency: Agency) => {
    showConfirmation(
      {
        title: 'Delete Agency',
        message: `Are you sure you want to delete agency "${agency.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await adminService.deleteAgency(agency.id);
          showToast('success', 'Agency deleted successfully');
          loadAgencies(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete agency');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'email', 
      label: 'Email',
      render: (value: string) => value || '-'
    },
    { 
      key: 'tax_id', 
      label: 'Tax ID',
      render: (value: string) => value || '-'
    },
    { 
      key: 'address', 
      label: 'Address',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {value && value.length > 30 ? `${value.substring(0, 30)}...` : value || '-'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <AgencyForm
        agency={editingAgency}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}

      />
      
      <DataTable
        title="Agency Management"
        columns={columns}
        data={agencies}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadAgencies(page)}
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

export default AgencyManagement;
