import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface Workflow {
  id: number;
  workflow_name: string;
  entity_type: string;
  is_active: boolean;
  levels: WorkflowLevel[];
}

interface WorkflowLevel {
  level_number: number;
  approver_type: string;
  approver_role_id?: number;
  approver_user_id?: number;
  approver_name?: string;
}

const ApprovalWorkflowManagement: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/approvals/workflows');
      const data = response.data?.data || response.data;
      setWorkflows(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('error', 'Failed to load workflows');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this workflow?')) return;
    try {
      await api.delete(`/api/v1/approvals/workflows/${id}`);
      showToast('success', 'Workflow deleted successfully');
      fetchWorkflows();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to delete workflow');
    }
  };

  const columns = [
    { key: 'workflow_name', label: 'Workflow Name', sortable: true },
    { key: 'entity_type', label: 'Entity Type', sortable: true },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, workflow: Workflow) => (
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedRow(expandedRow === workflow.id ? null : workflow.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            {expandedRow === workflow.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button onClick={() => handleDelete(workflow.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Approval Workflows</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <DataTable
            title="Workflows"
            data={workflows}
            columns={columns}
            loading={loading}
          />

          {workflows.map((workflow) => (
            expandedRow === workflow.id && (
              <div key={workflow.id} className="mt-4 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-3">Approval Levels</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Level</th>
                      <th className="px-3 py-2 text-left">Approver Type</th>
                      <th className="px-3 py-2 text-left">Approver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflow.levels?.map((level) => (
                      <tr key={level.level_number} className="border-t">
                        <td className="px-3 py-2">Level {level.level_number}</td>
                        <td className="px-3 py-2">{level.approver_type}</td>
                        <td className="px-3 py-2">{level.approver_name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflowManagement;
