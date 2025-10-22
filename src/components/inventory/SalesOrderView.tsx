import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { inventoryService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { SalesOrder, SalesOrderItem, Tenant } from '../../types';
import '../inventory/PurchaseOrderPrint.css';

interface SalesOrderViewProps {
  order: SalesOrder;
  onBack: () => void;
}

const SalesOrderView: React.FC<SalesOrderViewProps> = ({ order, onBack }) => {
  const [orderDetails, setOrderDetails] = useState<SalesOrder | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadOrderDetails();
  }, [order.id]);

  const loadOrderDetails = async () => {
    try {
      const [orderResponse, tenantResponse] = await Promise.all([
        inventoryService.getSalesOrder(order.id),
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
    const printContent = document.querySelector('.sales-order-content');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
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
    <div className="purchase-order-view bg-white min-h-screen">
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
          <h2 className="text-lg font-semibold text-gray-900">Sales Order Details</h2>
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
      <div className="sales-order-content print-container max-w-4xl mx-auto p-8 print:p-3 print:max-w-none">
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
              <h2 className="print-po-title text-2xl font-bold text-gray-800 mb-2">SALES ORDER</h2>
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

        {/* Order Details */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
          <div className="print-order-details bg-gray-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Order Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">SO Number:</span>
                <span className="font-semibold text-gray-900">{orderDetails.so_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order Date:</span>
                <span className="text-gray-900">{new Date(orderDetails.order_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: '2-digit' 
                })}</span>
              </div>
            </div>
          </div>
          
          <div className="print-order-details bg-blue-50 p-4 rounded-lg print:p-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Customer Information</h3>
            <div className="space-y-1 print:space-y-0">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{orderDetails.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{orderDetails.customer_phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Tax ID:</span>
                <span className="text-gray-900">{orderDetails.customer_tax_id || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="print-section mb-4 print:mb-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:text-xs print:mb-1">Order Items</h3>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg print:overflow-visible">
            <table className="print-table w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '120px' }}>Product</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '60px' }}>Batch</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '50px' }}>Qty</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '50px' }}>Free</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '60px' }}>Rate</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '60px' }}>CGST%</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '60px' }}>SGST%</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '50px' }}>Disc%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" style={{ minWidth: '70px' }}>Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-sm font-medium text-gray-900 border-b">{item.product_name}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.batch_number || '-'}</td>
                    <td className="px-2 py-2 text-sm text-center font-medium text-gray-900 border-b">{item.quantity}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.free_quantity || 0}</td>
                    <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">{item.unit_price.toFixed(2)}</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{(item.cgst_rate || item.gst_rate / 2).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{(item.sgst_rate || item.gst_rate / 2).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.discount_percent.toFixed(1)}%</td>
                    <td className="px-2 py-2 text-sm text-right font-semibold text-gray-900 border-b">{item.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
            <h4 className="text-sm font-semibold text-gray-800 mb-2 border-b border-blue-200 pb-1 print:text-xs print:mb-1">Order Summary</h4>
            <div className="space-y-1 print:space-y-0">
              {orderDetails.discount_percent > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount ({orderDetails.discount_percent.toFixed(1)}%):</span>
                  <span className="font-medium text-red-600">-{orderDetails.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {orderDetails.roundoff !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Round Off:</span>
                  <span className="font-medium text-gray-900">{orderDetails.roundoff.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                  <span className="print-total text-2xl font-bold text-blue-600">{orderDetails.total_amount.toFixed(2)}</span>
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

export default SalesOrderView;