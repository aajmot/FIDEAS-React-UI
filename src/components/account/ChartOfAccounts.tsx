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
    if (account.is_system_account) return;
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
    if (account.is_system_account) return;
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
            {Math.abs(balance).toLocaleString()}
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
    },
    {
      key: 'is_system_account',
      label: 'System',
      render: (value: boolean) => (
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
      <ChartOfAccountsForm
        account={editingAccount}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Chart of Accounts"
        columns={columns}
        data={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={(row) => !row.is_system_account}
        canDelete={(row) => !row.is_system_account}
        loading={loading}
        onRefresh={loadAccounts}
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

export default ChartOfAccounts;