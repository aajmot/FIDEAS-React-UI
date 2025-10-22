import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { User } from '../../types';
import { adminService } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

interface UserFormProps {
  user?: User & { role_ids?: number[] };
  onSave: (userData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onImport?: (data: any[]) => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel, isCollapsed, onToggleCollapse, resetForm, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    password: '',
    is_active: user?.is_active ?? true,
    role_ids: user?.role_ids || []
  });
  const [roles, setRoles] = useState<any[]>([]);
  
  React.useEffect(() => {
    loadRoles();
  }, []);

  React.useEffect(() => {
    if (resetForm && !user) {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_active: true,
        role_ids: []
      });
    } else if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '',
        is_active: user.is_active,
        role_ids: user.role_ids || []
      });
    }
  }, [user, resetForm]);

  const loadRoles = async () => {
    try {
      const response = await adminService.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleChange = (value: string | number | (string | number)[]) => {
    const roleIds = Array.isArray(value) ? value.map(v => Number(v)) : [Number(value)];
    setFormData(prev => ({
      ...prev,
      role_ids: roleIds
    }));
  };
  
  const downloadTemplate = async () => {
    try {
      const blob = await adminService.downloadUsersTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_template.csv';
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
    
    setImporting(true);
    try {
      const response = await adminService.importUsers(file);
      if (response.success && onImport) {
        onImport([]);
      }
    } catch (error) {
      console.error('Error importing file:', error);
    } finally {
      setImporting(false);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {user ? 'Edit User' : 'Add New User'}
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
            disabled={importing}
            className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <div className="animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            {importing ? 'Importing...' : 'Import'}
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Roles
            </label>
            <SearchableDropdown
              options={roles.map(role => ({ value: role.id, label: role.name }))}
              value={formData.role_ids}
              onChange={handleRoleChange}
              placeholder="Select roles..."
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
            {user ? 'Update' : 'Create'}
          </button>
        </div>
        </form>
      )}
    </div>
  );
};

export default UserForm;