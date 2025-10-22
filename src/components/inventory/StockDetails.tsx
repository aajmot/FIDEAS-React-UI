import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import DataTable from '../common/DataTable';
import SearchableDropdown from '../common/SearchableDropdown';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface StockDetail {
  id: number;
  product_id: number;
  product_name: string;
  batch_number: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  average_cost: number;
  total_value: number;
  last_updated: string;
  danger_level: number;
  reorder_level: number;
  stock_status: string;
}

const StockDetails: React.FC = () => {
  const [stockDetails, setStockDetails] = useState<StockDetail[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
    loadStockDetails();
    loadStockSummary();
  }, []);

  const loadStockSummary = async (productId?: number) => {
    try {
      const response = await inventoryService.getStockSummary(productId);
      setTotalProducts(response.data.total_products);
      setTotalInventoryValue(response.data.total_inventory_value);
    } catch (error) {
      showToast('error', 'Failed to load stock summary');
    }
  };

  const loadProducts = async (search?: string) => {
    try {
      const response = await inventoryService.getProducts({ 
        page: 1, 
        per_page: 100, 
        search 
      });
      setProducts(response.data);
    } catch (error) {
      showToast('error', 'Failed to load products');
    }
  };

  const handleProductSearch = async (searchTerm: string) => {
    try {
      const response = await inventoryService.getProducts({ 
        page: 1, 
        per_page: 50, 
        search: searchTerm 
      });
      return response.data.map(product => ({
        value: product.id,
        label: product.name
      }));
    } catch (error) {
      showToast('error', 'Failed to search products');
      return [];
    }
  };

  const loadStockDetails = async (productId?: number, page: number = 1, search?: string) => {
    try {
      setLoading(true);
      const params = { page, per_page: 10, search };
      const response = await inventoryService.getStockDetails(productId, params);
      setStockDetails(response.data);
      setTotalItems(response.total);
      setCurrentPage(page);
    } catch (error) {
      showToast('error', 'Failed to load stock details');
    } finally {
      setLoading(false);
    }
  };

  const handleProductFilter = async (value: string | number | (string | number)[]) => {
    const productId = Array.isArray(value) ? value[0] : value;
    setSelectedProductId(productId as string);
    setCurrentPage(1);
    setSearchTerm('');
    
    // If a product is selected and it's not in the current products array, fetch and add it
    if (productId && !products.find(p => p.id === productId)) {
      try {
        const response = await inventoryService.getProducts({ 
          page: 1, 
          per_page: 1, 
          search: productId.toString() 
        });
        if (response.data.length > 0) {
          setProducts(prev => [...prev, response.data[0]]);
        }
      } catch (error) {
        // Ignore error, product will still be selected
      }
    }
    
    if (productId) {
      loadStockDetails(Number(productId), 1);
      loadStockSummary(Number(productId));
    } else {
      loadStockDetails(undefined, 1);
      loadStockSummary();
    }
  };

  const handleRefresh = () => {
    const productId = selectedProductId ? Number(selectedProductId) : undefined;
    loadStockDetails(productId, currentPage, searchTerm);
    loadStockSummary(productId);
  };

  const handlePageChange = (page: number) => {
    const productId = selectedProductId ? Number(selectedProductId) : undefined;
    loadStockDetails(productId, page, searchTerm);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
    const productId = selectedProductId ? Number(selectedProductId) : undefined;
    loadStockDetails(productId, 1, search);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600';
      case 'reorder': return 'text-yellow-600';
      case 'overstock': return 'text-purple-600';
      default: return 'text-green-600';
    }
  };



  const columns = [
    { 
      key: 'product_name', 
      label: 'Product',
      className: 'min-w-0 flex-1'
    },
    { 
      key: 'batch_number', 
      label: 'Batch',
      className: 'hidden sm:table-cell'
    },
    {
      key: 'total_quantity',
      label: 'Stock',
      className: 'text-right',
      render: (value: number, row: StockDetail) => {
        const quantity = value || 0;
        return (
          <span className={getStatusColor(row.stock_status)}>
            {quantity.toFixed(2)}
          </span>
        );
      }
    },
    {
      key: 'available_quantity',
      label: 'Available',
      className: 'hidden md:table-cell text-right',
      render: (value: number) => (value || 0).toFixed(2)
    },
    {
      key: 'reserved_quantity',
      label: 'Reserved',
      className: 'hidden lg:table-cell text-right',
      render: (value: number) => (value || 0).toFixed(2)
    },
    {
      key: 'average_cost',
      label: 'Cost',
      className: 'hidden sm:table-cell text-right',
      render: (value: number) => (value || 0).toFixed(2)
    },
    {
      key: 'total_value',
      label: 'Value',
      className: 'text-right',
      render: (value: number) => (value || 0).toFixed(2)
    },
    {
      key: 'last_updated',
      label: 'Updated',
      className: 'hidden lg:table-cell text-right',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    }
  ];

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Stock Details</h1>
        <p className="text-sm text-gray-600">Monitor current stock levels and inventory</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">{totalProducts}</div>
          <div className="text-xs sm:text-sm text-blue-600">Total Products</div>
        </div>
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-green-600">{totalInventoryValue.toFixed(2)}</div>
          <div className="text-xs sm:text-sm text-green-600">Total Value</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Filter
              </label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'All Products' },
                  ...products.map(product => ({
                    value: product.id,
                    label: product.name
                  }))
                ]}
                value={selectedProductId}
                onChange={handleProductFilter}
                placeholder="Select product..."
                multiple={false}
                searchable={true}
                className="w-full"
                onSearch={handleProductSearch}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center w-full sm:w-auto px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="Stock Details"
        columns={columns}
        data={stockDetails}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={10}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default StockDetails;