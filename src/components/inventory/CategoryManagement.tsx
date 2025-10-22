import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import CategoryForm from './CategoryForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface Category {
  id: number;
  name: string;
  description: string;
  parent_id?: number;
  parent_name?: string;
  is_active: boolean;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadCategories(1);
  }, []);

  const loadCategories = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await inventoryService.getCategories({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setCategories(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadCategories(1, search);
    } else {
      await loadCategories(1, '');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleSave = async (categoryData: any) => {
    try {
      if (editingCategory) {
        await inventoryService.updateCategory(editingCategory.id, categoryData);
        showToast('success', 'Category updated successfully');
      } else {
        await inventoryService.createCategory(categoryData);
        showToast('success', 'Category created successfully');
      }
      setEditingCategory(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadCategories(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save category');
    }
  };

  const handleCancel = () => {
    setEditingCategory(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Categories imported successfully');
      loadCategories(1);
    } catch (error) {
      showToast('error', 'Failed to import categories');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (category: Category) => {
    showConfirmation(
      {
        title: 'Delete Category',
        message: `Are you sure you want to delete category "${category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteCategory(category.id);
          showToast('success', 'Category deleted successfully');
          loadCategories(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete category');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Category Name' },
    { 
      key: 'parent_name', 
      label: 'Parent Category',
      render: (value: string) => value || '-'
    },
    { key: 'description', label: 'Description' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <CategoryForm
        category={editingCategory}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Category Management"
        columns={columns}
        data={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadCategories(page)}
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

export default CategoryManagement;