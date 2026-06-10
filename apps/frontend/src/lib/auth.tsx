import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  roles: string[];
  permissions: string[];
  countyId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (updatedUser: User) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        try {
          const { data } = await authApi.me();
          const user = data.data;
          setState({ user, accessToken: token, refreshToken: localStorage.getItem('refreshToken'), isAuthenticated: true, isLoading: false });
          return;
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setState(s => ({ ...s, isLoading: false }));
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  };

  const updateUserInfo = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setState(s => ({ ...s, user: updatedUser }));
  };

  const hasPermission = (permission: string) => state.user?.permissions?.includes(permission) ?? false;
  const hasRole = (role: string) => state.user?.roles?.includes(role) ?? false;
  const hasAnyRole = (roles: string[]) => roles.some(r => state.user?.roles?.includes(r)) ?? false;

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUserInfo, hasPermission, hasRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
