import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import CreditNoteForm from './CreditNoteForm';
import CreditNoteView from './CreditNoteView';
import DataTable from '../common/DataTable';
import { accountExtensions } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CreditNoteManagement: React.FC = () => {
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
      const response = await accountExtensions.getCreditNotes();
      setNotes(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      showToast('error', 'Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadNotes();
    setResetForm(true);
    setTimeout(() => setResetForm(false), 100);
  };

  const [viewingNoteId, setViewingNoteId] = useState<number | null>(null);

  const handlePrint = (note: any) => {
    setViewingNoteId(note.id);
  };

  const columns = [
    { key: 'note_number', label: 'Note No', sortable: true },
    { 
      key: 'note_date', 
      label: 'Date', 
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '-'
    },
    { key: 'customer_id', label: 'Customer ID', sortable: true },
    { key: 'original_invoice_number', label: 'Original Invoice', sortable: true },
    { 
      key: 'total_amount_base', 
      label: 'Amount', 
      sortable: true,
      render: (val: string) => `${parseFloat(val || '0').toFixed(2)}` 
    },
    { key: 'reason', label: 'Reason' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row);
            }}
            className="text-gray-600 hover:text-gray-900"
            title="Print Credit Note"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (viewingNoteId !== null) {
    return (
      <CreditNoteView
        noteId={viewingNoteId}
        onBack={() => setViewingNoteId(null)}
      />
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <CreditNoteForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />

      <DataTable
        title="Credit Notes"
        data={notes}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};

export default CreditNoteManagement;
