import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/apiExtensions';
import { useToast } from '../../context/ToastContext';

const StockValuation: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getStockValuation();
      setData(response.data || { items: [], total_value: 0 });
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load stock valuation');
      setData({ items: [], total_value: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Stock Valuation</h1>
      
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="text-3xl font-bold text-green-600">
          ₹{data.total_value?.toFixed(2) || '0.00'}
        </div>
        <div className="text-gray-600">Total Stock Value</div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.items?.length > 0 ? data.items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="px-6 py-4 text-sm">{item.product_name}</td>
                <td className="px-6 py-4 text-sm text-right">{item.quantity?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 text-sm text-right">₹{item.avg_cost?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 text-sm text-right font-semibold">₹{item.value?.toFixed(2) || '0.00'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockValuation;
