import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import DataTable from '../common/DataTable';
import DatePicker from '../common/DatePicker';
import { reportService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ComparativeReports: React.FC = () => {
  const [reportType, setReportType] = useState<'profit-loss' | 'balance-sheet'>('profit-loss');
  const [comparisonType, setComparisonType] = useState<'yoy' | 'mom' | 'custom'>('yoy');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    period1_from: '',
    period1_to: '',
    period2_from: '',
    period2_to: ''
  });
  const { showToast } = useToast();

  const loadComparison = async () => {
    try {
      setLoading(true);
      
      // Load data for both periods
      const endpoint = reportType === 'profit-loss' ? 'getProfitLoss' : 'getBalanceSheet';
      
      const period1Data = await reportService[endpoint](
        filters.period1_from,
        filters.period1_to
      );
      
      const period2Data = await reportService[endpoint](
        filters.period2_from,
        filters.period2_to
      );

      // Combine and calculate variance
      const combined = combineData(period1Data.data, period2Data.data);
      setData(combined);
    } catch (error) {
      showToast('error', 'Failed to load comparative report');
    } finally {
      setLoading(false);
    }
  };

  const combineData = (period1: any, period2: any) => {
    const combined: any[] = [];
    
    if (reportType === 'profit-loss') {
      // Income
      const incomeAccounts = new Set([
        ...period1.income.map((i: any) => i.name),
        ...period2.income.map((i: any) => i.name)
      ]);
      
      incomeAccounts.forEach(name => {
        const p1 = period1.income.find((i: any) => i.name === name)?.amount || 0;
        const p2 = period2.income.find((i: any) => i.name === name)?.amount || 0;
        combined.push({
          category: 'Income',
          name,
          period1: p1,
          period2: p2,
          variance: p1 - p2,
          variance_pct: p2 !== 0 ? ((p1 - p2) / p2) * 100 : 0
        });
      });

      // Expenses
      const expenseAccounts = new Set([
        ...period1.expenses.map((e: any) => e.name),
        ...period2.expenses.map((e: any) => e.name)
      ]);
      
      expenseAccounts.forEach(name => {
        const p1 = period1.expenses.find((e: any) => e.name === name)?.amount || 0;
        const p2 = period2.expenses.find((e: any) => e.name === name)?.amount || 0;
        combined.push({
          category: 'Expense',
          name,
          period1: p1,
          period2: p2,
          variance: p1 - p2,
          variance_pct: p2 !== 0 ? ((p1 - p2) / p2) * 100 : 0
        });
      });

      // Totals
      combined.push({
        category: 'Total',
        name: 'Net Profit',
        period1: period1.net_profit,
        period2: period2.net_profit,
        variance: period1.net_profit - period2.net_profit,
        variance_pct: period2.net_profit !== 0 ? ((period1.net_profit - period2.net_profit) / period2.net_profit) * 100 : 0
      });
    }

    return combined;
  };

  const setQuickPeriod = (type: 'yoy' | 'mom') => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (type === 'yoy') {
      // Current year vs previous year
      setFilters({
        period1_from: `${currentYear}-01-01`,
        period1_to: `${currentYear}-12-31`,
        period2_from: `${currentYear - 1}-01-01`,
        period2_to: `${currentYear - 1}-12-31`
      });
    } else {
      // Current month vs previous month
      const currentMonthStart = new Date(currentYear, currentMonth, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0);

      setFilters({
        period1_from: currentMonthStart.toISOString().split('T')[0],
        period1_to: currentMonthEnd.toISOString().split('T')[0],
        period2_from: prevMonthStart.toISOString().split('T')[0],
        period2_to: prevMonthEnd.toISOString().split('T')[0]
      });
    }
  };

  useEffect(() => {
    if (comparisonType !== 'custom') {
      setQuickPeriod(comparisonType);
    }
  }, [comparisonType]);

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'name', label: 'Account' },
    {
      key: 'period1',
      label: 'Current Period',
      render: (value: number) => value.toLocaleString()
    },
    {
      key: 'period2',
      label: 'Previous Period',
      render: (value: number) => value.toLocaleString()
    },
    {
      key: 'variance',
      label: 'Variance',
      render: (value: number) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value.toLocaleString()}
        </span>
      )
    },
    {
      key: 'variance_pct',
      label: 'Variance %',
      render: (value: number, row: any) => (
        <div className="flex items-center">
          {value >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
          )}
          <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(value).toFixed(2)}%
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comparative Reports</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="profit-loss">Profit & Loss</option>
                <option value="balance-sheet">Balance Sheet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comparison Type</label>
              <select
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="yoy">Year over Year</option>
                <option value="mom">Month over Month</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
          </div>

          {comparisonType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period 1 From</label>
                <DatePicker
                  value={filters.period1_from}
                  onChange={(value) => setFilters(prev => ({ ...prev, period1_from: value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period 1 To</label>
                <DatePicker
                  value={filters.period1_to}
                  onChange={(value) => setFilters(prev => ({ ...prev, period1_to: value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period 2 From</label>
                <DatePicker
                  value={filters.period2_from}
                  onChange={(value) => setFilters(prev => ({ ...prev, period2_from: value }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period 2 To</label>
                <DatePicker
                  value={filters.period2_to}
                  onChange={(value) => setFilters(prev => ({ ...prev, period2_to: value }))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={loadComparison}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {data.length > 0 && (
        <DataTable
          title="Comparative Analysis"
          columns={columns}
          data={data}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ComparativeReports;
