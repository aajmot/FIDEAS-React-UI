import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import CustomerForm from './CustomerForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Customer } from '../../types';

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadCustomers(1);
  }, []);

  const loadCustomers = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await inventoryService.getCustomers({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setCustomers(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadCustomers(1, search);
    } else {
      await loadCustomers(1, '');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleSave = async (customerData: any) => {
    try {
      if (editingCustomer) {
        await inventoryService.updateCustomer(editingCustomer.id, customerData);
        showToast('success', 'Customer updated successfully');
      } else {
        await inventoryService.createCustomer(customerData);
        showToast('success', 'Customer created successfully');
      }
      setEditingCustomer(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadCustomers(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save customer');
    }
  };

  const handleCancel = () => {
    setEditingCustomer(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Customers imported successfully');
      loadCustomers(1);
    } catch (error) {
      showToast('error', 'Failed to import customers');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (customer: Customer) => {
    showConfirmation(
      {
        title: 'Delete Customer',
        message: `Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteCustomer(customer.id);
          showToast('success', 'Customer deleted successfully');
          loadCustomers(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete customer');
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
      key: 'age', 
      label: 'Age',
      render: (value: number) => value || '-'
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
      key: 'tax_id', 
      label: 'Tax ID',
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
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <CustomerForm
        customer={editingCustomer}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Customer Management"
        columns={columns}
        data={customers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadCustomers(page)}
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

export default CustomerManagement;