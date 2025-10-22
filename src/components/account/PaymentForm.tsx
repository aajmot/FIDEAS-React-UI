import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { useAuth } from '../../context/AuthContext';
import { accountService } from '../../services/api';
import { Payment } from '../../types';

interface PaymentFormProps {
  payment?: Payment;
  onSave: (paymentData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  payment, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const { user } = useAuth();
  
  const generatePaymentNumber = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    const tenantId = user?.tenant_id || 1;
    return `PAY-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    payment_number: payment?.payment_number || generatePaymentNumber(),
    payment_mode: payment?.payment_mode || 'PAID',
    payment_type: payment?.payment_type || 'CASH',
    account_id: payment?.account_id || '',
    amount: payment?.amount || 0,
    payment_date: payment?.payment_date || new Date().toISOString().split('T')[0],
    reference_type: payment?.reference_type || 'GENERAL',
    reference_id: payment?.reference_id || 0,
    reference_number: payment?.reference_number || '',
    remarks: payment?.remarks || ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      const cashBankAccounts = response.data.filter((acc: any) => 
        acc.code?.startsWith('CASH') || acc.code?.startsWith('BANK')
      );
      setAccounts(cashBankAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  useEffect(() => {
    if (resetForm && !payment) {
      setFormData({
        payment_number: generatePaymentNumber(),
        payment_mode: 'PAID',
        payment_type: 'CASH',
        account_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        reference_type: 'GENERAL',
        reference_id: 0,
        reference_number: '',
        remarks: ''
      });
    } else if (payment) {
      setFormData({
        payment_number: payment.payment_number,
        payment_mode: payment.payment_mode || 'PAID',
        payment_type: payment.payment_type,
        account_id: payment.account_id || '',
        amount: payment.amount,
        payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
        reference_type: payment.reference_type || 'GENERAL',
        reference_id: payment.reference_id || 0,
        reference_number: payment.reference_number || '',
        remarks: payment.remarks || ''
      });
    }
  }, [payment, resetForm, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.account_id) {
      alert('Please select a Cash/Bank account');
      return;
    }
    
    if (formData.amount <= 0) {
      alert('Amount must be greater than zero');
      return;
    }
    
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {payment ? 'Edit Payment' : 'Add New Payment'}
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
                Payment Number
              </label>
              <input
                type="text"
                name="payment_number"
                value={formData.payment_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <SearchableDropdown
                options={[
                  { value: 'PAID', label: 'Payment (Outgoing)' },
                  { value: 'RECEIVED', label: 'Receipt (Incoming)' }
                ]}
                value={formData.payment_mode}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_mode: value as string }))}
                placeholder="Select mode..."
                multiple={false}
                searchable={false}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Type
              </label>
              <SearchableDropdown
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'BANK', label: 'Bank' },
                  { value: 'CARD', label: 'Card' }
                ]}
                value={formData.payment_type}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_type: value as string }))}
                placeholder="Select type..."
                multiple={false}
                searchable={false}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cash/Bank Account *
              </label>
              <SearchableDropdown
                options={accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.code})` }))}
                value={formData.account_id}
                onChange={(value) => setFormData(prev => ({ ...prev, account_id: value as string }))}
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
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <DatePicker
                value={formData.payment_date}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_date: value }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference Type
              </label>
              <SearchableDropdown
                options={[
                  { value: 'GENERAL', label: 'General' },
                  { value: 'SALES', label: 'Sales' },
                  { value: 'PURCHASE', label: 'Purchase' }
                ]}
                value={formData.reference_type}
                onChange={(value) => setFormData(prev => ({ ...prev, reference_type: value as string }))}
                placeholder="Select reference..."
                multiple={false}
                searchable={false}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="SO-001, PO-001, etc."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto min-h-[34px] max-h-[34px]"
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
              {payment ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;