import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { useToast } from '../context/ToastContext';

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [kpisRes, trendRes, productsRes, transactionsRes] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getRevenueTrend(),
        dashboardService.getTopProducts(),
        dashboardService.getRecentTransactions()
      ]);
      
      // Handle nested data structure
      const kpisData = kpisRes.data?.data || kpisRes.data;
      const trendData = trendRes.data?.data || trendRes.data;
      const productsData = productsRes.data?.data || productsRes.data;
      const transactionsData = transactionsRes.data?.data || transactionsRes.data;
      
      console.log('KPIs data:', kpisData);
      setKpis(kpisData || {});
      setRevenueTrend(Array.isArray(trendData) ? trendData : []);
      setTopProducts(Array.isArray(productsData) ? productsData : []);
      setRecentTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error: any) {
      console.error('Dashboard data error:', error);
      showToast('error', 'Failed to load dashboard data');
      // Set default values on error
      setKpis({});
      setRevenueTrend([]);
      setTopProducts([]);
      setRecentTransactions([]);
    }
  };

  if (kpis === null) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Revenue</div>
          <div className="text-3xl font-bold mt-2">{kpis.revenue?.month?.toFixed(2) || '0.00'}</div>
          <div className="text-sm mt-2">Today: {kpis.revenue?.today?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Expenses</div>
          <div className="text-3xl font-bold mt-2">{kpis.expenses?.month?.toFixed(2) || '0.00'}</div>
          <div className="text-sm mt-2">Today: {kpis.expenses?.today?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Profit</div>
          <div className="text-3xl font-bold mt-2">{kpis.profit?.month?.toFixed(2) || '0.00'}</div>
          <div className="text-sm mt-2">Today: {kpis.profit?.today?.toFixed(2) || '0.00'}</div>
        </div>
      </div> */}

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Stock Value</div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{kpis.stock_value?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Receivables</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{kpis.receivables?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Payables</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{kpis.payables?.toFixed(2) || '0.00'}</div>
        </div>
      </div> */}

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        {/* <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Products</h2>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((product: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">Qty: {product.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{product.revenue.toFixed(2)}</div>
                </div>
              </div>
            )) : <div className="text-gray-500 text-center py-4">No data available</div>}
          </div>
        </div> */}

        {/* Recent Transactions */}
        {/* <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? recentTransactions.map((txn: any, index: number) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-medium">{txn.voucher_number}</div>
                  <div className="text-sm text-gray-500">{txn.type} - {txn.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{txn.amount.toFixed(2)}</div>
                </div>
              </div>
            )) : <div className="text-gray-500 text-center py-4">No data available</div>}
          </div>
        </div> */}
      </div>

      {/* Revenue Trend */}
      {/* <div className="bg-white p-6 rounded-lg shadow mt-6">
        <h2 className="text-xl font-semibold mb-4">Revenue Trend (Last 12 Months)</h2>
        <div className="flex items-end justify-between h-64 gap-2">
          {revenueTrend.length > 0 ? revenueTrend.map((item: any, index: number) => {
            const maxRevenue = Math.max(...revenueTrend.map((i: any) => i.revenue));
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-xs mb-1 font-semibold">{(item.revenue / 1000).toFixed(0)}K</div>
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%` }}></div>
                <div className="text-xs mt-2 text-gray-600">{item.month.split(' ')[0]}</div>
              </div>
            );
          }) : <div className="text-gray-500 text-center py-4 w-full">No data available</div>}
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
