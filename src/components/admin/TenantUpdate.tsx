import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import FormTextarea from '../common/FormTextarea';
import FormCheckbox from '../common/FormCheckbox';
import SearchableDropdown from '../common/SearchableDropdown';
import { currencyService } from '../../services/api';

interface TenantData {
  id: number;
  name: string;
  code: string;
  description: string;
  logo: string;
  tagline: string;
  address: string;
  business_type: string;
  is_active: boolean;
}

interface TenantSettings {
  id: number;
  tenant_id: number;
  enable_inventory: boolean;
  enable_gst: boolean;
  enable_bank_entry: boolean;
  base_currency: string;
  payment_modes: string[];
  default_payment_mode: string;
}

const TenantUpdate: React.FC = () => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [tenantData, setTenantData] = useState<TenantData>({
    id: 0,
    name: '',
    code: '',
    description: '',
    logo: '',
    tagline: '',
    address: '',
    business_type: 'TRADING',
    is_active: true
  });
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const { showToast } = useToast();

  const loadCurrencies = async () => {
    try {
      const { data } = await currencyService.getCurrencies();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      showToast('error', 'Failed to load currencies');
      setCurrencies([]);
    }
  };

  useEffect(() => {
    loadTenant();
    loadCurrencies();
  }, []);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTenant();
      setTenantData(response.data);
      
      // Load tenant settings
      try {
        const settingsResponse = await adminService.getTenantSettings();
        setSettings(settingsResponse.data || null);
      } catch (err) {
        // Settings endpoint might not exist yet, ignore error
        console.log('Settings not loaded:', err);
      }
    } catch (error) {
      showToast('error', 'Failed to load tenant information');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const files = (e.target as HTMLInputElement).files;
    
    if (type === 'file' && files && files[0]) {
      // For file upload, store the file name or handle file upload logic here
      setTenantData(prev => ({
        ...prev,
        [name]: files[0].name // Store filename for now
      }));
    } else {
      setTenantData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSettingChange = (settingName: keyof TenantSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [settingName]: value } : null);
  };

  const handlePaymentModeChange = (modes: string[]) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, payment_modes: modes } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateTenant(tenantData);
      
      // Update settings if they exist
      if (settings) {
        try {
          const settingsPayload = {
            enable_inventory: settings.enable_inventory,
            enable_gst: settings.enable_gst,
            enable_bank_entry: settings.enable_bank_entry,
            base_currency: settings.base_currency,
            payment_modes: settings.payment_modes,
            default_payment_mode: settings.default_payment_mode
          };
          await adminService.updateTenantSettings(settingsPayload);
        } catch (err) {
          console.log('Settings update failed:', err);
        }
      }
      
      showToast('success', 'Tenant updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update tenant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--erp-spacing-lg)' }} className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--erp-spacing-lg)' }}>
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200" style={{ padding: 'var(--erp-section-padding)' }}>
          <h2 className="font-medium text-gray-800" style={{ fontSize: 'var(--erp-datatable-title-font-size)', lineHeight: 'var(--erp-line-height)' }}>Tenant Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: 'var(--erp-card-padding)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--erp-spacing-lg)' }}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tenant Name
              </label>
              <input
                type="text"
                name="name"
                value={tenantData.name}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tenant Code
              </label>
              <input
                type="text"
                name="code"
                value={tenantData.code}
                disabled
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Tenant code cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={tenantData.description}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Logo
              </label>
              <input
                ref={logoInputRef}
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <textarea
                name="tagline"
                value={tenantData.tagline}
                onChange={handleChange}
                rows={1}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-y-auto h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={tenantData.address}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                name="business_type"
                value={tenantData.business_type}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="TRADING">Trading</option>
                <option value="SERVICE">Service</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <FormCheckbox
                checked={tenantData.is_active}
                onChange={(checked) => setTenantData(prev => ({ ...prev, is_active: checked }))}
                label="Active"
                disabled
              />
            </div>
          </div>

          {/* Tenant Settings Section */}
          {settings && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tenant Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--erp-spacing-lg)' }}>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Enable Inventory
                  </label>
                  <FormCheckbox
                    checked={settings.enable_inventory}
                    onChange={(checked) => handleSettingChange('enable_inventory', checked)}
                    label="Enable inventory module"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Enable GST
                  </label>
                  <FormCheckbox
                    checked={settings.enable_gst}
                    onChange={(checked) => handleSettingChange('enable_gst', checked)}
                    label="Enable GST calculations"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Enable Bank Entry
                  </label>
                  <FormCheckbox
                    checked={settings.enable_bank_entry}
                    onChange={(checked) => handleSettingChange('enable_bank_entry', checked)}
                    label="Enable bank entry module"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Base Currency
                  </label>
                  <SearchableDropdown
                    options={currencies
                      .filter(curr => curr && curr.currency_code && curr.symbol)
                      .map(curr => ({ 
                        label: `${curr.currency_code} (${curr.symbol || ''})`, 
                        value: curr.currency_code 
                      }))}
                    value={settings.base_currency || ''}
                    onChange={(value) => handleSettingChange('base_currency', String(value))}
                    placeholder="Select base currency"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Default Payment Mode
                  </label>
                  <SearchableDropdown
                    options={settings.payment_modes.map(mode => ({
                      label: mode,
                      value: mode
                    }))}
                    value={settings.default_payment_mode}
                    onChange={(value) => handleSettingChange('default_payment_mode', String(value))}
                    placeholder="Select default payment mode"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Modes
                  </label>
                  <SearchableDropdown
                    options={['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'].map(mode => ({
                      label: mode,
                      value: mode
                    }))}
                    value={settings.payment_modes}
                    onChange={(value) => handlePaymentModeChange(Array.isArray(value) ? value.map(String) : [String(value)])}
                    placeholder="Select payment modes"
                    multiple
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end" style={{ gap: 'var(--erp-spacing-sm)', marginTop: 'var(--erp-spacing-lg)' }}>
            <button
              type="submit"
              disabled={saving}
              className="erp-form-btn text-white bg-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Update Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantUpdate;