"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: 'customer' | 'admin' | 'super_admin';
  avatar?: string | null;
  country?: string | null;
  whatsapp?: string | null;
  preferred_lang?: string;
  preferred_currency?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  accountStatus?: string;
  firebaseUid?: string | null;
  authProvider?: string;
  registrationMethod?: string;
  createdAt?: string;
  lastLogin?: string | null;
  notificationSettings?: {
    email?: boolean;
    sms?: boolean;
    security?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionToken: string | null;
  login: (token: string, user: User, sessionToken?: string) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUserData: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<User | null>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    const currentSessionToken = localStorage.getItem('sessionToken');

    if (currentToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'x-session-token': currentSessionToken || '',
          },
        });
      } catch {
        // ignore logout API failure
      }
    }

    setToken(null);
    setSessionToken(null);
    setUser(null);
    clearStoredAuth();
  }, []);

  const logoutAll = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      try {
        await fetch(`${API_URL}/auth/logout-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // ignore
      }
    }

    setToken(null);
    setSessionToken(null);
    setUser(null);
    clearStoredAuth();
  }, []);

  const updateUserData = useCallback((updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!response.ok) {
        clearStoredAuth();
        setToken(null);
        setSessionToken(null);
        setUser(null);
        return null;
      }

      const data = await response.json();
      const freshUser: User = data.user;
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch {
      return user;
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedSessionToken = localStorage.getItem('sessionToken');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'x-session-token': storedSessionToken || '',
          },
        });

        if (!response.ok) {
          clearStoredAuth();
          if (!cancelled) {
            setToken(null);
            setSessionToken(null);
            setUser(null);
          }
          return;
        }

        const data = await response.json();
        const freshUser: User = data.user;

        localStorage.setItem('user', JSON.stringify(freshUser));

        if (!cancelled) {
          setToken(storedToken);
          setSessionToken(storedSessionToken);
          setUser(freshUser);
        }
      } catch {
        try {
          if (!cancelled) {
            setToken(storedToken);
            setSessionToken(storedSessionToken);
            setUser(JSON.parse(storedUser));
          }
        } catch {
          clearStoredAuth();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        setToken(null);
        setSessionToken(null);
        setUser(null);
      }
    };

    const onUnauthorized = () => {
      logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [logout]);

  const login = (newToken: string, newUser: User, newSessionToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    if (newSessionToken) {
      setSessionToken(newSessionToken);
      localStorage.setItem('sessionToken', newSessionToken);
    }
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const role = user?.role;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionToken,
        login,
        logout,
        logoutAll,
        updateUserData,
        refreshUser,
        isAuthenticated: !!token && !!user,
        isAdmin: role === 'admin' || role === 'super_admin',
        isSuperAdmin: role === 'super_admin',
        isLoading,
      }}
    >
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
