import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { accountService, adminService } from '../../services/api';
import { accountExtensions } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Tenant } from '../../types';
import '../invoice/PurchaseInvoicePrint.css';

interface ContraViewProps {
  contraId: number;
  onBack: () => void;
}

const ContraView: React.FC<ContraViewProps> = ({ contraId, onBack }) => {
  const [contra, setContra] = useState<any>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [contraId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const contraResponse = await accountExtensions.getContraVouchers();
      const contraData = contraResponse.data?.data?.find((c: any) => c.id === contraId);
      
      if (contraData && contraData.from_account_id && contraData.to_account_id) {
        const accountsResponse = await accountService.getAccounts();
        if (accountsResponse.data) {
          const fromAccount = accountsResponse.data.find((a: any) => a.id === contraData.from_account_id);
          const toAccount = accountsResponse.data.find((a: any) => a.id === contraData.to_account_id);
          
          if (fromAccount) {
            contraData.from_account_name = fromAccount.name;
            contraData.from_account_code = fromAccount.code;
          }
          if (toAccount) {
            contraData.to_account_name = toAccount.name;
            contraData.to_account_code = toAccount.code;
          }
        }
      }

      const tenantResponse = await adminService.getTenant();
      
      setContra(contraData);
      setTenant(tenantResponse.data);
    } catch (error) {
      showToast('error', 'Failed to load contra voucher data');
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

  if (!contra) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Contra voucher not found</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold text-gray-900">Contra Voucher Details</h2>
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
              <h2 className="print-po-title text-2xl font-bold text-gray-800 mb-2">CONTRA VOUCHER</h2>
              <div className="text-sm text-gray-600">
                <div>Date: {new Date(contra.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Voucher Details */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-order-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Voucher Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Voucher Number:</span>
                <span className="font-semibold text-gray-900">{contra.voucher_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-900">{new Date(contra.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Transfer Details */}
        <div className="print-section mb-4 print:mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div className="print-order-details bg-red-50 p-4 rounded-lg print:p-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">From Account (Credit)</h3>
              <div className="space-y-2 print:space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-600 w-24">Account:</span>
                  <span className="flex-1 font-semibold text-gray-900">{contra.from_account_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 w-24">Code:</span>
                  <span className="flex-1 text-gray-900">{contra.from_account_code || '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="print-order-details bg-green-50 p-4 rounded-lg print:p-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">To Account (Debit)</h3>
              <div className="space-y-2 print:space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-600 w-24">Account:</span>
                  <span className="flex-1 font-semibold text-gray-900">{contra.to_account_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 w-24">Code:</span>
                  <span className="flex-1 text-gray-900">{contra.to_account_code || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="print-section mb-4 print:mb-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm border border-blue-200 print:p-3">
            <div className="flex justify-between items-center mb-4 print:mb-2">
              <span className="text-xl font-semibold text-gray-800 print:text-base">Transfer Amount:</span>
              <span className="print-total text-4xl font-bold text-blue-600 print:text-2xl">
                 {Number(contra.amount || 0).toFixed(2)}
              </span>
            </div>
            
            {contra.narration && (
              <div className="pt-3 border-t border-blue-200 print:pt-2">
                <span className="font-medium text-gray-600 text-sm">Narration:</span>
                <p className="text-gray-900 mt-1">{contra.narration}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amount in Words */}
        <div className="print-section mb-4 print:mb-2">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:p-2">
            <span className="font-medium text-gray-600 text-sm">Amount in Words:</span>
            <p className="text-gray-900 font-semibold mt-1 text-lg print:text-sm">
              Rupees {Number(contra.amount || 0).toFixed(2)} Only
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer border-t border-gray-200 pt-4 mt-6 print:pt-2 print:mt-3">
          <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-4">
            <div>
              <p className="text-xs text-gray-600 mb-1 print:text-xs">Prepared By</p>
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

export default ContraView;
