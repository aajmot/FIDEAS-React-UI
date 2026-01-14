import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Upload, Download, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { departmentService } from '../../services/modules/people/departmentService';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Department } from '../../types';

interface DepartmentFormData {
  department_code: string;
  department_name: string;
  description: string;
  parent_department_id: number | null;
  branch_id: number | null;
  default_cost_center_id: number | null;
  org_unit_type: string;
  status: string;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [parentDepartments, setParentDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const [formData, setFormData] = useState<DepartmentFormData>({
    department_code: '',
    department_name: '',
    description: '',
    parent_department_id: null,
    branch_id: null,
    default_cost_center_id: null,
    org_unit_type: 'DIVISION',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchDepartments();
    fetchActiveDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentService.getDepartments({ per_page: 100 });
      setDepartments(response.data || []);
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDepartments = async () => {
    try {
      const response = await departmentService.getActiveDepartments();
      setParentDepartments(response.data || []);
    } catch (error) {
      console.log('Failed to load active departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.department_code || !formData.department_name) {
      showToast('error', 'Code and Name are required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        parent_department_id: formData.parent_department_id || undefined,
        branch_id: formData.branch_id || undefined,
        default_cost_center_id: formData.default_cost_center_id || undefined
      };

      if (editingId) {
        await departmentService.updateDepartment(editingId, submitData);
        showToast('success', 'Department updated successfully');
      } else {
        await departmentService.createDepartment(submitData);
        showToast('success', 'Department created successfully');
      }
      
      resetForm();
      fetchDepartments();
      fetchActiveDepartments();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail))
        : 'Error saving department';
      showToast('error', errorMsg);
    }
  };

  const handleEdit = (dept: Department) => {
    setFormData({
      department_code: dept.department_code,
      department_name: dept.department_name,
      description: dept.description || '',
      parent_department_id: dept.parent_department_id || null,
      branch_id: dept.branch_id || null,
      default_cost_center_id: dept.default_cost_center_id || null,
      org_unit_type: dept.org_unit_type || 'DIVISION',
      status: dept.status
    });
    setEditingId(dept.id);
    setIsFormCollapsed(false);
  };

  const handleDelete = async (dept: Department) => {
    showConfirmation(
      {
        title: 'Delete Department',
        message: `Are you sure you want to delete department "${dept.department_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await departmentService.deleteDepartment(dept.id);
          showToast('success', 'Department deleted successfully');
          fetchDepartments();
          fetchActiveDepartments();
        } catch (error: any) {
          const errorMsg = error.response?.data?.detail 
            ? (typeof error.response.data.detail === 'string' 
              ? error.response.data.detail 
              : JSON.stringify(error.response.data.detail))
            : 'Error deleting department';
          showToast('error', errorMsg);
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      department_code: '',
      department_name: '',
      description: '',
      parent_department_id: null,
      branch_id: null,
      default_cost_center_id: null,
      org_unit_type: 'DIVISION',
      status: 'ACTIVE'
    });
    setEditingId(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await departmentService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'departments_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('success', 'Template downloaded successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : 'Error downloading template')
        : 'Error downloading template';
      showToast('error', errorMsg);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await departmentService.importDepartments(file);
      showToast('success', 'Departments imported successfully');
      fetchDepartments();
      fetchActiveDepartments();
      e.target.value = '';
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail))
        : 'Error importing departments';
      showToast('error', errorMsg);
      e.target.value = '';
    }
  };

  const columns = [
    { key: 'department_code', label: 'Code', sortable: true },
    { key: 'department_name', label: 'Name', sortable: true },
    { key: 'org_unit_type', label: 'Unit Type', sortable: true },
    { key: 'parent_department_id', label: 'Parent Department', sortable: true, render: (value: string) => value || '-' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value ? '#dcfce7' : '#fef3c7',
          color: value ? '#166534' : '#854d0e'
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Department) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
            {editingId ? 'Edit Department' : 'Add New Department'}
          </h2>
          <div className="flex items-center" style={{ gap: 'var(--erp-spacing-sm)' }}>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="erp-form-btn erp-btn-template"
            >
              <Download className="erp-form-btn-icon" />
              Template
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('import-file')?.click()}
              className="erp-form-btn erp-btn-import"
            >
              <Upload className="erp-form-btn-icon" />
              Import
            </button>
            <input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
            <button type="button" onClick={() => setIsFormCollapsed(!isFormCollapsed)} className="text-gray-500 hover:text-gray-700">
              {isFormCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
            </button>
          </div>
        </div>

        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-6" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.department_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, department_code: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.department_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, department_name: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Parent Department</label>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'None' },
                    ...parentDepartments
                      .filter(d => d.id !== editingId)
                      .map(d => ({ value: d.id.toString(), label: d.department_name }))
                  ]}
                  value={formData.parent_department_id?.toString() || ''}
                  onChange={(v) => setFormData(prev => ({ ...prev, parent_department_id: v ? Number(v) : null }))}
                  placeholder="Select parent"
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)' }}>
              <button type="button" onClick={resetForm} className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200">
                {editingId ? 'Cancel' : 'Reset'}
              </button>
              <button type="submit" className="erp-form-btn text-white bg-primary hover:bg-secondary">
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable title="Departments" data={departments} columns={columns} loading={loading} />
      
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

export default DepartmentManagement;
