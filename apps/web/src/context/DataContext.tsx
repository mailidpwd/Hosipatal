import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types';
import { userService } from '@/services/api/userService';
import { appointmentService } from '@/services/api/appointmentService';

// --- Data Models ---
export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  wallet: {
    balance: number;
    weeklyEarnings: number;
    history: { id: string; desc: string; amount: number; date: string }[];
  };
  health: {
    streak: number;
    bp: string;
    weight: string;
    steps: number;
    stepsTarget: number;
    water: number;
    waterTarget: number;
  };
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  time: string;
  date: string;
  isCompleted: boolean;
  type: 'upcoming' | 'past';
}

interface DataContextType {
  user: UserProfile | null;
  isLoading: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  appointments: Appointment[];
  isLoadingAppointments: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  refresh: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  // Fetch user profile (without auth, use default/mock data for now)
  const { data: userProfile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userService.getProfile(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch appointments
  const { data: appointmentsData, isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAppointments(),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!userProfile) throw new Error('No user profile to update');
      return userService.updateProfile(updates);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['user', 'profile'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      return appointmentService.createAppointment(appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
      return appointmentService.updateAppointment(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const updateUser = async (updates: Partial<UserProfile>) => {
    await updateUserMutation.mutateAsync(updates);
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    await addAppointmentMutation.mutateAsync(appointment);
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    await updateAppointmentMutation.mutateAsync({ id, updates });
  };

  const refresh = () => {
    refetchProfile();
    refetchAppointments();
  };

  const contextValue: DataContextType = {
    user: userProfile || null,
    isLoading: isLoadingProfile,
    updateUser,
    appointments: appointmentsData || [],
    isLoadingAppointments,
    addAppointment,
    updateAppointment,
    refresh,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
