import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, TrendingDown, Package, Edit, Check, X } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface StockMeterData {
  id: number;
  product_id: number;
  product_name: string;
  current_stock: number;
  reorder_level: number;
  danger_level: number;
  max_stock: number;
  min_stock: number;
  stock_status: 'normal' | 'reorder' | 'danger' | 'overstock';
  last_updated: string;
}

const StockMeter: React.FC = () => {
  const [stockData, setStockData] = useState<StockMeterData[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    danger_level: number;
    reorder_level: number;
    max_stock: number;
    min_stock: number;
  }>({ danger_level: 0, reorder_level: 0, max_stock: 0, min_stock: 0 });
  const [summaryData, setSummaryData] = useState({
    total_products: 0,
    danger_level_count: 0,
    reorder_level_count: 0,
    normal_count: 0,
    overstock_count: 0
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
    loadStockMeter();
    loadStockMeterSummary();
  }, []);

  const loadStockMeterSummary = async (productId?: number) => {
    try {
      const response = await inventoryService.getStockMeterSummary(productId);
      setSummaryData(response.data);
    } catch (error) {
      showToast('error', 'Failed to load stock meter summary');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await inventoryService.getProducts();
      setProducts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load products');
    }
  };

  const loadStockMeter = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params: any = {
        page,
        per_page: 10,
        search
      };
      
      if (selectedProductId) {
        params.product_id = selectedProductId;
      }
      
      const response = await inventoryService.getStockDetails(selectedProductId ? Number(selectedProductId) : undefined, params);
      const meterData = response.data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        current_stock: item.total_quantity,
        reorder_level: item.reorder_level || 10,
        danger_level: item.danger_level || 5,
        max_stock: item.max_stock || 100,
        min_stock: item.min_stock || 0,
        stock_status: item.stock_status,
        last_updated: item.last_updated
      }));
      setStockData(meterData);
      setTotalItems(response.total);
      setCurrentPage(page);
    } catch (error) {
      showToast('error', 'Failed to load stock meter data');
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'bg-red-100 text-red-800';
      case 'reorder': return 'bg-yellow-100 text-yellow-800';
      case 'overstock': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'reorder': return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'overstock': return <Package className="h-4 w-4 text-purple-600" />;
      default: return <Package className="h-4 w-4 text-green-600" />;
    }
  };

  const filteredData = stockData.filter(item => {
    const statusMatch = !statusFilter || item.stock_status === statusFilter;
    return statusMatch;
  });
  
  const handleProductFilterChange = (value: string) => {
    setSelectedProductId(value);
    setCurrentPage(1);
    loadStockMeter(1);
    loadStockMeterSummary(value ? Number(value) : undefined);
  };
  
  const handlePageChange = (page: number) => {
    loadStockMeter(page);
  };
  
  const handleSearch = (searchTerm: string) => {
    setCurrentPage(1);
    loadStockMeter(1, searchTerm);
  };

  const handleEdit = (row: StockMeterData) => {
    setEditingRow(row.id);
    setEditValues({
      danger_level: row.danger_level,
      reorder_level: row.reorder_level,
      max_stock: row.max_stock,
      min_stock: row.min_stock
    });
  };

  const handleSave = async (productId: number) => {
    try {
      await inventoryService.updateProduct(productId, editValues);
      setEditingRow(null);
      loadStockMeter(currentPage);
      loadStockMeterSummary(selectedProductId ? Number(selectedProductId) : undefined);
      showToast('success', 'Stock levels updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update stock levels');
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditValues({ danger_level: 0, reorder_level: 0, max_stock: 0, min_stock: 0 });
  };

  const handleInputChange = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };



  const columns = [
    { key: 'product_name', label: 'Product' },
    {
      key: 'current_stock',
      label: 'Current Stock',
      render: (value: number, row: StockMeterData) => (
        <div className="flex items-center">
          {getStatusIcon(row.stock_status)}
          <span className="ml-2">{value.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'danger_level',
      label: 'Danger Level',
      render: (value: number, row: StockMeterData) => (
        editingRow === row.id ? (
          <input
            type="number"
            value={editValues.danger_level}
            onChange={(e) => handleInputChange('danger_level', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded"
            step="0.01"
          />
        ) : (
          value.toFixed(2)
        )
      )
    },
    {
      key: 'reorder_level',
      label: 'Reorder Level',
      render: (value: number, row: StockMeterData) => (
        editingRow === row.id ? (
          <input
            type="number"
            value={editValues.reorder_level}
            onChange={(e) => handleInputChange('reorder_level', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded"
            step="0.01"
          />
        ) : (
          value.toFixed(2)
        )
      )
    },
    {
      key: 'min_stock',
      label: 'Min Stock',
      render: (value: number, row: StockMeterData) => (
        editingRow === row.id ? (
          <input
            type="number"
            value={editValues.min_stock}
            onChange={(e) => handleInputChange('min_stock', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded"
            step="0.01"
          />
        ) : (
          value.toFixed(2)
        )
      )
    },
    {
      key: 'max_stock',
      label: 'Max Stock',
      render: (value: number, row: StockMeterData) => (
        editingRow === row.id ? (
          <input
            type="number"
            value={editValues.max_stock}
            onChange={(e) => handleInputChange('max_stock', e.target.value)}
            className="w-20 px-2 py-1 text-sm border rounded"
            step="0.01"
          />
        ) : (
          value.toFixed(2)
        )
      )
    },
    {
      key: 'stock_status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: StockMeterData) => (
        <div className="flex items-center space-x-2">
          {editingRow === row.id ? (
            <>
              <button
                onClick={() => handleSave(row.product_id)}
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
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stock Meter</h1>
        <p className="text-gray-600">Monitor stock levels and alerts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{summaryData.total_products}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{summaryData.danger_level_count}</div>
          <div className="text-sm text-red-600">Danger Level</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{summaryData.reorder_level_count}</div>
          <div className="text-sm text-yellow-600">Reorder Level</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{summaryData.overstock_count}</div>
          <div className="text-sm text-purple-600">Overstock</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{summaryData.normal_count}</div>
          <div className="text-sm text-green-600">Normal</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                value={selectedProductId}
                onChange={(value) => handleProductFilterChange(value as string)}
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
                    console.error('Product search error:', error);
                    return [{ value: '', label: 'All Products' }];
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'danger', label: 'Danger Level' },
                  { value: 'reorder', label: 'Reorder Level' },
                  { value: 'overstock', label: 'Overstock' },
                  { value: 'normal', label: 'Normal' }
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as string)}
                placeholder="Select status..."
                multiple={false}
                searchable={false}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  loadStockMeter(currentPage);
                  loadStockMeterSummary(selectedProductId ? Number(selectedProductId) : undefined);
                }}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="Stock Meter"
        columns={columns}
        data={filteredData}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        pageSize={10}
      />
    </div>
  );
};

export default StockMeter;