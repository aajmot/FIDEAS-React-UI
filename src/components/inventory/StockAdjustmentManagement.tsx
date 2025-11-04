import React, { useState, useEffect } from 'react';
import { Trash2, Printer } from 'lucide-react';
import StockAdjustmentForm from './StockAdjustmentForm';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface StockAdjustment {
  id: number;
  adjustment_number: string;
  adjustment_date: string;
  reference_number?: string;
  reason: string;
  total_cost?: number;
  items?: any[];
}

const StockAdjustmentManagement: React.FC = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getStockAdjustments();
      setAdjustments(response.data);
    } catch (error) {
      showToast('error', 'Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', 'Stock adjustment created successfully');
    loadAdjustments();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleDelete = async (adjustment: StockAdjustment) => {
    showConfirmation(
      {
        title: 'Delete Adjustment',
        message: `Are you sure you want to delete adjustment "${adjustment.adjustment_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteStockAdjustment(adjustment.id);
          showToast('success', 'Stock adjustment deleted successfully');
          loadAdjustments();
        } catch (error) {
          showToast('error', 'Failed to delete stock adjustment');
        }
      }
    );
  };

  const columns = [
    {
      key: 'adjustment_number',
      label: 'Adjustment Number',
      sortable: true,
    },
    {
      key: 'adjustment_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    },
    {
      key: 'reference_number',
      label: 'Reference',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'items',
      label: 'Items Count',
      sortable: false,
      render: (value: any[]) => value?.length || 0,
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      sortable: false,
      render: (_: any, adjustment: StockAdjustment) => {
        if (adjustment.items && adjustment.items.length > 0) {
          const total = adjustment.items.reduce((sum, item) => sum + (item.total_cost || 0), 0);
          return total.toFixed(2);
        }
        return '0.00';
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: true,
      render: (value: string) => (
        <span title={value}>
          {value && value.length > 40 ? `${value.substring(0, 40)}...` : (value || '-')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, adjustment: StockAdjustment) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleDelete(adjustment)}
            className="text-red-600 hover:text-red-800"
            title="Delete Adjustment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-6">
      <StockAdjustmentForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Stock Adjustments</h2>
        </div>
        <div className="p-6">
          <DataTable
            title="Stock Adjustments"
            data={adjustments}
            columns={columns}
            loading={loading}
          />
        </div>
      </div>
      
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

export default StockAdjustmentManagement;
