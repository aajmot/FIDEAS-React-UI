import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { diagnosticService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Tenant } from '../../types';
import '../../reports.css';

interface TestOrderViewProps {
  order: any;
  onBack: () => void;
}

const TestOrderView: React.FC<TestOrderViewProps> = ({ order, onBack }) => {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadOrderDetails();
  }, [order.id]);

  const loadOrderDetails = async () => {
    try {
      const [orderResponse, tenantResponse] = await Promise.all([
        diagnosticService.getTestOrder(order.id),
        adminService.getTenant()
      ]);
      setOrderDetails(orderResponse.data);
      setTenant(tenantResponse.data);
      setItems(orderResponse.data.items || []);
    } catch (error) {
      showToast('error', 'Failed to load order details');
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
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="p-6">
        <div className="text-red-500">Order not found</div>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Orders
        </button>
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
          <h2 className="text-lg font-semibold text-gray-900">Test Order Details</h2>
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
            <div className="text-right">
              <h2 className="report-title text-2xl font-bold text-gray-800 mb-2">TEST ORDER</h2>
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

        <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="report-details bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Order Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order Number:</span>
                <span className="font-semibold text-gray-900">{orderDetails.test_order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order Date:</span>
                <span className="text-gray-900">{new Date(orderDetails.order_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className="text-gray-900">{orderDetails.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Urgency:</span>
                <span className="text-gray-900">{orderDetails.urgency}</span>
              </div>
            </div>
          </div>
          
          <div className="report-details bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Patient Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{orderDetails.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{orderDetails.patient_phone || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="report-details bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Doctor Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{orderDetails.doctor_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{orderDetails.doctor_phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">License:</span>
                <span className="text-gray-900">{orderDetails.doctor_license_number || '-'}</span>
              </div>
            </div>
          </div>

          {orderDetails.notes && (
            <div className="report-details bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Notes</h3>
              <p className="text-sm text-gray-700">{orderDetails.notes}</p>
            </div>
          )}
        </div>

        <div className="report-section mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Order Items</h3>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
            <table className="report-table w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Test/Panel</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Type</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Rate</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">GST%</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">CESS%</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Disc%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">
                      {item.test_name || item.panel_name}
                    </td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">
                      {item.panel_id ? 'Panel' : 'Test'}
                    </td>
                    <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{(item.rate || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{(item.gst || 0).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{(item.cess || 0).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{(item.disc_percentage || 0).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-right font-semibold text-gray-900 border-b">{(item.total_amount || 0).toFixed(2)}</td>
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
              <li>• Test results will be available as per standard turnaround time</li>
              <li>• Sample collection as per appointment schedule</li>
              <li>• All disputes subject to local jurisdiction</li>
            </ul>
          </div>
          <div className="report-summary bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 border-b border-blue-200 pb-1">Order Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{(orderDetails.total_amount || 0).toFixed(2)}</span>
              </div>
              {(orderDetails.disc_percentage || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount ({(orderDetails.disc_percentage || 0).toFixed(1)}%):</span>
                  <span className="font-medium text-red-600">-{(orderDetails.disc_amount || 0).toFixed(2)}</span>
                </div>
              )}
              {(orderDetails.roundoff || 0) !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Round Off:</span>
                  <span className="font-medium text-gray-900">{(orderDetails.roundoff || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                  <span className="report-total text-2xl font-bold text-blue-600">{(orderDetails.final_amount || 0).toFixed(2)}</span>
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

export default TestOrderView;
