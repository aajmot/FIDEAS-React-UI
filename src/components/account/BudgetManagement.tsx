import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import { useToast } from '../../context/ToastContext';

interface Budget {
  id: number;
  name: string;
  fiscal_year_id: number;
  account_id: number;
  cost_center_id?: number;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  status: string;
}

const BudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', fiscal_year_id: '', account_id: '', cost_center_id: '', budget_amount: '', status: 'DRAFT' });
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchFiscalYears();
    fetchAccounts();
    fetchCostCenters();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/account/budgets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setBudgets(result.data);
      }
    } catch (error) {
      showToast('error', 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiscalYears = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/admin/financial-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setFiscalYears(result.data);
      }
    } catch (error) {}
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/account/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setAccounts(result.data);
      }
    } catch (error) {}
  };

  const fetchCostCenters = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/account/cost-centers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setCostCenters(result.data);
      }
    } catch (error) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.fiscal_year_id || !formData.account_id || !formData.budget_amount) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ...formData,
        fiscal_year_id: parseInt(formData.fiscal_year_id),
        account_id: parseInt(formData.account_id),
        cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : null,
        budget_amount: parseFloat(formData.budget_amount)
      };
      const url = editingId 
        ? `/api/v1/account/budgets/${editingId}`
        : '/api/v1/account/budgets';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        showToast('success', `Budget ${editingId ? 'updated' : 'created'} successfully`);
        fetchBudgets();
        resetForm();
      } else {
        showToast('error', result.message || 'Operation failed');
      }
    } catch (error) {
      showToast('error', 'Failed to save budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setFormData({
      name: budget.name,
      fiscal_year_id: budget.fiscal_year_id.toString(),
      account_id: budget.account_id.toString(),
      cost_center_id: budget.cost_center_id?.toString() || '',
      budget_amount: budget.budget_amount.toString(),
      status: budget.status
    });
    setIsFormCollapsed(false);
  };

  const handleDelete = async (budget: Budget) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/v1/account/budgets/${budget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        showToast('success', 'Budget deleted successfully');
        fetchBudgets();
      } else {
        showToast('error', result.message || 'Failed to delete');
      }
    } catch (error) {
      showToast('error', 'Failed to delete budget');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', fiscal_year_id: '', account_id: '', cost_center_id: '', budget_amount: '', status: 'DRAFT' });
    setEditingId(null);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/account/budgets/export-template', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'budgets_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showToast('error', 'Failed to download template');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showToast('error', 'Not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/account/budgets/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success) {
        showToast('success', result.message || 'Import successful');
        fetchBudgets();
      } else {
        showToast('error', result.message || 'Import failed');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to import');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { 
      key: 'budget_amount', 
      label: 'Budget Amount',
      render: (value: number) => value.toFixed(2)
    },
    { 
      key: 'actual_amount', 
      label: 'Actual Amount',
      render: (value: number) => value.toFixed(2)
    },
    { 
      key: 'variance', 
      label: 'Variance',
      render: (value: number) => (
        <span className={value < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
          {value.toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${value === 'APPROVED' ? 'bg-green-100 text-green-800' : value === 'CLOSED' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Budget' : 'Add New Budget'}
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
              onChange={handleImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="text-gray-500 hover:text-gray-700"
            >
              {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fiscal Year
                </label>
                <SearchableDropdown
                  options={fiscalYears.map(fy => ({ value: fy.id, label: fy.name }))}
                  value={formData.fiscal_year_id}
                  onChange={(value) => setFormData({ ...formData, fiscal_year_id: value as string })}
                  placeholder="Select Fiscal Year"
                  multiple={false}
                  searchable={true}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account
                </label>
                <SearchableDropdown
                  options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                  value={formData.account_id}
                  onChange={(value) => setFormData({ ...formData, account_id: value as string })}
                  placeholder="Select Account"
                  multiple={false}
                  searchable={true}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cost Center
                </label>
                <SearchableDropdown
                  options={[{ value: '', label: 'None' }, ...costCenters.map(cc => ({ value: cc.id, label: cc.name }))]}
                  value={formData.cost_center_id}
                  onChange={(value) => setFormData({ ...formData, cost_center_id: value as string })}
                  placeholder="Select Cost Center"
                  multiple={false}
                  searchable={true}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Budget Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget_amount}
                  onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <SearchableDropdown
                  options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'CLOSED', label: 'Closed' }
                  ]}
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as string })}
                  placeholder="Select Status"
                  multiple={false}
                  searchable={true}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable
        title="Budgets"
        columns={columns}
        data={budgets}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
};

export default BudgetManagement;
