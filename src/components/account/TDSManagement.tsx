import React, { useState, useEffect } from 'react';
import DataTable from '../common/DataTable';
import { accountExtensions } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const TDSManagement: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [formData, setFormData] = useState({
    section_code: '',
    description: '',
    rate: '',
    threshold_limit: ''
  });
  const [calcData, setCalcData] = useState({
    section_code: '',
    amount: '',
    result: null as any
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const response = await accountExtensions.getTDSSections();
      setSections(response.data);
    } catch (error: any) {
      showToast('error', 'Failed to load TDS sections');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountExtensions.createTDSSection(formData);
      showToast('success', 'TDS section created successfully');
      setShowForm(false);
      loadSections();
      setFormData({ section_code: '', description: '', rate: '', threshold_limit: '' });
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to create TDS section');
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await accountExtensions.calculateTDS(calcData);
      setCalcData({ ...calcData, result: response.data });
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Failed to calculate TDS');
    }
  };

  const columns = [
    { key: 'section_code', label: 'Section' },
    { key: 'description', label: 'Description' },
    { key: 'rate', label: 'Rate (%)', render: (val: number) => `${val}%` },
    { key: 'threshold_limit', label: 'Threshold', render: (val: number) => `₹${val.toFixed(2)}` },
    { key: 'is_active', label: 'Status', render: (val: boolean) => val ? '✓ Active' : '✗ Inactive' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">TDS Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCalculator(!showCalculator)} 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            TDS Calculator
          </button>
          <button onClick={() => setShowForm(!showForm)} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {showForm ? 'Cancel' : 'New Section'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Section Code</label>
              <input type="text" value={formData.section_code} 
                onChange={(e) => setFormData({...formData, section_code: e.target.value})} 
                className="w-full border rounded px-3 py-2" placeholder="e.g., 194C" required />
            </div>
            <div>
              <label className="block mb-2">Rate (%)</label>
              <input type="number" step="0.01" value={formData.rate} 
                onChange={(e) => setFormData({...formData, rate: e.target.value})} 
                className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="col-span-2">
              <label className="block mb-2">Description</label>
              <input type="text" value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block mb-2">Threshold Limit</label>
              <input type="number" step="0.01" value={formData.threshold_limit} 
                onChange={(e) => setFormData({...formData, threshold_limit: e.target.value})} 
                className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Create Section
          </button>
        </form>
      )}

      {showCalculator && (
        <div className="bg-blue-50 p-6 rounded shadow mb-6">
          <h3 className="font-semibold mb-4">TDS Calculator</h3>
          <form onSubmit={handleCalculate} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-2">Section</label>
              <select value={calcData.section_code} 
                onChange={(e) => setCalcData({...calcData, section_code: e.target.value})} 
                className="w-full border rounded px-3 py-2" required>
                <option value="">Select section</option>
                {sections.map((s: any) => (
                  <option key={s.id} value={s.section_code}>{s.section_code} - {s.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Amount</label>
              <input type="number" step="0.01" value={calcData.amount} 
                onChange={(e) => setCalcData({...calcData, amount: e.target.value})} 
                className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Calculate
              </button>
            </div>
          </form>
          {calcData.result && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Gross Amount</div>
                <div className="text-lg font-bold">₹{calcData.result.amount.toFixed(2)}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">TDS Rate</div>
                <div className="text-lg font-bold">{calcData.result.rate}%</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">TDS Amount</div>
                <div className="text-lg font-bold text-red-600">₹{calcData.result.tds_amount.toFixed(2)}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Net Amount</div>
                <div className="text-lg font-bold text-green-600">₹{calcData.result.net_amount.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <DataTable title="TDS Sections" columns={columns} data={sections} />
    </div>
  );
};

export default TDSManagement;
