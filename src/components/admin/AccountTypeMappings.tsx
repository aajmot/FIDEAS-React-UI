import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Save, Trash2 } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';

interface AccountConfiguration {
  id: number;
  config_key: string;
  account_id: number;
  account_name?: string;
  account_code?: string;
  module?: string;
}

interface Account {
  id: number;
  name: string;
  code: string;
  group_name: string;
}

interface ConfigurationKey {
  id: number;
  code: string;
  name: string;
  description?: string;
  default_account_id?: number;
  is_active: boolean;
}

const MODULES = [
  { value: '', label: 'General' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SALES', label: 'Sales' },
  { value: 'INVENTORY', label: 'Inventory' }
];

const AccountTypeMappings: React.FC = () => {
  const [configurations, setConfigurations] = useState<AccountConfiguration[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [configurationKeys, setConfigurationKeys] = useState<ConfigurationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configurationsRes, accountsRes, configKeysRes] = await Promise.all([
        adminService.getAccountConfigurations(),
        adminService.getAccounts(),
        adminService.getAccountConfigurationKeys()
      ]);
      
      console.log('Configurations Response:', configurationsRes);
      console.log('Accounts Response:', accountsRes);
      console.log('Config Keys Response:', configKeysRes);
      
      setConfigurations(configurationsRes.data || []);
      setAccounts(accountsRes.data || []);
      // Config keys response has 'items' property instead of 'data'
      setConfigurationKeys((configKeysRes as any).items || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationChange = (configKey: string, accountId: number, module?: string) => {
    setConfigurations(prev => {
      const existing = prev.find(c => c.config_key === configKey && c.module === module);
      const account = accounts.find(a => a.id === accountId);
      
      if (existing) {
        return prev.map(c => 
          (c.config_key === configKey && c.module === module)
            ? { ...c, account_id: accountId, account_name: account?.name || '', account_code: account?.code || '' }
            : c
        );
      } else {
        return [...prev, {
          id: 0,
          config_key: configKey,
          account_id: accountId,
          account_name: account?.name || '',
          account_code: account?.code || '',
          module: module
        }];
      }
    });
  };

  const handleSave = async (configKey: string, module?: string) => {
    const configuration = configurations.find(c => c.config_key === configKey && c.module === module);
    if (!configuration) return;

    try {
      await adminService.updateAccountConfiguration(configKey, { 
        account_id: configuration.account_id,
        module: module || undefined
      });
      showToast('success', 'Configuration saved successfully');
      loadData();
    } catch (error) {
      showToast('error', 'Failed to save configuration');
    }
  };

  const handleDelete = async (configId: number) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await adminService.deleteAccountConfiguration(configId);
      showToast('success', 'Configuration deleted successfully');
      loadData();
    } catch (error) {
      showToast('error', 'Failed to delete configuration');
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
          <h2 className="text-lg font-semibold text-gray-900">Account Configurations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure account mappings for different configuration keys and modules
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {configurationKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No configuration keys found.</p>
                <p className="text-sm mt-2">Please check the API or add configuration keys in the backend.</p>
              </div>
            ) : (
              configurationKeys.map(type => {
                return (
                  <div key={type.code} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">{type.name}</h3>
                      {type.description && (
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      )}
                    </div>
                    {MODULES.map(module => {
                      const configuration = configurations.find(
                        c => c.config_key === type.code && (c.module || '') === module.value
                      );
                      return (
                        <div key={`${type.code}-${module.value}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-3 pb-3 border-b border-gray-100 last:border-0">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Module
                            </label>
                            <input
                              type="text"
                              value={module.label}
                              disabled
                              className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-gray-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Mapped Account
                            </label>
                            <SearchableDropdown
                              options={accounts.map(acc => ({
                                value: acc.id.toString(),
                                label: `${acc.code} - ${acc.name}`
                              }))}
                              value={configuration?.account_id?.toString() || ''}
                              onChange={(value) => handleConfigurationChange(type.code, parseInt(value as string), module.value || undefined)}
                              placeholder="Select account..."
                              searchable={true}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(type.code, module.value || undefined)}
                              disabled={!configuration}
                              className="flex items-center px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </button>
                            {configuration && configuration.id > 0 && (
                              <button
                                onClick={() => handleDelete(configuration.id)}
                                className="flex items-center px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeMappings;
