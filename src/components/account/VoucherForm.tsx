import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Paperclip } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/api';
import { Voucher } from '../../types';

interface VoucherFormProps {
  voucher?: Voucher;
  onSave: (voucherData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

interface VoucherLine {
  account_id: number | null;
  debit: number;
  credit: number;
  description: string;
  gst_rate?: number;
  gst_amount?: number;
  cost_center_id?: number | null;
}

const VoucherForm: React.FC<VoucherFormProps> = ({ 
  voucher, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  
  const generateVoucherNumber = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fff = String(now.getMilliseconds()).padStart(3, '0');
    const tenantId = user?.tenant_id || 1;
    return `V-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };
  
  const [formData, setFormData] = useState({
    voucher_type: voucher?.voucher_type || 'Journal',
    voucher_number: voucher?.voucher_number || generateVoucherNumber(),
    date: voucher?.date || new Date().toISOString().split('T')[0],
    description: voucher?.description || '',
    reference_number: voucher?.reference_number || '',
    party_account_id: voucher?.party_account_id || null,
    payment_method: voucher?.payment_method || '',
    cheque_number: voucher?.cheque_number || '',
    cheque_date: voucher?.cheque_date || '',
    bank_name: voucher?.bank_name || '',
    currency: 'INR',
    exchange_rate: 1,
    is_posted: false
  });
  
  const [lines, setLines] = useState<VoucherLine[]>([
    { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null },
    { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null }
  ]);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    loadAccounts();
    loadCostCenters();
  }, []);
  
  useEffect(() => {
    if (resetForm && !voucher) {
      setFormData({
        voucher_type: 'Journal',
        voucher_number: generateVoucherNumber(),
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference_number: '',
        party_account_id: null,
        payment_method: '',
        cheque_number: '',
        cheque_date: '',
        bank_name: '',
        currency: 'INR',
        exchange_rate: 1,
        is_posted: false
      });
      setLines([
        { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null },
        { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null }
      ]);
    } else if (voucher) {
      setFormData({
        voucher_type: voucher.voucher_type,
        voucher_number: voucher.voucher_number,
        date: voucher.date,
        description: voucher.description || '',
        reference_number: voucher.reference_number || '',
        party_account_id: voucher.party_account_id || null,
        payment_method: voucher.payment_method || '',
        cheque_number: voucher.cheque_number || '',
        cheque_date: voucher.cheque_date || '',
        bank_name: voucher.bank_name || '',
        currency: 'INR',
        exchange_rate: 1,
        is_posted: false
      });
      
      // Load existing lines if available
      if (voucher.lines && voucher.lines.length > 0) {
        setLines(voucher.lines.map((line: any) => ({
          account_id: line.account_id,
          debit: line.debit || 0,
          credit: line.credit || 0,
          description: line.description || '',
          gst_rate: line.gst_rate || 0,
          gst_amount: line.gst_amount || 0,
          cost_center_id: line.cost_center_id || null
        })));
      } else {
        setLines([
          { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null },
          { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null }
        ]);
      }
    }
  }, [voucher, resetForm, user]);
  
  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts();
      setAccounts(response.data.map((acc: any) => ({
        value: acc.id,
        label: `${acc.code} - ${acc.name}`
      })));
    } catch (error) {
      showToast('error', 'Failed to load accounts');
    }
  };

  const loadCostCenters = async () => {
    try {
      const response = await accountService.getCostCenters();
      setCostCenters(response.data.map((cc: any) => ({
        value: cc.id,
        label: cc.name
      })));
    } catch (error) {
      showToast('error', 'Failed to load cost centers');
    }
  };

  const handleSubmit = (e: React.FormEvent, isPosted: boolean = false) => {
    e.preventDefault();
    
    if (!formData.voucher_number || formData.voucher_number.trim() === '') {
      showToast('error', 'Voucher number is required');
      return;
    }
    
    if (!formData.date) {
      showToast('error', 'Date is required');
      return;
    }
    
    const validLines = lines.filter(line => line.account_id && (line.debit > 0 || line.credit > 0));
    
    if (validLines.length < 2) {
      showToast('error', 'At least 2 line items are required');
      return;
    }
    
    const totalDebit = validLines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = validLines.reduce((sum, line) => sum + (line.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      showToast('error', 'Total debit must equal total credit');
      return;
    }
    
    const voucherData = {
      ...formData,
      total_amount: totalDebit,
      lines: validLines,
      is_posted: isPosted
    };
    
    onSave(voucherData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLineChange = (index: number, field: keyof VoucherLine, value: any) => {
    const newLines = [...lines];
    if (field === 'debit' || field === 'credit' || field === 'gst_rate' || field === 'gst_amount') {
      (newLines[index] as any)[field] = parseFloat(value) || 0;
    } else if (field === 'account_id') {
      (newLines[index] as any)[field] = value as number | null;
    } else {
      (newLines[index] as any)[field] = value as string;
    }
    setLines(newLines);
  };
  
  const addLine = () => {
    setLines([...lines, { account_id: null, debit: 0, credit: 0, description: '', gst_rate: 0, gst_amount: 0, cost_center_id: null }]);
  };
  
  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };
  
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const difference = totalDebit - totalCredit;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {voucher ? 'Edit Voucher' : 'Add New Voucher'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Voucher Number *
              </label>
              <input
                type="text"
                name="voucher_number"
                value={formData.voucher_number}
                readOnly
                required
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
                Voucher Type
              </label>
              <SearchableDropdown
                options={[
                  { value: 'Journal', label: 'Journal' },
                  { value: 'Receipt', label: 'Receipt' },
                  { value: 'Payment', label: 'Payment' },
                  { value: 'Contra', label: 'Contra' }
                ]}
                value={formData.voucher_type}
                onChange={(value) => setFormData(prev => ({ ...prev, voucher_type: value as string }))}
                placeholder="Select type..."
                multiple={false}
                searchable={true}
                disabled={!!voucher}
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
                placeholder="Invoice/Bill No."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Party/Contact {(formData.voucher_type === 'Payment' || formData.voucher_type === 'Receipt') && '*'}
              </label>
              <SearchableDropdown
                options={accounts}
                value={formData.party_account_id || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, party_account_id: value as number }))}
                placeholder="Select party..."
                multiple={false}
                searchable={true}
              />
            </div>

            {(formData.voucher_type === 'Payment' || formData.voucher_type === 'Receipt') && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <SearchableDropdown
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Cheque', label: 'Cheque' },
                      { value: 'Bank Transfer', label: 'Bank Transfer' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'Card', label: 'Card' }
                    ]}
                    value={formData.payment_method}
                    onChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as string }))}
                    placeholder="Select method..."
                    multiple={false}
                    searchable={false}
                  />
                </div>

                {formData.payment_method === 'Cheque' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cheque Number
                      </label>
                      <input
                        type="text"
                        name="cheque_number"
                        value={formData.cheque_number}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cheque Date
                      </label>
                      <DatePicker
                        value={formData.cheque_date}
                        onChange={(value) => setFormData(prev => ({ ...prev, cheque_date: value }))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {(formData.payment_method === 'Cheque' || formData.payment_method === 'Bank Transfer') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </>
            )}



            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Narration/Notes
              </label>
              <FormTextarea
                name="description"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Enter narration or notes..."
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">GST %</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">GST Amt</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Center</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <SearchableDropdown
                          options={accounts}
                          value={line.account_id || ''}
                          onChange={(value) => handleLineChange(index, 'account_id', value)}
                          placeholder="Select account..."
                          multiple={false}
                          searchable={true}
                          className="min-w-[200px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.gst_rate || ''}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            const amount = (line.debit || line.credit || 0) * rate / 100;
                            handleLineChange(index, 'gst_rate', e.target.value);
                            handleLineChange(index, 'gst_amount', amount.toString());
                          }}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={line.gst_amount || ''}
                          readOnly
                          className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded bg-gray-50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <SearchableDropdown
                          options={costCenters}
                          value={line.cost_center_id || ''}
                          onChange={(value) => handleLineChange(index, 'cost_center_id', value)}
                          placeholder="Select..."
                          multiple={false}
                          searchable={true}
                          className="min-w-[150px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 2}
                          className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 py-2 text-xs font-semibold">Total</td>
                    <td className="px-3 py-2 text-xs font-semibold text-right">{totalDebit.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-right">{totalCredit.toFixed(2)}</td>
                    <td colSpan={2} className="px-3 py-2 text-xs font-semibold">
                      <span className={difference === 0 ? 'text-green-600' : 'text-red-600'}>
                        Difference: {Math.abs(difference).toFixed(2)}
                      </span>
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Attachments (Bills, Invoices, Receipts)
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center px-2 py-1.5 text-sm bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200">
                <Paperclip className="h-4 w-4 mr-1" />
                <span className="text-sm">Choose Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {attachments.length > 0 && (
                <span className="text-sm text-gray-600">{attachments.length} file(s) selected</span>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded">
                    <span className="text-xs text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addLine}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded hover:bg-primary hover:text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </button>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-600 hover:bg-gray-700 rounded"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
              >
                Post Voucher
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default VoucherForm;