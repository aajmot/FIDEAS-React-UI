import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import RoleForm from './RoleForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadRoles();
  }, [currentPage, searchTerm]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getRoles({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined
      });
      setRoles(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSave = async (roleData: any) => {
    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, roleData);
        showToast('success', 'Role updated successfully');
      } else {
        await adminService.createRole(roleData);
        showToast('success', 'Role created successfully');
      }
      setEditingRole(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadRoles();
    } catch (error) {
      showToast('error', 'Failed to save role');
    }
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Roles imported successfully');
      loadRoles();
    } catch (error) {
      showToast('error', 'Failed to import roles');
    }
  };

  const handleCancel = () => {
    setEditingRole(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (role: Role) => {
    showConfirmation(
      {
        title: 'Delete Role',
        message: `Are you sure you want to delete role "${role.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await adminService.deleteRole(role.id);
          showToast('success', 'Role deleted successfully');
          loadRoles();
        } catch (error) {
          showToast('error', 'Failed to delete role');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Role Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value ? '#dcfce7' : '#fee2e2',
          color: value ? '#166534' : '#991b1b'
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <RoleForm
        role={editingRole}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Role Management"
        columns={columns}
        data={roles}
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

export default RoleManagement;