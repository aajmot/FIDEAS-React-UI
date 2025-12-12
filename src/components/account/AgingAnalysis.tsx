import React, { useState, useEffect } from 'react';
import { accountExtensions } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AgingAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'receivables') {
        const response = await accountExtensions.getReceivablesAging();
        setReceivables(response.data);
      } else {
        const response = await accountExtensions.getPayablesAging();
        setPayables(response.data);
      }
    } catch (error: any) {
      showToast('error', 'Failed to load aging analysis');
    }
  };

  const data = activeTab === 'receivables' ? receivables : payables;
  const totals = data.reduce((acc: any, row: any) => ({
    '0-30': acc['0-30'] + row['0-30'],
    '31-60': acc['31-60'] + row['31-60'],
    '61-90': acc['61-90'] + row['61-90'],
    '90+': acc['90+'] + row['90+'],
    total: acc.total + row.total
  }), { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Aging Analysis</h1>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('receivables')} 
          className={`px-4 py-2 rounded ${activeTab === 'receivables' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Receivables
        </button>
        <button onClick={() => setActiveTab('payables')} 
          className={`px-4 py-2 rounded ${activeTab === 'payables' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Payables
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">{activeTab === 'receivables' ? 'Customer' : 'Supplier'}</th>
              <th className="px-4 py-3 text-right">0-30 Days</th>
              <th className="px-4 py-3 text-right">31-60 Days</th>
              <th className="px-4 py-3 text-right">61-90 Days</th>
              <th className="px-4 py-3 text-right">90+ Days</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, index: number) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{row.customer || row.supplier}</td>
                <td className="px-4 py-3 text-right">₹{row['0-30'].toFixed(2)}</td>
                <td className="px-4 py-3 text-right">₹{row['31-60'].toFixed(2)}</td>
                <td className="px-4 py-3 text-right">₹{row['61-90'].toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-red-600">₹{row['90+'].toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{row.total.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-t-2 bg-gray-100 font-bold">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">₹{totals['0-30'].toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{totals['31-60'].toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{totals['61-90'].toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-red-600">₹{totals['90+'].toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{totals.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-green-100 p-4 rounded">
          <div className="text-sm text-gray-600">Current (0-30)</div>
          <div className="text-2xl font-bold text-green-700">₹{totals['0-30'].toFixed(2)}</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <div className="text-sm text-gray-600">31-60 Days</div>
          <div className="text-2xl font-bold text-yellow-700">₹{totals['31-60'].toFixed(2)}</div>
        </div>
        <div className="bg-orange-100 p-4 rounded">
          <div className="text-sm text-gray-600">61-90 Days</div>
          <div className="text-2xl font-bold text-orange-700">₹{totals['61-90'].toFixed(2)}</div>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <div className="text-sm text-gray-600">Overdue (90+)</div>
          <div className="text-2xl font-bold text-red-700">₹{totals['90+'].toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default AgingAnalysis;
