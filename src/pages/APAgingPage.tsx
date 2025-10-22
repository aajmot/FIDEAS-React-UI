import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AgingData {
  bill_number: string;
  date: string;
  reference: string;
  amount: number;
  balance: number;
  days: number;
  current: number;
  days_31_60: number;
  days_61_90: number;
  over_90: number;
}

const APAgingPage: React.FC = () => {
  const [data, setData] = useState<AgingData[]>([]);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [totals, setTotals] = useState({ current: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 0 });

  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/v1/account/reports/ap-aging?as_of_date=${asOfDate}`);
      setData(response.data.data || []);
      setTotals(response.data.totals || { current: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching AP aging:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">AP Aging Report</h1>
      
      <div className="mb-4 flex gap-4">
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button onClick={fetchData} className="bg-blue-500 text-white px-4 py-2 rounded">
          Refresh
        </button>
      </div>

      <div className="mb-4 bg-gray-100 p-4 rounded">
        <div className="flex gap-6">
          <div><strong>Total:</strong> ₹{totals.total.toFixed(2)}</div>
          <div><strong>Current:</strong> ₹{totals.current.toFixed(2)}</div>
          <div><strong>31-60:</strong> ₹{totals.days_31_60.toFixed(2)}</div>
          <div><strong>61-90:</strong> ₹{totals.days_61_90.toFixed(2)}</div>
          <div><strong>Over 90:</strong> ₹{totals.over_90.toFixed(2)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 border">Bill #</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Reference</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Balance</th>
              <th className="px-4 py-2 border">Days</th>
              <th className="px-4 py-2 border">Current</th>
              <th className="px-4 py-2 border">31-60</th>
              <th className="px-4 py-2 border">61-90</th>
              <th className="px-4 py-2 border">Over 90</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{row.bill_number}</td>
                <td className="px-4 py-2 border">{row.date}</td>
                <td className="px-4 py-2 border">{row.reference}</td>
                <td className="px-4 py-2 border text-right">₹{row.amount.toFixed(2)}</td>
                <td className="px-4 py-2 border text-right">₹{row.balance.toFixed(2)}</td>
                <td className="px-4 py-2 border text-center">{row.days}</td>
                <td className="px-4 py-2 border text-right">₹{row.current.toFixed(2)}</td>
                <td className="px-4 py-2 border text-right">₹{row.days_31_60.toFixed(2)}</td>
                <td className="px-4 py-2 border text-right">₹{row.days_61_90.toFixed(2)}</td>
                <td className="px-4 py-2 border text-right">₹{row.over_90.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default APAgingPage;
