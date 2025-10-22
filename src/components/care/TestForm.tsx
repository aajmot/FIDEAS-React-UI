import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import { careService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestFormProps {
  test?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm: boolean;
}

const TestForm: React.FC<TestFormProps> = ({
  test,
  onSave,
  onCancel,
  isCollapsed,
  onToggleCollapse,
  resetForm
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '' as string | number,
    body_part: '',
    description: '',
    typical_duration: '',
    preparation_instruction: '',
    rate: '',
    hsn_code: '',
    gst: '',
    cess: '',
    commission_type: '',
    commission_value: '',
    is_active: true,
    parameters: [] as any[]
  });
  const [categories, setCategories] = useState<any[]>([]);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (test) {
      careService.getTest(test.id).then(response => {
        const data = response.data;
        setFormData({
          name: data.name || '',
          category_id: data.category_id || '',
          body_part: data.body_part || '',
          description: data.description || '',
          typical_duration: data.typical_duration || '',
          preparation_instruction: data.preparation_instruction || '',
          rate: data.rate || '',
          hsn_code: data.hsn_code || '',
          gst: data.gst || '',
          cess: data.cess || '',
          commission_type: data.commission_type || '',
          commission_value: data.commission_value || '',
          is_active: data.is_active ?? true,
          parameters: data.parameters || []
        });
      });
    } else if (resetForm) {
      setFormData({
        name: '',
        category_id: '',
        body_part: '',
        description: '',
        typical_duration: '',
        preparation_instruction: '',
        rate: '',
        hsn_code: '',
        gst: '',
        cess: '',
        commission_type: '',
        commission_value: '',
        is_active: true,
        parameters: []
      });
    }
  }, [test, resetForm]);

  const loadCategories = async () => {
    try {
      const response = await careService.getTestCategories({ page: 1, per_page: 1000 });
      setCategories(response.data);
    } catch (error) {
      showToast('error', 'Failed to load categories');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Name is required');
      return;
    }
    onSave(formData);
  };

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [...formData.parameters, { name: '', unit: '', normal_range: '', is_active: true }]
    });
  };

  const removeParameter = (index: number) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index)
    });
  };

  const updateParameter = (index: number, field: string, value: any) => {
    const updated = [...formData.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, parameters: updated });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await careService.importTests(file);
      showToast('success', 'Tests imported successfully');
      window.location.reload();
    } catch (error) {
      showToast('error', 'Failed to import tests');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportTemplate = async () => {
    try {
      await careService.exportTestsTemplate();
    } catch (error) {
      showToast('error', 'Failed to export template');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {test ? 'Edit Test' : 'Add New Test'}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportTemplate}
            className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download className="h-3 w-3 mr-1" />
            Template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Upload className="h-3 w-3 mr-1" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <SearchableDropdown
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                value={formData.category_id}
                onChange={(value) => setFormData({ ...formData, category_id: Array.isArray(value) ? value[0] : value })}
                placeholder="Select Category"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Body Part</label>
              <input
                type="text"
                value={formData.body_part}
                onChange={(e) => setFormData({ ...formData, body_part: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
              <input
                type="number"
                step="0.01"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CESS %</label>
              <input
                type="number"
                step="0.01"
                value={formData.cess}
                onChange={(e) => setFormData({ ...formData, cess: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Commission Type</label>
              <SearchableDropdown
                options={[
                  { value: '', label: 'None' },
                  { value: 'Percentage', label: 'Percentage' },
                  { value: 'Fixed', label: 'Fixed' }
                ]}
                value={formData.commission_type}
                onChange={(value) => setFormData({ ...formData, commission_type: String(Array.isArray(value) ? value[0] : value) })}
                placeholder="Select Commission Type"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Commission Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.commission_value}
                onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Typical Duration</label>
              <input
                type="text"
                value={formData.typical_duration}
                onChange={(e) => setFormData({ ...formData, typical_duration: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto h-9"
                rows={1}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Preparation Instruction</label>
              <textarea
                value={formData.preparation_instruction}
                onChange={(e) => setFormData({ ...formData, preparation_instruction: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto h-9"
                rows={1}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold">Test Parameters</h3>
              <button
                type="button"
                onClick={addParameter}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Parameter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '600px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Parameter Name</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Unit</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left">Normal Range</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.parameters.map((param, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="Parameter Name"
                          value={param.name}
                          onChange={(e) => updateParameter(index, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="Unit"
                          value={param.unit}
                          onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="Normal Range"
                          value={param.normal_range}
                          onChange={(e) => updateParameter(index, 'normal_range', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              {test ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TestForm;
