import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Tenant } from '../../types';
import '../../reports.css';

interface TestInvoiceViewProps {
  invoice: any;
  onBack: () => void;
}

const TestInvoiceView: React.FC<TestInvoiceViewProps> = ({ invoice, onBack }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadTenantDetails();
  }, []);

  const loadTenantDetails = async () => {
    try {
      const tenantResponse = await adminService.getTenant();
      setTenant(tenantResponse.data);
    } catch (error) {
      showToast('error', 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-gray-500">Loading invoice details...</div>
      </div>
    );
  }

  return (
    <div className="report-view bg-white">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden bg-gray-50">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Test Invoice Details</h2>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          <Printer className="h-3 w-3 mr-1" />
          Print
        </button>
      </div>

      <div className="report-content report-container max-w-4xl mx-auto p-8">
        <div className="report-header border-b-2 border-blue-600 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="report-company-name text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'Company Name'}</h1>
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
            
            <div className="flex items-center gap-4">
              {invoice.qr_code && (
                <img 
                  src={invoice.qr_code} 
                  alt="Invoice QR Code" 
                  className="w-12 h-12"
                />
              )}
              <div className="text-right">
                <h2 className="report-title text-2xl font-bold text-gray-800 mb-2">TEST INVOICE</h2>
                <div className="text-sm text-gray-600">
                  <div>Date: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="report-details bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Invoice Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Invoice Number:</span>
                <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Invoice Date:</span>
                <span className="text-gray-900">{new Date(invoice.invoice_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="font-medium text-gray-600">Due Date:</span>
                <span className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div> */}
              {/* <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className="text-gray-900">{invoice.status}</span>
              </div> */}
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order Number:</span>
                <span className="text-gray-900">{invoice.order?.test_order_number}</span>
              </div>
            </div>
          </div>
          
          <div className="report-details bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Patient Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{invoice.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{invoice.patient_phone || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-section grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <div className="report-details bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Doctor Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{invoice.order?.doctor_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{invoice.order?.doctor_phone || '-'}</span>
              </div>
              {invoice.notes && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Notes:</span>
                  <span className="text-gray-900">{invoice.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="report-section mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Invoice Items</h3>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
            <table className="report-table w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Test/Panel</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Rate</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Disc%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Disc Amt</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Taxable</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">GST%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">GST Amt</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">CESS%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">CESS Amt</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">
                      {item.test_name || item.panel_name}
                    </td>
                    <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{item.rate??0}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.disc_percentage??0}%</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{item.disc_amount??0}</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{item.taxable_amount??0}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{((item.cgst_rate??0) + (item.sgst_rate??0))}%</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{((item.cgst_amount??0) + (item.sgst_amount??0) + (item.igst_amount??0))}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.cess_rate??0}%</td>
                    <td className="px-2 py-2 text-sm text-right text-gray-700 border-b">{item.cess_amount??0}</td>
                    <td className="px-2 py-2 text-sm text-right font-semibold text-gray-900 border-b">{item.total_amount??0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-0 text-xs">Terms & Conditions:</h4>
            <ul className="text-xs text-gray-600 leading-tight">
              <li>• Payment due within 30 days of invoice date</li>
              <li>• Late payment charges may apply</li>
              <li>• All disputes subject to local jurisdiction</li>
            </ul>
          </div>
          <div className="report-summary bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 border-b border-blue-200 pb-1">Invoice Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{invoice.subtotal_amount??0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Items Discount:</span>
                <span className="font-medium text-red-600">-{invoice.items_total_discount_amount??0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxable Amount:</span>
                <span className="font-medium text-gray-900">{invoice.taxable_amount??0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">CGST:</span>
                <span className="font-medium text-gray-900">{invoice.cgst_amount??0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">SGST:</span>
                <span className="font-medium text-gray-900">{invoice.sgst_amount??0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">IGST:</span>
                <span className="font-medium text-gray-900">{invoice.igst_amount??0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">CESS:</span>
                <span className="font-medium text-gray-900">{invoice.cess_amount??0}</span>
              </div>
              {invoice.overall_disc_amount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Discount:</span>
                  <span className="font-medium text-red-600">-{invoice.overall_disc_amount??0}</span>
                </div>
              )}
              {invoice.roundoff !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Round Off:</span>
                  <span className="font-medium text-gray-900">{invoice.roundoff??0}</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                  <span className="report-total text-2xl font-bold text-blue-600">{invoice.final_amount??0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="report-footer border-t border-gray-200 pt-3 mt-4">
          <div className="text-right">
            <div className="report-signature mb-8">
              <p className="text-xs text-gray-600 mb-1">Authorized Signature</p>
              <div className="border-b border-gray-300 w-32 ml-auto"></div>
            </div>
            <div className="text-xs text-gray-500">
              <p>This is a computer generated document.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInvoiceView;
