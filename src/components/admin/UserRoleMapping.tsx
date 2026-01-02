import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import UserRoleMappingForm from './UserRoleMappingForm';
import RoleUserEditModal from './RoleUserEditModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface RoleMapping {
  role_id: number;
  role_name: string;
  role_description: string;
  user_count: number;
  users: {
    mapping_id: number;
    user_id: number;
    username: string;
    full_name: string;
  }[];
}

const UserRoleMapping: React.FC = () => {
  const [roleMappings, setRoleMappings] = useState<RoleMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleMapping | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const pageSize = 10;

  useEffect(() => {
    loadMappings();
  }, [currentPage, searchTerm]);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserRoleMappings({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined
      });
      setRoleMappings(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load user role mappings');
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

  const handleSave = async (mappingData: any) => {
    try {
      if (editingRole) {
        // Update role users
        await adminService.updateRoleUsers(mappingData.role_id, mappingData.user_ids);
        showToast('success', 'Role users updated successfully');
        setEditingRole(null);
      } else {
        // Create/update role users
        await adminService.updateRoleUsers(mappingData.role_id, mappingData.user_ids);
        showToast('success', 'Role users updated successfully');
      }
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadMappings();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to save user role mapping';
      showToast('error', message);
    }
  };

  const handleCancel = () => {
    if (editingRole) {
      handleEditCancel();
    } else {
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleEdit = (role: RoleMapping) => {
    setEditingRole(role);
    setIsFormCollapsed(false);
  };

  const handleEditCancel = () => {
    setEditingRole(null);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleDelete = async (role: RoleMapping) => {
    if (window.confirm(`Remove all users from ${role.role_name} role?`)) {
      try {
        await adminService.deleteAllUsersFromRole(role.role_id);
        showToast('success', 'All users removed from role successfully');
        loadMappings();
      } catch (error) {
        showToast('error', 'Failed to remove users from role');
      }
    }
  };

  const handleModalSave = async (roleId: number, userIds: number[]) => {
    try {
      await adminService.updateRoleUsers(roleId, userIds);
      showToast('success', 'Role users updated successfully');
      setIsModalOpen(false);
      setEditingRole(null);
      loadMappings();
    } catch (error) {
      showToast('error', 'Failed to update role users');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'User role mappings imported successfully');
      loadMappings();
    } catch (error) {
      showToast('error', 'Failed to import user role mappings');
    }
  };

  const formatUsersDisplay = (users: RoleMapping['users']) => {
    if (users.length === 0) return 'No users';
    if (users.length === 1) return users[0].username;
    return `${users[0].username}+${users.length - 1}`;
  };

  const columns = [
    { key: 'role_name', label: 'Role Name' },
    { key: 'role_description', label: 'Description' },
    {
      key: 'users',
      label: 'Users',
      render: (users: RoleMapping['users']) => (
        <span className="text-sm">
          {formatUsersDisplay(users)} ({users.length})
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <UserRoleMappingForm
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        editingRole={editingRole}
        onImport={handleImport}
      />
      
      <DataTable
        title="Role User Assignments"
        columns={columns}
        data={roleMappings}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />
      
      <RoleUserEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        role={editingRole}
      />
    </div>
  );
};

export default UserRoleMapping;