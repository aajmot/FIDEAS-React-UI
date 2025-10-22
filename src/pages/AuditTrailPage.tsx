import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AuditEntry {
  created_at: string;
  entity_type: string;
  entity_id: number;
  action: string;
  username: string;
  remarks: string;
}

const AuditTrailPage: React.FC = () => {
  const [data, setData] = useState<AuditEntry[]>([]);
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entity_type', entityType);
      if (search) params.append('search', search);
      
      const response = await axios.get(`/api/v1/account/audit-trail?${params}`);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Trail</h1>
      
      <div className="mb-4 flex gap-4">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="VOUCHER">Voucher</option>
          <option value="LEDGER">Ledger</option>
          <option value="ACCOUNT">Account</option>
          <option value="PAYMENT">Payment</option>
          <option value="JOURNAL">Journal</option>
        </select>
        
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        
        <button onClick={fetchData} className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 border">Date/Time</th>
              <th className="px-4 py-2 border">Entity Type</th>
              <th className="px-4 py-2 border">Entity ID</th>
              <th className="px-4 py-2 border">Action</th>
              <th className="px-4 py-2 border">User</th>
              <th className="px-4 py-2 border">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{new Date(row.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 border">{row.entity_type}</td>
                <td className="px-4 py-2 border">{row.entity_id}</td>
                <td className="px-4 py-2 border">{row.action}</td>
                <td className="px-4 py-2 border">{row.username}</td>
                <td className="px-4 py-2 border">{row.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrailPage;
