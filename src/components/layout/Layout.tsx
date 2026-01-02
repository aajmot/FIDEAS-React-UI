import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { useTenant } from '../../context/TenantContext';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { tenantName } = useTenant();

  // Mock menu data - in real app, this would come from API based on user roles
  const mockMenus = [
    {
      name: 'Admin',
      icon: '👥',
      children: [
        { name: 'User Management', code: 'USER_MGMT', icon: '👤', module_code: 'ADMIN' },
        { name: 'Role Management', code: 'ROLE_MGMT', icon: '🔐', module_code: 'ADMIN' },
        { name: 'User Role Mapping', code: 'USER_ROLE_MAPPING', icon: '🔗', module_code: 'ADMIN' },
      ]
    },
    {
      name: 'Inventory',
      icon: '📦',
      children: [
        {
          name: 'Master',
          icon: '📋',
          children: [
            { name: 'Category Management', code: 'CATEGORY_MGMT', icon: '🏷️', module_code: 'INVENTORY' },
            { name: 'Product Management', code: 'PRODUCT_MGMT', icon: '📦', module_code: 'INVENTORY' },
          ]
        },
        {
          name: 'Transaction',
          icon: '💼',
          children: [
            { name: 'Sales Order', code: 'SALES_ORDER', icon: '💰', module_code: 'INVENTORY' },
            { name: 'Purchase Order', code: 'PURCHASE_ORDER', icon: '🛒', module_code: 'INVENTORY' },
          ]
        }
      ]
    },
    {
      name: 'Account',
      icon: '💰',
      children: [
        { name: 'Chart of Accounts', code: 'CHART_ACCOUNTS', icon: '📊', module_code: 'ACCOUNT' },
        { name: 'Journal', code: 'JOURNAL', icon: '📝', module_code: 'ACCOUNT' },
        { name: 'Ledger', code: 'LEDGER', icon: '📖', module_code: 'ACCOUNT' },
      ]
    }
  ];





  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        tenantName={tenantName} 
        menus={mockMenus} 
      />
      
      <main className="flex-1 overflow-auto" style={{ padding: 'var(--erp-spacing-md) var(--erp-spacing-lg)' }}>
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="text-center text-gray-500" style={{ padding: 'var(--erp-spacing-md)', fontSize: 'var(--erp-font-size-xs)' }}>
          fideas@2025
        </div>
      </footer>
    </div>
  );
};

export default Layout;