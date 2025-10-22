import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import UnitForm from './UnitForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface Unit {
  id: number;
  name: string;
  symbol: string;
  parent_id?: number;
  conversion_factor: number;
  is_active: boolean;
}

const UnitManagement: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadUnits(1);
  }, []);

  const loadUnits = async (page: number, search?: string) => {
    try {
      setLoading(true);
      const searchText = search !== undefined ? search : searchTerm;
      const response = await inventoryService.getUnits({ 
        page, 
        per_page: 10, 
        search: searchText 
      });
      setUnits(response.data);
      setTotalItems(response.total || 0);
      setCurrentPage(response.page || page);
      if (search !== undefined) {
        setSearchTerm(search);
      }
    } catch (error) {
      showToast('error', 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    if (search) {
      await loadUnits(1, search);
    } else {
      await loadUnits(1, '');
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
  };

  const handleSave = async (unitData: any) => {
    try {
      if (editingUnit) {
        await inventoryService.updateUnit(editingUnit.id, unitData);
        showToast('success', 'Unit updated successfully');
      } else {
        await inventoryService.createUnit(unitData);
        showToast('success', 'Unit created successfully');
      }
      setEditingUnit(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadUnits(currentPage);
    } catch (error) {
      showToast('error', 'Failed to save unit');
    }
  };

  const handleCancel = () => {
    setEditingUnit(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleImport = async () => {
    try {
      showToast('success', 'Units imported successfully');
      loadUnits(1);
    } catch (error) {
      showToast('error', 'Failed to import units');
    }
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (unit: Unit) => {
    showConfirmation(
      {
        title: 'Delete Unit',
        message: `Are you sure you want to delete unit "${unit.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteUnit(unit.id);
          showToast('success', 'Unit deleted successfully');
          loadUnits(currentPage);
        } catch (error) {
          showToast('error', 'Failed to delete unit');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Unit Name' },
    { key: 'symbol', label: 'Symbol' },
    {
      key: 'parent_id',
      label: 'Parent Unit',
      render: (value: number, row: Unit) => {
        if (!value) return '-';
        const parentUnit = units.find(u => u.id === value);
        return parentUnit ? parentUnit.name : `ID: ${value}`;
      }
    },
    { key: 'conversion_factor', label: 'Conversion Factor' },
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
      <UnitForm
        unit={editingUnit}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
        onImport={handleImport}
      />
      
      <DataTable
        title="Unit Management"
        columns={columns}
        data={units}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        pageSize={10}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={(page) => loadUnits(page)}
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

export default UnitManagement;