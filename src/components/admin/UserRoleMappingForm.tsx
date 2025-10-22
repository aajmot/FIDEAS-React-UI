import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { adminService } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

interface UserRoleMappingFormProps {
  onSave: (mappingData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  editingRole?: {
    role_id: number;
    role_name: string;
    users: { user_id: number; username: string }[];
  } | null;
  onImport?: () => void;
}

const UserRoleMappingForm: React.FC<UserRoleMappingFormProps> = ({ 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm,
  editingRole,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    user_ids: editingRole ? editingRole.users.map(u => u.user_id) : [],
    role_id: editingRole ? editingRole.role_id : '',
    is_active: true
  });
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    loadUsersAndRoles();
  }, []);

  useEffect(() => {
    if (resetForm && !editingRole) {
      setFormData({
        user_ids: [],
        role_id: '',
        is_active: true
      });
    } else if (editingRole) {
      setFormData({
        user_ids: editingRole.users.map(u => u.user_id),
        role_id: editingRole.role_id,
        is_active: true
      });
    }
  }, [resetForm, editingRole]);

  const loadUsersAndRoles = async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        adminService.getUsers(),
        adminService.getRoles()
      ]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch (error) {
      console.error('Error loading users and roles:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      // For editing, save role with updated users
      onSave({
        role_id: formData.role_id,
        user_ids: formData.user_ids
      });
    } else {
      // For creating, save role with users
      onSave({
        role_id: parseInt(formData.role_id as string),
        user_ids: formData.user_ids
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDropdownChange = (name: string) => (value: string | number | (string | number)[]) => {
    if (name === 'user_ids') {
      const userIds = Array.isArray(value) ? value.map(v => Number(v)) : [Number(value)];
      setFormData(prev => ({
        ...prev,
        user_ids: userIds
      }));
    } else if (name === 'role_id') {
      const roleId = Array.isArray(value) ? value[0] : value;
      setFormData(prev => ({
        ...prev,
        [name]: roleId
      }));
      // Load users for selected role
      if (roleId && !editingRole) {
        loadRoleUsers(Number(roleId));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const loadRoleUsers = async (roleId: number) => {
    try {
      const response = await adminService.getRoleUsers(roleId);
      const roleUsers = response.data || [];
      setFormData(prev => ({
        ...prev,
        user_ids: roleUsers.map((user: any) => user.user_id)
      }));
    } catch (error) {
      console.error('Error loading role users:', error);
    }
  };
  
  const downloadTemplate = async () => {
    try {
      const blob = await adminService.downloadUserRoleMappingsTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_role_mappings_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;
    
    try {
      const response = await adminService.importUserRoleMappings(file);
      if (response.success && onImport) {
        onImport();
      }
    } catch (error) {
      console.error('Error importing file:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingRole ? `Edit Users for ${editingRole.role_name}` : 'Add User Role Mapping'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="h-3 w-3 mr-1" />
            Template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Upload className="h-3 w-3 mr-1" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {editingRole ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <SearchableDropdown
                    options={[{ value: editingRole.role_id, label: editingRole.role_name }]}
                    value={formData.role_id}
                    onChange={() => {}}
                    placeholder="Role"
                    multiple={false}
                    searchable={false}
                    disabled={true}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Users
                  </label>
                  <SearchableDropdown
                    options={users.map(user => ({
                      value: user.id,
                      label: `${user.username} - ${user.first_name} ${user.last_name}`
                    }))}
                    value={formData.user_ids}
                    onChange={handleDropdownChange('user_ids')}
                    placeholder="Select Users"
                    multiple={true}
                    searchable={true}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-1 block text-xs text-gray-700">
                    Active
                  </label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <SearchableDropdown
                    options={roles.map(role => ({ value: role.id, label: role.name }))}
                    value={formData.role_id}
                    onChange={handleDropdownChange('role_id')}
                    placeholder="Select Role"
                    multiple={false}
                    searchable={true}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Users
                  </label>
                  <SearchableDropdown
                    options={users.map(user => ({
                      value: user.id,
                      label: `${user.username} - ${user.first_name} ${user.last_name}`
                    }))}
                    value={formData.user_ids}
                    onChange={handleDropdownChange('user_ids')}
                    placeholder="Select Users"
                    multiple={true}
                    searchable={true}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-1 block text-xs text-gray-700">
                    Active
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              {editingRole ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserRoleMappingForm;