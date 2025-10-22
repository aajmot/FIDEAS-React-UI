import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Copy, RotateCcw, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';
import VoucherForm from './VoucherForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { accountService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirmation } from '../../hooks/useConfirmation';
import { Voucher } from '../../types';

const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | undefined>(undefined);
  const [resetForm, setResetForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { confirmationState, showConfirmation, hideConfirmation, handleConfirm } = useConfirmation();

  useEffect(() => {
    loadVouchers();
    
    // Handle URL params for voucher ID or type
    const voucherId = searchParams.get('id');
    const voucherType = searchParams.get('type');
    
    if (voucherId) {
      loadVoucherForEdit(parseInt(voucherId));
    } else if (voucherType) {
      // Pre-select voucher type from URL
      setEditingVoucher({ voucher_type: voucherType } as Voucher);
      setIsFormCollapsed(false);
    }
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await accountService.getVouchers();
      setVouchers(response.data);
    } catch (error) {
      showToast('error', 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const loadVoucherForEdit = async (voucherId: number) => {
    try {
      const response = await accountService.getVoucher(voucherId);
      setEditingVoucher(response.data);
      setIsFormCollapsed(false);
      // Clear URL params after loading
      setSearchParams({});
    } catch (error) {
      showToast('error', 'Failed to load voucher');
    }
  };

  const handleEdit = (voucher: Voucher) => {
    if (voucher.status === 'Posted') {
      showToast('error', 'Cannot edit posted voucher. Please unpost it first.');
      return;
    }
    loadVoucherForEdit(voucher.id);
  };

  const handlePost = async (voucher: Voucher) => {
    try {
      await accountService.postVoucher(voucher.id);
      showToast('success', 'Voucher posted successfully');
      loadVouchers();
    } catch (error) {
      showToast('error', 'Failed to post voucher');
    }
  };

  const handleUnpost = async (voucher: Voucher) => {
    try {
      await accountService.unpostVoucher(voucher.id);
      showToast('success', 'Voucher unposted successfully');
      loadVouchers();
    } catch (error) {
      showToast('error', 'Failed to unpost voucher');
    }
  };

  const handleDuplicate = async (voucher: Voucher) => {
    try {
      const response = await accountService.getVoucher(voucher.id);
      const duplicateVoucher = {
        ...response.data,
        id: undefined,
        voucher_number: undefined,
        status: 'Draft'
      };
      setEditingVoucher(duplicateVoucher as Voucher);
      setIsFormCollapsed(false);
      showToast('info', 'Voucher duplicated. Modify and save as new.');
    } catch (error) {
      showToast('error', 'Failed to duplicate voucher');
    }
  };

  const handleReverse = async (voucher: Voucher) => {
    if (!window.confirm(`Are you sure you want to reverse voucher "${voucher.voucher_number}"? This will create a reversing entry.`)) {
      return;
    }
    try {
      await accountService.reverseVoucher(voucher.id);
      showToast('success', 'Voucher reversed successfully');
      loadVouchers();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to reverse voucher');
    }
  };

  const handleSave = async (voucherData: any) => {
    try {
      if (editingVoucher) {
        await accountService.updateVoucher(editingVoucher.id, voucherData);
        showToast('success', 'Voucher updated successfully');
      } else {
        await accountService.createVoucher(voucherData);
        showToast('success', 'Voucher created successfully');
      }
      setEditingVoucher(undefined);
      setResetForm(true);
      setTimeout(() => setResetForm(false), 100);
      loadVouchers();
    } catch (error) {
      showToast('error', 'Failed to save voucher');
    }
  };

  const handleCancel = () => {
    setEditingVoucher(undefined);
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleToggleCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (voucher.status === 'Posted') {
      showToast('error', 'Cannot delete posted voucher. Please unpost it first.');
      return;
    }
    showConfirmation(
      {
        title: 'Delete Voucher',
        message: `Are you sure you want to delete voucher "${voucher.voucher_number}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger'
      },
      async () => {
        try {
          await accountService.deleteVoucher(voucher.id);
          showToast('success', 'Voucher deleted successfully');
          loadVouchers();
        } catch (error) {
          showToast('error', 'Failed to delete voucher');
        }
      }
    );
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'voucher_number', label: 'Voucher No.' },
    { key: 'voucher_type', label: 'Type' },
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => (value || 0).toLocaleString()
    },
    { key: 'description', label: 'Description' },
    { key: 'created_by', label: 'Created By' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Posted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'post_actions',
      label: 'Actions',
      render: (_: any, row: Voucher) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'Draft' ? (
            <button
              onClick={() => handlePost(row)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
              title="Post Voucher"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleUnpost(row)}
              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded"
              title="Unpost Voucher"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDuplicate(row)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Duplicate Voucher"
          >
            <Copy className="h-4 w-4" />
          </button>
          {row.status === 'Posted' && (
            <button
              onClick={() => handleReverse(row)}
              className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
              title="Reverse Entry"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete Voucher"
            disabled={row.status === 'Posted'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <VoucherForm
        voucher={editingVoucher}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleCollapse}
        resetForm={resetForm}
      />
      
      <DataTable
        title="Voucher Management"
        columns={columns}
        data={vouchers}
        onRowClick={(voucher) => {
          if (voucher.status === 'Posted') {
            showToast('info', 'Unpost the voucher first to edit');
          } else {
            handleEdit(voucher);
          }
        }}
        loading={loading}
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

export default VoucherManagement;