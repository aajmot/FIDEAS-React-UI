import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { inventoryService } from '../../services/api';
import SearchableDropdown from '../common/SearchableDropdown';

interface Product {
  id: number;
  tenant_id?: number;
  name: string;
  code?: string;
  description?: string;
  composition?: string;
  tags?: string;
  hsn_id?: number | null;
  hsn_code?: string;
  schedule?: string;
  manufacturer?: string;
  is_discontinued?: boolean;
  category_id?: number;
  subcategory_id?: number | null;
  unit_id?: number;

  // Pricing
  mrp_price?: number;
  selling_price?: number;
  cost_price?: number;
  is_tax_inclusive?: boolean;
  currency_id?: number | null;
  exchange_rate?: number | null;

  // Tax rates
  gst_rate?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cess_rate?: number;
  is_reverse_charge?: boolean;

  // Inventory
  is_composite?: boolean;
  is_inventory_item?: boolean;
  reorder_level?: number;
  danger_level?: number;
  min_stock?: number;
  max_stock?: number;

  // Commission / discounts / sales
  commission_type?: string;
  commission_value?: number;
  max_discount_percent?: number;

  // Misc
  barcode?: string;
  is_serialized?: boolean;
  warranty_months?: number;
  is_active?: boolean;

  // Audit
  created_at?: string;
  created_by?: number | string | null;
  updated_at?: string;
  updated_by?: number | string | null;
  is_deleted?: boolean;
}

interface ProductFormProps {
  product?: Product;
  onSave: (productData: any) => void;
  onCancel: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  resetForm?: boolean;
  onImport?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSave, 
  onCancel, 
  isCollapsed, 
  onToggleCollapse, 
  resetForm,
  onImport
}) => {
  const normalizeCommissionType = (value?: string | null) => {
    if (!value) return '';
    const normalized = value.toLowerCase();
    if (normalized === 'percentage') return 'Percentage';
    if (normalized === 'fixed') return 'Fixed';
    return value;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    code: product?.code || '',
    composition: product?.composition || '',
    tags: product?.tags || '',
    hsn_code: product?.hsn_code || '',
    schedule: product?.schedule || 'OTC',
    manufacturer: product?.manufacturer || '',
    is_discontinued: product?.is_discontinued || false,
    category_id: product?.category_id || '',
    subcategory_id: product?.subcategory_id || '',
    unit_id: product?.unit_id || '',
  price: product?.selling_price ?? 0,
    mrp_price: product?.mrp_price ?? 0,
    selling_price: product?.selling_price ?? 0,
    cost_price: product?.cost_price ?? 0,
    is_tax_inclusive: product?.is_tax_inclusive ?? false,
  gst_rate: product?.gst_rate ?? 0,
  gst_percentage: product?.gst_rate ?? 0,
    cgst_rate: product?.cgst_rate ?? 0,
    sgst_rate: product?.sgst_rate ?? 0,
    igst_rate: product?.igst_rate ?? 0,
    cess_rate: product?.cess_rate ?? 0,

  commission_type: normalizeCommissionType(product?.commission_type),
    commission_value: product?.commission_value || 0,
    max_discount_percent: product?.max_discount_percent ?? 0,

    barcode: product?.barcode || '',
    is_serialized: product?.is_serialized ?? false,
    warranty_months: product?.warranty_months ?? 0,

    currency_id: product?.currency_id || '',
    exchange_rate: product?.exchange_rate ?? 1,

    reorder_level: product?.reorder_level || 0,
    danger_level: product?.danger_level || 0,
    min_stock: product?.min_stock || 0,
    max_stock: product?.max_stock || 0,
    description: product?.description || '',
    is_inventory_item: product?.is_inventory_item ?? true,
    is_active: product?.is_active ?? true
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  useEffect(() => {
    loadCategories();
    loadUnits();
  }, []);

  useEffect(() => {
    if (resetForm && !product) {
      setFormData({
        name: '',
        code: '',
        composition: '',
        tags: '',
        hsn_code: '',
        schedule: 'OTC',
        manufacturer: '',
        is_discontinued: false,
        category_id: '',
        subcategory_id: '',
        unit_id: '',

        price: 0,
        mrp_price: 0,
        selling_price: 0,
        cost_price: 0,
        is_tax_inclusive: false,

        gst_rate: 0,
        gst_percentage: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        cess_rate: 0,

  commission_type: '',
        commission_value: 0,
        max_discount_percent: 0,

        barcode: '',
        is_serialized: false,
        warranty_months: 0,

        currency_id: '',
        exchange_rate: 1,

        reorder_level: 0,
        danger_level: 0,
        min_stock: 0,
        max_stock: 0,
        description: '',
        is_inventory_item: true,
        is_active: true
      });
    } else if (product) {
      setFormData({
  name: product.name,
  code: product.code || '',
        composition: product.composition || '',
        tags: product.tags || '',
        hsn_code: product.hsn_code || '',
        schedule: product.schedule || 'OTC',
        manufacturer: product.manufacturer || '',
        is_discontinued: product.is_discontinued || false,
  category_id: product.category_id ?? '',
  subcategory_id: product.subcategory_id ?? '',
  unit_id: product.unit_id ?? '',

  price: product.selling_price ?? 0,
  mrp_price: product.mrp_price ?? 0,
        selling_price: product.selling_price ?? 0,
        cost_price: product.cost_price ?? 0,
        is_tax_inclusive: product.is_tax_inclusive ?? false,

  gst_rate: product.gst_rate ?? 0,
  gst_percentage: product.gst_rate ?? 0,
        cgst_rate: product.cgst_rate ?? 0,
        sgst_rate: product.sgst_rate ?? 0,
        igst_rate: product.igst_rate ?? 0,
        cess_rate: product.cess_rate ?? 0,

  commission_type: normalizeCommissionType(product.commission_type),
        commission_value: product.commission_value || 0,
        max_discount_percent: product.max_discount_percent ?? 0,

        barcode: product.barcode || '',
        is_serialized: product.is_serialized ?? false,
        warranty_months: product.warranty_months ?? 0,

        currency_id: product.currency_id || '',
        exchange_rate: product.exchange_rate ?? 1,

        reorder_level: product.reorder_level || 0,
        danger_level: product.danger_level || 0,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        description: product.description || '',
        is_inventory_item: product.is_inventory_item ?? true,
        is_active: product.is_active ?? true
      });
    }
  }, [product, resetForm]);

  const loadCategories = async () => {
    try {
      const response = await inventoryService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await inventoryService.getUnits();
      setUnits(response.data);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCategoryChange = (value: string | number | (string | number)[]) => {
    const categoryId = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
  };

  const handleUnitChange = (value: string | number | (string | number)[]) => {
    const unitId = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({
      ...prev,
      unit_id: unitId
    }));
  };

  const downloadTemplate = async () => {
    try {
      const blob = await inventoryService.downloadProductsTemplate();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_template.csv';
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
      await inventoryService.importProducts(file);
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
          {product ? 'Edit Product' : 'Add New Product'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--erp-spacing-lg)' }}>
            {/* Row 1 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name *
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
                Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">MRP</label>
              <input
                type="number"
                name="mrp_price"
                value={(formData as any).mrp_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price</label>
              <input
                type="number"
                name="selling_price"
                value={(formData as any).selling_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price</label>
              <input
                type="number"
                name="cost_price"
                value={(formData as any).cost_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax Inclusive</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  name="is_tax_inclusive"
                  checked={(formData as any).is_tax_inclusive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Yes</label>
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category *
              </label>
              <SearchableDropdown
                options={categories.map(category => ({
                  value: category.id,
                  label: category.name
                }))}
                value={formData.category_id}
                onChange={handleCategoryChange}
                placeholder="Select category..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                GST %
              </label>
              <input
                type="number"
                name="gst_percentage"
                value={formData.gst_percentage}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Commission Type
              </label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Commission Value
              </label>
              <input
                type="number"
                name="commission_value"
                value={formData.commission_value}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <SearchableDropdown
                options={units.map(unit => ({
                  value: unit.id,
                  label: unit.name
                }))}
                value={formData.unit_id}
                onChange={handleUnitChange}
                placeholder="Select unit..."
                multiple={false}
                searchable={true}
                className="w-full"
              />
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                name="barcode"
                value={(formData as any).barcode}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Serialized</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  name="is_serialized"
                  checked={(formData as any).is_serialized}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Yes</label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Warranty (months)</label>
              <input
                type="number"
                name="warranty_months"
                value={(formData as any).warranty_months}
                onChange={handleChange}
                step="1"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Discount %</label>
              <input
                type="number"
                name="max_discount_percent"
                value={(formData as any).max_discount_percent}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Danger Level</label>
              <input
                type="number"
                name="danger_level"
                value={formData.danger_level}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Stock</label>
              <input
                type="number"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Stock</label>
              <input
                type="number"
                name="max_stock"
                value={formData.max_stock}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Schedule
              </label>
              <SearchableDropdown
                options={[
                  { value: 'OTC', label: 'OTC' },
                  { value: 'Schedule H', label: 'Schedule H' },
                  { value: 'Schedule X', label: 'Schedule X' }
                ]}
                value={formData.schedule}
                onChange={(value) => setFormData({ ...formData, schedule: String(Array.isArray(value) ? value[0] : value) })}
                placeholder="Select Schedule"
                multiple={false}
                searchable={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Discontinued</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  name="is_discontinued"
                  checked={formData.is_discontinued}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Yes</label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Inventory Item</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  name="is_inventory_item"
                  checked={formData.is_inventory_item}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Yes</label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
            </div>

            {/* Row 4 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="#tag1 #tag2"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Composition
              </label>
              <input
                type="text"
                name="composition"
                value={formData.composition}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>



            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto"
                style={{ minHeight: '30px', maxHeight: '30px' }}
              />
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
              {product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductForm;