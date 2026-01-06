import { useQuery } from '@tanstack/react-query';
import { providerService, type CriticalAlert, type PatientTip, type ScheduleItem, type Pledge } from '@/services/api/providerService';
import { useAuth } from '@/context/AuthContext';

export interface StaffRealTimeData {
  criticalAlerts: CriticalAlert[];
  recentTips: PatientTip[];
  schedule: ScheduleItem[];
  activePledges: Pledge[];
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook for staff-specific real-time data
 * Provides critical alerts, tips, schedule, and pledges with automatic polling
 * Filters data by the logged-in provider's ID
 */
export const useStaffRealTime = (providerId?: string): StaffRealTimeData => {
  const { user } = useAuth();
  const currentProviderId = providerId || (user?.role === 'STAFF' ? user.id : undefined) || 'staff-1';
  // Critical alerts - poll every 10 seconds
  const { data: criticalAlerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['provider', 'criticalAlerts', currentProviderId],
    queryFn: () => providerService.getCriticalAlerts(currentProviderId),
    refetchInterval: 10000, // 10 seconds
    retry: 2,
    enabled: true, // Always enabled to show data
  });

  // Recent tips - poll every 60 seconds
  const { data: recentTips = [], isLoading: tipsLoading, refetch: refetchTips } = useQuery({
    queryKey: ['provider', 'recentTips', currentProviderId],
    queryFn: () => providerService.getRecentWishes(3, currentProviderId),
    refetchInterval: 60000, // 60 seconds
    retry: 2,
    enabled: true, // Always enabled to show data
  });

  // Today's schedule - poll every 30 seconds
  const today = new Date().toISOString().split('T')[0];
  const { data: schedule = [], isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['provider', 'schedule', today, currentProviderId],
    queryFn: () => providerService.getSchedule(today, currentProviderId),
    refetchInterval: 30000, // 30 seconds
    retry: 2,
    enabled: true, // Always enabled to show data
  });

  // Active pledges - poll every 30 seconds
  const { data: earnings, isLoading: earningsLoading, refetch: refetchEarnings } = useQuery({
    queryKey: ['provider', 'earnings', currentProviderId],
    queryFn: () => providerService.getEarnings(currentProviderId),
    refetchInterval: 30000, // 30 seconds
    retry: 2,
    enabled: true, // Always enabled to show data
  });

  const activePledges = earnings?.activePledges || [];

  const refetch = () => {
    refetchAlerts();
    refetchTips();
    refetchSchedule();
    refetchEarnings();
  };

  return {
    criticalAlerts: criticalAlerts || [],
    recentTips: recentTips || [],
    schedule: schedule || [],
    activePledges,
    isLoading: alertsLoading || tipsLoading || scheduleLoading || earningsLoading,
    refetch,
  };
};

