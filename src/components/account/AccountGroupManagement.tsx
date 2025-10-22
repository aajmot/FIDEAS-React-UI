import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SearchableDropdown from '../common/SearchableDropdown';

const AccountGroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
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

  useEffect(() => {
    loadGroups();
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
    if (!window.confirm(`Are you sure you want to delete account group "${group.name}"? This will fail if accounts exist under this group.`)) {
      return;
    }
    try {
      await accountService.deleteAccountGroup(group.id);
      showToast('success', 'Account group deleted successfully');
      loadGroups();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to delete account group. It may have accounts under it.');
    }
  };

  const renderGroupTree = (parentId: number | null = null, level: number = 0) => {
    return groups
      .filter(g => g.parent_id === parentId)
      .map(group => (
        <div key={group.id}>
          <div 
            className={`flex items-center justify-between p-3 border-b hover:bg-gray-50`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => handleEdit(group)}>
              <span className="text-sm font-medium text-gray-900">{group.name}</span>
              <span className="text-xs text-gray-500">({group.code})</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                group.account_type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                group.account_type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                group.account_type === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
                group.account_type === 'INCOME' ? 'bg-green-100 text-green-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {group.account_type}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(group);
              }}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              title="Delete Group"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {renderGroupTree(group.id, level + 1)}
        </div>
      ));
  };

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
                  options={[
                    { value: 'ASSET', label: 'Asset' },
                    { value: 'LIABILITY', label: 'Liability' },
                    { value: 'EQUITY', label: 'Equity' },
                    { value: 'INCOME', label: 'Income' },
                    { value: 'EXPENSE', label: 'Expense' }
                  ]}
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

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Account Group Hierarchy</h2>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No account groups found</div>
          ) : (
            renderGroupTree()
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountGroupManagement;
