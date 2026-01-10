import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import { paymentService  } from '../../services/api';
import {invoiceService} from '../../services/modules/health/invoiceService';
import { useToast } from '../../context/ToastContext';

interface Payment {
  id: number;
  payment_number: string;
  total_amount_base: number;
  allocated_amount_base: number;
  unallocated_amount_base: number;
  party_id: number;
}

interface TestInvoice {
  id: number;
  invoice_number: string;
  patient_name: string;
  patient_phone: string;
  total_amount: number;
  balance_amount: number;
}

interface PaymentAllocation {
  id: number;
  payment_id: number;
  payment_number: string;
  document_type: string;
  document_id: number;
  invoice_number: string;
  patient_name: string;
  allocated_amount: number;
  remarks: string;
  created_at: string;
}

interface AllocationInput {
  invoice_id: number;
  invoice_number: string;
  patient_name: string;
  balance_amount: number;
  allocated_amount: number;
  remarks: string;
}

const PaymentAllocation: React.FC = () => {
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<TestInvoice[]>([]);
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [allocationInputs, setAllocationInputs] = useState<AllocationInput[]>([{
    invoice_id: 0,
    invoice_number: '',
    patient_name: '',
    balance_amount: 0,
    allocated_amount: 0,
    remarks: ''
  }]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPayments();
    fetchAllocations();
    fetchInvoices();
  }, []);

  const addAllocationLine = () => {
    setAllocationInputs([...allocationInputs, {
      invoice_id: 0,
      invoice_number: '',
      patient_name: '',
      balance_amount: 0,
      allocated_amount: 0,
      remarks: ''
    }]);
  };

  const removeAllocationLine = (index: number) => {
    if (allocationInputs.length > 1) {
      setAllocationInputs(allocationInputs.filter((_, i) => i !== index));
    }
  };

  const updateAllocationLine = (index: number, field: keyof AllocationInput, value: any) => {
    const newLines = [...allocationInputs];
    if (field === 'invoice_id') {
      const invoice = invoices.find(inv => inv.id === Number(value));
      if (invoice) {
        newLines[index] = {
          ...newLines[index],
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          patient_name: invoice.patient_name,
          balance_amount: invoice.balance_amount
        };
      }
    } else if (field === 'allocated_amount') {
      const amount = Math.max(0, Number(value) || 0);
      const unallocatedAmount = parseFloat(selectedPayment?.unallocated_amount_base.toString() || '0');
      const currentTotal = allocationInputs.reduce((sum, allocation, i) => 
        i === index ? sum : sum + allocation.allocated_amount, 0
      );
      const maxAllowedAmount = Math.min(amount, unallocatedAmount - currentTotal, newLines[index].balance_amount);
      newLines[index] = { ...newLines[index], [field]: maxAllowedAmount };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setAllocationInputs(newLines);
  };

  const fetchPayments = async () => {
    try {
      const response = await paymentService.getPayments({ status: 'POSTED' });
      const unallocatedPayments = (response.data || []).filter((payment: Payment) => 
        payment.unallocated_amount_base > 0
      );
      setPayments(unallocatedPayments);
    } catch (error) {
      showToast('error', 'Failed to load payments');
    }
  };

  const fetchInvoices = async (patientId?: number) => {
    try {
      const params: any = {
        status: 'POSTED',
        payment_status: 'PARTIAL,UNPAID',       
      };
      if (patientId) {
        params.patient_id = patientId;
      }
      const response = await invoiceService.getTestInvoices(params);
      const unpaidInvoices = (response.data || []).filter((invoice: TestInvoice) => 
        invoice.balance_amount > 0
      );
      setInvoices(unpaidInvoices);
    } catch (error) {
      showToast('error', 'Failed to load invoices');
    }
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getPayments();
      setAllocations(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load payment allocations');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (value: string | number | (string | number)[]) => {
    const paymentId = Array.isArray(value) ? value[0]?.toString() : value.toString();
    const payment = payments.find(p => p.id.toString() === paymentId);
    setSelectedPayment(payment || null);
    setAllocationInputs([{
      invoice_id: 0,
      invoice_number: '',
      patient_name: '',
      balance_amount: 0,
      allocated_amount: 0,
      remarks: ''
    }]);
    if (payment) {
      fetchInvoices(payment.party_id);
    }
  };

  const handleAllocationChange = (invoiceId: number, field: 'allocated_amount' | 'remarks', value: string | number) => {
    setAllocationInputs(prev => {
      const existing = prev.find(a => a.invoice_id === invoiceId);
      if (existing) {
        return prev.map(a => 
          a.invoice_id === invoiceId 
            ? { ...a, [field]: field === 'allocated_amount' ? Number(value) : value }
            : a
        );
      } else {
        return [...prev, {
          invoice_id: invoiceId,
          invoice_number: '',
          patient_name: '',
          balance_amount: 0,
          allocated_amount: field === 'allocated_amount' ? Number(value) : 0,
          remarks: field === 'remarks' ? value.toString() : ''
        }];
      }
    });
  };

  const getTotalAllocated = () => {
    return allocationInputs.reduce((sum, allocation) => sum + allocation.allocated_amount, 0);
  };

  const getRemainingUnallocated = () => {
    const unallocated = parseFloat(selectedPayment?.unallocated_amount_base.toString() || '0');
    return unallocated - getTotalAllocated();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayment) {
      showToast('error', 'Please select a payment');
      return;
    }

    const validAllocations = allocationInputs.filter(a => a.allocated_amount > 0);
    if (validAllocations.length === 0) {
      showToast('error', 'Please allocate amount to at least one invoice');
      return;
    }

    if (getTotalAllocated() > parseFloat(selectedPayment.unallocated_amount_base.toString())) {
      showToast('error', 'Total allocated amount cannot exceed unallocated amount');
      return;
    }

    try {
      const allocationData = {
        allocations: validAllocations.map(allocation => ({
          document_type: 'TEST',
          document_id: allocation.invoice_id,
          allocated_amount: allocation.allocated_amount,
          remarks: allocation.remarks || ''
        }))
      };

      await paymentService.allocatePayment(selectedPayment.id, allocationData.allocations);
      showToast('success', 'Payment allocated successfully');
      
      setSelectedPayment(null);
      setAllocationInputs([]);
      fetchPayments();
      fetchAllocations();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error allocating payment');
    }
  };

  const invoiceColumns = [
    { key: 'invoice_number', label: 'Invoice #', sortable: true },
    { key: 'patient_name', label: 'Patient', sortable: true },
    { 
      key: 'balance_amount', 
      label: 'Balance', 
      sortable: true,
      render: (value: number) => value?.toFixed(2) || '0.00'
    },
    {
      key: 'allocated_amount',
      label: 'Allocate Amount',
      render: (_: any, record: TestInvoice) => {
        const allocation = allocationInputs.find(a => a.invoice_id === record.id);
        return (
          <input
            type="number"
            value={allocation?.allocated_amount || ''}
            onChange={(e) => handleAllocationChange(record.id, 'allocated_amount', e.target.value)}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
            min="0"
            max={record.balance_amount}
            step="0.01"
            placeholder="0.00"
          />
        );
      }
    },
    {
      key: 'remarks',
      label: 'Remarks',
      render: (_: any, record: TestInvoice) => {
        const allocation = allocationInputs.find(a => a.invoice_id === record.id);
        return (
          <input
            type="text"
            value={allocation?.remarks || ''}
            onChange={(e) => handleAllocationChange(record.id, 'remarks', e.target.value)}
            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="Optional remarks"
          />
        );
      }
    }
  ];

  const allocationColumns = [
    { key: 'payment_number', label: 'Payment #', sortable: true },
    { key: 'invoice_number', label: 'Invoice #', sortable: true },
    { key: 'patient_name', label: 'Patient', sortable: true },
    { 
      key: 'allocated_amount', 
      label: 'Allocated Amount', 
      sortable: true,
      render: (value: number) => value?.toFixed(2) || '0.00'
    },
    { key: 'remarks', label: 'Remarks', sortable: true },
    { 
      key: 'created_at', 
      label: 'Date', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
            Payment Details
          </h2>
          <button
            type="button"
            onClick={() => setIsFormCollapsed(!isFormCollapsed)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isFormCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
          </button>
        </div>

        {!isFormCollapsed && (
          <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-4" style={{ gap: 'var(--erp-spacing-lg)', marginBottom: 'var(--erp-spacing-xl)' }}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment *</label>
                <SearchableDropdown
                  options={payments.map(payment => ({
                    value: payment.id.toString(),
                    label: `${payment.payment_number} (${parseFloat(payment.unallocated_amount_base.toString())})`
                  }))}
                  value={selectedPayment?.id.toString() || ''}
                  onChange={handlePaymentChange}
                  placeholder="Select payment"
                  multiple={false}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount</label>
                <input
                  type="text"
                  value={parseFloat(selectedPayment?.total_amount_base.toString() || '0').toFixed(2)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Allocated Amount</label>
                <input
                  type="text"
                  value={parseFloat(selectedPayment?.allocated_amount_base.toString() || '0').toFixed(2)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unallocated Amount</label>
                <input
                  type="text"
                  value={getRemainingUnallocated().toFixed(2)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Invoice Allocations</h3>
                <button
                  type="button"
                  onClick={addAllocationLine}
                  className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Invoice
                </button>
              </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-left">Invoice</th>
                          <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-left">Patient</th>
                          <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-center">Balance</th>
                          <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-center">Allocated</th>
                          <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-left">Remarks</th>
                          <th className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocationInputs.map((allocation, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-2 py-1.5">
                              <SearchableDropdown
                                options={invoices.map(invoice => ({
                                  value: invoice.id,
                                  label: `${invoice.invoice_number} - ${invoice.patient_name}`
                                }))}
                                value={allocation.invoice_id}
                                onChange={(value) => updateAllocationLine(index, 'invoice_id', Number(value))}
                                placeholder="Select invoice..."
                                multiple={false}
                                searchable={true}
                                className="w-full min-w-48"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={allocation.patient_name}
                                readOnly
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={allocation.balance_amount.toFixed(2)}
                                readOnly
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-center"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={allocation.allocated_amount}
                                onChange={(e) => updateAllocationLine(index, 'allocated_amount', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                                min="0"
                                max={Math.min(allocation.balance_amount, getRemainingUnallocated() + allocation.allocated_amount)}
                                step="0.01"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={allocation.remarks}
                                onChange={(e) => updateAllocationLine(index, 'remarks', e.target.value)}
                                className="w-32 px-2 py-1 text-xs border border-gray-300 rounded"
                                placeholder="Remarks"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeAllocationLine(index)}
                                className="text-red-600 hover:text-red-800"
                                disabled={allocationInputs.length <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

            <div className="bg-blue-50 rounded-lg" style={{ padding: 'var(--erp-spacing-md)', marginBottom: 'var(--erp-spacing-lg)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 'var(--erp-spacing-lg)' }}>
                <div>
                  <div className="text-xs font-medium text-blue-600 mb-1">Original Unallocated</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {selectedPayment ? parseFloat(selectedPayment.unallocated_amount_base.toString()).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-green-600 mb-1">Total Allocated</div>
                  <div className="text-lg font-semibold text-green-800">
                    {getTotalAllocated().toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-orange-600 mb-1">Remaining Unallocated</div>
                  <div className="text-lg font-semibold text-orange-800">
                    {getRemainingUnallocated().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

                <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)', marginTop: 'var(--erp-spacing-lg)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment(null);
                      setAllocationInputs([]);
                    }}
                    className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="erp-form-btn text-white bg-primary hover:bg-secondary"
                    disabled={getTotalAllocated() === 0 || !selectedPayment}
                  >
                    Allocate Payment
                  </button>
                </div>
          </form>
        )}
      </div>

      <DataTable
        title="Payment Allocations"
        data={allocations}
        columns={allocationColumns}
        loading={loading}
      />
    </div>
  );
};

export default PaymentAllocation;