import React, { useState, useEffect } from 'react';
import { currencyService } from '../../services/apiExtensions';

const CurrencyManagement: React.FC = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    const { data } = await currencyService.getCurrencies();
    setCurrencies(data);
  };

  const updateRate = async (currencyId: number, rate: number) => {
    await currencyService.updateExchangeRate(currencyId, rate);
    loadCurrencies();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Currency Management</h2>
      
      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Code</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Symbol</th>
            <th className="border p-2">Exchange Rate</th>
            <th className="border p-2">Base</th>
          </tr>
        </thead>
        <tbody>
          {currencies.map((curr) => (
            <tr key={curr.currency_id}>
              <td className="border p-2">{curr.currency_code}</td>
              <td className="border p-2">{curr.currency_name}</td>
              <td className="border p-2">{curr.symbol}</td>
              <td className="border p-2">{curr.exchange_rate}</td>
              <td className="border p-2">{curr.is_base ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrencyManagement;
