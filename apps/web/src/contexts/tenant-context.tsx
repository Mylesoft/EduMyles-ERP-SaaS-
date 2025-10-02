'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

interface TenantSettings {
  allowRegistration: boolean;
  defaultRole: string;
  features: string[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  settings: TenantSettings;
  contactInfo: any;
  billingInfo?: any;
  plan: any;
  createdAt: string;
  updatedAt: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  updateTenantSettings: (settings: Partial<TenantSettings>) => Promise<void>;
  applyTheme: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Load tenant data from user context
  useEffect(() => {
    if (isAuthenticated && user?.tenant) {
      const tenantData: Tenant = {
        id: user.tenant.id,
        name: user.tenant.name,
        subdomain: user.tenant.subdomain,
        customDomain: undefined,
        logo: user.tenant.logo,
        primaryColor: user.tenant.primaryColor,
        secondaryColor: user.tenant.secondaryColor,
        status: 'ACTIVE',
        settings: {
          allowRegistration: user.tenant.settings?.allowRegistration ?? true,
          defaultRole: user.tenant.settings?.defaultRole ?? 'STUDENT',
          features: user.tenant.settings?.features ?? [],
          theme: {
            primaryColor: user.tenant.primaryColor || '#3b82f6',
            secondaryColor: user.tenant.secondaryColor || '#1e40af',
            logo: user.tenant.logo,
          },
          timezone: user.tenant.settings?.timezone ?? 'UTC',
          language: user.tenant.settings?.language ?? 'en',
          dateFormat: user.tenant.settings?.dateFormat ?? 'MM/DD/YYYY',
          currency: user.tenant.settings?.currency ?? 'USD',
        },
        contactInfo: user.tenant.settings?.contactInfo ?? {},
        billingInfo: user.tenant.settings?.billingInfo,
        plan: user.tenant.settings?.plan ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTenant(tenantData);
      setIsLoading(false);

      // Apply theme
      applyTheme(tenantData);
    } else {
      setTenant(null);
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  const applyTheme = (tenantData?: Tenant) => {
    const currentTenant = tenantData || tenant;
    if (!currentTenant) return;

    const root = document.documentElement;
    const settings = currentTenant.settings;

    // Apply CSS custom properties
    if (settings.theme.primaryColor) {
      root.style.setProperty('--color-primary', settings.theme.primaryColor);
    }

    if (settings.theme.secondaryColor) {
      root.style.setProperty('--color-secondary', settings.theme.secondaryColor);
    }

    // Update favicon if logo is available
    if (settings.theme.logo) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.theme.logo;
      }
    }

    // Update page title
    document.title = `${currentTenant.name} - EduMyles`;
  };

  const updateTenantSettings = async (newSettings: Partial<TenantSettings>) => {
    if (!tenant || !user?.tokens) return;

    try {
      setIsLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenant/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.tokens.accessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': tenant.subdomain,
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update tenant settings');
      }

      const updatedSettings = {
        ...tenant.settings,
        ...newSettings,
      };

      const updatedTenant = {
        ...tenant,
        settings: updatedSettings,
        updatedAt: new Date().toISOString(),
      };

      setTenant(updatedTenant);
      applyTheme(updatedTenant);

    } catch (error) {
      console.error('Failed to update tenant settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically detect tenant from subdomain
  useEffect(() => {
    const detectTenantFromDomain = () => {
      if (typeof window === 'undefined') return;

      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Check if we're on a subdomain (e.g., demo.edumyles.com)
      if (parts.length > 2) {
        const subdomain = parts[0];
        // Store subdomain for login purposes
        localStorage.setItem('detected_subdomain', subdomain);
      }
    };

    detectTenantFromDomain();
  }, []);

  const value: TenantContextType = {
    tenant,
    isLoading,
    updateTenantSettings,
    applyTheme: () => applyTheme(),
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}