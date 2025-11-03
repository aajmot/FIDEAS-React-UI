import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import WarehouseForm from './WarehouseForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import api from '../../services/api';

interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  contact_person: string;
  phone: string;
  email: string;
  is_active: boolean;
}

const WarehouseManagement: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadWarehouses(1);
  }, []);

  const loadWarehouses = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
  const response = await api.get('/api/v1/inventory/warehouses', {
        params: { page, per_page: 10, search: searchText }
      });
      const data = response.data?.data || response.data;
      setWarehouses(Array.isArray(data) ? data : []);
      setTotalItems(response.data?.total || data.length || 0);
      setCurrentPage(response.data?.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load warehouses');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadWarehouses(1, search);
    } else {
      await loadWarehouses(1, '');
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
  };

  const handleSave = async (warehouseData: any) => {
    try {
      if (editingWarehouse) {
  await api.put(`/api/v1/inventory/warehouses/${editingWarehouse.id}`, warehouseData);
        showToast('success', 'Warehouse updated successfully');
      } else {
  await api.post('/api/v1/inventory/warehouses', warehouseData);
        showToast('success', 'Warehouse created successfully');
      }
      setEditingWarehouse(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadWarehouses(currentPage);
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to save warehouse');
    }
  };

  const handleCancel = () => {
    setEditingWarehouse(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Warehouses imported successfully');
      loadWarehouses(1);
    } catch (error) {
      showToast('error', 'Failed to import warehouses');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (warehouse: Warehouse) => {
    showConfirmation(
      {
        title: 'Delete Warehouse',
        message: `Are you sure you want to delete warehouse "${warehouse.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await api.delete(`/api/v1/inventory/warehouses/${warehouse.id}`);
          showToast('success', 'Warehouse deleted successfully');
          loadWarehouses(currentPage);
        } catch (error: any) {
          showToast('error', error.response?.data?.detail || 'Failed to delete warehouse');
        }
      }
    );
  };



  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
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
      <WarehouseForm
        warehouse={editingWarehouse}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Warehouse Management"
        columns={columns}
        data={warehouses}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadWarehouses(page)}
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

export default WarehouseManagement;
