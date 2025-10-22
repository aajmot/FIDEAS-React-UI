import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface OrderCommissionViewProps {
  commissionId: number;
  onBack: () => void;
}

const OrderCommissionView: React.FC<OrderCommissionViewProps> = ({ commissionId, onBack }) => {
  const [commission, setCommission] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [commissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commissionResponse, tenantResponse] = await Promise.all([
        adminService.getOrderCommission(commissionId),
        adminService.getTenant()
      ]);
      setCommission(commissionResponse.data);
      setTenant(tenantResponse.data);
    } catch (error) {
      showToast('error', 'Failed to load commission data');
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

  if (!commission) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Commission not found</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden bg-gray-50">
        <div className="flex items-center">
          <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Order Commission Details</h2>
        </div>
        <button onClick={handlePrint} className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
          <Printer className="h-3 w-3 mr-1" />
          Print
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-3">
        <div className="border-b-2 border-blue-600 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">{tenant?.name || 'Company Name'}</h1>
              {tenant?.address && <div className="text-gray-600 text-sm whitespace-pre-line mb-2">{tenant.address}</div>}
              <div className="flex gap-4 text-sm text-gray-600">
                {tenant?.phone && <div>Phone: {tenant.phone}</div>}
                {tenant?.email && <div>Email: {tenant.email}</div>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ORDER COMMISSION</h2>
              <div className="text-sm text-gray-600">
                <div>Date: {new Date(commission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Commission Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Commission #:</span>
                <span className="font-semibold text-gray-900">{commission.commission_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order Type:</span>
                <span className="text-gray-900">{commission.order_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Order #:</span>
                <span className="text-gray-900">{commission.order_number}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Agency Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{commission.agency_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="text-gray-900">{commission.agency_phone}</span>
              </div>
            </div>
          </div>
        </div>

        {commission.notes && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Notes</h3>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">{commission.notes}</div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">Commission Items</h3>
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-b">Item</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">Rate</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">Comm%</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">Comm Val</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">GST%</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">CESS%</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-b">Disc%</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 border-b">Final</th>
              </tr>
            </thead>
            <tbody>
              {commission.items?.map((item: any, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 text-sm text-gray-900 border-b">{item.item_name}</td>
                  <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">₹{item.item_rate.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.commission_percentage.toFixed(2)}%</td>
                  <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">₹{item.commission_value.toFixed(2)}</td>
                  <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.gst_percentage.toFixed(2)}%</td>
                  <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.cess_percentage.toFixed(2)}%</td>
                  <td className="px-2 py-2 text-sm text-center text-gray-700 border-b">{item.discount_percentage.toFixed(2)}%</td>
                  <td className="px-2 py-2 text-sm text-right font-medium text-gray-900 border-b">₹{item.final_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-4">
          <div className="w-1/2 bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-3">Commission Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>₹{commission.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({commission.disc_percentage}%):</span>
                <span>₹{commission.disc_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Round Off:</span>
                <span>₹{commission.roundoff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Final Total:</span>
                <span>₹{commission.final_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 mt-4">
          <div className="flex justify-between items-start mb-4">
            <div className="text-xs text-gray-600">
              <p><strong>Note:</strong> This is a system generated commission document.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-1">Authorized Signature</p>
              <div className="border-b border-gray-300 w-32"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCommissionView;
