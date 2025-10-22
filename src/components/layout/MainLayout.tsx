import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';

const MainLayout: React.FC = () => {
  const { tenantName } = useTenant();
  const { user } = useAuth();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await adminService.getUserMenus();
        if (response.success && response.data) {
          setMenus(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch menus:', error);
        setMenus([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMenus();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading menus...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        tenantName={tenantName} 
        menus={menus} 
      />
      
      <main className="flex-1 overflow-auto px-2 sm:px-0">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-3 mt-auto">
        <div className="text-center text-sm text-gray-500">
          fideas@2025
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
