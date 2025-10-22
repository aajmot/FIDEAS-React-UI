import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Save } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';

interface AccountTypeMapping {
  id: number;
  account_type: string;
  account_id: number;
  account_name: string;
  account_code: string;
}

interface Account {
  id: number;
  name: string;
  code: string;
  group_name: string;
}

const ACCOUNT_TYPES = [
  { value: 'ACCOUNTS_RECEIVABLE', label: 'Accounts Receivable' },
  { value: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable' },
  { value: 'SALES_REVENUE', label: 'Sales Revenue' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'COGS', label: 'Cost of Goods Sold' },
  { value: 'TAX_PAYABLE', label: 'Tax Payable' },
  { value: 'PHARMACY_REVENUE', label: 'Pharmacy Revenue' },
  { value: 'DIAGNOSTIC_REVENUE', label: 'Diagnostic Revenue' }
];

const AccountTypeMappings: React.FC = () => {
  const [mappings, setMappings] = useState<AccountTypeMapping[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mappingsRes, accountsRes] = await Promise.all([
        adminService.getAccountTypeMappings(),
        adminService.getAccounts()
      ]);
      setMappings(mappingsRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (accountType: string, accountId: number) => {
    setMappings(prev => {
      const existing = prev.find(m => m.account_type === accountType);
      const account = accounts.find(a => a.id === accountId);
      
      if (existing) {
        return prev.map(m => 
          m.account_type === accountType 
            ? { ...m, account_id: accountId, account_name: account?.name || '', account_code: account?.code || '' }
            : m
        );
      } else {
        return [...prev, {
          id: 0,
          account_type: accountType,
          account_id: accountId,
          account_name: account?.name || '',
          account_code: account?.code || ''
        }];
      }
    });
  };

  const handleSave = async (accountType: string) => {
    const mapping = mappings.find(m => m.account_type === accountType);
    if (!mapping) return;

    try {
      await adminService.updateAccountTypeMapping(accountType, { account_id: mapping.account_id });
      showToast('success', 'Mapping saved successfully');
      loadData();
    } catch (error) {
      showToast('error', 'Failed to save mapping');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Account Type Mappings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Map abstract account types to specific accounts in your chart of accounts
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {ACCOUNT_TYPES.map(type => {
              const mapping = mappings.find(m => m.account_type === type.value);
              return (
                <div key={type.value} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Type
                      </label>
                      <input
                        type="text"
                        value={type.label}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mapped Account
                      </label>
                      <SearchableDropdown
                        options={accounts.map(acc => ({
                          value: acc.id.toString(),
                          label: `${acc.code} - ${acc.name}`
                        }))}
                        value={mapping?.account_id?.toString() || ''}
                        onChange={(value) => handleMappingChange(type.value, parseInt(value as string))}
                        placeholder="Select account..."
                        searchable={true}
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => handleSave(type.value)}
                        disabled={!mapping}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeMappings;
