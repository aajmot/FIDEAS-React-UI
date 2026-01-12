import React, { useState, useEffect } from 'react';
import { batchService } from '../../services/api';

const BatchManagement: React.FC = () => {
  const [nearExpiry, setNearExpiry] = useState<any[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadNearExpiry();
  }, [days]);

  const loadNearExpiry = async () => {
    try {
      const { data } = await batchService.getNearExpiry(days);
      setNearExpiry(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load near expiry batches:', error);
      setNearExpiry([]);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Batch Management</h2>
      
      <div className="mb-4">
        <label className="mr-2">Near Expiry (Days):</label>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} 
                className="border p-2 rounded">
          <option value={30}>30 Days</option>
          <option value={60}>60 Days</option>
          <option value={90}>90 Days</option>
        </select>
      </div>

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Batch No</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Expiry Date</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">MRP</th>
          </tr>
        </thead>
        <tbody>
          {nearExpiry.map((batch) => (
            <tr key={batch.batch_id}>
              <td className="border p-2">{batch.batch_no}</td>
              <td className="border p-2">{batch.product_name}</td>
              <td className="border p-2">{batch.exp_date}</td>
              <td className="border p-2">{batch.quantity}</td>
              <td className="border p-2">{batch.mrp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BatchManagement;
