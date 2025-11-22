import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { inventoryService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Tenant } from '../../types';
import './PurchaseInvoicePrint.css';

interface PurchaseInvoiceViewProps {
  invoiceId: number;
  onBack: () => void;
}

const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({ invoiceId, onBack }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const invoiceResponse = await api.get(`/api/v1/inventory/purchase-invoices/${invoiceId}`);
      const invoiceData = invoiceResponse.data?.data || invoiceResponse.data;
      
      // Fetch supplier details if we have supplier_id
      if (invoiceData.supplier_id) {
        try {
          const supplierResponse = await inventoryService.getSupplier(invoiceData.supplier_id);
          const supplier = supplierResponse.data;
          
          // Update invoice with latest supplier information
          invoiceData.supplier_name = supplier.name;
          invoiceData.supplier_address = supplier.address || '';
          invoiceData.supplier_phone = supplier.phone;
          invoiceData.supplier_tax_id = supplier.tax_id || '';
        } catch (error) {
          console.error('Failed to fetch supplier details:', error);
        }
      }

      const tenantResponse = await adminService.getTenant();
      
      setInvoice(invoiceData);
      setTenant(tenantResponse.data);
    } catch (error) {
      showToast('error', 'Failed to load purchase invoice data');
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

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Purchase invoice not found</p>
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
          <h2 className="text-lg font-semibold text-gray-900">Purchase Invoice Details</h2>
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
                {tenant?.tax_id && <div>Tax ID: {tenant.tax_id}</div>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="print-po-title text-2xl font-bold text-gray-800 mb-2">PURCHASE INVOICE</h2>
              <div className="text-sm text-gray-600">
                <div>Date: {new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-order-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Invoice Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Invoice Number:</span>
                <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
              </div>
              {invoice.reference_number && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Reference:</span>
                  <span className="text-gray-900">{invoice.reference_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Invoice Date:</span>
                <span className="text-gray-900">{new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Due Date:</span>
                  <span className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: '2-digit' 
                  })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className="font-semibold text-gray-900">{invoice.status}</span>
              </div>
            </div>
          </div>
          
          <div className="print-order-details bg-blue-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Supplier Information</h3>
            <div className="space-y-2 print:space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-gray-600 w-20">Name:</span>
                <span className="flex-1 font-semibold text-gray-900 text-base">{invoice.supplier_name || '-'}</span>
              </div>
              <div className="flex mb-1">
                <span className="font-medium text-gray-600 w-20">Address:</span>
                <span className="flex-1 text-gray-900 whitespace-pre-line text-sm">{invoice.supplier_address || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 w-20">Phone:</span>
                <span className="flex-1 text-gray-900">{invoice.supplier_phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 w-20">GSTIN:</span>
                <span className="flex-1 text-gray-900 font-medium">{invoice.supplier_tax_id || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="print-section mb-4 print:mb-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Invoice Items</h3>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
            <table className="print-table w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Product</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">HSN</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Batch</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Qty</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Rate</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Disc%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Taxable</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">CGST</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">SGST</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">{item.product_name || '-'}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.hsn_code || '-'}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.batch_number || '-'}</td>
                    <td className="px-2 py-2 text-sm text-center font-medium text-gray-900 border-b">{item.quantity || 0}</td>
                    <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{Number(item.unit_price_base || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{Number(item.discount_percent || 0).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{Number(item.taxable_amount_base || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{Number(item.cgst_amount_base || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{Number(item.sgst_amount_base || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-right font-semibold text-gray-900 border-b">{Number(item.total_amount_base || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Details Section */}
        {invoice.payment_details && invoice.payment_details.length > 0 && (
          <div className="print-section mb-4 print:mb-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Payment Details</h3>
            <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
              <table className="print-table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Mode</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Account</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Amount</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Reference</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payment_details.map((payment: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 text-sm text-gray-900 border-b">{payment.payment_mode}</td>
                      <td className="px-2 py-2 text-sm text-gray-700 border-b">{payment.account_name || '-'}</td>
                      <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{Number(payment.amount_base || 0).toFixed(2)}</td>
                      <td className="px-2 py-2 text-sm text-gray-700 border-b">{payment.transaction_reference || '-'}</td>
                      <td className="px-2 py-2 text-sm text-gray-700 border-b">{payment.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div>
            <h4 className="font-medium text-gray-800 mb-0 text-xs print:text-xs">Terms & Conditions:</h4>
            <ul className="text-xs text-gray-600 leading-tight print:text-xs print:leading-none">
              <li>• Payment terms as per agreement</li>
              <li>• Goods once sold will not be taken back</li>
              <li>• All disputes subject to local jurisdiction</li>
            </ul>
          </div>
          <div className="print-summary bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200 print:p-2">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 border-b border-blue-200 pb-1 print:text-xs print:mb-1">Invoice Summary</h4>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{Number(invoice.subtotal_base || 0).toFixed(2)}</span>
              </div>
              {Number(invoice.discount_percent_base || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount ({Number(invoice.discount_percent_base || 0).toFixed(1)}%):</span>
                  <span className="font-medium text-red-600">-{Number(invoice.discount_amount_base || 0).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.tax_amount_base || 0) > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">CGST:</span>
                    <span className="font-medium text-gray-900">{Number(invoice.cgst_amount_base || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SGST:</span>
                    <span className="font-medium text-gray-900">{Number(invoice.sgst_amount_base || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
              {Number(invoice.roundoff_base || 0) !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Round Off:</span>
                  <span className="font-medium text-gray-900">{Number(invoice.roundoff_base || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                  <span className="print-total text-2xl font-bold text-blue-600">{Number(invoice.total_amount_base || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer border-t border-gray-200 pt-3 mt-4 print:pt-2 print:mt-2">
          <div className="text-right">
            <div className="print-signature-space mb-8 print:mb-4">
              <p className="text-xs text-gray-600 mb-1 print:text-xs">Authorized Signature</p>
              <div className="border-b border-gray-300 w-32 ml-auto print:w-24"></div>
            </div>
            <div className="text-xs text-gray-500 print:text-xs">
              <p>This is a computer generated document.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceView;
