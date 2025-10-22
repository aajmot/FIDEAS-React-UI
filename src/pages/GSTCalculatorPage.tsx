import React, { useState } from 'react';
import axios from 'axios';

interface GSTResult {
  subtotal: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  total_gst: number;
  total_amount: number;
}

const GSTCalculatorPage: React.FC = () => {
  const [subtotal, setSubtotal] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [isInterstate, setIsInterstate] = useState(false);
  const [result, setResult] = useState<GSTResult | null>(null);

  const calculate = async () => {
    try {
      const response = await axios.post('/api/v1/account/calculate-gst', {
        subtotal: parseFloat(subtotal),
        gst_rate: parseFloat(gstRate),
        is_interstate: isInterstate
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error calculating GST:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">GST Calculator</h1>
      
      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Subtotal (₹)</label>
          <input
            type="number"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter amount"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">GST Rate (%)</label>
          <select
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Transaction Type</label>
          <select
            value={isInterstate ? 'interstate' : 'intrastate'}
            onChange={(e) => setIsInterstate(e.target.value === 'interstate')}
            className="w-full border rounded px-3 py-2"
          >
            <option value="intrastate">Intrastate (CGST + SGST)</option>
            <option value="interstate">Interstate (IGST)</option>
          </select>
        </div>

        <button
          onClick={calculate}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="bg-gray-50 p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Calculation Results</h2>
          
          <div className="space-y-2">
            {isInterstate ? (
              <>
                <div className="flex justify-between">
                  <span>IGST Rate:</span>
                  <span className="font-semibold">{result.igst_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>IGST Amount:</span>
                  <span className="font-semibold">₹{result.igst_amount?.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST Rate:</span>
                  <span className="font-semibold">{result.cgst_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST Amount:</span>
                  <span className="font-semibold">₹{result.cgst_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST Rate:</span>
                  <span className="font-semibold">{result.sgst_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST Amount:</span>
                  <span className="font-semibold">₹{result.sgst_amount?.toFixed(2)}</span>
                </div>
              </>
            )}
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total GST:</span>
                <span className="font-bold">₹{result.total_gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total Amount:</span>
                <span className="font-bold">₹{result.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTCalculatorPage;
