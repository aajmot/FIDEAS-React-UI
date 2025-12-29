import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Save } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';

interface TemplateRule {
  id?: number;
  line_number: number;
  account_type: string;
  account_id?: number;
  account_name?: string;
  entry_type: string;
  amount_source: string;
  narration: string;
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

interface Template {
  id: number;
  name: string;
  code: string;
  transaction_type: string;
  description: string;
  is_active: boolean;
  rules: TemplateRule[];
}

const TransactionTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [configurationKeys, setConfigurationKeys] = useState<ConfigurationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadAccounts();
    loadAccountTypes();
    loadConfigurationKeys();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await adminService.getAccounts();
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Failed to load accounts');
    }
  };

  const loadAccountTypes = async () => {
    try {
      const response = await adminService.getAccountTypes();
      setAccountTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load account types');
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

  const loadConfigurationKeys = async () => {
    try {
      const response = await adminService.getAccountConfigurationKeys();
      console.log('Config Keys Response:', response);
      // API returns data in 'items' property
      setConfigurationKeys((response as any).items || []);
    } catch (error: any) {
      console.warn('Configuration keys endpoint not available:', error.message);
      // Silently fail - this is optional data
      // Don't show error toast as it's not critical for the page to function
      setConfigurationKeys([]);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTransactionTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateRules = async (templateId: number) => {
    try {
      const response = await adminService.getTransactionTemplateRules(templateId);
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate({ ...template, rules: response.data || [] });
      }
    } catch (error) {
      showToast('error', 'Failed to load template rules');
    }
  };

  const handleAddRule = () => {
    if (!selectedTemplate) return;
    const newRule: TemplateRule = {
      line_number: (selectedTemplate.rules.length || 0) + 1,
      account_type: '',
      account_id: undefined,
      entry_type: 'DEBIT',
      amount_source: 'TOTAL_AMOUNT',
      narration: ''
    };
    setSelectedTemplate({
      ...selectedTemplate,
      rules: [...selectedTemplate.rules, newRule]
    });
  };

  const handleDeleteRule = (lineNumber: number) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      rules: selectedTemplate.rules.filter(r => r.line_number !== lineNumber)
    });
  };

  const handleRuleChange = (lineNumber: number, field: keyof TemplateRule, value: string | number | undefined) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      rules: selectedTemplate.rules.map(r =>
        r.line_number === lineNumber ? { ...r, [field]: value } : r
      )
    });
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    try {
      await adminService.updateTransactionTemplateRules(selectedTemplate.id, selectedTemplate.rules);
      showToast('success', 'Template rules saved successfully');
      loadTemplates();
    } catch (error) {
      showToast('error', 'Failed to save template rules');
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
            </div>
            <div className="p-4 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplateRules(template.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs mt-1 opacity-80">{template.transaction_type}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Posting Rules</h3>
                  <button
                    onClick={handleAddRule}
                    className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rule
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedTemplate.rules.map((rule) => (
                    <div key={rule.line_number} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-700">Line {rule.line_number}</span>
                        <button
                          onClick={() => handleDeleteRule(rule.line_number)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Account Type
                          </label>
                          <SearchableDropdown
                            options={accountTypes.map(type => ({
                              value: type.value,
                              label: type.value
                            }))}
                            value={rule.account_type}
                            onChange={(value) => handleRuleChange(rule.line_number, 'account_type', value as string)}
                            placeholder="Search or select..."
                            searchable={true}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Specific Account (Optional)
                          </label>
                          <SearchableDropdown
                            options={accounts.map(acc => ({
                              value: acc.id.toString(),
                              label: `${acc.code} - ${acc.name}`
                            }))}
                            value={rule.account_id?.toString() || ''}
                            onChange={(value) => handleRuleChange(rule.line_number, 'account_id', value ? parseInt(value as string) : undefined)}
                            placeholder="Override with specific account..."
                            searchable={true}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Entry Type
                          </label>
                          <select
                            value={rule.entry_type}
                            onChange={(e) => handleRuleChange(rule.line_number, 'entry_type', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="DEBIT">Debit</option>
                            <option value="CREDIT">Credit</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount Source
                          </label>
                          <select
                            value={rule.amount_source}
                            onChange={(e) => handleRuleChange(rule.line_number, 'amount_source', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="TOTAL_AMOUNT">Total Amount</option>
                            <option value="SUBTOTAL">Subtotal</option>
                            <option value="TAX_AMOUNT">Tax Amount</option>
                            <option value="DISCOUNT_AMOUNT">Discount Amount</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Narration
                          </label>
                          <input
                            type="text"
                            value={rule.narration}
                            onChange={(e) => handleRuleChange(rule.line_number, 'narration', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Select a template to view and edit rules</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionTemplates;
