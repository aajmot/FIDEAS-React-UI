import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import TestForm from './TestForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { careService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface Test {
  id: number;
  name: string;
  category_name?: string;
  body_part?: string;
  rate?: number;
  commission_type?: string;
  commission_value?: number;
  is_active: boolean;
}

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const pageSize = 10;

  useEffect(() => {
    loadTests();
  }, [currentPage, searchTerm]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await careService.getTests({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm
      });
      setTests(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingTest) {
        await careService.updateTest(editingTest.id, data);
        showToast('success', 'Test updated successfully');
      } else {
        await careService.createTest(data);
        showToast('success', 'Test created successfully');
      }
      setEditingTest(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadTests();
    } catch (error) {
      showToast('error', 'Failed to save test');
    }
  };

  const handleDelete = async (test: Test) => {
    showConfirmation(
      {
        title: 'Delete Test',
        message: `Are you sure you want to delete "${test.name}"?`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await careService.deleteTest(test.id);
          showToast('success', 'Test deleted successfully');
          loadTests();
        } catch (error) {
          showToast('error', 'Failed to delete test');
        }
      }
    );
  };

  const columns = [
    { key: 'name', label: 'Test Name' },
    { key: 'category_name', label: 'Category', render: (v: string) => v || '-' },
    { key: 'body_part', label: 'Body Part', render: (v: string) => v || '-' },
    { key: 'rate', label: 'Rate', render: (v: number) => v ? v.toFixed(2) : '-' },
    { key: 'commission_type', label: 'Commission Type', render: (v: string) => v || '-' },
    { key: 'commission_value', label: 'Commission Value', render: (v: number) => v ? v.toFixed(2) : '-' },
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
      <TestForm
        test={editingTest}
        onSave={handleSave}
        onCancel={() => {
          setEditingTest(undefined);
          setResetForm(true);
          setTimeout(() => setResetForm(false), 100);
        }}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Test Management"
        columns={columns}
        data={tests}
        onEdit={setEditingTest}
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

export default TestManagement;
