import React, { useState } from 'react';
import axios from 'axios';

const ComparativeReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('pl');
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');
  const [data, setData] = useState<any>(null);

  const fetchComparativePL = async () => {
    try {
      const response = await axios.get('/api/v1/comparative-reports/comparative-pl', {
        params: { period1_start: period1Start, period1_end: period1End, period2_start: period2Start, period2_end: period2End }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Comparative Reports</h1>
      
      <div className="mb-6 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-2">Period 1</h3>
            <input type="date" value={period1Start} onChange={(e) => setPeriod1Start(e.target.value)} className="border rounded px-3 py-2 w-full mb-2" />
            <input type="date" value={period1End} onChange={(e) => setPeriod1End(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Period 2</h3>
            <input type="date" value={period2Start} onChange={(e) => setPeriod2Start(e.target.value)} className="border rounded px-3 py-2 w-full mb-2" />
            <input type="date" value={period2End} onChange={(e) => setPeriod2End(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
        </div>
        <button onClick={fetchComparativePL} className="bg-blue-500 text-white px-4 py-2 rounded">Compare</button>
      </div>

      {data && (
        <div className="bg-white p-6 rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Metric</th>
                <th className="px-4 py-2">Period 1</th>
                <th className="px-4 py-2">Period 2</th>
                <th className="px-4 py-2">Variance</th>
                <th className="px-4 py-2">Variance %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 font-semibold">Income</td>
                <td className="px-4 py-2">₹{data.period1.income.toFixed(2)}</td>
                <td className="px-4 py-2">₹{data.period2.income.toFixed(2)}</td>
                <td className="px-4 py-2">₹{data.variance.income.toFixed(2)}</td>
                <td className="px-4 py-2">{data.variance_percent.income.toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold">Expense</td>
                <td className="px-4 py-2">₹{data.period1.expense.toFixed(2)}</td>
                <td className="px-4 py-2">₹{data.period2.expense.toFixed(2)}</td>
                <td className="px-4 py-2">₹{data.variance.expense.toFixed(2)}</td>
                <td className="px-4 py-2">{data.variance_percent.expense.toFixed(2)}%</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="px-4 py-2 font-bold">Net Profit</td>
                <td className="px-4 py-2 font-bold">₹{data.period1.profit.toFixed(2)}</td>
                <td className="px-4 py-2 font-bold">₹{data.period2.profit.toFixed(2)}</td>
                <td className="px-4 py-2 font-bold">₹{data.variance.profit.toFixed(2)}</td>
                <td className="px-4 py-2 font-bold">{data.variance_percent.profit.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparativeReportsPage;
