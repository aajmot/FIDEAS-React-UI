import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/apiExtensions';
import { useToast } from '../../context/ToastContext';
import DataTable from '../common/DataTable';

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
      setData(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load stock aging');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <DataTable
        title="Stock Aging Analysis"
        columns={[
          { key: 'product', label: 'Product' },
          { key: '0-30_days', label: '0-30 Days', render: (value) => <span className="text-green-600">{value?.toFixed(2) || '0.00'}</span> },
          { key: '31-60_days', label: '31-60 Days', render: (value) => <span className="text-yellow-600">{value?.toFixed(2) || '0.00'}</span> },
          { key: '61-90_days', label: '61-90 Days', render: (value) => <span className="text-orange-600">{value?.toFixed(2) || '0.00'}</span> },
          { key: '90+_days', label: '90+ Days', render: (value) => <span className="text-red-600">{value?.toFixed(2) || '0.00'}</span> }
        ]}
        data={data}
        loading={loading}
      />
    </div>
  );
};

export default StockAging;
