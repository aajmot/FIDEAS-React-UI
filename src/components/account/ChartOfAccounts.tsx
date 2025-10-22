import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import ChartOfAccountsForm from './ChartOfAccountsForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Account } from '../../types';

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountService.getAccounts();
      setAccounts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
  };

  const handleSave = async (accountData: any) => {
    try {
      if (editingAccount) {
        await accountService.updateAccount(editingAccount.id, accountData);
        showToast('success', 'Account updated successfully');
      } else {
        await accountService.createAccount(accountData);
        showToast('success', 'Account created successfully');
      }
      setEditingAccount(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadAccounts();
    } catch (error) {
      showToast('error', 'Failed to save account');
    }
  };

  const handleCancel = () => {
    setEditingAccount(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (account: Account) => {
    showConfirmation(
      {
        title: 'Delete Account',
        message: `Are you sure you want to delete account "${account.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await accountService.deleteAccount(account.id);
          showToast('success', 'Account deleted successfully');
          loadAccounts();
        } catch (error) {
          showToast('error', 'Failed to delete account');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account Name' },
    { key: 'account_group_name', label: 'Account Group' },
    { 
      key: 'account_type', 
      label: 'Type',
      render: (value: string) => (
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
      key: 'current_balance', 
      label: 'Balance', 
      render: (value: number) => {
        const balance = value || 0;
        return (
          <span className={`font-semibold ${
            balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            ₹{Math.abs(balance).toLocaleString()}
            {balance !== 0 && (
              <span className="text-xs ml-1">
                {balance > 0 ? 'Dr' : 'Cr'}
              </span>
            )}
          </span>
        );
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const renderAccountTree = (groupName: string, accountType: string) => {
    const groupAccounts = accounts.filter(acc => 
      acc.account_group_name === groupName && acc.account_type === accountType
    );
    
    if (groupAccounts.length === 0) return null;
    
    return (
      <div key={groupName} className="mb-4">
        <div className="bg-gray-100 px-4 py-2 font-semibold text-sm">
          {groupName}
        </div>
        {groupAccounts.map(account => (
          <div 
            key={account.id}
            className="flex items-center justify-between px-6 py-2 border-b hover:bg-gray-50 cursor-pointer"
            onClick={() => handleEdit(account)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 w-16">{account.code}</span>
              <span className="text-sm">{account.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-semibold ${
                (account.current_balance || 0) > 0 ? 'text-green-600' : 
                (account.current_balance || 0) < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {Math.abs(account.current_balance || 0).toLocaleString()}
                {(account.current_balance || 0) !== 0 && (
                  <span className="text-xs ml-1">
                    {(account.current_balance || 0) > 0 ? 'Dr' : 'Cr'}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderTreeView = () => {
    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
    const uniqueGroups = Array.from(new Set(accounts.map(acc => acc.account_group_name).filter(Boolean)));
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Account Hierarchy</h2>
        </div>
        <div className="p-4">
          {accountTypes.map(type => {
            const typeGroups = uniqueGroups.filter(group => 
              accounts.some(acc => acc.account_group_name === group && acc.account_type === type)
            );
            
            if (typeGroups.length === 0) return null;
            
            return (
              <div key={type} className="mb-6">
                <div className={`px-4 py-2 font-bold text-white rounded-t ${
                  type === 'ASSET' ? 'bg-blue-600' :
                  type === 'LIABILITY' ? 'bg-red-600' :
                  type === 'EQUITY' ? 'bg-purple-600' :
                  type === 'INCOME' ? 'bg-green-600' : 'bg-orange-600'
                }`}>
                  {type}
                </div>
                <div className="border border-t-0 rounded-b">
                  {typeGroups.map(group => group && renderAccountTree(group, type))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6">
      <ChartOfAccountsForm
        account={editingAccount}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm font-medium border ${
              viewMode === 'table' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } rounded-l-lg`}
          >
            Table View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
              viewMode === 'tree' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } rounded-r-lg`}
          >
            Hierarchy View
          </button>
        </div>
      </div>
      
      {viewMode === 'table' ? (
          <DataTable
          title="Chart of Accounts"
          columns={columns}
          data={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      ) : (
        renderTreeView()
      )}
      
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

export default ChartOfAccounts;