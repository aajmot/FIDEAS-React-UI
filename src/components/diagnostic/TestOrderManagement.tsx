import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer } from 'lucide-react';
import TestOrderForm from './TestOrderForm';
import TestOrderView from './TestOrderView';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { diagnosticService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatUTCToLocal } from '../../utils/dateUtils';

interface TestOrder {
  id: number;
  test_order_number: string;
  patient_name: string;
  doctor_name: string;
  order_date: string;
  status: string;
  urgency: string;
  final_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_amount?: number;
}

const TestOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<TestOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<TestOrder | null>(null);
  const [showOrderView, setShowOrderView] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, orderId: null as number | null, orderNumber: '' });
  const { showToast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await diagnosticService.getTestOrders();
      setOrders(response.data);
    } catch (error) {
      showToast('error', 'Failed to load test orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', editingOrder ? 'Test order updated successfully' : 'Test order created successfully');
    loadOrders();
    setEditingOrder(null);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleCancel = () => {
    setEditingOrder(null);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleEdit = async (order: TestOrder) => {
    try {
      const response = await diagnosticService.getTestOrder(order.id);
      setEditingOrder(response.data);
      setIsFormCollapsed(false);
    } catch (error) {
      showToast('error', 'Failed to load test order details');
    }
  };

  const handleView = (order: TestOrder) => {
    setSelectedOrder(order);
    setShowOrderView(true);
  };

  const handleDeleteClick = (order: TestOrder) => {
    setDeleteModal({ isOpen: true, orderId: order.id, orderNumber: order.test_order_number });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.orderId) return;
    
    try {
      await diagnosticService.deleteTestOrder(deleteModal.orderId);
      setOrders(orders.filter(order => order.id !== deleteModal.orderId));
      showToast('success', 'Test order deleted successfully');
      setDeleteModal({ isOpen: false, orderId: null, orderNumber: '' });
    } catch (error) {
      showToast('error', 'Failed to delete test order');
    }
  };

  const columns = [
    {
      key: 'test_order_number',
      label: 'Order Number',
      sortable: true,
    },
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
    },
    {
      key: 'doctor_name',
      label: 'Doctor',
      sortable: true,
    },
    {
      key: 'order_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => formatUTCToLocal(value),
    },
    {
      key: 'urgency',
      label: 'Urgency',
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'urgent' ? '#fee2e2' : value === 'normal' ? '#dbeafe' : '#f3f4f6',
          color: value === 'urgent' ? '#991b1b' : value === 'normal' ? '#1e40af' : '#6b7280'
        }}>
          {value || 'Normal'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value === 'completed' ? '#dcfce7' : value === 'pending' ? '#fef3c7' : '#f3f4f6',
          color: value === 'completed' ? '#166534' : value === 'pending' ? '#854d0e' : '#6b7280'
        }}>
          {value || 'Pending'}
        </span>
      ),
    },
     {
      key: 'subtotal_amount',
      label: 'Sub Total',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
     {
      key: 'items_total_discount_amount',
      label: 'Item Disc',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
     {
      key: 'taxable_amount',
      label: 'Taxable',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
    {
      key: 'total_tax',
      label: 'Total Tax',
      sortable: true,
      render: (_: any, order: TestOrder) => {
        const total = (order.cgst_amount || 0) + (order.sgst_amount || 0) + (order.igst_amount || 0) + (order.cess_amount || 0);
        return total.toFixed(2);
      },
    },
    {
      key: 'final_amount',
      label: 'Total Amount',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, order: TestOrder) => (
        <div className="flex space-x-0">
          <button
            onClick={() => handleView(order)}
            className="text-blue-600 hover:text-blue-800"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(order)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(order)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (showOrderView && selectedOrder) {
    return (
      <TestOrderView
        order={selectedOrder}
        onBack={() => {
          setShowOrderView(false);
          setSelectedOrder(null);
        }}
      />
    );
  }

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <TestOrderForm
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
        editData={editingOrder}
      />

      <DataTable
        title="Test Orders"
        data={orders}
        columns={columns}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, orderId: null, orderNumber: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Test Order"
        message={`Are you sure you want to delete test order ${deleteModal.orderNumber}? This action cannot be undone.`}
      />
    </div>
  );
};

export default TestOrderManagement;
