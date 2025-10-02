'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    settings: any;
  };
  role: string;
  permissions: string[];
  preferences: any;
  profile: any;
  installedModules: any[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenantSubdomain?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth data from localStorage on mount
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');

        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);
          
          setTokens(parsedTokens);
          setUser(parsedUser);
          
          // Verify token is still valid
          verifyToken(parsedTokens.accessToken);
        }
      } catch (error) {
        console.error('Failed to load auth data:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const clearAuthData = useCallback(() => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  }, []);

  const saveAuthData = useCallback((userData: User, tokensData: AuthTokens) => {
    setUser(userData);
    setTokens(tokensData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_tokens', JSON.stringify(tokensData));
  }, []);

  const verifyToken = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': user?.tenant?.subdomain || '',
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      
      if (data.success && data.data.user) {
        setUser(data.data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuthData();
    }
  }, [user?.tenant?.subdomain, clearAuthData]);

  const login = useCallback(async (email: string, password: string, tenantSubdomain?: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          tenantSubdomain,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Login failed');
      }

      const { user: userData, tokens: tokensData } = data.data;
      
      saveAuthData(userData, tokensData);
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router, saveAuthData]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      if (tokens?.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
            'X-Tenant-Subdomain': user?.tenant?.subdomain || '',
          },
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuthData();
      setIsLoading(false);
      router.push('/auth/login');
    }
  }, [tokens?.accessToken, user?.tenant?.subdomain, clearAuthData, router]);

  const refreshTokens = useCallback(async () => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Token refresh failed');
      }

      const newTokens = data.data.tokens;
      setTokens(newTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));

    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      router.push('/auth/login');
    }
  }, [tokens?.refreshToken, clearAuthData, router]);

  const hasPermission = useCallback((permission: string | string[]) => {
    if (!user || !user.permissions) return false;

    const permissions = Array.isArray(permission) ? permission : [permission];
    const userPermissions = user.permissions;

    // Check if user has super admin permission
    if (userPermissions.includes('*')) return true;

    // Check specific permissions
    return permissions.some(perm => {
      // Check exact match
      if (userPermissions.includes(perm)) return true;

      // Check wildcard permissions
      const wildcardPerm = perm.split(':')[0] + ':*';
      if (userPermissions.includes(wildcardPerm)) return true;

      return false;
    });
  }, [user]);

  const hasRole = useCallback((role: string | string[]) => {
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  // Auto-refresh tokens when they're about to expire
  useEffect(() => {
    if (!tokens) return;

    const refreshInterval = setInterval(() => {
      const timeUntilExpiry = (tokens.expiresIn * 1000) - Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (timeUntilExpiry <= fiveMinutes) {
        refreshTokens();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [tokens, refreshTokens]);

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    login,
    logout,
    refreshTokens,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}