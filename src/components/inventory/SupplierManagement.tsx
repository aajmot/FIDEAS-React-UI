import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import SupplierForm from './SupplierForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Supplier } from '../../types';

const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadSuppliers(1);
  }, []);

  const loadSuppliers = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await inventoryService.getSuppliers({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setSuppliers(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadSuppliers(1, search);
    } else {
      await loadSuppliers(1, '');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const handleSave = async (supplierData: any) => {
    try {
      if (editingSupplier) {
        await inventoryService.updateSupplier(editingSupplier.id, supplierData);
        showToast('success', 'Supplier updated successfully');
      } else {
        await inventoryService.createSupplier(supplierData);
        showToast('success', 'Supplier created successfully');
      }
      setEditingSupplier(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadSuppliers(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save supplier');
    }
  };

  const handleCancel = () => {
    setEditingSupplier(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Suppliers imported successfully');
      loadSuppliers(1);
    } catch (error) {
      showToast('error', 'Failed to import suppliers');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (supplier: Supplier) => {
    showConfirmation(
      {
        title: 'Delete Supplier',
        message: `Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteSupplier(supplier.id);
          showToast('success', 'Supplier deleted successfully');
          loadSuppliers(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete supplier');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'email', 
      label: 'Email',
      render: (value: string) => value || '-'
    },
    { 
      key: 'tax_id', 
      label: 'Tax ID',
      render: (value: string) => value || '-'
    },
    { 
      key: 'contact_person', 
      label: 'Contact Person',
      render: (value: string) => value || '-'
    },
    { 
      key: 'address', 
      label: 'Address',
      render: (value: string) => (
        <span className="text-xs" title={value}>
          {value && value.length > 30 ? `${value.substring(0, 30)}...` : value || '-'}
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
    <div className="p-3 sm:p-6">
      <SupplierForm
        supplier={editingSupplier}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Supplier Management"
        columns={columns}
        data={suppliers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadSuppliers(page)}
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

export default SupplierManagement;