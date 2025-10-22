import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import BillingMasterForm from './BillingMasterForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { clinicService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { BillingMaster } from '../../types';

const BillingMasterManagement: React.FC = () => {
  const [billingMasters, setBillingMasters] = useState<BillingMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingBillingMaster, setEditingBillingMaster] = useState<BillingMaster | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const pageSize = 10;

  useEffect(() => {
    loadBillingMasters();
  }, [currentPage, searchTerm]);

  const loadBillingMasters = async () => {
    try {
      setLoading(true);
      const response = await clinicService.getBillingMasters({
        page: currentPage,
        per_page: pageSize,
        search: searchTerm
      });
      setBillingMasters(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load billing masters');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleEdit = (billingMaster: BillingMaster) => {
    setEditingBillingMaster(billingMaster);
  };

  const handleSave = async (billingMasterData: any) => {
    try {
      if (editingBillingMaster) {
        await clinicService.updateBillingMaster(editingBillingMaster.id, billingMasterData);
        showToast('success', 'Billing master updated successfully');
      } else {
        await clinicService.createBillingMaster(billingMasterData);
        showToast('success', 'Billing master created successfully');
      }
      setEditingBillingMaster(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadBillingMasters();
    } catch (error) {
      showToast('error', 'Failed to save billing master');
    }
  };

  const handleCancel = () => {
    setEditingBillingMaster(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Billing masters imported successfully');
      loadBillingMasters();
    } catch (error) {
      showToast('error', 'Failed to import billing masters');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (billingMaster: BillingMaster) => {
    showConfirmation(
      {
        title: 'Delete Billing Master',
        message: `Are you sure you want to delete billing master "${billingMaster.description}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await clinicService.deleteBillingMaster(billingMaster.id);
          showToast('success', 'Billing master deleted successfully');
          loadBillingMasters();
        } catch (error) {
          showToast('error', 'Failed to delete billing master');
        }
      }
    );
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const columns = [
    { key: 'description', label: 'Description' },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (value: number) => formatAmount(value)
    },
    { 
      key: 'hsn_code', 
      label: 'HSN Code',
      render: (value: string) => value || '-'
    },
    { 
      key: 'gst_percentage', 
      label: 'GST %',
      render: (value: number) => `${value}%`
    },
    { 
      key: 'note', 
      label: 'Note',
      render: (value: string) => value || '-'
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
    },
    { 
      key: 'created_at', 
      label: 'Created',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'updated_at', 
      label: 'Updated',
      render: (value: string) => formatDate(value)
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <BillingMasterForm
        billingMaster={editingBillingMaster}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Billing Master Management"
        columns={columns}
        data={billingMasters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
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

export default BillingMasterManagement;