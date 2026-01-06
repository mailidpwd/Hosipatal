import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { UserRole } from '@/types';
import { authService, type AuthResponse } from '@/services/api/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Fetch current user on mount
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const userData = await authService.getCurrentUser();
        // Store providerId in sessionStorage if user is STAFF
        if (userData?.role === 'STAFF' && userData?.id) {
          try {
            sessionStorage.setItem('providerId', userData.id);
          } catch {
            // Ignore storage errors
          }
        }
        return userData;
      } catch (error) {
        // Not authenticated
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent clearing user
  });

  // Update user state when query data changes
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      // Store IDs in sessionStorage for persistence
      if (currentUser.id) {
        try {
          sessionStorage.setItem('userId', currentUser.id);
          if (currentUser.role === 'STAFF') {
            sessionStorage.setItem('providerId', currentUser.id);
          }
          if (currentUser.role === 'ADMIN') {
            sessionStorage.setItem('adminId', currentUser.id);
          }
        } catch {
          // Ignore storage errors
        }
      }
    } else {
      setUser(null);
    }
  }, [currentUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await authService.login(credentials);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
      // Store IDs in sessionStorage for persistence
      if (data.user?.id) {
        try {
          sessionStorage.setItem('userId', data.user.id);
          if (data.user.role === 'STAFF') {
            sessionStorage.setItem('providerId', data.user.id);
          }
          if (data.user.role === 'ADMIN') {
            sessionStorage.setItem('adminId', data.user.id);
          }
        } catch {
          // Ignore storage errors
        }
      }
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      throw new Error(error.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; role: UserRole }) => {
      const response = await authService.register(data);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      throw new Error(error.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      // Redirect will be handled by App.tsx
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local state
      setUser(null);
      queryClient.clear();
      console.error('Logout error:', error);
    },
  });

  // Refresh session
  const refreshSession = async () => {
    try {
      const response = await authService.refreshSession();
      setUser(response.user);
      queryClient.setQueryData(['auth', 'me'], response.user);
    } catch (error) {
      // Session expired, logout
      setUser(null);
      queryClient.clear();
    }
  };

  const login = async (email: string, password: string) => {
    const response = await loginMutation.mutateAsync({ email, password });
    return response; // Return response for AuthScreen to verify role
  };

  const register = async (data: { email: string; password: string; name: string; role: UserRole }) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

