import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import FormTextarea from '../common/FormTextarea';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/modules/health';

interface PaymentDetail {
  id: string;
  line_no: number;
  payment_mode: string;
  bank_account_id: number;
  instrument_number: string;
  instrument_date: string;
  bank_name: string;
  transaction_reference: string;
  amount_base: number;
  account_id: number;
}

interface PaymentAllocation {
  id: string;
  document_type: string;
  document_id: number;
  document_number: string;
  document_total?: number;
  document_balance?: number;
  allocated_amount_base: number;
  discount_amount_base: number;
  remarks: string;
}

interface HealthPaymentFormProps {
  onSave: (paymentData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
}

const HealthPaymentForm: React.FC<HealthPaymentFormProps> = ({ onSave, onCancel, isCollapsed, onToggleCollapse, resetForm }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    payment_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'RECEIPT',
    party_type: 'CUSTOMER',
    party_id: 0,
    status: 'DRAFT',
    reference_number: '',
    exchange_rate: 1,
    total_amount_base: 0,
    allocated_amount_base: 0,
    unallocated_amount_base: 0,
    tds_amount_base: 0,
    is_refund: false,
    remarks: ''
  });

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    generatePaymentNumber();
    loadPatients();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (resetForm) resetFormData();
  }, [resetForm]);

  useEffect(() => {
    calculateTotals();
  }, [paymentDetails, allocations]);

  useEffect(() => {
    if (formData.party_id > 0) loadInvoices(formData.party_id);
  }, [formData.party_id]);

  const generatePaymentNumber = () => {
    const timestamp = Date.now();
    const tenantId = user?.tenant_id || 1;
    setFormData(prev => ({ ...prev, payment_number: `PAY-${tenantId}-${timestamp}` }));
  };

  const resetFormData = () => {
    generatePaymentNumber();
    setFormData(prev => ({ ...prev, party_id: 0, total_amount_base: 0, status: 'DRAFT', reference_number: '', remarks: '' }));
    setPaymentDetails([]);
    setAllocations([]);
  };

  const loadPatients = async () => {
    try {
      const data =await patientService.getPatients();
      setPatients(data.data||[]);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/account/accounts`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAccounts(data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadInvoices = async (partyId: number) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/health/invoices?patient_id=${partyId}&per_page=1000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const addPaymentDetail = () => {
    setPaymentDetails([...paymentDetails, {
      id: Date.now().toString(),
      line_no: paymentDetails.length + 1,
      payment_mode: 'CASH',
      bank_account_id: 0,
      instrument_number: '',
      instrument_date: '',
      bank_name: '',
      transaction_reference: '',
      amount_base: 0,
      account_id: 0
    }]);
  };

  const removePaymentDetail = (id: string) => setPaymentDetails(paymentDetails.filter(d => d.id !== id));
  const updatePaymentDetail = (id: string, field: string, value: any) => {
    setPaymentDetails(paymentDetails.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addAllocation = () => {
    setAllocations([...allocations, {
      id: Date.now().toString(),
      document_type: 'INVOICE',
      document_id: 0,
      document_number: '',
      allocated_amount_base: 0,
      discount_amount_base: 0,
      remarks: ''
    }]);
  };

  const removeAllocation = (id: string) => setAllocations(allocations.filter(a => a.id !== id));
  
  const updateAllocation = (id: string, field: string, value: any) => {
    setAllocations(allocations.map(a => {
      if (a.id === id) {
        if (field === 'document_number') {
          const invoice = invoices.find(inv => inv.invoice_number === value);
          if (invoice) {
            return {
              ...a,
              document_number: value,
              document_id: invoice.id,
              document_total: invoice.total_amount_base || 0,
              document_balance: invoice.balance_amount_base || 0,
              allocated_amount_base: invoice.balance_amount_base || 0
            };
          }
        }
        return { ...a, [field]: value };
      }
      return a;
    }));
  };

  const calculateTotals = () => {
    const totalDetails = paymentDetails.reduce((sum, d) => sum + (d.amount_base || 0), 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocated_amount_base || 0), 0);
    setFormData(prev => ({
      ...prev,
      total_amount_base: totalDetails,
      allocated_amount_base: totalAllocated,
      unallocated_amount_base: totalDetails - totalAllocated
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      details: paymentDetails.map(d => ({
        line_no: d.line_no,
        payment_mode: d.payment_mode,
        instrument_number: d.instrument_number || null,
        instrument_date: d.instrument_date || null,
        bank_name: d.bank_name || null,
        transaction_reference: d.transaction_reference || null,
        amount_base: d.amount_base,
        account_id: d.account_id
      })),
      allocations: allocations.filter(a => a.document_id > 0).map(a => ({
        document_type: a.document_type,
        document_id: a.document_id,
        document_number: a.document_number,
        allocated_amount_base: a.allocated_amount_base,
        discount_amount_base: a.discount_amount_base || 0,
        remarks: a.remarks || null
      }))
    });
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Payment Entry</h2>
        <button type="button" onClick={onToggleCollapse} className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Number</label>
              <input type="text" value={formData.payment_number} readOnly className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
              <DatePicker value={formData.payment_date} onChange={(v) => setFormData(prev => ({ ...prev, payment_date: v }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Type *</label>
              <SearchableDropdown options={[{ value: 'RECEIPT', label: 'Receipt' }, { value: 'PAYMENT', label: 'Payment' }]}
                value={formData.payment_type} onChange={(v) => setFormData(prev => ({ ...prev, payment_type: v as string }))}
                multiple={false} searchable={false} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <SearchableDropdown options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'POSTED', label: 'Posted' }]}
                value={formData.status} onChange={(v) => setFormData(prev => ({ ...prev, status: v as string }))}
                multiple={false} searchable={false} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Party *</label>
              <SearchableDropdown options={patients.map(p => ({ value: p.id, label: `${p?.first_name+" "+p?.last_name} - ${p.phone || ''}` }))}
                value={formData.party_id} onChange={(v) => setFormData(prev => ({ ...prev, party_id: Number(v) }))}
                placeholder="Select patient..." multiple={false} searchable={true} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reference Number</label>
              <input type="text" value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Payment Details</h3>
              <button type="button" onClick={addPaymentDetail}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary hover:bg-secondary rounded">
                <Plus className="h-3 w-3" /> Add Line
              </button>
            </div>
            
            {paymentDetails.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Mode</th>
                       <th className="px-2 py-2 text-left">Amount</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Instrument #</th>
                      {/* <th className="px-2 py-2 text-left">Bank</th> */}
                      <th className="px-2 py-2 text-left">Ref</th>
                      {/* <th className="px-2 py-2 text-left">Account</th> */}
                      <th className="px-2 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentDetails.map((detail) => (
                      <tr key={detail.id} className="border-t">
                        <td className="px-2 py-2">
                          <SearchableDropdown options={[
                            { value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' },
                            { value: 'UPI', label: 'UPI' }, { value: 'CHEQUE', label: 'Cheque' },
                            { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
                          ]} value={detail.payment_mode} onChange={(v) => updatePaymentDetail(detail.id, 'payment_mode', v)}
                            multiple={false} searchable={false} />
                        </td>
                          <td className="px-2 py-2">
                          <input type="number" value={detail.amount_base} step="0.01" required
                            onChange={(e) => updatePaymentDetail(detail.id, 'amount_base', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        </td>
                      
                        <td className="px-2 py-2">
                          <DatePicker value={detail.instrument_date}
                            onChange={(v) => updatePaymentDetail(detail.id, 'instrument_date', v)} />
                        </td>
                          <td className="px-2 py-2">
                          <input type="text" value={detail.instrument_number}
                            onChange={(e) => updatePaymentDetail(detail.id, 'instrument_number', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        </td>
                        {/* <td className="px-2 py-2">
                          <input type="text" value={detail.bank_name}
                            onChange={(e) => updatePaymentDetail(detail.id, 'bank_name', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        </td> */}
                        <td className="px-2 py-2">
                          <input type="text" value={detail.transaction_reference}
                            onChange={(e) => updatePaymentDetail(detail.id, 'transaction_reference', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        </td>
                      
                        {/* <td className="px-2 py-2">
                          <SearchableDropdown options={accounts.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                            value={detail.account_id} onChange={(v) => updatePaymentDetail(detail.id, 'account_id', Number(v))}
                            placeholder="Select..." multiple={false} searchable={true} />
                        </td> */}
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removePaymentDetail(detail.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Invoice Allocations</h3>
              <button type="button" onClick={addAllocation} disabled={!formData.party_id}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary hover:bg-secondary rounded disabled:bg-gray-300">
                <Plus className="h-3 w-3" /> Add Allocation
              </button>
            </div>
            
            {allocations.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Invoice #</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2 text-right">Balance</th>
                      <th className="px-2 py-2 text-right">Allocated</th>
                      <th className="px-2 py-2 text-right">Discount</th>
                      <th className="px-2 py-2 text-left">Remarks</th>
                      <th className="px-2 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((allocation) => (
                      <tr key={allocation.id} className="border-t">
                        <td className="px-2 py-2">
                          <SearchableDropdown options={invoices.map(inv => ({ value: inv.invoice_number, label: `${inv.invoice_number} - ${inv.total_amount_base || 0}` }))}
                            value={allocation.document_number} onChange={(v) => updateAllocation(allocation.id, 'document_number', v)}
                            placeholder="Select..." multiple={false} searchable={true} />
                        </td>
                        <td className="px-2 py-2 text-right">{allocation.document_total ? `${allocation.document_total.toFixed(2)}` : '-'}</td>
                        <td className="px-2 py-2 text-right">{allocation.document_balance ? `${allocation.document_balance.toFixed(2)}` : '-'}</td>
                        <td className="px-2 py-2">
                          <input type="number" value={allocation.allocated_amount_base} step="0.01" required
                            onChange={(e) => updateAllocation(allocation.id, 'allocated_amount_base', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" value={allocation.discount_amount_base} step="0.01"
                            onChange={(e) => updateAllocation(allocation.id, 'discount_amount_base', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={allocation.remarks}
                            onChange={(e) => updateAllocation(allocation.id, 'remarks', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeAllocation(allocation.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount</label>
                <div className="text-lg font-bold text-blue-600">{formData.total_amount_base.toFixed(2)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">Allocated Amount</label>
                <div className="text-lg font-bold text-green-600">{formData.allocated_amount_base.toFixed(2)}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <label className="block text-xs font-medium text-gray-700 mb-1">Unallocated Amount</label>
                <div className="text-lg font-bold text-orange-600">{formData.unallocated_amount_base.toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">TDS Amount</label>
                <input type="number" value={formData.tds_amount_base} step="0.01"
                  onChange={(e) => setFormData(prev => ({ ...prev, tds_amount_base: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input type="checkbox" checked={formData.is_refund}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_refund: e.target.checked }))} className="rounded" />
                  Is Refund
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <FormTextarea name="remarks" value={formData.remarks}
                  onChange={(v) => setFormData(prev => ({ ...prev, remarks: v }))}
                  placeholder="Enter remarks..." rows={2} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded">
              Cancel
            </button>
            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded">
              Create
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HealthPaymentForm;
