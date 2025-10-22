import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import DatePicker from '../common/DatePicker';

interface FiscalYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
}

const FiscalYearManagement: React.FC = () => {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadFiscalYears();
  }, []);

  const loadFiscalYears = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/account/fiscal-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setFiscalYears(result.data);
      }
    } catch (error) {
      showToast('error', 'Failed to load fiscal years');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      showToast('error', 'Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `/api/v1/account/fiscal-years/${editingId}`
        : '/api/v1/account/fiscal-years';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showToast('success', `Fiscal year ${editingId ? 'updated' : 'created'} successfully`);
        loadFiscalYears();
        resetForm();
      } else {
        showToast('error', result.message || 'Operation failed');
      }
    } catch (error) {
      showToast('error', 'Failed to save fiscal year');
    }
  };

  const handleEdit = (fy: FiscalYear) => {
    setEditingId(fy.id);
    setFormData({
      name: fy.name,
      start_date: fy.start_date,
      end_date: fy.end_date,
      is_active: fy.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this fiscal year?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/account/fiscal-years/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        showToast('success', 'Fiscal year deleted successfully');
        loadFiscalYears();
      } else {
        showToast('error', result.message || 'Failed to delete');
      }
    } catch (error) {
      showToast('error', 'Failed to delete fiscal year');
    }
  };

  const handleClose = async (id: number) => {
    if (!window.confirm('Are you sure you want to close this fiscal year? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/account/fiscal-years/${id}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        showToast('success', 'Fiscal year closed successfully');
        loadFiscalYears();
      } else {
        showToast('error', result.message || 'Failed to close');
      }
    } catch (error) {
      showToast('error', 'Failed to close fiscal year');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', start_date: '', end_date: '', is_active: false });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiscal Year Management</h1>
          <p className="text-gray-600">Manage accounting periods</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Fiscal Year
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Fiscal Year' : 'Create Fiscal Year'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., FY 2024-2025"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Set as Active</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(value) => setFormData({ ...formData, start_date: value })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.end_date}
                  onChange={(value) => setFormData({ ...formData, end_date: value })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : fiscalYears.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No fiscal years found</td>
                </tr>
              ) : (
                fiscalYears.map((fy) => (
                  <tr key={fy.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(fy.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(fy.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {fy.is_active && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        )}
                        {fy.is_closed && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Lock className="h-3 w-3 mr-1" />
                            Closed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        {!fy.is_closed && (
                          <>
                            <button
                              onClick={() => handleEdit(fy)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleClose(fy.id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Close Fiscal Year"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {!fy.is_active && !fy.is_closed && (
                          <button
                            onClick={() => handleDelete(fy.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FiscalYearManagement;
