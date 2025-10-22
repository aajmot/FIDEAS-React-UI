import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { adminService } from '../../services/api';

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface RoleFormProps {
  role?: Role;
  onSave: (roleData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onImport?: (data: any[]) => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ role, onSave, onCancel, isCollapsed, onToggleCollapse, resetForm, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    is_active: role?.is_active ?? true
  });
  
  React.useEffect(() => {
    if (resetForm && !role) {
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    } else if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        is_active: role.is_active
      });
    }
  }, [role, resetForm]);

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
  
  const downloadTemplate = async () => {
    try {
      const blob = await adminService.downloadRolesTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'roles_template.csv';
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
      const response = await adminService.importRoles(file);
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
          {role ? 'Edit Role' : 'Add New Role'}
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
                Role Name
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
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
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

            {/* Empty placeholder to complete 4 columns */}
            <div></div>
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
              {role ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RoleForm;