import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import AgencyCommissionForm from './AgencyCommissionForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';

interface AgencyCommission {
  id: number;
  agency_id: number;
  agency_name?: string;
  product_type: string;
  product_id: number;
  product_name: string;
  notes?: string;
  commission_type?: string;
  commission_value?: number;
  effective_from?: string;
  effective_to?: string;
}

const AgencyCommissionManagement: React.FC = () => {
  const [commissions, setCommissions] = useState<AgencyCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingCommission, setEditingCommission] = useState<AgencyCommission | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();
  const pageSize = 10;

  useEffect(() => {
    loadCommissions();
  }, [currentPage]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAgencyCommissions({ page: currentPage, per_page: pageSize });
      setCommissions(response.data);
      setTotalItems(response.total);
    } catch (error) {
      showToast('error', 'Failed to load agency commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingCommission) {
        await adminService.updateAgencyCommission(editingCommission.id, data);
        showToast('success', 'Agency commission updated successfully');
      } else {
        await adminService.createAgencyCommission(data);
        showToast('success', 'Agency commission created successfully');
      }
      setEditingCommission(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadCommissions();
    } catch (error) {
      showToast('error', 'Failed to save agency commission');
    }
  };

  const handleDelete = async (commission: AgencyCommission) => {
    showConfirmation(
      {
        title: 'Delete Agency Commission',
        message: `Are you sure you want to delete commission for "${commission.product_name}"?`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await adminService.deleteAgencyCommission(commission.id);
          showToast('success', 'Agency commission deleted successfully');
          loadCommissions();
        } catch (error) {
          showToast('error', 'Failed to delete agency commission');
        }
      }
    );
  };

  const columns = [
    { key: 'agency_name', label: 'Agency', render: (v: string) => v || '-' },
    { key: 'product_type', label: 'Product Type' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'commission_type', label: 'Commission Type', render: (v: string) => v || '-' },
    { key: 'commission_value', label: 'Commission Value', render: (v: number) => v ? v.toFixed(2) : '-' },
    { key: 'effective_from', label: 'Effective From', render: (v: string) => v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-' },
    { key: 'effective_to', label: 'Effective To', render: (v: string) => v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-' }
  ];

  return (
    <div className="p-3 sm:p-6">
      <AgencyCommissionForm
        commission={editingCommission}
        onSave={handleSave}
        onCancel={() => {
          setEditingCommission(undefined);
          setResetForm(true);
          setTimeout(() => setResetForm(false), 100);
        }}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Agency Commission Setup"
        columns={columns}
        data={commissions}
        onEdit={setEditingCommission}
        onDelete={handleDelete}
        loading={loading}
        pageSize={pageSize}
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
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

export default AgencyCommissionManagement;
