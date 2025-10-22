import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BudgetData {
  budget_name: string;
  account: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_percent: number;
  status: string;
}

const BudgetVsActualPage: React.FC = () => {
  const [data, setData] = useState<BudgetData[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState('');

  const fetchData = async () => {
    try {
      const params = fiscalYearId ? { fiscal_year_id: fiscalYearId } : {};
      const response = await axios.get('/api/v1/comparative-reports/budget-vs-actual', { params });
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBudget = data.reduce((sum, item) => sum + item.budget_amount, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual_amount, 0);
  const totalVariance = totalBudget - totalActual;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Budget vs Actual Analysis</h1>
      
      <div className="mb-4 flex gap-4">
        <input
          type="number"
          placeholder="Fiscal Year ID (optional)"
          value={fiscalYearId}
          onChange={(e) => setFiscalYearId(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button onClick={fetchData} className="bg-blue-500 text-white px-4 py-2 rounded">Refresh</button>
      </div>

      <div className="mb-4 bg-gray-100 p-4 rounded grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-600">Total Budget</div>
          <div className="text-xl font-bold">₹{totalBudget.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Actual</div>
          <div className="text-xl font-bold">₹{totalActual.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Variance</div>
          <div className={`text-xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{totalVariance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 border">Budget Name</th>
              <th className="px-4 py-2 border">Account</th>
              <th className="px-4 py-2 border">Budget</th>
              <th className="px-4 py-2 border">Actual</th>
              <th className="px-4 py-2 border">Variance</th>
              <th className="px-4 py-2 border">Variance %</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{row.budget_name}</td>
                <td className="px-4 py-2 border">{row.account}</td>
                <td className="px-4 py-2 border text-right">₹{row.budget_amount.toFixed(2)}</td>
                <td className="px-4 py-2 border text-right">₹{row.actual_amount.toFixed(2)}</td>
                <td className={`px-4 py-2 border text-right ${row.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{row.variance.toFixed(2)}
                </td>
                <td className="px-4 py-2 border text-right">{row.variance_percent.toFixed(2)}%</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 rounded text-sm ${row.status === 'Under Budget' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetVsActualPage;
