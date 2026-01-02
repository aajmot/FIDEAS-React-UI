import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import TestCategoryForm from './TestCategoryForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { careService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface TestCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  created_by?: string;
}

const TestCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TestCategory | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const pageSize = 10;

  useEffect(() => {
    loadCategories();
  }, [currentPage, searchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await careService.getTestCategories({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm
      });
      setCategories(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load test categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingCategory) {
        await careService.updateTestCategory(editingCategory.id, data);
        showToast('success', 'Test category updated successfully');
      } else {
        await careService.createTestCategory(data);
        showToast('success', 'Test category created successfully');
      }
      setEditingCategory(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadCategories();
    } catch (error) {
      showToast('error', 'Failed to save test category');
    }
  };

  const handleDelete = async (category: TestCategory) => {
    showConfirmation(
      {
        title: 'Delete Test Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await careService.deleteTestCategory(category.id);
          showToast('success', 'Test category deleted successfully');
          loadCategories();
        } catch (error) {
          showToast('error', 'Failed to delete test category');
        }
      }
    );
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (v: string) => v || '-' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value ? '#dcfce7' : '#f3f4f6',
          color: value ? '#166534' : '#6b7280'
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <TestCategoryForm
        category={editingCategory}
        onSave={handleSave}
        onCancel={() => {
          setEditingCategory(undefined);
          setResetForm(true);
          setTimeout(() => setResetForm(false), 100);
        }}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Test Category Management"
        columns={columns}
        data={categories}
        onEdit={setEditingCategory}
        onDelete={handleDelete}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSearch={(search) => {
          setSearchTerm(search);
          setCurrentPage(1);
        }}
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

export default TestCategoryManagement;
