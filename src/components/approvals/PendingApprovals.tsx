import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import DataTable from '../common/DataTable';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface ApprovalRequest {
  id: number;
  entity_type: string;
  entity_id: number;
  entity_reference: string;
  current_level: number;
  total_levels: number;
  requested_by_name: string;
  requested_at: string;
  status: string;
}

const PendingApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/approvals/pending');
      setApprovals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showToast('error', 'Failed to load pending approvals');
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this request?')) return;
    try {
      await api.post(`/api/v1/approvals/requests/${id}/approve`, { comments: 'Approved' });
      showToast('success', 'Request approved successfully');
      fetchApprovals();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to approve request');
    }
  };

  const handleReject = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedApproval || !rejectReason.trim()) {
      showToast('error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await api.post(`/api/v1/approvals/requests/${selectedApproval.id}/reject`, { comments: rejectReason });
      showToast('success', 'Request rejected successfully');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedApproval(null);
      fetchApprovals();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to reject request');
    }
  };

  const filteredApprovals = approvals.filter(approval =>
    approval.entity_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.requested_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'entity_type', label: 'Type', sortable: true },
    { key: 'entity_reference', label: 'Reference', sortable: true },
    { 
      key: 'current_level', 
      label: 'Level', 
      sortable: true,
      render: (value: number, row: ApprovalRequest) => `${value} of ${row.total_levels}`
    },
    { key: 'requested_by_name', label: 'Requested By', sortable: true },
    { 
      key: 'requested_at', 
      label: 'Requested At', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
          <Clock size={14} /> {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, approval: ApprovalRequest) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleApprove(approval.id)} 
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button 
            onClick={() => handleReject(approval)} 
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            <XCircle size={16} /> Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock size={28} /> Pending Approvals
        </h1>
        <div className="text-sm text-gray-600">
          {approvals.length} pending request{approvals.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by type, reference or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          title="Pending Approvals"
          data={filteredApprovals}
          columns={columns}
          loading={loading}
        />
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Approval Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedApproval(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
