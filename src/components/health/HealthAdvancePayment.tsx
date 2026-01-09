import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DatePicker from '../common/DatePicker';
import SearchableDropdown from '../common/SearchableDropdown';
import DataTable from '../common/DataTable';
import { patientService } from '../../services/modules/health/patientService';
import { paymentService } from '../../services/modules/account/paymentService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatUTCToLocal } from '../../utils/dateUtils';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface PaymentFormData {
  payment_number: string;
  party_id: number;
  party_type: string;
  amount: number;
  payment_mode: string;
  instrument_number: string;
  instrument_date: string;
  bank_name: string;
  branch_name: string;
  ifsc_code: string;
  transaction_reference: string;
  remarks: string;
}

const HealthAdvancePayment: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const { showToast } = useToast();
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
    const tenantId = user?.tenant_id || 0;
    return `PAY-${tenantId}${dd}${mm}${yyyy}${hh}${min}${ss}${fff}`;
  };

  const [formData, setFormData] = useState<PaymentFormData>({
    payment_number: generatePaymentNumber(),
    party_id: 0,
    party_type: 'PATIENT',
    amount: 0,
    payment_mode: 'CASH',
    instrument_number: '',
    instrument_date: new Date().toISOString().split('T')[0],
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    transaction_reference: '',
    remarks: ''
  });

  useEffect(() => {
    fetchPatients();
    fetchPayments();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getPatients({ per_page: 1000 });
      setPatients(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load patients');
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getAdvancePayments({ page: 1, page_size: 100, 
        payment_type: 'RECEIPT',
         party_type: 'PATIENT',
         include_details:true,
         });
      setPayments(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.party_id || formData.amount <= 0) {
      showToast('error', 'Please select a patient and enter a valid amount');
      return;
    }

    try {
      await paymentService.createAdvancePayment(formData);
      showToast('success', 'Advance payment recorded successfully');
      resetForm();
      fetchPayments();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error recording payment');
    }
  };

  const resetForm = () => {
    setFormData({
      payment_number: generatePaymentNumber(),
      party_id: 0,
      party_type: 'PATIENT',
      amount: 0,
      payment_mode: 'CASH',
      instrument_number: '',
      instrument_date: new Date().toISOString().split('T')[0],
      bank_name: '',
      branch_name: '',
      ifsc_code: '',
      transaction_reference: '',
      remarks: ''
    });
  };

  const handlePaymentModeChange = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      payment_mode: mode,
      instrument_number: '',
      instrument_date: new Date().toISOString().split('T')[0],
      bank_name: '',
      branch_name: '',
      ifsc_code: '',
      transaction_reference: ''
    }));
  };

  const requiresInstrumentNumber = ['CHEQUE', 'CARD', 'BANK_TRANSFER'].includes(formData.payment_mode);
  const requiresInstrumentDate = ['CHEQUE', 'CARD', 'UPI', 'BANK_TRANSFER'].includes(formData.payment_mode);
  const requiresBankDetails = ['CHEQUE', 'BANK_TRANSFER'].includes(formData.payment_mode);

  const columns = [
    { key: 'payment_number', label: 'Payment #', sortable: true },
    // { key: 'party_name', label: 'Patient', sortable: true },
    { key: 'details', label: 'Mode', sortable: true,
        render: (row: any) => row?.[0]?.payment_mode ?? '-'  
     },
    { key: 'payment_date', label: 'Date', sortable: true, 
    render: (value: string) => formatUTCToLocal(value),  
    },
    { key: 'total_amount_base', label: 'Amount', sortable: true, render: (value: number) => `${(value || 0)}` },
    { key: 'allocated_amount_base', label: 'Allocated Amt', sortable: true, render: (value: number) => `${(value || 0)}` },
    { key: 'unallocated_amount_base', label: 'Unallocated Amt', sortable: true, render: (value: number) => `${(value || 0)}` },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'POSTED' ? '#dcfce7' : '#fef3c7',
          color: value === 'POSTED' ? '#166534' : '#854d0e'
        }}>
          {value}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>Add New Receipt(Incoming)</h2>
          <button type="button" onClick={() => setIsFormCollapsed(!isFormCollapsed)} className="text-gray-500 hover:text-gray-700">
            {isFormCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
          </button>
        </div>

        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-6" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Number</label>
                <input type="text" value={formData.payment_number} readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient *</label>
                <SearchableDropdown
                  options={patients.map(p => ({ value: p.id.toString(), label: `${p.first_name} ${p.last_name} - ${p.phone}` }))}
                  value={formData.party_id.toString()}
                  onChange={(v) => setFormData(prev => ({ ...prev, party_id: Number(v) }))}
                  placeholder="Select patient"
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" step="0.01" min="0.01" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                <input type="text" value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode *</label>
                <SearchableDropdown
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'CHEQUE', label: 'Cheque' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
                  ]}
                  value={formData.payment_mode}
                  onChange={(v) => handlePaymentModeChange(v.toString())}
                  placeholder="Select mode"
                  multiple={false}
                  searchable={false}
                />
              </div>

              {requiresInstrumentNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instrument Number *</label>
                  <input type="text" value={formData.instrument_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrument_number: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" required />
                </div>
              )}

              {requiresInstrumentDate && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instrument Date *</label>
                  <DatePicker value={formData.instrument_date}
                    onChange={(v) => setFormData(prev => ({ ...prev, instrument_date: v }))}
                    required />
                </div>
              )}

              {requiresBankDetails && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name *</label>
                    <input type="text" value={formData.bank_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" required />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Branch Name</label>
                    <input type="text" value={formData.branch_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, branch_name: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" value={formData.ifsc_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
                  </div>
                </>
              )}

              {formData.payment_mode === 'UPI' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Reference</label>
                  <input type="text" value={formData.transaction_reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_reference: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded" />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)' }}>
              <button type="button" onClick={resetForm} className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200">Reset</button>
              <button type="submit" className="erp-form-btn text-white bg-primary hover:bg-secondary">Create</button>
            </div>
          </form>
        )}
      </div>

      <DataTable title="Receipt Entries (Incoming)" data={payments} columns={columns} loading={loading} />
    </div>
  );
};

export default HealthAdvancePayment;
