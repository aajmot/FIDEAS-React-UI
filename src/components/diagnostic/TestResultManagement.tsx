import React, { useState, useEffect } from 'react';
import { Plus, Printer, Edit, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';
import TestResultForm from './TestResultForm';
import TestResultView from './TestResultView';
import { diagnosticService, adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../common/ConfirmationModal';

const TestResultManagement: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showResultView, setShowResultView] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTestResults();
  }, [searchTerm]);

  const loadTestResults = async () => {
    setLoading(true);
    try {
      const response = await diagnosticService.getTestResults({ search: searchTerm });
      setTestResults(response.data);
    } catch (error) {
      showToast('error', 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (resultData: any) => {
    try {
      if (selectedResult) {
        await diagnosticService.updateTestResult(selectedResult.id, resultData);
        showToast('success', 'Test result updated successfully');
      } else {
        await diagnosticService.createTestResult(resultData);
        showToast('success', 'Test result created successfully');
      }
      setSelectedResult(null);
      setResetForm(true);
      loadTestResults();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to save test result');
    }
  };

  const handleEdit = (id: number) => {
    const result = testResults.find(r => r.id === id);
    if (result) {
      setSelectedResult(result);
      setIsFormCollapsed(false);
      setResetForm(false);
    }
  };

  const handlePrint = (id: number) => {
    const result = testResults.find(r => r.id === id);
    if (result) {
      setSelectedResult(result);
      setShowResultView(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await diagnosticService.deleteTestResult(deleteModal.id);
      showToast('success', 'Test result deleted successfully');
      setDeleteModal({ show: false, id: null });
      loadTestResults();
    } catch (error) {
      showToast('error', 'Failed to delete test result');
    }
  };

  const handleCancel = () => {
    setSelectedResult(null);
    setResetForm(true);
  };

  const columns = [
    { key: 'result_number', label: 'Result #', sortable: true },
    { key: 'order_number', label: 'Order #', sortable: true },
    { key: 'patient_name', label: 'Patient', sortable: true },
    { key: 'doctor_name', label: 'Doctor', sortable: true },
    { key: 'result_type', label: 'Type', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handlePrint(row.id)}
            className="text-blue-600 hover:text-blue-800"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(row.id)}
            className="text-yellow-600 hover:text-yellow-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ show: true, id: row.id })}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (showResultView && selectedResult) {
    return (
      <TestResultView
        result={selectedResult}
        onBack={() => {
          setShowResultView(false);
          setSelectedResult(null);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <TestResultForm
        testResult={selectedResult}
        onSave={handleSave}
        onCancel={handleCancel}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
      />

      <DataTable
        title="Test Results"
        columns={columns}
        data={testResults}
        loading={loading}
        onSearch={setSearchTerm}
      />

      <ConfirmationModal
        isOpen={deleteModal.show}
        onCancel={() => setDeleteModal({ show: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Test Result"
        message="Are you sure you want to delete this test result? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TestResultManagement;
