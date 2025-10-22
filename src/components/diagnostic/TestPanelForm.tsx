import React, { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../common/DatePicker';
import { diagnosticService, careService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TestPanelFormProps {
  onSave: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  editingPanel?: any;
  onCancelEdit: () => void;
}

interface TestPanelItem {
  test_id: number;
  test_name: string;
  body_part?: string;
  typical_duration?: string;
  rate?: number;
  gst?: number;
  preparation_instruction?: string;
}

const TestPanelForm: React.FC<TestPanelFormProps> = ({ 
  onSave, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm,
  editingPanel,
  onCancelEdit
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    cost: '',
    gst: '',
    cess: '',
    expired_on: '',
    is_active: true
  });
  const [items, setItems] = useState<TestPanelItem[]>([{
    test_id: 0,
    test_name: '',
    body_part: '',
    typical_duration: '',
    rate: 0,
    gst: 0,
    preparation_instruction: ''
  }]);
  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
    loadTests();
  }, []);

  useEffect(() => {
    const loadEditingPanel = async () => {
      if (!editingPanel) return;
      
      setFormData({
        name: editingPanel.name || '',
        description: editingPanel.description || '',
        category_id: editingPanel.category_id?.toString() || '',
        cost: editingPanel.cost?.toString() || '',
        gst: editingPanel.gst?.toString() || '',
        cess: editingPanel.cess?.toString() || '',
        expired_on: editingPanel.expired_on ? editingPanel.expired_on.split('T')[0] : '',
        is_active: editingPanel.is_active ?? true
      });
      
      if (editingPanel.items && editingPanel.items.length > 0) {
        const itemsWithDetails = await Promise.all(
          editingPanel.items.map(async (item: any) => {
            try {
              const response = await careService.getTest(item.test_id);
              const test = response.data;
              return {
                test_id: item.test_id,
                test_name: item.test_name,
                body_part: test?.body_part || '',
                typical_duration: test?.typical_duration || '',
                rate: test?.rate || 0,
                gst: test?.gst || 0,
                preparation_instruction: test?.preparation_instruction || ''
              };
            } catch (error) {
              return {
                test_id: item.test_id,
                test_name: item.test_name,
                body_part: '',
                typical_duration: '',
                rate: 0,
                gst: 0,
                preparation_instruction: ''
              };
            }
          })
        );
        setItems(itemsWithDetails);
      }
    };
    loadEditingPanel();
  }, [editingPanel]);

  useEffect(() => {
    if (resetForm) {
      setFormData({
        name: '',
        description: '',
        category_id: '',
        cost: '',
        gst: '',
        cess: '',
        expired_on: '',
        is_active: true
      });
      setItems([{
        test_id: 0,
        test_name: '',
        body_part: '',
        typical_duration: '',
        rate: 0,
        gst: 0,
        preparation_instruction: ''
      }]);
    }
  }, [resetForm]);

  const loadCategories = async () => {
    try {
      const response = await careService.getTestCategories({ per_page: 100 });
      setCategories(response.data);
    } catch (error) {
      showToast('error', 'Failed to load categories');
    }
  };

  const loadTests = async () => {
    try {
      const response = await careService.getTests({ per_page: 1000 });
      setTests(response.data);
    } catch (error) {
      showToast('error', 'Failed to load tests');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleTestChange = async (index: number, value: string | number | (string | number)[]) => {
    const testId = Array.isArray(value) ? value[0] : value;
    let test = tests.find(t => t.id === Number(testId));
    
    if (!test && testId) {
      try {
        const response = await careService.getTest(Number(testId));
        test = response.data;
      } catch (error) {
        console.error('Error fetching test:', error);
      }
    }
    
    const newItems = [...items];
    newItems[index] = {
      test_id: Number(testId),
      test_name: test?.name || '',
      body_part: test?.body_part || '',
      typical_duration: test?.typical_duration || '',
      rate: test?.rate || 0,
      gst: test?.gst || 0,
      preparation_instruction: test?.preparation_instruction || ''
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      test_id: 0,
      test_name: '',
      body_part: '',
      typical_duration: '',
      rate: 0,
      gst: 0,
      preparation_instruction: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      showToast('error', 'Please enter panel name');
      return;
    }

    const validItems = items.filter(item => item.test_id > 0).map(item => ({
      test_id: item.test_id,
      test_name: item.test_name
    }));
    if (validItems.length === 0) {
      showToast('error', 'Please add at least one test');
      return;
    }

    try {
      const panelData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        gst: formData.gst ? parseFloat(formData.gst) : null,
        cess: formData.cess ? parseFloat(formData.cess) : null,
        expired_on: formData.expired_on || null,
        is_active: formData.is_active,
        items: validItems
      };

      if (editingPanel) {
        await diagnosticService.updateTestPanel(editingPanel.id, panelData);
      } else {
        await diagnosticService.createTestPanel(panelData);
      }
      onSave();
    } catch (error) {
      showToast('error', `Failed to ${editingPanel ? 'update' : 'create'} test panel`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingPanel ? 'Edit Test Panel' : 'Create Test Panel'}
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Panel Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <SearchableDropdown
                options={categories.map(cat => ({
                  value: cat.id.toString(),
                  label: cat.name
                }))}
                value={formData.category_id}
                onChange={(value) => setFormData(prev => ({ ...prev, category_id: value.toString() }))}
                placeholder="Select category"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
              <input
                type="number"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CESS %</label>
              <input
                type="number"
                name="cess"
                value={formData.cess}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
              <DatePicker
                value={formData.expired_on}
                onChange={(value) => setFormData(prev => ({ ...prev, expired_on: value }))}
                placeholder="Select expiry date"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 mt-6">
            <h3 className="text-md font-semibold">Panel Tests</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Test
            </button>
          </div>

          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="border border-gray-200" style={{ minWidth: '1000px', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ width: '20%' }}>Test</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ width: '12%' }}>Body Part</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-left" style={{ width: '20%' }}>Preparation Instruction</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ width: '12%' }}>Duration</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ width: '10%' }}>Rate</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ width: '8%' }}>GST%</th>
                    <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center" style={{ width: '8%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-2">
                        <SearchableDropdown
                          options={tests.map(test => ({
                            value: test.id.toString(),
                            label: test.name
                          }))}
                          value={item.test_id.toString()}
                          onChange={(value) => handleTestChange(index, value)}
                          placeholder="Select test..."
                          multiple={false}
                          searchable={true}
                          className="w-full"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.body_part || ''}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <textarea
                          value={item.preparation_instruction || ''}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 h-9 resize-none overflow-y-auto"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.typical_duration || ''}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.rate ? item.rate.toFixed(2) : ''}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.gst ? item.gst.toFixed(2) : ''}
                          readOnly
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={items.length === 1}
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
            {editingPanel && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded"
            >
              {editingPanel ? 'Update Panel' : 'Save Panel'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TestPanelForm;
