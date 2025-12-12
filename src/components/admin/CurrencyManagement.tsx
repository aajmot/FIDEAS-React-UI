import React, { useState, useEffect } from 'react';
import { Edit, Check, X, RefreshCw } from 'lucide-react';
import { currencyService } from '../../services/api';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';

interface CurrencyData {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  symbol: string;
  exchange_rate: number;
  is_base: boolean;
}

const CurrencyManagement: React.FC = () => {
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const { showToast } = useToast();

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const { data } = await currencyService.getCurrencies();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      showToast('error', 'Failed to load currencies');
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (currency: CurrencyData) => {
    setEditingId(currency.currency_id);
    setEditRate(currency.exchange_rate);
  };

  const handleSave = async (currencyId: number) => {
    try {
      await currencyService.updateExchangeRate(currencyId, editRate);
      setEditingId(null);
      loadCurrencies();
      showToast('success', 'Exchange rate updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update exchange rate');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditRate(0);
  };

  const columns = [
    { key: 'currency_code', label: 'Code' },
    { key: 'currency_name', label: 'Name' },
    { key: 'symbol', label: 'Symbol' },
    {
      key: 'exchange_rate',
      label: 'Exchange Rate',
      render: (value: number, row: CurrencyData) => (
        editingId === row.currency_id ? (
          <input
            type="number"
            value={editRate}
            onChange={(e) => setEditRate(Number(e.target.value))}
            className="w-24 px-2 py-1 text-sm border rounded"
            step="0.0001"
            min="0"
          />
        ) : (
          value != null ? value.toFixed(4) : '-'
        )
      )
    },
    {
      key: 'is_base',
      label: 'Base Currency',
      render: (value: boolean) => (
        <span className={value ? 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800' : ''}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: CurrencyData) => (
        !row.is_base && (
          <div className="flex items-center space-x-2">
            {editingId === row.currency_id ? (
              <>
                <button
                  onClick={() => handleSave(row.currency_id)}
                  className="text-green-600 hover:text-green-800"
                  title="Save"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-800"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleEdit(row)}
                className="text-blue-600 hover:text-blue-800"
                title="Edit Exchange Rate"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <DataTable
        title="Currencies"
        columns={columns}
        data={currencies}
        loading={loading}
        pageSize={10}
        totalItems={currencies.length}
        currentPage={1}
        onPageChange={() => {}}
        onSearch={() => {}}
        onRefresh={loadCurrencies}
      />
    </div>
  );
};

export default CurrencyManagement;