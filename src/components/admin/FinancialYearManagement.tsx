import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import FinancialYearForm from './FinancialYearForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface FinancialYear {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
}

const FinancialYearManagement: React.FC = () => {
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingYear, setEditingYear] = useState<FinancialYear | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  const pageSize = 10;

  useEffect(() => {
    loadYears();
  }, [currentPage, searchTerm]);

  const loadYears = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFinancialYears({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm || undefined
      });
      setYears(Array.isArray(response.data) ? response.data : []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error('Financial years error:', error);
      showToast('error', 'Failed to load financial years');
      setYears([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (year: FinancialYear) => {
    setEditingYear(year);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleSave = async (yearData: any) => {
    try {
      if (editingYear) {
        await adminService.updateFinancialYear(editingYear.id, yearData);
        showToast('success', 'Financial year updated successfully');
      } else {
        await adminService.createFinancialYear(yearData);
        showToast('success', 'Financial year created successfully');
      }
      setEditingYear(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadYears();
    } catch (error) {
      showToast('error', 'Failed to save financial year');
    }
  };

  const handleCancel = () => {
    setEditingYear(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Financial years imported successfully');
      loadYears();
    } catch (error) {
      showToast('error', 'Failed to import financial years');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (year: FinancialYear) => {
    showConfirmation(
      {
        title: 'Delete Financial Year',
        message: `Are you sure you want to delete financial year "${year.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await adminService.deleteFinancialYear(year.id);
          showToast('success', 'Financial year deleted successfully');
          loadYears();
        } catch (error) {
          showToast('error', 'Failed to delete financial year');
        }
      }
    );
  };



  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Year Name' },
    { key: 'code', label: 'Code' },
    { 
      key: 'start_date', 
      label: 'Start Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { 
      key: 'end_date', 
      label: 'End Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    {
      key: 'is_current',
      label: 'Current',
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Current' : 'Not Current'}
        </span>
      )
    },
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
      <FinancialYearForm
        year={editingYear}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Financial Year Management"
        columns={columns}
        data={years}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
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

export default FinancialYearManagement;