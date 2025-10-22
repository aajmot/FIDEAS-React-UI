import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { JournalLine, JournalEntry } from '../../types';

interface JournalFormProps {
  entry?: any;
  onSave: () => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const JournalForm: React.FC<JournalFormProps> = ({ entry, onSave, onCancel, isCollapsed, onToggleCollapse, resetForm }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const generateJVNumber = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    const tenantId = user?.tenant_id || 1;
    return `JV-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voucher_number: generateJVNumber(),
    description: ''
  });
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    { account_id: 0, description: '', debit: 0, credit: 0 },
    { account_id: 0, description: '', debit: 0, credit: 0 }
  ]);
  const { showToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        voucher_number: generateJVNumber(),
        description: ''
      });
      setJournalLines([
        { account_id: 0, description: '', debit: 0, credit: 0 },
        { account_id: 0, description: '', debit: 0, credit: 0 }
      ]);
    }
  }, [resetForm]);

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      setAccounts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load accounts');
    }
  };

  const addJournalLine = () => {
    setJournalLines([...journalLines, { account_id: 0, description: '', debit: 0, credit: 0 }]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length > 2) {
      setJournalLines(journalLines.filter((_, i) => i !== index));
    }
  };

  const updateJournalLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...journalLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setJournalLines(newLines);
  };

  const getTotals = () => {
    const totalDebit = journalLines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const validateJournalEntry = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const { totalDebit, totalCredit, difference } = getTotals();
    
    // Validation 1: Debit must equal Credit
    if (Math.abs(difference) > 0.01) {
      errors.push(`Debit (₹${totalDebit.toFixed(2)}) and Credit (₹${totalCredit.toFixed(2)}) must be equal`);
    }
    
    // Validation 2: At least 2 lines required
    if (journalLines.length < 2) {
      errors.push('At least 2 journal lines are required');
    }
    
    // Validation 3: All lines must have account selected
    const linesWithoutAccount = journalLines.filter(line => !line.account_id);
    if (linesWithoutAccount.length > 0) {
      errors.push(`${linesWithoutAccount.length} line(s) missing account selection`);
    }
    
    // Validation 4: Each line must have either debit or credit (not both, not neither)
    const invalidLines = journalLines.filter(line => {
      const hasDebit = line.debit && line.debit > 0;
      const hasCredit = line.credit && line.credit > 0;
      return (!hasDebit && !hasCredit) || (hasDebit && hasCredit);
    });
    if (invalidLines.length > 0) {
      errors.push(`${invalidLines.length} line(s) must have either debit OR credit (not both, not neither)`);
    }
    
    // Validation 5: Amounts must be positive
    const negativeAmounts = journalLines.filter(line => 
      (line.debit && line.debit < 0) || (line.credit && line.credit < 0)
    );
    if (negativeAmounts.length > 0) {
      errors.push('All amounts must be positive');
    }
    
    // Validation 6: Date must be valid
    if (!formData.date) {
      errors.push('Transaction date is required');
    } else {
      const entryDate = new Date(formData.date);
      const today = new Date();
      if (entryDate > today) {
        errors.push('Transaction date cannot be in the future');
      }
    }
    
    // Validation 7: Voucher number must be unique (checked on backend)
    if (!formData.voucher_number || formData.voucher_number.trim() === '') {
      errors.push('Voucher number is required');
    }
    
    // Validation 8: Total amount must be greater than zero
    if (totalDebit === 0 || totalCredit === 0) {
      errors.push('Total amount must be greater than zero');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent, isPosted: boolean = false) => {
    e.preventDefault();
    
    // Run validation
    const validation = validateJournalEntry();
    if (!validation.valid) {
      validation.errors.forEach(error => showToast('error', error));
      return;
    }

    try {
      const { totalDebit } = getTotals();
      const entryData = {
        ...formData,
        total_amount: totalDebit,
        lines: journalLines,
        is_posted: isPosted
      };
      await accountService.createJournalEntry(entryData);
      showToast('success', isPosted ? 'Journal entry posted successfully' : 'Journal entry saved as draft');
      onSave();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save journal entry');
    }
  };

  const { totalDebit, totalCredit, difference } = getTotals();

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">{entry ? 'Edit Journal Entry' : 'Create Journal Entry'}</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <DatePicker
                value={formData.date}
                onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Voucher Number</label>
              <input
                type="text"
                value={formData.voucher_number}
                readOnly
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">Journal Lines</h3>
              <button
                type="button"
                onClick={addJournalLine}
                className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-left">Account</th>
                    <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-left">Description</th>
                    <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-center">Debit</th>
                    <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-center">Credit</th>
                    <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {journalLines.map((line, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-1.5" style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}>
                        <div style={{ position: 'relative', zIndex: 10000, overflow: 'visible' }}>
                          <SearchableDropdown
                            options={accounts.map(acc => ({
                              value: acc.id,
                              label: `${acc.code} - ${acc.name}`
                            }))}
                            value={line.account_id}
                            onChange={(value) => updateJournalLine(index, 'account_id', Number(value))}
                            placeholder="Select account..."
                            multiple={false}
                            searchable={true}
                            className="w-full min-w-48"
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={line.debit}
                          onChange={(e) => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={line.credit}
                          onChange={(e) => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-center"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeJournalLine(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={journalLines.length <= 2}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-2 py-1.5 font-semibold text-xs">Totals:</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-xs">₹{totalDebit.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-center font-semibold text-xs">₹{totalCredit.toFixed(2)}</td>
                    <td className="px-2 py-1.5"></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-2 py-1.5 font-semibold text-xs">Difference:</td>
                    <td colSpan={2} className={`px-2 py-1.5 text-center font-semibold text-xs ${
                      Math.abs(difference) < 0.01 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(difference).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            {entry && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gray-600 hover:bg-gray-700 rounded"
            >
              <Save className="h-3 w-3 mr-1" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              <Save className="h-3 w-3 mr-1" />
              Post Entry
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default JournalForm;