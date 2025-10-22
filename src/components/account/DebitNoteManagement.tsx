import React, { useState, useEffect } from 'react';
import DebitNoteForm from './DebitNoteForm';
import DataTable from '../common/DataTable';
import { accountExtensions } from '../../services/apiExtensions';
import { useToast } from '../../context/ToastContext';

const DebitNoteManagement: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await accountExtensions.getDebitNotes();
      setNotes(response.data);
    } catch (error) {
      showToast('error', 'Failed to load debit notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadNotes();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const columns = [
    { key: 'note_number', label: 'Note No', sortable: true },
    { 
      key: 'date', 
      label: 'Date', 
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { key: 'supplier', label: 'Supplier', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (val: number) => `₹${(val || 0).toFixed(2)}` 
    },
    { key: 'reason', label: 'Reason' }
  ];

  return (
    <div className="p-3 sm:p-6">
      <DebitNoteForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />

      <DataTable
        title="Debit Notes"
        data={notes}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};

export default DebitNoteManagement;
