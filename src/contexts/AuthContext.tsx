"use client";

// Authentication Context Provider
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        
        console.log('AuthContext: Checking session - Token exists:', !!savedToken, 'User exists:', !!savedUser);
        
        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.role) {
            console.log('AuthContext: Restoring session for user:', parsedUser);
            setUser(parsedUser);
          } else {
            console.log('AuthContext: Invalid user data, clearing session');
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  // Listen for authentication errors (session expired)
  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      if (event.detail?.message?.includes('Session expired')) {
        logout();
      }
    };

    window.addEventListener('auth-error', handleAuthError as EventListener);
    return () => window.removeEventListener('auth-error', handleAuthError as EventListener);
  }, [logout]);

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      setError(null);
      console.log('AuthContext: Starting login process...');
      const result = await apiService.auth.login(credentials);
      console.log('AuthContext: Login successful, result:', result);
      
      if (result && result.user_info) {
        console.log('AuthContext: Setting user state:', result.user_info);
        
        // Set user state - React will automatically trigger re-render for all components using this context
        setUser(result.user_info);
        console.log('AuthContext: User state updated, all subscribed components will re-render');
        
        return result;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!user && apiService.auth.isAuthenticated();
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    setUser,
    clearError,
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

