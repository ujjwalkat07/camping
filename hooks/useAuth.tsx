"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User } from '@/services/api';
import { tokenStorage, adminStorage, axiosInstance } from '@/lib/api-client';
import { isAdminUser } from '@/lib/utils';
import { BACKEND_URL } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  adminLogin: (email: string, password?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncAuth = async () => {
    let currentUser = api.getCurrentUser();
    let adminUser = api.getAdminUser();
    let activeUser = adminUser || currentUser;

    const token = tokenStorage.getToken();
    const refreshToken = tokenStorage.getRefreshToken();

    // If access token is missing but refresh token exists, attempt to regenerate tokens directly from backend
    if (!token && refreshToken) {
      try {
        const res = await axiosInstance.post(`${BACKEND_URL}/api/auth/refreshtoken`, { refreshToken });
        const newAccessToken = res.data?.accessToken || res.data?.token;
        const newRefreshToken = res.data?.refreshToken || refreshToken;

        if (newAccessToken) {
          tokenStorage.setToken(newAccessToken);
          if (newRefreshToken) tokenStorage.setRefreshToken(newRefreshToken);
          currentUser = api.getCurrentUser();
          adminUser = api.getAdminUser();
          activeUser = adminUser || currentUser;
        } else {
          await tokenStorage.clearAuth();
          activeUser = null;
        }
      } catch (err) {
        console.warn('Failed to auto-restore session from refresh token:', err);
        await tokenStorage.clearAuth();
        activeUser = null;
      }
    }

    setUser(activeUser);
    setIsAdmin(isAdminUser(activeUser));
    setIsLoading(false);
  };

  useEffect(() => {
    syncAuth();

    const handleStorageChange = () => { syncAuth(); };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password?: string) => {
    const loggedInUser = await api.login(email, password);
    await syncAuth();
    window.dispatchEvent(new Event('storage'));
    return loggedInUser;
  };

  const adminLogin = async (email: string, password?: string) => {
    const loggedInAdmin = await api.adminLogin(email, password);
    await syncAuth();
    window.dispatchEvent(new Event('storage'));
    return loggedInAdmin;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setIsAdmin(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        login,
        adminLogin,
        logout,
        refreshAuth: syncAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
