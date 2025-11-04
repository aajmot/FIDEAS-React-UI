import React, { useState, useEffect } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import SalesOrderForm from './SalesOrderForm';
import SalesOrderView from './SalesOrderView';
import DataTable from '../common/DataTable';
import ConfirmationModalWithInput from '../common/ConfirmationModalWithInput';
import { inventoryService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { SalesOrder } from '../../types';

const SalesOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showOrderView, setShowOrderView] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [orderToReverse, setOrderToReverse] = useState<SalesOrder | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getSalesOrders();
      setOrders(response.data);
    } catch (error) {
      showToast('error', 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', 'Sales order saved successfully');
    loadOrders();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleView = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowOrderView(true);
  };



  const handleReverse = (order: SalesOrder) => {
    setOrderToReverse(order);
    setShowReverseModal(true);
  };

  const handleConfirmReverse = async (reason: string) => {
    if (!orderToReverse) return;
    
    try {
      await inventoryService.reverseSalesOrder(orderToReverse.id, reason);
      showToast('success', 'Sales order reversed successfully');
      loadOrders();
    } catch (error) {
      showToast('error', 'Failed to reverse sales order');
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
    { 
      key: 'so_number', 
      label: 'SO Number'
    },
    { 
      key: 'customer_name', 
      label: 'Customer'
    },
    { 
      key: 'agency_name', 
      label: 'Agency',
      render: (value: string) => value || '-'
    },
    { 
      key: 'order_date', 
      label: 'Date',
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { 
      key: 'net_amount', 
      label: 'Total Amount',
      render: (value: number, row: SalesOrder) => ((value || row.total_amount) || 0).toFixed(2)
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
      render: (value: any, row: SalesOrder) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Order"
          >
            <Printer className="h-4 w-4" />
          </button>
          {row.status !== 'reversed' && (
            <button
              onClick={() => handleReverse(row)}
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

  if (showOrderView && selectedOrder) {
    return (
      <SalesOrderView
        order={selectedOrder}
        onBack={() => {
          setShowOrderView(false);
          setSelectedOrder(null);
        }}
      />
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <SalesOrderForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Sales Order Management"
        columns={columns}
        data={orders}
        loading={loading}
      />
      
      <ConfirmationModalWithInput
        isOpen={showReverseModal}
        title="Reverse Sales Order"
        message={`WARNING: This will reverse ALL transactions related to sales order "${orderToReverse?.so_number}" including:\n\n• Stock transactions (items will be added back to inventory)\n• Accounting entries (AR and Sales accounts will be reversed)\n\nThis action cannot be undone.`}
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

export default SalesOrderManagement;