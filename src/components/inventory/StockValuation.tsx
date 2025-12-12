import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';

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
      setData(response.data?.data || { items: [], total_value: 0 });
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
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="text-3xl font-bold text-green-600">
          ₹{data.total_value?.toFixed(2) || '0.00'}
        </div>
        <div className="text-gray-600">Total Stock Value</div>
      </div>

      <DataTable
        title="Stock Valuation"
        columns={[
          { key: 'product_name', label: 'Product' },
          { key: 'quantity', label: 'Quantity', render: (value) => value?.toFixed(2) || '0.00' },
          { key: 'avg_cost', label: 'Avg Cost', render: (value) => `₹${value?.toFixed(2) || '0.00'}` },
          { key: 'value', label: 'Value', render: (value) => `₹${value?.toFixed(2) || '0.00'}` }
        ]}
        data={data.items || []}
        loading={loading}
      />
    </div>
  );
};

export default StockValuation;
