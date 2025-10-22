import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer } from 'lucide-react';
import TestOrderForm from './TestOrderForm';
import TestOrderView from './TestOrderView';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModal';
import { diagnosticService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestOrder {
  id: number;
  test_order_number: string;
  patient_name: string;
  doctor_name: string;
  order_date: string;
  status: string;
  urgency: string;
  final_amount: number;
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
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    },
    {
      key: 'urgency',
      label: 'Urgency',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'urgent' ? 'bg-red-100 text-red-800' :
          value === 'normal' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Normal'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Pending'}
        </span>
      ),
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
        <div className="flex space-x-2">
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
    <div className="p-3 sm:p-6">
      <TestOrderForm
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
        editData={editingOrder}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Test Orders</h2>
        </div>
        <div className="p-6">
          <DataTable
            title="Test Orders"
            data={orders}
            columns={columns}
            loading={loading}
          />
        </div>
      </div>

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
