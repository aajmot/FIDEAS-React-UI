import React, { useState, useEffect } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import DataTable from '../common/DataTable';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderView from './PurchaseOrderView';
import ConfirmationModalWithInput from '../common/ConfirmationModalWithInput';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PurchaseOrder } from '../../types';

const PurchaseOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'view'>('list');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [orderToReverse, setOrderToReverse] = useState<PurchaseOrder | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getPurchaseOrders();
      setOrders(response.data);
    } catch (error) {
      showToast('error', 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setActiveTab('view');
  };

  const handleOrderSaved = () => {
    loadOrders();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
    showToast('success', 'Purchase order created successfully');
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleReverseOrder = (order: PurchaseOrder) => {
    setOrderToReverse(order);
    setShowReverseModal(true);
  };

  const handleConfirmReverse = async (reason: string) => {
    if (!orderToReverse) return;
    
    try {
      await inventoryService.reversePurchaseOrder(orderToReverse.id, reason);
      showToast('success', 'Purchase order reversed successfully');
      loadOrders();
    } catch (error) {
      showToast('error', 'Failed to reverse purchase order');
    } finally {
      setShowReverseModal(false);
      setOrderToReverse(null);
    }
  };

  const handleCancelReverse = () => {
    setShowReverseModal(false);
    setOrderToReverse(null);
  };

  const columns = [
    { key: 'po_number', label: 'PO Number' },
    { key: 'supplier_name', label: 'Supplier' },
    { 
      key: 'order_date', 
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { 
      key: 'total_amount', 
      label: 'Total Amount',
      render: (value: number) => (value || 0).toFixed(2)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'reversed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: PurchaseOrder) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewOrder(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Order"
          >
            <Printer className="h-4 w-4" />
          </button>
          {row.status !== 'reversed' && (
            <button
              onClick={() => handleReverseOrder(row)}
              className="text-red-600 hover:text-red-800"
              title="Reverse Order"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (activeTab === 'view' && selectedOrder) {
    return (
      <div className="p-3 sm:p-6">
        <PurchaseOrderView
          orderId={selectedOrder.id}
          onBack={() => setActiveTab('list')}
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <PurchaseOrderForm
        onSave={handleOrderSaved}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Purchase Order Management"
        columns={columns}
        data={orders}
        loading={loading}
      />
      
      <ConfirmationModalWithInput
        isOpen={showReverseModal}
        title="Reverse Purchase Order"
        message={`WARNING: This will reverse ALL transactions related to purchase order "${orderToReverse?.po_number}" including:\n\n• Stock transactions (items will be removed from inventory)\n• Accounting entries (AP and Purchase accounts will be reversed)\n\nThis action cannot be undone.`}
        inputLabel="Reason for reversal *"
        inputPlaceholder="Enter the reason for reversing this order..."
        confirmText="Reverse Order"
        variant="danger"
        onConfirm={handleConfirmReverse}
        onCancel={handleCancelReverse}
      />
    </div>
  );
};

export default PurchaseOrderManagement;