import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import TestPanelForm from './TestPanelForm';
import DataTable from '../common/DataTable';
import { diagnosticService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestPanel {
  id: number;
  name: string;
  description?: string;
  category_name?: string;
  cost?: number;
  gst?: number;
  cess?: number;
  expired_on?: string;
  is_active: boolean;
}

const TestPanelManagement: React.FC = () => {
  const [panels, setPanels] = useState<TestPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [editingPanel, setEditingPanel] = useState<TestPanel | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadPanels();
  }, []);

  const loadPanels = async () => {
    setLoading(true);
    try {
      const response = await diagnosticService.getTestPanels();
      setPanels(response.data);
    } catch (error) {
      showToast('error', 'Failed to load test panels');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showToast('success', editingPanel ? 'Test panel updated successfully' : 'Test panel created successfully');
    loadPanels();
    setResetForm(true);
    setEditingPanel(null);
    setTimeout(() => setResetForm(false), 100);
  };

  const handleEdit = async (panel: TestPanel) => {
    try {
      const response = await diagnosticService.getTestPanel(panel.id);
      setEditingPanel(response.data);
      setIsFormCollapsed(false);
    } catch (error) {
      showToast('error', 'Failed to load test panel details');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this test panel?')) return;
    
    try {
      await diagnosticService.deleteTestPanel(id);
      showToast('success', 'Test panel deleted successfully');
      loadPanels();
    } catch (error) {
      showToast('error', 'Failed to delete test panel');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Panel Name',
      sortable: true,
    },
    {
      key: 'category_name',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'cost',
      label: 'Cost',
      sortable: true,
      render: (value: number) => value ? value.toFixed(2) : '-',
    },
    {
      key: 'gst',
      label: 'GST %',
      sortable: true,
      render: (value: number) => value ? value.toFixed(2) : '-',
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span style={{
          padding: '1px 6px',
          fontSize: 'var(--erp-font-size-xs)',
          borderRadius: '4px',
          backgroundColor: value ? '#dcfce7' : '#fee2e2',
          color: value ? '#166534' : '#991b1b'
        }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, panel: TestPanel) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(panel)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(panel.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <TestPanelForm
        onSave={handleSave}
        isCollapsed={isFormCollapsed}
        onToggleCollapse={() => setIsFormCollapsed(!isFormCollapsed)}
        resetForm={resetForm}
        editingPanel={editingPanel}
        onCancelEdit={() => {
          setEditingPanel(null);
          setResetForm(true);
          setTimeout(() => setResetForm(false), 100);
        }}
      />

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Test Panels</h2>
        </div>
        <div className="p-6">
          <DataTable
            title="Test Panels"
            data={panels}
            columns={columns}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default TestPanelManagement;
