import React, { useState, useEffect } from 'react';
import { Trash2, Printer } from 'lucide-react';
import ProductWasteForm from './ProductWasteForm';
import ProductWasteView from './ProductWasteView';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { ProductWaste } from '../../types';

const ProductWasteManagement: React.FC = () => {
  const [wastes, setWastes] = useState<ProductWaste[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [selectedWaste, setSelectedWaste] = useState<ProductWaste | null>(null);
  const [showWasteView, setShowWasteView] = useState(false);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadWastes();
  }, []);

  const loadWastes = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getProductWastes();
      setWastes(response.data);
    } catch (error) {
      showToast('error', 'Failed to load product wastes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', 'Product waste recorded successfully');
    loadWastes();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleView = (waste: ProductWaste) => {
    setSelectedWaste(waste);
    setShowWasteView(true);
  };

  const handleDelete = async (waste: ProductWaste) => {
    showConfirmation(
      {
        title: 'Delete Waste Record',
        message: `Are you sure you want to delete waste record "${waste.waste_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await inventoryService.deleteProductWaste(waste.id);
          showToast('success', 'Product waste deleted successfully');
          loadWastes();
        } catch (error) {
          showToast('error', 'Failed to delete product waste');
        }
      }
    );
  };

  const columns = [
    {
      key: 'waste_number',
      label: 'Waste Number',
      sortable: true,
    },
    {
      key: 'waste_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    },
    {
      key: 'warehouse_name',
      label: 'Warehouse',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'items',
      label: 'Items Count',
      sortable: false,
      render: (value: any, waste: ProductWaste) => {
        if (waste.items && waste.items.length > 0) {
          return waste.items.length;
        }
        return waste.product_name ? '1 (Legacy)' : '0';
      },
    },
    {
      key: 'total_quantity',
      label: 'Total Qty',
      sortable: false,
      render: (_: any, waste: ProductWaste) => {
        if (waste.items && waste.items.length > 0) {
          const total = waste.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          return total.toFixed(1);
        }
        return (waste.quantity || 0).toFixed(1);
      },
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      sortable: false,
      render: (_: any, waste: ProductWaste) => {
        if (waste.items && waste.items.length > 0) {
          const total = waste.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost_base || 0)), 0);
          return total.toFixed(2);
        }
        return ((waste.quantity || 0) * (waste.unit_cost_base || 0)).toFixed(2);
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      sortable: true,
      render: (value: string) => (
        <span title={value}>
          {value && value.length > 30 ? `${value.substring(0, 30)}...` : (value || '-')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, waste: ProductWaste) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(waste)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Waste"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(waste)}
            className="text-red-600 hover:text-red-800"
            title="Delete Waste"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (showWasteView && selectedWaste) {
    return (
      <ProductWasteView
        waste={selectedWaste}
        onBack={() => {
          setShowWasteView(false);
          setSelectedWaste(null);
        }}
      />
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <ProductWasteForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Waste Records</h2>
        </div>
        <div className="p-6">
          <DataTable
            title="Product Wastes"
            data={wastes}
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

export default ProductWasteManagement;