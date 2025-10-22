import React, { useState, useEffect } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import OrderCommissionForm from './OrderCommissionForm';
import OrderCommissionView from './OrderCommissionView';
import DataTable from '../common/DataTable';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface OrderCommission {
  id: number;
  commission_number: string;
  order_type: string;
  order_number: string;
  agency_name: string;
  total_amount: number;
  disc_amount: number;
  final_amount: number;
  created_at: string;
}

const OrderCommissionManagement: React.FC = () => {
  const [commissions, setCommissions] = useState<OrderCommission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [viewingCommission, setViewingCommission] = useState<OrderCommission | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'list' | 'view'>('list');
  const { showToast } = useToast();

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const response = await adminService.getOrderCommissions();
      setCommissions(response.data || []);
    } catch (error) {
      showToast('error', 'Failed to load order commissions');
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadCommissions();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleView = (commission: OrderCommission) => {
    setViewingCommission(commission);
    setActiveTab('view');
  };

  const handleDelete = async (commission: OrderCommission) => {
    if (!window.confirm(`Delete order commission ${commission.order_number}?`)) return;
    
    try {
      await adminService.deleteOrderCommission(commission.id);
      showToast('success', 'Order commission deleted successfully');
      loadCommissions();
    } catch (error) {
      showToast('error', 'Failed to delete order commission');
    }
  };

  const columns = [
    {
      key: 'commission_number',
      label: 'Commission #',
      sortable: true,
    },
    {
      key: 'order_number',
      label: 'Order Number',
      sortable: true,
    },
    {
      key: 'order_type',
      label: 'Type',
      sortable: true,
    },
    {
      key: 'agency_name',
      label: 'Agency',
      sortable: true,
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
    {
      key: 'disc_amount',
      label: 'Discount',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
    {
      key: 'final_amount',
      label: 'Final Amount',
      sortable: true,
      render: (value: number) => (value || 0).toFixed(2),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, commission: OrderCommission) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(commission)}
            className="text-blue-600 hover:text-blue-800"
            title="Print Commission"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(commission)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (activeTab === 'view' && viewingCommission) {
    return (
      <div className="p-3 sm:p-6">
        <OrderCommissionView
          commissionId={viewingCommission.id}
          onBack={() => setActiveTab('list')}
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <OrderCommissionForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />

      <DataTable
        title="Order Commission Management"
        data={commissions}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};

export default OrderCommissionManagement;
