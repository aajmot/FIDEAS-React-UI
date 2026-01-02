import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import UserForm from './UserForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { User } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined
      });
      setUsers(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Users imported successfully');
      loadUsers();
    } catch (error) {
      showToast('error', 'Failed to import users');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSave = async (userData: any) => {
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, userData);
        showToast('success', 'User updated successfully');
      } else {
        await adminService.createUser(userData);
        showToast('success', 'User created successfully');
      }
      setEditingUser(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadUsers();
    } catch (error) {
      showToast('error', 'Failed to save user');
    }
  };

  const handleCancel = () => {
    setEditingUser(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (user: User) => {
    showConfirmation(
      {
        title: 'Delete User',
        message: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await adminService.deleteUser(user.id);
          showToast('success', 'User deleted successfully');
          loadUsers();
        } catch (error) {
          showToast('error', 'Failed to delete user');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    {
      key: 'roles',
      label: 'Roles',
      render: (roles: string[]) => (
        <span style={{ fontSize: 'var(--erp-font-size-xs)' }}>
          {roles && roles.length > 0 ? roles.join(', ') : 'No roles'}
        </span>
      )
    },
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
      <UserForm
        user={editingUser}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="User Management"
        columns={columns}
        data={users}
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

export default UserManagement;