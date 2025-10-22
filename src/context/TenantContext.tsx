import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { adminService } from '../services/api';

interface TenantContextType {
  tenantName: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenantName, setTenantName] = useState('FIDEAS');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTenantInfo = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !isAuthenticated) return;
      
      try {
        const result = await adminService.getTenant();
        if (result && result.success && result.data?.name) {
          setTenantName(result.data.name);
        }
      } catch (error) {
        console.error('Failed to fetch tenant info:', error);
      }
    };
    
    fetchTenantInfo();
  }, [isAuthenticated]);

  const value = {
    tenantName,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};