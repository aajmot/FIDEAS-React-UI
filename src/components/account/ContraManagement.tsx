import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { accountService } from '../../services/api';
import { accountExtensions } from '../../services/apiExtensions';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const ContraManagement: React.FC = () => {
  const [contras, setContras] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const generateVoucherNumber = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const tenantId = user?.tenant_id || 1;
    return `CNT-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}`;
  };

  const [formData, setFormData] = useState({
    voucher_number: generateVoucherNumber(),
    date: new Date().toISOString().split('T')[0],
    from_account_id: 0,
    to_account_id: 0,
    amount: '',
    narration: ''
  });

  useEffect(() => {
    loadContras();
    loadAccounts();
  }, []);

  const loadContras = async () => {
    try {
      setLoading(true);
      const response = await accountExtensions.getContraVouchers();
      setContras(response.data);
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to load contra vouchers');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      const cashBankAccounts = response.data.filter((acc: any) => 
        acc.account_type === 'ASSET' && (acc.name.toLowerCase().includes('cash') || acc.name.toLowerCase().includes('bank'))
      );
      setAccounts(cashBankAccounts);
    } catch (error: any) {
      showToast('error', 'Failed to load accounts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from_account_id) {
      showToast('error', 'Please select From Account');
      return;
    }
    
    if (!formData.to_account_id) {
      showToast('error', 'Please select To Account');
      return;
    }
    
    if (formData.from_account_id === formData.to_account_id) {
      showToast('error', 'From and To accounts must be different');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('error', 'Amount must be greater than zero');
      return;
    }

    try {
      await accountExtensions.createContra({ ...formData, amount: parseFloat(formData.amount) });
      showToast('success', 'Contra voucher created successfully');
      resetForm();
      loadContras();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to create contra voucher');
    }
  };

  const resetForm = () => {
    setFormData({
      voucher_number: generateVoucherNumber(),
      date: new Date().toISOString().split('T')[0],
      from_account_id: 0,
      to_account_id: 0,
      amount: '',
      narration: ''
    });
  };

  const columns = [
    { key: 'voucher_number', label: 'Voucher No' },
    { 
      key: 'date', 
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { 
      key: 'amount', 
      label: 'Amount', 
      render: (val: number) => `₹${val.toLocaleString()}` 
    },
    { key: 'narration', label: 'Narration' }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Create Contra Voucher</h2>
          <button
            type="button"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFormCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
        
        {!isFormCollapsed && (
          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Voucher Number
                  </label>
                  <input
                    type="text"
                    value={formData.voucher_number}
                    readOnly
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <DatePicker
                    value={formData.date}
                    onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    From Account (Credit) *
                  </label>
                  <SearchableDropdown
                    options={accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.code})` }))}
                    value={formData.from_account_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, from_account_id: value as number }))}
                    placeholder="Select account..."
                    multiple={false}
                    searchable={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    To Account (Debit) *
                  </label>
                  <SearchableDropdown
                    options={accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.code})` }))}
                    value={formData.to_account_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, to_account_id: value as number }))}
                    placeholder="Select account..."
                    multiple={false}
                    searchable={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Narration
                  </label>
                  <FormTextarea
                    value={formData.narration}
                    onChange={(value) => setFormData(prev => ({ ...prev, narration: value }))}
                    placeholder="Enter narration..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
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
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <DataTable
        title="Contra Vouchers"
        columns={columns}
        data={contras}
        loading={loading}
      />
    </div>
  );
};

export default ContraManagement;
