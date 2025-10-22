import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import FormTextarea from '../common/FormTextarea';
import FormCheckbox from '../common/FormCheckbox';

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

interface TenantSetting {
  id: number;
  setting: string;
  description: string;
  value_type: string;
  value: string;
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
  const [settings, setSettings] = useState<TenantSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTenant();
      setTenantData(response.data);
      
      // Load tenant settings
      try {
        const settingsResponse = await adminService.getTenantSettings();
        setSettings(settingsResponse.data || []);
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

  const handleSettingChange = (settingName: string, value: string) => {
    setSettings(prev => prev.map(s => 
      s.setting === settingName ? { ...s, value } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateTenant(tenantData);
      
      // Update settings if endpoint exists
      if (settings.length > 0) {
        try {
          for (const setting of settings) {
            await adminService.updateTenantSetting(setting.setting, {
              value: setting.value
            });
          }
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
      <div className="p-3 sm:p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tenant Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <FormTextarea
                name="description"
                value={tenantData.description}
                onChange={(value) => setTenantData(prev => ({ ...prev, description: value }))}
                rows={3}
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
              <FormTextarea
                name="tagline"
                value={tenantData.tagline}
                onChange={(value) => setTenantData(prev => ({ ...prev, tagline: value }))}
                rows={2}
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
          {settings.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tenant Settings</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setting</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settings.map((setting) => (
                      <tr key={setting.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {setting.setting.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {setting.description}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {setting.value_type === 'BOOLEAN' ? (
                            <input
                              type="checkbox"
                              checked={setting.value === 'TRUE'}
                              onChange={(e) => handleSettingChange(setting.setting, e.target.checked ? 'TRUE' : 'FALSE')}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                          ) : setting.value_type === 'INTEGER' ? (
                            <input
                              type="number"
                              value={setting.value}
                              onChange={(e) => handleSettingChange(setting.setting, e.target.value)}
                              className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <input
                              type="text"
                              value={setting.value}
                              onChange={(e) => handleSettingChange(setting.setting, e.target.value)}
                              className="w-48 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
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