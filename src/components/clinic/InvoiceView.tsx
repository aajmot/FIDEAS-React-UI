import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Invoice, Tenant } from '../../types';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface InvoiceViewProps {
  invoice: Invoice;
  onBack: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onBack }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const response = await adminService.getTenant();
      setTenant(response.data);
    } catch (error) {
      showToast('error', 'Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };
  const handlePrint = () => {
    const printContent = document.querySelector('.invoice-content');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const formatAmount = (amount: number) => {
    return (amount || 0).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="invoice-view bg-white min-h-screen">
      {/* Print Controls */}
      <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 print:hidden bg-gray-50">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Invoice Details</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded w-full sm:w-auto justify-center"
        >
          <Printer className="h-3 w-3 mr-1" />
          Print
        </button>
      </div>

      {/* A4 Printable Content */}
      <div className="invoice-content print-container max-w-4xl mx-auto p-8 print:p-3 print:max-w-none">
        {/* Invoice Header */}
        <div className="print-header border-b-2 border-blue-600 pb-3 mb-4 print:pb-2 print:mb-2">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
            <div className="flex-1">
              <h1 className="print-clinic-name text-2xl md:text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'Clinic Name'}</h1>
              {tenant?.address && (
                <div className="text-gray-600 mb-2">
                  <div className="whitespace-pre-line text-sm">{tenant.address}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                {tenant?.email && <div>Email: {tenant.email}</div>}
                {tenant?.tax_id && <div>Registration: {tenant.tax_id}</div>}
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <h2 className="print-invoice-title text-xl md:text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
              <div className="text-xs md:text-sm text-gray-600">
                <div>Date: {formatDate(invoice.invoice_date)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-invoice-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Invoice Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Invoice Number:</span>
                <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Appointment #:</span>
                <span className="text-gray-900">{invoice.appointment_number || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Payment Method:</span>
                <span className="text-gray-900">{invoice.payment_method || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Payment Status:</span>
                <span className="text-gray-900">{invoice.payment_status}</span>
              </div>
            </div>
          </div>
          
          <div className="print-invoice-details bg-blue-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Patient Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{invoice.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{invoice.patient_phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Doctor:</span>
                <span className="text-gray-900">{invoice.doctor_name || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Breakdown */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="print-section mb-4 print:mb-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Amount Breakdown</h3>
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
              <table className="print-table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Item Type</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Description</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Qty</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Unit Price</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 text-sm text-gray-900 border-b">{item.item_type}</td>
                      <td className="px-2 py-2 text-sm text-gray-900 border-b">{item.description}</td>
                      <td className="px-2 py-2 text-sm text-center text-gray-900 border-b">{item.quantity}</td>
                      <td className="px-2 py-2 text-sm text-right text-gray-900 border-b">{formatAmount(item.unit_price)}</td>
                      <td className="px-2 py-2 text-sm text-right text-gray-900 border-b">{formatAmount(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="print-section mb-4 print:mb-2">
          <div className="flex flex-col md:flex-row print:flex-row gap-4 md:gap-6 print:gap-4">
            {/* Terms and Conditions */}
            <div className="w-full md:w-1/2">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 print:text-xs print:mb-2">Terms & Conditions</h4>
              <div className="text-xs text-gray-600 space-y-1 print:text-xs">
                <p>• Payment is due within 30 days of invoice date.</p>
                <p>• All services are non-refundable once rendered.</p>
                <p>• Please bring this invoice for any follow-up visits.</p>
                <p>• Contact us for any billing inquiries.</p>
              </div>
            </div>
            
            {/* Invoice Summary */}
            <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded-lg print:p-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 print:text-xs print:mb-2">Invoice Summary</h4>
              <div className="space-y-2 text-sm print:space-y-1 print:text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatAmount(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount ({invoice.discount_percentage || 0}%):</span>
                  <span className={`font-medium ${(invoice.discount_amount || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {(invoice.discount_amount || 0) > 0 ? '-' : ''}{formatAmount(invoice.discount_amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 print:pt-1">
                  <span className="font-semibold text-gray-900">Final Amount:</span>
                  <span className="font-bold text-lg text-gray-900 print:text-sm">{formatAmount(invoice.final_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer border-t border-gray-200 pt-3 mt-4 print:pt-2 print:mt-2">
          <div className="flex flex-col md:flex-row print:flex-row justify-between items-end gap-4 md:gap-0">
            <div className="print:w-1/2">
              <div className="text-xs text-gray-600 mb-2 print:text-xs">
                <p><strong>Note:</strong> Please retain this invoice for your records.</p>
                <p>Thank you for choosing our services.</p>
              </div>
            </div>
            <div className="text-right print:w-1/2">
              <div className="print-signature-space mb-8 print:mb-4">
                <p className="text-xs text-gray-600 mb-1 print:text-xs">Authorized Signature</p>
                <div className="border-b border-gray-300 w-32 ml-auto print:w-24"></div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 print:text-xs">
              <p>This is a computer generated invoice.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;