import React, { useState, useEffect } from 'react';
import { reconciliationService } from '../../services/apiExtensions';

const BankReconciliation: React.FC = () => {
  const [unreconciled, setUnreconciled] = useState<any[]>([]);
  const [accountId, setAccountId] = useState(1);

  useEffect(() => {
    loadUnreconciled();
  }, [accountId]);

  const loadUnreconciled = async () => {
    const { data } = await reconciliationService.getUnreconciled(accountId);
    setUnreconciled(data);
  };

  const autoMatch = async () => {
    const { data } = await reconciliationService.autoMatch(accountId);
    alert(`Matched ${data.matched_count} transactions`);
    loadUnreconciled();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bank Reconciliation</h2>
      
      <button onClick={autoMatch} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Auto Match
      </button>

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Debit</th>
            <th className="border p-2">Credit</th>
            <th className="border p-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {unreconciled.map((stmt) => (
            <tr key={stmt.statement_id}>
              <td className="border p-2">{stmt.trans_date}</td>
              <td className="border p-2">{stmt.description}</td>
              <td className="border p-2">₹{stmt.debit}</td>
              <td className="border p-2">₹{stmt.credit}</td>
              <td className="border p-2">₹{stmt.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BankReconciliation;
