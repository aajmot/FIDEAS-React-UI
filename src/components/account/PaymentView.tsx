import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { accountService, adminService, inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Tenant } from '../../types';
import '../invoice/PurchaseInvoicePrint.css';

interface PaymentViewProps {
  paymentId: number;
  onBack: () => void;
}

const PaymentView: React.FC<PaymentViewProps> = ({ paymentId, onBack }) => {
  const [payment, setPayment] = useState<any>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [paymentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const paymentResponse = await accountService.getPayment(paymentId);
      const paymentData = paymentResponse.data || paymentResponse;
      
      // Fetch account details if we have account_id
      if (paymentData.account_id) {
        try {
          const accountsResponse = await accountService.getAccounts();
          if (accountsResponse.data && accountsResponse.data.length > 0) {
            const account = accountsResponse.data.find((a: any) => a.id === paymentData.account_id);
            
            if (account) {
              paymentData.account_name = account.name;
              paymentData.account_code = account.code;
            }
          }
        } catch (error) {
          console.error('Failed to fetch account details:', error);
        }
      }

      // Fetch party details if we have party_id and party_type
      if (paymentData.party_id && paymentData.party_type) {
        try {
          if (paymentData.party_type === 'SUPPLIER') {
            const suppliersResponse = await inventoryService.getSuppliers({ per_page: 1000 });
            const supplier = suppliersResponse.data?.find((s: any) => s.id === paymentData.party_id);
            if (supplier) {
              paymentData.party_name = supplier.name;
              paymentData.party_phone = supplier.phone;
              paymentData.party_address = supplier.address;
            }
          } else if (paymentData.party_type === 'CUSTOMER') {
            const customersResponse = await inventoryService.getCustomers({ per_page: 1000 });
            const customer = customersResponse.data?.find((c: any) => c.id === paymentData.party_id);
            if (customer) {
              paymentData.party_name = customer.name;
              paymentData.party_phone = customer.phone;
              paymentData.party_address = customer.address;
            }
          }
        } catch (error) {
          console.error('Failed to fetch party details:', error);
        }
      }

      const tenantResponse = await adminService.getTenant();
      
      setPayment(paymentData);
      setTenant(tenantResponse.data);
    } catch (error) {
      showToast('error', 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Payment not found</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const isReceipt = payment.payment_mode === 'RECEIVED';
  const documentTitle = isReceipt ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER';

  return (
    <div className="purchase-invoice-view bg-white min-h-screen">
      {/* Print Controls */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden bg-gray-50">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          <Printer className="h-3 w-3 mr-1" />
          Print
        </button>
      </div>

      {/* A4 Printable Content */}
      <div className="purchase-invoice-content print-container max-w-4xl mx-auto p-8 print:p-3 print:max-w-none">
        {/* Company Header */}
        <div className="print-header border-b-2 border-blue-600 pb-3 mb-4 print:pb-2 print:mb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="print-company-name text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'Company Name'}</h1>
              {tenant?.address && (
                <div className="text-gray-600 mb-2">
                  <div className="whitespace-pre-line">{tenant.address}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                {tenant?.email && <div>Email: {tenant.email}</div>}
                {tenant?.tax_id && <div>GSTIN: {tenant.tax_id}</div>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="print-po-title text-2xl font-bold text-gray-800 mb-2">{documentTitle}</h2>
              <div className="text-sm text-gray-600">
                <div>Date: {new Date(payment.payment_date || payment.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-order-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Payment Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Payment Number:</span>
                <span className="font-semibold text-gray-900">{payment.payment_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Payment Mode:</span>
                <span className="text-gray-900">
                  {payment.payment_mode === 'PAID' ? 'Payment (Outgoing)' : 'Receipt (Incoming)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Payment Type:</span>
                <span className="text-gray-900">{payment.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Payment Method:</span>
                <span className="text-gray-900">{payment.payment_method || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-900">{new Date(payment.payment_date || payment.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className="font-semibold text-gray-900">{payment.status}</span>
              </div>
            </div>
          </div>
          
          <div className="print-order-details bg-blue-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Account Information</h3>
            <div className="space-y-2 print:space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-600 w-24">Account:</span>
                <span className="flex-1 font-semibold text-gray-900">{payment.account_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 w-24">Code:</span>
                <span className="flex-1 text-gray-900">{payment.account_code || '-'}</span>
              </div>
              {payment.reference_type && payment.reference_type !== 'GENERAL' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600 w-24">Reference:</span>
                    <span className="flex-1 text-gray-900">{payment.reference_type}</span>
                  </div>
                  {payment.reference_number && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600 w-24">Ref. Number:</span>
                      <span className="flex-1 text-gray-900 font-medium">{payment.reference_number}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Party Information Section */}
        {payment.party_name && (
          <div className="print-section mb-4 print:mb-2">
            <div className="print-order-details bg-green-50 p-4 rounded-lg print:p-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">
                {payment.party_type === 'SUPPLIER' ? 'Supplier' : 'Customer'} Information
              </h3>
              <div className="space-y-2 print:space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-600 w-24">Name:</span>
                  <span className="flex-1 font-semibold text-gray-900">{payment.party_name}</span>
                </div>
                {payment.party_phone && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600 w-24">Phone:</span>
                    <span className="flex-1 text-gray-900">{payment.party_phone}</span>
                  </div>
                )}
                {payment.party_address && (
                  <div className="flex mb-1">
                    <span className="font-medium text-gray-600 w-24">Address:</span>
                    <span className="flex-1 text-gray-900 whitespace-pre-line text-sm">{payment.party_address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Amount Section */}
        <div className="print-section mb-4 print:mb-2">
        </div>

        {/* Payment Amount Section */}
        <div className="print-section mb-4 print:mb-2">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm border border-green-200 print:p-3">
            <div className="flex justify-between items-center mb-4 print:mb-2">
              <span className="text-xl font-semibold text-gray-800 print:text-base">Amount {isReceipt ? 'Received' : 'Paid'}:</span>
              <span className="print-total text-4xl font-bold text-green-600 print:text-2xl">
                 {Number(payment.amount || 0).toFixed(2)}
              </span>
            </div>
            
            {payment.description && (
              <div className="pt-3 border-t border-green-200 print:pt-2">
                <span className="font-medium text-gray-600 text-sm">Description:</span>
                <p className="text-gray-900 mt-1">{payment.description}</p>
              </div>
            )}
            
            {payment.remarks && (
              <div className="pt-3 border-t border-green-200 mt-3 print:pt-2 print:mt-2">
                <span className="font-medium text-gray-600 text-sm">Remarks:</span>
                <p className="text-gray-900 mt-1">{payment.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amount in Words */}
        <div className="print-section mb-4 print:mb-2">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:p-2">
            <span className="font-medium text-gray-600 text-sm">Amount in Words:</span>
            <p className="text-gray-900 font-semibold mt-1 text-lg print:text-sm">
              {/* This would ideally convert number to words */}
              Rupees {Number(payment.amount || 0).toFixed(2)} Only
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer border-t border-gray-200 pt-4 mt-6 print:pt-2 print:mt-3">
          <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4">
            <div>
              <p className="text-xs text-gray-600 mb-1 print:text-xs">Received By</p>
              <div className="border-b border-gray-300 w-48 mt-8 print:w-32 print:mt-4"></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-1 print:text-xs">Authorized Signature</p>
              <div className="border-b border-gray-300 w-48 ml-auto mt-8 print:w-32 print:mt-4"></div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center print:text-xs">
            <p>This is a computer generated document.</p>
            <p>Generated on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
