import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Upload, Download, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import ConfirmationModal from '../common/ConfirmationModal';
import { employeeService } from '../../services/modules/people/employeeService';
import { departmentService } from '../../services/modules/people/departmentService';
import { roleService } from '../../services/modules/admin';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Employee, Department } from '../../types';

interface EmployeeFormData {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: number | null;
  branch_id: number | null;
  qualification: string;
  specialization: string;
  license_number: string;
  license_expiry: string;
  employee_type: string;
  employment_type: string;
  status: string;
  remarks: string;
  create_user: boolean;
  username?: string;
  password?: string;
  role_ids?: number[];
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const generateEmployeeCode = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    const tenantId = 1; // Get from auth context if available
    return `E-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_code: generateEmployeeCode(),
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: null,
    branch_id: null,
    qualification: '',
    specialization: '',
    license_number: '',
    license_expiry: '',
    employee_type: 'OTHERS',
    employment_type: 'INTERNAL',
    status: 'ACTIVE',
    remarks: '',
    create_user: false,
    username: '',
    password: '',
    role_ids: []
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getEmployees({ per_page: 100 });
      setEmployees(response.data || []);
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getActiveDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.log('Failed to load departments');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles({ per_page: 100 });
      setRoles(response.data || []);
    } catch (error) {
      console.log('Failed to load roles');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_code || !formData.first_name || !formData.last_name || !formData.email) {
      showToast('error', 'Employee Code, First Name, Last Name, and Email are required');
      return;
    }

    try {
      const submitData: any = {
        employee_code: formData.employee_code,
        employee_name: `${formData.first_name} ${formData.last_name}`.trim(),
        employee_type: formData.employee_type,
        phone: formData.phone || undefined,
        email: formData.email,
        qualification: formData.qualification || undefined,
        specialization: formData.specialization || undefined,
        license_number: formData.license_number || undefined,
        license_expiry: formData.license_expiry || undefined,
        employment_type: formData.employment_type,
        status: formData.status,
        remarks: formData.remarks || undefined,
        branch_id: formData.branch_id || undefined,
        department_id: formData.department_id || undefined,
        create_user: formData.create_user
      };

      if (formData.create_user && !editingId) {
        submitData.user_data = {
          username: formData.username || formData.email,
          password: formData.password,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_ids: formData.role_ids || []
        };
      }

      if (editingId) {
        await employeeService.updateEmployee(editingId, submitData);
        showToast('success', 'Employee updated successfully');
      } else {
        await employeeService.createEmployee(submitData);
        showToast('success', 'Employee created successfully');
      }
      
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail))
        : 'Error saving employee';
      showToast('error', errorMsg);
    }
  };

  const handleEdit = (emp: Employee) => {
    const nameParts = emp.employee_name?.split(' ') || ['', ''];
    setFormData({
      employee_code: emp.employee_code,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: emp.email,
      phone: emp.phone || '',
      department_id: emp.department_id || null,
      branch_id: null,
      qualification: emp.qualification || '',
      specialization: emp.specialization || '',
      license_number: emp.license_number || '',
      license_expiry: emp.license_expiry || '',
      employee_type: emp.employee_type || 'OTHERS',
      employment_type: emp.employment_type || 'INTERNAL',
      status: emp.status,
      remarks: emp.remarks || '',
      create_user: false,
      username: '',
      password: '',
      role_ids: []
    });
    setEditingId(emp.id);
    setIsFormCollapsed(false);
  };

  const handleDelete = async (emp: Employee) => {
    showConfirmation(
      {
        title: 'Delete Employee',
        message: `Are you sure you want to delete employee "${emp.employee_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await employeeService.deleteEmployee(emp.id);
          showToast('success', 'Employee deleted successfully');
          fetchEmployees();
        } catch (error: any) {
          const errorMsg = error.response?.data?.detail 
            ? (typeof error.response.data.detail === 'string' 
              ? error.response.data.detail 
              : JSON.stringify(error.response.data.detail))
            : 'Error deleting employee';
          showToast('error', errorMsg);
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      employee_code: generateEmployeeCode(),
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: null,
      branch_id: null,
      qualification: '',
      specialization: '',
      license_number: '',
      license_expiry: '',
      employee_type: 'OTHERS',
      employment_type: 'INTERNAL',
      status: 'ACTIVE',
      remarks: '',
      create_user: false,
      username: '',
      password: '',
      role_ids: []
    });
    setEditingId(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await employeeService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employees_template.csv';
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
      await employeeService.importEmployees(file);
      showToast('success', 'Employees imported successfully');
      fetchEmployees();
      e.target.value = '';
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail 
        ? (typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail))
        : 'Error importing employees';
      showToast('error', errorMsg);
      e.target.value = '';
    }
  };

  const columns = [
    { key: 'employee_code', label: 'Code', sortable: true },
    { key: 'employee_name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true, render: (value: string) => value || '-' },
    { key: 'department_name', label: 'Department', sortable: true, render: (value: string) => value || '-' },
    { key: 'employee_type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
          color: value === 'ACTIVE' ? '#166534' : '#854d0e'
        }}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (value: any, row: Employee) => (
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
            {editingId ? 'Edit Employee' : 'Add New Employee'}
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee Code *</label>
                <input
                  type="text"
                  value={formData.employee_code}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'None' },
                    ...departments.map(d => ({ value: d.id.toString(), label: d.department_name }))
                  ]}
                  value={formData.department_id?.toString() || ''}
                  onChange={(v) => setFormData(prev => ({ ...prev, department_id: v ? Number(v) : null }))}
                  placeholder="Select department"
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">License Expiry</label>
                <DatePicker
                  value={formData.license_expiry}
                  onChange={(value) => setFormData(prev => ({ ...prev, license_expiry: value }))}
                  placeholder="Select date"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee Type</label>
                <select
                  value={formData.employee_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_type: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                >
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                  <option value="CONSULTANT">Consultant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
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

              {!editingId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Create User</label>
                  <div className="flex items-center h-9">
                    <input
                      type="checkbox"
                      checked={formData.create_user}
                      onChange={(e) => setFormData(prev => ({ ...prev, create_user: e.target.checked }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-xs text-gray-700">Create user account</span>
                  </div>
                </div>
              )}
            </div>

            {formData.create_user && !editingId && (
              <div className="grid grid-cols-1 sm:grid-cols-6" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Leave empty to use email"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    required={formData.create_user}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Roles</label>
                  <SearchableDropdown
                    options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                    value={formData.role_ids?.map(id => id.toString()) || []}
                    onChange={(v) => setFormData(prev => ({ ...prev, role_ids: Array.isArray(v) ? v.map(Number) : [Number(v)] }))}
                    placeholder="Select roles"
                    multiple={true}
                    searchable={true}
                  />
                </div>
              </div>
            )}

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

      <DataTable title="Employees" data={employees} columns={columns} loading={loading} />
      
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

export default EmployeeManagement;
