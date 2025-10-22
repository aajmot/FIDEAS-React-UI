import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Package } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  batch_number?: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type: string;
  reference_number: string;
  movement_date: string;
  notes?: string;
  unit_price?: number;
}

const StockTracking: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    total_movements: 0,
    total_in: 0,
    total_out: 0,
    net_movement: 0
  });
  const [filters, setFilters] = useState({
    product_id: '',
    movement_type: '',
    from_date: '',
    to_date: '',
    reference_type: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
    loadStockMovements();
    loadStockTrackingSummary();
  }, []);

  useEffect(() => {
    loadStockMovements();
    loadStockTrackingSummary();
  }, [filters]);

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts();
      setProducts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load products');
    }
  };

  const loadStockTrackingSummary = async () => {
    try {
      const response = await inventoryService.getStockTrackingSummary({
        product_id: filters.product_id || undefined,
        movement_type: filters.movement_type || undefined,
        reference_type: filters.reference_type || undefined,
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined
      });
      setSummaryData(response.data);
    } catch (error) {
      showToast('error', 'Failed to load stock tracking summary');
    }
  };

  const loadStockMovements = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getStockMovements({
        product_id: filters.product_id || undefined,
        movement_type: filters.movement_type || undefined,
        reference_type: filters.reference_type || undefined,
        from_date: filters.from_date || undefined,
        to_date: filters.to_date || undefined,
        per_page: 1000
      });
      setMovements(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (field: string, value: string) => {
    if (field === 'product_id' && value) {
      // Ensure selected product is in products list
      const productExists = products.find(p => p.id.toString() === value);
      if (!productExists) {
        try {
          const response = await inventoryService.getProducts({ per_page: 1000 });
          const selectedProduct = response.data.find(p => p.id.toString() === value);
          if (selectedProduct) {
            setProducts(prev => [...prev, selectedProduct]);
          }
        } catch (error) {
          console.error('Error loading selected product:', error);
        }
      }
    }
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadStockMovements();
    loadStockTrackingSummary();
  };

  const clearFilters = () => {
    setFilters({
      product_id: '',
      movement_type: '',
      from_date: '',
      to_date: '',
      reference_type: ''
    });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600';
      case 'out': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };



  const columns = [
    {
      key: 'movement_date',
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { key: 'product_name', label: 'Product' },
    { key: 'batch_number', label: 'Batch', render: (value: string) => value || '-' },
    {
      key: 'movement_type',
      label: 'Type',
      render: (value: string) => (
        <div className="flex items-center">
          {getMovementIcon(value)}
          <span className={`ml-2 capitalize ${getMovementColor(value)}`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value: number, row: StockMovement) => {
        const quantity = value || 0;
        return (
          <span className={getMovementColor(row.movement_type)}>
            {row.movement_type === 'out' ? '-' : '+'}{quantity.toFixed(2)}
          </span>
        );
      }
    },
    { key: 'reference_type', label: 'Reference Type' },
    { key: 'reference_number', label: 'Reference No.' },
    {
      key: 'unit_price',
      label: 'Unit Price',
      render: (value: number) => (value || 0).toFixed(2)
    },
    { key: 'notes', label: 'Notes', render: (value: string) => value || '-' }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stock Tracking</h1>
        <p className="text-gray-600">Track all stock movements and transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{summaryData.total_movements}</div>
          <div className="text-sm text-gray-600">Total Movements</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{summaryData.total_in.toFixed(2)}</div>
          <div className="text-sm text-green-600">Stock In</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{summaryData.total_out.toFixed(2)}</div>
          <div className="text-sm text-red-600">Stock Out</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className={`text-2xl font-bold ${summaryData.net_movement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summaryData.net_movement >= 0 ? '+' : ''}{summaryData.net_movement.toFixed(2)}
          </div>
          <div className="text-sm text-blue-600">Net Movement</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Products' },
                  ...products.map(product => ({
                    value: product.id,
                    label: product.name
                  }))
                ]}
                value={filters.product_id}
                onChange={(value) => handleFilterChange('product_id', value as string)}
                placeholder="Select product..."
                multiple={false}
                searchable={true}
                className="w-full"
                onSearch={async (searchTerm) => {
                  try {
                    const response = await inventoryService.getProducts({ search: searchTerm, per_page: 50 });
                    return [
                      { value: '', label: 'All Products' },
                      ...response.data.map(product => ({
                        value: product.id,
                        label: product.name
                      }))
                    ];
                  } catch (error) {
                    return [{ value: '', label: 'All Products' }];
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'in', label: 'Stock In' },
                  { value: 'out', label: 'Stock Out' },
                  { value: 'adjustment', label: 'Adjustment' }
                ]}
                value={filters.movement_type}
                onChange={(value) => handleFilterChange('movement_type', value as string)}
                placeholder="Select type..."
                multiple={false}
                searchable={false}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Type</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All References' },
                  { value: 'Purchase Order', label: 'Purchase Order' },
                  { value: 'Sales Order', label: 'Sales Order' },
                  { value: 'Stock Adjustment', label: 'Stock Adjustment' },
                  { value: 'Product Waste', label: 'Product Waste' }
                ]}
                value={filters.reference_type}
                onChange={(value) => handleFilterChange('reference_type', value as string)}
                placeholder="Select reference..."
                multiple={false}
                searchable={false}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <DatePicker
                value={filters.from_date}
                onChange={(value) => handleFilterChange('from_date', value)}
                placeholder="From date"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <DatePicker
                value={filters.to_date}
                onChange={(value) => handleFilterChange('to_date', value)}
                placeholder="To date"
                className="w-full"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                className="flex items-center px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="Stock Movements"
        columns={columns}
        data={movements}
        loading={loading}
      />
    </div>
  );
};

export default StockTracking;