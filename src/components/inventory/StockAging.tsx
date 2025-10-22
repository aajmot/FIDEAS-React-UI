import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/apiExtensions';
import { useToast } from '../../context/ToastContext';

const StockAging: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getStockAging();
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load stock aging');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Stock Aging Analysis</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">0-30 Days</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">31-60 Days</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">61-90 Days</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">90+ Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? data.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="px-6 py-4 text-sm">{item.product}</td>
                <td className="px-6 py-4 text-sm text-right text-green-600">{item['0-30_days']?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 text-sm text-right text-yellow-600">{item['31-60_days']?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 text-sm text-right text-orange-600">{item['61-90_days']?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 text-sm text-right text-red-600">{item['90+_days']?.toFixed(2) || '0.00'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockAging;
