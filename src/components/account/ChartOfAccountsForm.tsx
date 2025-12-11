import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import FormCheckbox from '../common/FormCheckbox';
import { accountService } from '../../services/api';
import { Account } from '../../types';

interface ChartOfAccountsFormProps {
  account?: Account;
  onSave: (accountData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const ChartOfAccountsForm: React.FC<ChartOfAccountsFormProps> = ({ 
  account, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const [accountGroups, setAccountGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: account?.code || '',
    name: account?.name || '',
    account_group_id: account?.account_group_id || '',
    opening_balance: account?.opening_balance || 0,
    is_active: account?.is_active ?? true
  });

  useEffect(() => {
    loadAccountGroups();
  }, []);

  useEffect(() => {
    if (resetForm && !account) {
      setFormData({
        code: '',
        name: '',
        account_group_id: '',
        opening_balance: 0,
        is_active: true
      });
    } else if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        account_group_id: account.account_group_id || '',
        opening_balance: account.opening_balance || 0,
        is_active: account.is_active
      });
    }
  }, [account, resetForm]);

  const loadAccountGroups = async () => {
    try {
      const response = await accountService.getAccountGroups();
      setAccountGroups(response.data);
    } catch (error) {
      console.error('Error loading account groups:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.account_group_id) {
      alert('Please select an account group');
      return;
    }
    
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {account ? 'Edit Account' : 'Add New Account'}
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Account Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                disabled={!!account}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Account Name
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
                Account Group *
              </label>
              <SearchableDropdown
                options={accountGroups.map(group => ({ 
                  value: group.id, 
                  label: `${group.name} (${group.account_type})` 
                }))}
                value={formData.account_group_id}
                onChange={(value) => setFormData(prev => ({ ...prev, account_group_id: value as string }))}
                placeholder="Select account group..."
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Opening Balance
              </label>
              <input
                type="number"
                name="opening_balance"
                value={formData.opening_balance}
                onChange={handleChange}
                step="0.01"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <FormCheckbox
                checked={formData.is_active}
                onChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                label="Active"
              />
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
              {account ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChartOfAccountsForm;