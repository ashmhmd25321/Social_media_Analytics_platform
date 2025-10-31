'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, authStorage } from '@/lib/auth';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = authStorage.getUser();
        const token = authStorage.getAccessToken();

        if (storedUser && token) {
          // Verify token is still valid by fetching user profile
          try {
            const response = await authApi.getProfile();
            if (response.success && response.data?.user) {
              setUser(response.data.user);
              authStorage.setUser(response.data.user);
            } else {
              authStorage.clear();
              setUser(null);
            }
          } catch {
            authStorage.clear();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        authStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;

        // Store tokens and user
        authStorage.setTokens(tokens);
        authStorage.setUser(userData);
        setUser(userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed');
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    try {
      const response = await authApi.register(data);

      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;

        // Store tokens and user
        authStorage.setTokens(tokens);
        authStorage.setUser(userData);
        setUser(userData);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        authStorage.setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

