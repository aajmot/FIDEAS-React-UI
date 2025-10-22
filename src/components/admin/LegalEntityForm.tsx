import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { adminService } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

interface LegalEntity {
  id: number;
  name: string;
  code: string;
  registration_number: string;
  address: string;
  logo: string;
  admin_user_id: number;
  is_active: boolean;
}

interface LegalEntityFormProps {
  entity?: LegalEntity;
  onSave: (entityData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onImport?: () => void;
}

const LegalEntityForm: React.FC<LegalEntityFormProps> = ({ 
  entity, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: entity?.name || '',
    code: entity?.code || '',
    registration_number: entity?.registration_number || '',
    address: entity?.address || '',
    logo: entity?.logo || '',
    admin_user_id: entity?.admin_user_id || '',
    is_active: entity?.is_active ?? true
  });
  const [users, setUsers] = useState<any[]>([]);
  
  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (resetForm && !entity) {
      setFormData({
        name: '',
        code: '',
        registration_number: '',
        address: '',
        logo: '',
        admin_user_id: '',
        is_active: true
      });
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    } else if (entity) {
      setFormData({
        name: entity.name,
        code: entity.code,
        registration_number: entity.registration_number,
        address: entity.address,
        logo: entity.logo,
        admin_user_id: entity.admin_user_id,
        is_active: entity.is_active
      });
    }
  }, [entity, resetForm]);

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserChange = (value: string | number | (string | number)[]) => {
    const userId = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({
      ...prev,
      admin_user_id: userId
    }));
  };

  const downloadTemplate = async () => {
    try {
      const blob = await adminService.downloadLegalEntitiesTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'legal_entities_template.csv';
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
      await adminService.importLegalEntities(file);
      if (onImport) onImport();
    } catch (error) {
      console.error('Error importing file:', error);
    } finally {
      setImporting(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file.name
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {entity ? 'Edit Legal Entity' : 'Add New Legal Entity'}
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
                Entity Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Entity Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin User
              </label>
              <SearchableDropdown
                options={users.map(user => ({
                  value: user.id,
                  label: `${user.username} - ${user.first_name} ${user.last_name}`
                }))}
                value={formData.admin_user_id}
                onChange={handleUserChange}
                placeholder="Select admin user..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter full address..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Logo
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
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
              {entity ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LegalEntityForm;