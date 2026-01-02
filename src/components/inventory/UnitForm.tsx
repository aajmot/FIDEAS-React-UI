import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { inventoryService } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

interface Unit {
  id: number;
  name: string;
  symbol: string;
  parent_id?: number;
  conversion_factor: number;
  is_active: boolean;
}

interface UnitFormProps {
  unit?: Unit;
  onSave: (unitData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onImport?: () => void;
}

const UnitForm: React.FC<UnitFormProps> = ({ 
  unit, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    symbol: unit?.symbol || '',
    parent_id: unit?.parent_id || '',
    conversion_factor: unit?.conversion_factor || 1.0,
    is_active: unit?.is_active ?? true
  });
  
  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    if (resetForm && !unit) {
      setFormData({
        name: '',
        symbol: '',
        parent_id: '',
        conversion_factor: 1.0,
        is_active: true
      });
    } else if (unit) {
      setFormData({
        name: unit.name,
        symbol: unit.symbol,
        parent_id: unit.parent_id || '',
        conversion_factor: unit.conversion_factor || 1.0,
        is_active: unit.is_active
      });
    }
  }, [unit, resetForm]);

  const loadUnits = async () => {
    try {
      const response = await inventoryService.getUnits({ page: 1, per_page: 100 });
      setUnits(response.data);
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      parent_id: formData.parent_id === '' ? null : formData.parent_id,
      conversion_factor: formData.conversion_factor || 1.0
    };
    onSave(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'conversion_factor' ? parseFloat(value) || 0 :
              name === 'parent_id' ? (value === '' ? '' : parseInt(value)) :
              value
    }));
  };

  const handleParentUnitChange = (value: string | number | (string | number)[]) => {
    const parentId = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({
      ...prev,
      parent_id: parentId
    }));
  };

  const downloadTemplate = async () => {
    try {
      const blob = await inventoryService.downloadUnitsTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'units_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImport) return;
    
    try {
      await inventoryService.importUnits(file);
      if (onImport) onImport();
    } catch (error) {
      console.error('Error importing file:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 flex justify-between items-center" style={{ padding: 'var(--erp-section-padding)' }}>
        <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>
          {unit ? 'Edit Unit' : 'Add New Unit'}
        </h2>
        <div className="flex items-center" style={{ gap: 'var(--erp-spacing-sm)' }}>
          <button
            type="button"
            onClick={downloadTemplate}
            className="erp-form-btn erp-btn-template"
          >
            <Download className="erp-form-btn-icon" />
            Template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="erp-form-btn bg-green-600 text-white hover:bg-green-700"
          >
            <Upload className="erp-form-btn-icon" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700"
          >
            {isCollapsed ? <ChevronDown className="erp-form-btn-icon" style={{ marginRight: 0 }} /> : <ChevronUp className="erp-form-btn-icon" style={{ marginRight: 0 }} />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 'var(--erp-spacing-lg)' }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Unit Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parent Unit
              </label>
              <SearchableDropdown
                options={units.filter(u => u.id !== unit?.id).map(u => ({
                  value: u.id,
                  label: u.name
                }))}
                value={formData.parent_id}
                onChange={handleParentUnitChange}
                placeholder="Select parent unit..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Conversion Factor
              </label>
              <input
                type="number"
                step="0.0001"
                name="conversion_factor"
                value={formData.conversion_factor}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center pt-5">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label className="ml-1 block text-xs text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)', marginTop: 'var(--erp-spacing-lg)' }}>
            <button
              type="button"
              onClick={onCancel}
              className="erp-form-btn text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="erp-form-btn text-white bg-primary hover:bg-secondary"
            >
              {unit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UnitForm;