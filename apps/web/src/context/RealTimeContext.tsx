import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { healthService } from '@/services/api/healthService';
import { walletService } from '@/services/api/walletService';
import { notificationService } from '@/services/api/notificationService';
import { appointmentService } from '@/services/api/appointmentService';
import { useRealtime } from '@/hooks/useRealtime';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AuthContext } from '@/context/AuthContext';
import type { Notification } from '@/types/notifications';

interface RealTimeContextType {
  heartRate: number | null;
  steps: number | null;
  walletBalance: number | null;
  notifications: Notification[];
  nextAppointment: Date | null;
  isConnected: boolean;
  isLoading: boolean;
  dismissNotification: (id: string) => void;
  addNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
  refresh: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider = ({ children }: { children?: ReactNode }) => {
  const queryClient = useQueryClient();
  // Safely get user - check if AuthContext is available
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [steps, setSteps] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Date | null>(null);

  // Demo balance management - persists across refreshes
  const DEMO_BALANCE_KEY = 'rdm_demo_balance';
  const DEFAULT_PATIENT_BALANCE = 7500; // Realistic demo balance for patients
  const DEFAULT_PROVIDER_BALANCE = 10000; // Realistic demo balance for providers

  // Initialize demo balance from localStorage or create default
  const getDemoBalance = (userRole?: string): number => {
    const stored = localStorage.getItem(DEMO_BALANCE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    // Set default based on user role (if available) or default to patient balance
    const defaultBalance = userRole === 'PROVIDER' || userRole === 'ADMIN' 
      ? DEFAULT_PROVIDER_BALANCE 
      : DEFAULT_PATIENT_BALANCE;
    localStorage.setItem(DEMO_BALANCE_KEY, defaultBalance.toString());
    return defaultBalance;
  };

  // Save demo balance to localStorage
  const saveDemoBalance = (balance: number) => {
    localStorage.setItem(DEMO_BALANCE_KEY, balance.toString());
  };

  // Fetch health data - properly handle null responses
  const { data: vitals, isLoading: vitalsLoading, refetch: refetchVitals } = useQuery({
    queryKey: ['health', 'vitals'],
    queryFn: async () => {
      try {
        const data = await healthService.getVitals();
        return data || {
          heartRate: 72,
          bloodPressure: '120/80',
          weight: '70 kg',
          temperature: 98.6,
          oxygenSaturation: 98,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Failed to fetch vitals:', error);
        return {
          heartRate: 72,
          bloodPressure: '120/80',
          weight: '70 kg',
          temperature: 98.6,
          oxygenSaturation: 98,
          timestamp: new Date().toISOString(),
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['health', 'metrics'],
    queryFn: async () => {
      try {
        const data = await healthService.getMetrics();
        return data || {
          steps: 0,
          stepsTarget: 10000,
          water: 0,
          waterTarget: 2500,
          streak: 0,
        };
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        return {
          steps: 0,
          stepsTarget: 10000,
          water: 0,
          waterTarget: 2500,
          streak: 0,
        };
      }
    },
    refetchInterval: 30000,
  });

  // Fetch wallet balance with demo balance fallback
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet', 'balance', user?.id],
    queryFn: async () => {
      try {
        const data = await walletService.getBalance();
        // Always use demo balance for demo purposes (when API returns 0 or null)
        const apiBalance = data?.balance ?? 0;
        const demoBalance = getDemoBalance(user?.role);
        // Use demo balance if API balance is 0 or null, otherwise use API balance
        const finalBalance = apiBalance > 0 ? apiBalance : demoBalance;
        
        return {
          balance: finalBalance,
          weeklyEarnings: data?.weeklyEarnings ?? 0,
          totalEarnings: data?.totalEarnings ?? 0,
          history: data?.history ?? [],
        };
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
        // On error, use demo balance
        const demoBalance = getDemoBalance(user?.role);
        return {
          balance: demoBalance,
          weeklyEarnings: 0,
          totalEarnings: 0,
          history: [],
        };
      }
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: true, // Always enabled
  });

  // Fetch next appointment
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: async () => {
      try {
        const data = await appointmentService.getAppointments({ type: 'upcoming' });
        return data || [];
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        return [];
      }
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch notifications - DISABLED (notifications completely removed)
  const { data: serverNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Always return empty array - notifications disabled
      return [];
    },
    enabled: false, // Completely disable this query
    refetchInterval: false, // No refetching
  });

  // Update local state from API responses (only if data exists)
  useEffect(() => {
    if (vitals?.heartRate !== undefined && vitals.heartRate !== null) {
      setHeartRate(vitals.heartRate);
    }
  }, [vitals]);

  useEffect(() => {
    if (metrics?.steps !== undefined && metrics.steps !== null) {
      setSteps(metrics.steps);
    }
  }, [metrics]);

  useEffect(() => {
    if (wallet?.balance !== undefined && wallet.balance !== null) {
      const balance = wallet.balance;
      setWalletBalance(balance);
      // Persist demo balance to localStorage (for demo purposes)
      // Always save the balance to maintain persistence across refreshes
      if (balance > 0) {
        saveDemoBalance(balance);
      }
    } else {
      // If wallet data is not available, use demo balance
      const demoBalance = getDemoBalance(user?.role);
      setWalletBalance(demoBalance);
    }
  }, [wallet, user?.role]);

  // Initialize demo balance on mount or when user changes
  useEffect(() => {
    // Only initialize if balance is null (initial state)
    if (walletBalance === null) {
      const demoBalance = getDemoBalance(user?.role);
      setWalletBalance(demoBalance);
    }
  }, [user?.role]); // Only depend on user role, not walletBalance to avoid loops

  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const appt = appointments[0];
      setNextAppointment(new Date(`${appt.date}T${appt.time}`));
    } else {
      setNextAppointment(null);
    }
  }, [appointments]);

  useEffect(() => {
    // Notifications completely disabled - always set to empty array
    setNotifications([]);
  }, [serverNotifications]);

  // Listen for demo notifications updates (same tab) - DISABLED
  // useEffect(() => {
  //   const handler = () => {
  //     refetchNotifications();
  //   };
  //   window.addEventListener('demo_notifications_updated', handler as any);
  //   return () => window.removeEventListener('demo_notifications_updated', handler as any);
  // }, [refetchNotifications]);

  // Set up real-time updates for health data
  const realtimeHealth = useRealtime(
    'health',
    async () => {
      await Promise.all([refetchVitals(), refetchMetrics()]);
    },
    { pollingInterval: 5000 }
  );

  // Set up real-time updates for wallet
  const realtimeWallet = useRealtime(
    'wallet',
    async () => {
      await refetchWallet();
    },
    { pollingInterval: 10000 }
  );

  // Set up WebSocket for notifications
  const ws = useWebSocket(true);
  useEffect(() => {
    if (ws.isConnected) {
      ws.onMessage((message) => {
        if (message.type === 'notification') {
          refetchNotifications();
        } else if (message.type === 'vitals') {
          refetchVitals();
          refetchMetrics();
        } else if (message.type === 'wallet') {
          refetchWallet();
        }
      });
    }
  }, [ws.isConnected, ws, refetchNotifications, refetchVitals, refetchMetrics, refetchWallet]);

  const dismissNotification = async (id: string) => {
    // Notifications disabled - do nothing
    setNotifications([]);
    try {
      // await notificationService.markRead(id);
      // setNotifications(prev => prev.filter(n => n.id !== id));
      // queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      // If API call fails, just remove from local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Also remove from demo storage so it doesn't come back on next refetch
      const KEY = 'demo_notifications';
      const removeFromStorage = (storage: Storage) => {
        try {
          const raw = storage.getItem(KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return;
          const next = parsed.filter((n: any) => n?.id !== id);
          storage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      };
      try { removeFromStorage(sessionStorage); } catch {}
      try { removeFromStorage(localStorage); } catch {}
    }
  };

  const addNotification = async (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    try {
      await notificationService.createNotification({ message, type });
      // Refresh notifications
      refetchNotifications();
    } catch (error) {
      // If API call fails, add to local state only
      const newNotification: Notification = {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date(),
      };
      setNotifications(prev => [newNotification, ...prev].slice(0, 10));
    }
  };

  const refresh = () => {
    refetchVitals();
    refetchMetrics();
    refetchWallet();
    refetchNotifications();
  };

  const isConnected = ws.isConnected || realtimeHealth.isActive || realtimeWallet.isActive;
  const isLoading = vitalsLoading || metricsLoading || walletLoading || appointmentsLoading;

  const contextValue: RealTimeContextType = {
    heartRate,
    steps,
    walletBalance,
    notifications,
    nextAppointment,
    isConnected,
    isLoading,
    dismissNotification,
    addNotification,
    refresh,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

