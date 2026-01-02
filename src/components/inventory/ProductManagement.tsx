import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import ProductForm from './ProductForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface Product {
  id: number;
  name: string;
  code?: string;
  composition?: string;
  tags?: string;
  hsn_code?: string;
  schedule?: string;
  manufacturer?: string;
  is_discontinued?: boolean;
  category_id?: number;
  subcategory_id?: number;
  unit_id: number;
  // pricing (legacy 'price' kept for compatibility)
  price?: number;
  mrp_price?: number;
  selling_price?: number;
  cost_price?: number;
  gst_rate?: number;
  gst_percentage?: number;
  commission_type?: string;
  commission_value?: number;
  reorder_level?: number;
  danger_level?: number;
  min_stock?: number;
  max_stock?: number;
  description?: string;
  is_inventory_item?: boolean;
  is_active: boolean;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadProducts(1);
  }, []);

  const loadProducts = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await inventoryService.getProducts({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setProducts(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadProducts(1, search);
    } else {
      await loadProducts(1, '');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleSave = async (productData: any) => {
    try {
      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct.id, productData);
        showToast('success', 'Product updated successfully');
      } else {
        await inventoryService.createProduct(productData);
        showToast('success', 'Product created successfully');
      }
      setEditingProduct(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadProducts(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save product');
    }
  };

  const handleCancel = () => {
    setEditingProduct(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Products imported successfully');
      loadProducts(1);
    } catch (error) {
      showToast('error', 'Failed to import products');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (product: Product) => {
    showConfirmation(
      {
        title: 'Delete Product',
        message: `Are you sure you want to delete product "${product.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteProduct(product.id);
          showToast('success', 'Product deleted successfully');
          loadProducts(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete product');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    {
      key: 'selling_price',
      label: 'Price',
      render: (_value: number, row: Product) => {
        const amount = row.selling_price ?? row.price ?? 0;
        return amount.toFixed(2);
      }
    },
    {
      key: 'gst_rate',
      label: 'GST%',
      render: (_value: number, row: Product) => `${(row.gst_rate ?? row.gst_percentage ?? 0).toFixed(1)}%`
    },
    { 
      key: 'tags', 
      label: 'Tags',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {value && value.length > 20 ? `${value.substring(0, 20)}...` : value || '-'}
        </span>
      )
    },
    { key: 'hsn_code', label: 'HSN' },
    { 
      key: 'manufacturer', 
      label: 'Manufacturer',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {value && value.length > 15 ? `${value.substring(0, 15)}...` : value || '-'}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <ProductForm
        product={editingProduct}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Product Management"
        columns={columns}
        data={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadProducts(page)}
        onSearch={handleSearch}
      />
      
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        onConfirm={handleConfirm}
        onCancel={hideConfirmation}
      />
    </div>
  );
};

export default ProductManagement;