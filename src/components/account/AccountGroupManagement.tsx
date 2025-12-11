import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import SearchableDropdown from '../common/SearchableDropdown';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';

const AccountGroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_id: '',
    account_type: 'ASSET'
  });
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadGroups();
    loadAccountTypes();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await accountService.getAccountGroups();
      setGroups(response.data);
    } catch (error) {
      showToast('error', 'Failed to load account groups');
    } finally {
      setLoading(false);
    }
  };

  const loadAccountTypes = async () => {
    try {
      const response = await accountService.getAccountTypes();
      setAccountTypes(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load account types');
      // Fallback to default types if API fails
      setAccountTypes([
        { value: 'ASSET' },
        { value: 'LIABILITY' },
        { value: 'EQUITY' },
        { value: 'INCOME' },
        { value: 'EXPENSE' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await accountService.updateAccountGroup(editingGroup.id, formData);
        showToast('success', 'Account group updated successfully');
      } else {
        await accountService.createAccountGroup(formData);
        showToast('success', 'Account group created successfully');
      }
      resetForm();
      loadGroups();
    } catch (error) {
      showToast('error', 'Failed to save account group');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', parent_id: '', account_type: 'ASSET' });
    setEditingGroup(null);
  };

  const handleEdit = (group: any) => {
    if (group.is_system_assigned) return;
    setEditingGroup(group);
    setFormData({
      name: group.name,
      code: group.code,
      parent_id: group.parent_id || '',
      account_type: group.account_type
    });
    setIsFormCollapsed(false);
  };
  
  const handleDelete = async (group: any) => {
    if (group.is_system_assigned) return;
    showConfirmation(
      {
        title: 'Delete Account Group',
        message: `Are you sure you want to delete account group "${group.name}"? This will fail if accounts exist under this group.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await accountService.deleteAccountGroup(group.id);
          showToast('success', 'Account group deleted successfully');
          loadGroups();
        } catch (error: any) {
          showToast('error', error.response?.data?.detail || 'Failed to delete account group. It may have accounts under it.');
        }
      }
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Group Name',
      render: (value: any, row: any) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'code',
      label: 'Code',
      render: (value: any) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      key: 'account_type',
      label: 'Type',
      render: (value: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'ASSET' ? 'bg-blue-100 text-blue-800' :
          value === 'LIABILITY' ? 'bg-red-100 text-red-800' :
          value === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
          value === 'INCOME' ? 'bg-green-100 text-green-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'parent_name',
      label: 'Parent Group',
      render: (value: any) => value || '-'
    },
    {
      key: 'is_system_assigned',
      label: 'System',
      render: (value: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingGroup ? 'Edit Account Group' : 'Add New Account Group'}
          </h2>
          <button
            type="button"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
        
        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <SearchableDropdown
                  options={accountTypes.map(type => ({
                    value: type.value,
                    label: type.value
                  }))}
                  value={formData.account_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, account_type: value as string }))}
                  placeholder="Select type..."
                  multiple={false}
                  searchable={false}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Parent Group
                </label>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'None (Root Level)' },
                    ...groups.map(g => ({ value: g.id, label: `${g.name} (${g.code})` }))
                  ]}
                  value={formData.parent_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, parent_id: value as string }))}
                  placeholder="Select parent..."
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
                {editingGroup ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      <DataTable
        title="Account Groups"
        columns={columns}
        data={groups}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={(row) => !row.is_system_assigned}
        canDelete={(row) => !row.is_system_assigned}
        loading={loading}
        onRefresh={loadGroups}
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

export default AccountGroupManagement;
