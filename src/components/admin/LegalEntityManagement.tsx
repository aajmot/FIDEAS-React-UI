import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import LegalEntityForm from './LegalEntityForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface LegalEntity {
  id: number;
  name: string;
  code: string;
  registration_number: string;
  address: string;
  logo: string;
  admin_user_id: number;
  admin_user_name: string;
  is_active: boolean;
}

const LegalEntityManagement: React.FC = () => {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadEntities();
  }, [currentPage, searchTerm]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLegalEntities({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined
      });
      setEntities(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load legal entities');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entity: LegalEntity) => {
    setEditingEntity(entity);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSave = async (entityData: any) => {
    try {
      if (editingEntity) {
        await adminService.updateLegalEntity(editingEntity.id, entityData);
        showToast('success', 'Legal entity updated successfully');
      } else {
        await adminService.createLegalEntity(entityData);
        showToast('success', 'Legal entity created successfully');
      }
      setEditingEntity(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadEntities();
    } catch (error) {
      showToast('error', 'Failed to save legal entity');
    }
  };

  const handleCancel = () => {
    setEditingEntity(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Legal entities imported successfully');
      loadEntities();
    } catch (error) {
      showToast('error', 'Failed to import legal entities');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (entity: LegalEntity) => {
    showConfirmation(
      {
        title: 'Delete Legal Entity',
        message: `Are you sure you want to delete legal entity "${entity.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await adminService.deleteLegalEntity(entity.id);
          showToast('success', 'Legal entity deleted successfully');
          loadEntities();
        } catch (error) {
          showToast('error', 'Failed to delete legal entity');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Entity Name' },
    { key: 'code', label: 'Code' },
    { key: 'registration_number', label: 'Registration No.' },
    { key: 'admin_user_name', label: 'Admin User' },
    { 
      key: 'address', 
      label: 'Address',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {value && value.length > 30 ? `${value.substring(0, 30)}...` : value || '-'}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <LegalEntityForm
        entity={editingEntity}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Legal Entity Management"
        columns={columns}
        data={entities}
        onEdit={handleEdit}
        onDelete={handleDelete}
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

export default LegalEntityManagement;