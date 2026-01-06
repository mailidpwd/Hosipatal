
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon, Button, Badge } from '@/components/UI';
import { providerService } from '@/services/api/providerService';
import { useStaffRealTime } from '@/hooks/useStaffRealTime';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import type { DashboardData } from '@/services/api/providerService';

// Demo data matching backend in-memory store for staff-1 (Dr. Sarah Smith)
const getDemoDashboardData = (providerId: string): DashboardData => {
  return {
    totalPatients: 5,
    criticalCount: 2,
    rating: 4.8,
    rdmBalance: 12500,
    criticalPatients: [
      {
        id: 'alert-1',
        patientId: '83921',
        patientName: 'Michael Chen',
        type: 'bp_spike',
        severity: 'high' as const,
        message: 'BP Spike (150/95)',
        details: 'Recorded 2h ago',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        name: 'Michael Chen',
        age: 45,
        gender: 'Male',
        patientId: '#83921',
        diagnosis: 'Hypertension',
        adherenceScore: 75,
        rdmEarnings: 0,
        status: 'critical' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIRqf1C3W41bQ_OyYVAvYrNB1nxLeTpHLj9lVvJTV2cLA50I7ZcqqPsHgi_a7d72pwjd6e6MqQ9gHv-hNvH7A_r8EE3UPcQsPliBXk4QqXsCxuyJjO6-LbsDSkaMqFQAPIw2oDkYGDJgR6SC4FH849l2xaT1ALDbO6wjZW6rC3GYfXtL-oepz4bz9ufOZ7o8s6k4Sv_QIIwLcR1ks9oQjjc2CyxsxaT7lbxUBGmmPEVLlvesO1jqVNpCpnImHPlHaWqPH8OdvG8694',
      },
      {
        id: 'alert-2',
        patientId: '99201',
        patientName: 'Sarah Jenkins',
        type: 'missed_meds',
        severity: 'moderate' as const,
        message: 'Missed Meds (3 Days)',
        details: 'Notification via App',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        name: 'Sarah Jenkins',
        age: 38,
        gender: 'Female',
        patientId: '#99201',
        diagnosis: 'Diabetes T2',
        adherenceScore: 65,
        rdmEarnings: 0,
        status: 'critical' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH',
      },
    ],
    schedule: [
      {
        id: 'schedule-1',
        time: '09:00',
        title: 'Review Lab Results',
        patientName: 'Michael Chen',
        patientId: '83921',
        type: 'urgent',
        status: 'done' as const,
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'schedule-2',
        time: '10:30',
        title: 'Video Consult',
        patientName: 'David Kim',
        patientId: '1129',
        type: 'follow-up',
        status: 'now' as const,
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'schedule-3',
        time: '14:00',
        title: 'Staff Meeting',
        patientName: '',
        type: 'internal',
        status: 'upcoming' as const,
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: 'schedule-4',
        time: '16:30',
        title: 'Chart Review',
        patientName: '',
        type: 'internal',
        status: 'upcoming' as const,
        date: new Date().toISOString().split('T')[0],
      },
    ],
    recentWishes: [
      {
        id: 'tip-1',
        patientId: '99201',
        patientName: 'Sarah Jenkins',
        amount: 50,
        message: 'Thank you for the extra time yesterday, Dr. Smith! I feel much better.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH',
      },
      {
        id: 'tip-2',
        patientId: '1129',
        patientName: 'David Kim',
        amount: 100,
        message: 'My BP is finally stable. Couldn\'t have done it without your pledge.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        avatar: '',
        liked: true,
      },
      {
        id: 'tip-3',
        patientId: '9201',
        patientName: 'Emily Davis',
        amount: 10,
        type: 'rating',
        rating: 5,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: '',
      },
    ],
  };
};

export const ProviderDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const providerId = user?.role === 'STAFF' ? user.id : undefined;

  // Get providerId from sessionStorage as fallback (persists across page navigations)
  const getStoredProviderId = () => {
    try {
      return sessionStorage.getItem('providerId') || undefined;
    } catch {
      return undefined;
    }
  };

  // Store providerId in ref to prevent query from being disabled when user temporarily becomes null
  const providerIdRef = React.useRef<string | undefined>(providerId || getStoredProviderId() || 'staff-1');

  React.useEffect(() => {
    if (providerId) {
      providerIdRef.current = providerId;
      try {
        sessionStorage.setItem('providerId', providerId);
      } catch {
        // Ignore storage errors
      }
    } else if (user?.role === 'STAFF' && user?.id) {
      // If user exists but providerId wasn't set, update it
      providerIdRef.current = user.id;
      try {
        sessionStorage.setItem('providerId', user.id);
      } catch {
        // Ignore storage errors
      }
    }
  }, [providerId, user?.id, user?.role]);

  // Use fallback 'staff-1' if no providerId is available (for testing/demo)
  const stableProviderId = providerId || providerIdRef.current || getStoredProviderId() || 'staff-1';


  const { criticalAlerts, recentTips, schedule, isLoading: realtimeLoading } = useStaffRealTime(stableProviderId);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  // Fetch dashboard data - filtered by providerId
  const { data: dashboardData, isLoading: dashboardLoading, error } = useQuery({
    queryKey: ['provider', 'dashboard', stableProviderId],
    queryFn: async () => {
      console.log('[ProviderDashboard] Fetching dashboard with providerId:', stableProviderId);
      try {
        // Short timeout (1.5 seconds) - if API doesn't respond quickly, use demo data
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1500);
        });
        
        const result = await Promise.race([
          providerService.getDashboard(stableProviderId),
          timeoutPromise,
        ]) as DashboardData;
        
        console.log('[ProviderDashboard] Dashboard result:', result);
        return result;
      } catch (error: any) {
        console.warn('[ProviderDashboard] API call failed, using demo data:', error?.message);
        // Return demo data immediately if API fails (for demo mode or network issues)
        const demoData = getDemoDashboardData(stableProviderId);
        console.log('[ProviderDashboard] Using demo data:', demoData);
        return demoData;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !authLoading, // Always fetch once auth is done (don't require providerId for debugging)
    retry: false, // Don't retry - use demo data immediately on failure
    staleTime: 0, // Always consider data fresh for demo mode
  });

  // Use demo data if available, otherwise fall back to realtime data
  const data = dashboardData || {
    totalPatients: 0,
    criticalCount: 0,
    rating: 0,
    rdmBalance: 0,
    criticalPatients: [],
    schedule: [],
    recentWishes: [],
  };

  // Use data from dashboard (demo or real) instead of realtime hook
  const displayCriticalAlerts = data.criticalPatients || criticalAlerts;
  const displaySchedule = data.schedule || schedule;
  const displayRecentWishes = data.recentWishes || recentTips || [];

  // Calculate time left for "now" schedule items
  // Using useRef to track previous values and prevent infinite loops
  const scheduleRef = React.useRef(displaySchedule);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only update ref if schedule actually changed (by length or content)
    const scheduleChanged = displaySchedule.length !== scheduleRef.current.length ||
      JSON.stringify(displaySchedule.map(s => s.id)) !== JSON.stringify(scheduleRef.current.map(s => s.id));

    if (scheduleChanged) {
      scheduleRef.current = displaySchedule;
    }

    const updateTimes = () => {
      const now = new Date();
      const newTimeLeft: { [key: string]: string } = {};

      scheduleRef.current.forEach(item => {
        if (item.status === 'now' && item.time) {
          const [hours, minutes] = item.time.split(':').map(Number);
          const scheduleTime = new Date(now);
          scheduleTime.setHours(hours, minutes, 0, 0);

          if (scheduleTime < now) {
            scheduleTime.setDate(scheduleTime.getDate() + 1);
          }

          const diff = scheduleTime.getTime() - now.getTime();
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);

          newTimeLeft[item.id] = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
      });

      // Only update state if values actually changed
      setTimeLeft(prev => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(newTimeLeft);
        return prevStr === newStr ? prev : newTimeLeft;
      });
    };

    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only run timer if there are schedule items with 'now' status
    const hasNowItems = scheduleRef.current.some(item => item.status === 'now');
    if (hasNowItems) {
      updateTimes();
      intervalRef.current = setInterval(updateTimes, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [displaySchedule.length]); // Only depend on schedule length to prevent infinite loops

  const isLoading = authLoading || dashboardLoading || realtimeLoading;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  if (isLoading && !dashboardData) {
    return (
      <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
          <p className="font-bold">Error loading dashboard</p>
          <p className="text-sm mt-1">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 md:pb-12 animate-[fadeIn_0.5s_ease-out]">
      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Welcome back, Dr. Smith</h2>
          <div className="flex items-center gap-2 text-text-secondary dark:text-slate-400">
            <Icon name="calendar_today" className="text-sm" />
            <span className="text-xs font-medium">{currentDate}</span>
          </div>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 bg-primary hover:bg-primary-dark text-slate-900 text-xs font-bold rounded-lg shadow-sm shadow-primary/20 transition-all active:scale-95 self-start sm:self-auto">
          <Icon name="add" className="text-lg" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Section 1: Key Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Patients</p>
            <Icon name="groups" className="text-text-secondary dark:text-slate-500 text-lg" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-none">{data.totalPatients}</p>
            {isLoading && (
              <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-0.5 mt-1">
                <Icon name="trending_up" className="text-xs" /> Loading...
              </p>
            )}
          </div>
        </div>
        {/* Critical Attention */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <p className="text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider">Critical</p>
            <Icon name="warning" className="text-red-500 text-lg" />
          </div>
          <div>
            <p className="text-red-900 dark:text-red-100 text-2xl font-bold leading-none">{data.criticalCount || displayCriticalAlerts.length}</p>
            <p className="text-red-600 dark:text-red-300 text-[10px] font-medium mt-1">Action Req.</p>
          </div>
        </div>
        {/* Satisfaction Rating */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rating</p>
            <Icon name="star" className="text-yellow-500 fill-1 text-lg" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-none">{data.rating.toFixed(1)} <span className="text-sm text-slate-400 font-medium">/ 5</span></p>
            <p className="text-text-secondary dark:text-slate-400 text-[10px] font-medium mt-1">Top 10%</p>
          </div>
        </div>
        {/* My RDM Earnings */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-surface-dark border border-primary/30 shadow-[0_0_10px_-3px_rgba(13,242,223,0.1)] hover:shadow-[0_0_15px_-3px_rgba(13,242,223,0.2)] transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Icon name="currency_bitcoin" className="text-5xl text-primary" />
          </div>
          <div className="flex items-start justify-between mb-2 relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Balance</p>
            <Icon name="account_balance_wallet" className="text-primary text-lg" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-none">
              {data.rdmBalance >= 1000 ? `${(data.rdmBalance / 1000).toFixed(1)}k` : data.rdmBalance}
            </p>
            <p className="text-text-secondary dark:text-slate-400 text-[10px] font-medium mt-1">RDM Token</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Critical List & Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Section 2: Critical Watchlist & Today's Schedule */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* Critical Patients */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="notification_important" className="text-red-500 text-xl" />
                <h3 className="text-slate-900 dark:text-white text-base font-bold">Critical Patients</h3>
              </div>
              <button className="text-primary-dark dark:text-primary text-xs font-bold hover:underline">View All Risks</button>
            </div>
            <div className="w-full bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Name</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alert Details</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {displayCriticalAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                          No critical alerts at this time
                        </td>
                      </tr>
                    ) : (
                      displayCriticalAlerts.slice(0, 3).map((alert: any) => {
                        // Alert already contains patient data if from demo data, otherwise find patient
                        const patient = alert.name ? alert : data.criticalPatients?.find((p: any) => p.patientId === alert.patientId || p.id === alert.patientId);
                        const severityColors = {
                          high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-600', label: 'High Risk' },
                          moderate: { bg: alert.type === 'missed_meds' ? 'bg-orange-100' : 'bg-yellow-100', text: alert.type === 'missed_meds' ? 'text-orange-800' : 'text-yellow-800', border: alert.type === 'missed_meds' ? 'border-orange-200' : 'border-yellow-200', dot: alert.type === 'missed_meds' ? 'bg-orange-500' : 'bg-yellow-500', label: alert.type === 'missed_meds' ? 'Adherence Risk' : 'Moderate' },
                        };
                        const colors = severityColors[alert.severity] || severityColors.moderate;
                        const timeAgo = new Date(alert.timestamp);
                        const hoursAgo = Math.floor((Date.now() - timeAgo.getTime()) / (1000 * 60 * 60));

                        return (
                          <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{ backgroundImage: patient?.avatar ? `url("${patient.avatar}")` : 'none' }}></div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{alert.patientName}</span>
                                  <span className="text-[10px] text-slate-500">ID: {alert.patientId}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${alert.severity === 'high' ? 'text-red-600 dark:text-red-400' : alert.type === 'missed_meds' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {alert.message}
                                </span>
                                <span className="text-[10px] text-slate-500">{alert.details || `${hoursAgo}h ago`}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text} dark:bg-opacity-30 dark:text-opacity-80 border ${colors.border} dark:border-opacity-50`}>
                                <span className={`size-1.5 rounded-full ${colors.dot} ${alert.severity === 'high' ? 'animate-pulse' : ''}`}></span>
                                {colors.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <button className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 px-2.5 py-1.5 rounded-lg transition-colors shadow-sm">
                                <Icon name={alert.type === 'missed_meds' ? 'send' : alert.severity === 'high' ? 'call' : 'visibility'} className="text-xs" />
                                {alert.type === 'missed_meds' ? 'Remind' : alert.severity === 'high' ? 'Contact' : 'Review'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50 dark:bg-black/20">
                {displayCriticalAlerts.length === 0 ? (
                  <div className="p-3 bg-white dark:bg-surface-dark rounded-lg text-center text-slate-500 dark:text-slate-400 text-sm">
                    No critical alerts at this time
                  </div>
                ) : (
                  displayCriticalAlerts.slice(0, 3).map((alert: any) => {
                    // Alert already contains patient data if from demo data, otherwise find patient
                    const patient = alert.name ? alert : data.criticalPatients?.find((p: any) => p.patientId === alert.patientId || p.id === alert.patientId);
                    return (
                      <div key={alert.id} className="p-3 bg-white dark:bg-surface-dark border-l-4 border-l-red-500 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover relative shrink-0" style={{ backgroundImage: patient?.avatar ? `url("${patient.avatar}")` : 'none' }}>
                            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full text-white p-0.5 border-2 border-white dark:border-surface-dark">
                              <Icon name="priority_high" className="text-[10px] block" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{alert.patientName}</h4>
                            <p className="text-[10px] text-slate-500 mb-1">ID: {alert.patientId}</p>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded text-red-700 dark:text-red-300 text-[10px] font-bold">
                              {alert.message}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                          <button className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                            <Icon name={alert.severity === 'high' ? 'call' : 'send'} className="text-xs" /> {alert.severity === 'high' ? 'Contact' : 'Remind'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Today's Schedule (Horizontal) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white text-base font-bold">Today's Schedule</h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {displaySchedule.length === 0 ? (
                <div className="col-span-full p-4 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                  No schedule items for today
                </div>
              ) : (
                displaySchedule.map((item) => {
                  const borderColors = {
                    done: 'border-l-green-500',
                    now: 'border-l-primary',
                    upcoming: 'border-l-slate-300 dark:border-l-slate-600',
                  };
                  const statusColors = {
                    done: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-100 dark:border-green-800' },
                    now: { bg: 'bg-primary/10', text: 'text-primary-dark dark:text-primary', border: 'border-primary/20' },
                    upcoming: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500', border: '' },
                  };
                  const colors = statusColors[item.status];
                  const timeDisplay = item.time ? `${item.time} ${parseInt(item.time.split(':')[0]) >= 12 ? 'PM' : 'AM'}` : '';

                  return (
                    <div key={item.id} className={`bg-white dark:bg-surface-dark p-3.5 rounded-xl border-l-4 ${borderColors[item.status]} border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group ${item.status === 'upcoming' ? 'opacity-70 hover:opacity-100' : ''} ${item.status === 'now' ? 'shadow-md ring-1 ring-primary/10' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold ${colors.text} ${colors.bg} px-1.5 py-0.5 rounded flex items-center gap-1 ${colors.border ? `border ${colors.border}` : ''}`}>
                          {item.status === 'now' && <span className="animate-pulse size-1.5 rounded-full bg-primary-dark dark:bg-primary"></span>}
                          {item.status === 'done' && <Icon name="check_circle" className="text-green-500 text-sm" />}
                          {item.status === 'done' ? 'Done' : item.status === 'now' ? 'Now' : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{timeDisplay}</p>
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {item.patientName ? `${item.patientName} • ${item.type === 'urgent' ? 'Urgent' : item.type}` : item.type === 'internal' ? 'Admin • Internal' : item.type}
                      </p>
                      {item.status === 'now' && timeLeft[item.id] && (
                        <p className="text-[9px] text-primary-dark dark:text-primary font-mono mt-1">{timeLeft[item.id]}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Recent Wishes & Tips */}
        <div className="xl:col-span-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-900 dark:text-white text-base font-bold">Recent Wishes & Tips</h2>
            <div className="bg-rose-50 dark:bg-rose-900/20 p-1.5 rounded-lg">
              <Icon name="favorite" className="text-rose-500 fill-1 text-sm block" />
            </div>
          </div>
          <div className="flex flex-col bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 h-full overflow-hidden shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {displayRecentWishes.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-8">
                  No recent tips or wishes
                </div>
              ) : (
                displayRecentWishes.map((tip, index) => {
                  const timeAgo = new Date(tip.timestamp);
                  const hoursAgo = Math.floor((Date.now() - timeAgo.getTime()) / (1000 * 60 * 60));
                  const daysAgo = Math.floor(hoursAgo / 24);
                  const timeDisplay = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';
                  const initials = tip.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                  return (
                    <React.Fragment key={tip.id}>
                      {index > 0 && <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            {tip.avatar ? (
                              <div className="size-8 rounded-full bg-cover bg-center border border-slate-100 dark:border-slate-700" style={{ backgroundImage: `url("${tip.avatar}")` }}></div>
                            ) : (
                              <div className="size-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-xs border border-slate-100 dark:border-slate-700">
                                {initials}
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tip.patientName}</h4>
                              <p className="text-[10px] text-slate-500">{timeDisplay}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tip.amount >= 100
                            ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                            : tip.type === 'rating'
                              ? 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-800'
                              : 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                            }`}>
                            {tip.type === 'rating' ? `+${tip.amount} RDM` : `+${tip.amount} RDM`}
                          </span>
                        </div>
                        {tip.type === 'rating' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                            <span className="size-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center shrink-0">
                              <Icon name="star" className="text-[10px] fill-1" />
                            </span>
                            Rated you {tip.rating}-Stars
                          </div>
                        ) : tip.message ? (
                          <>
                            <div className={`p-2.5 rounded-lg text-xs ${tip.liked ? 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800'} italic leading-relaxed`}>
                              "{tip.message}"
                            </div>
                            {tip.liked ? (
                              <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                                <Icon name="favorite" className="text-xs fill-1" /> Liked
                              </div>
                            ) : (
                              <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-primary transition-colors w-fit">
                                <Icon name="reply" className="text-xs" />
                                Reply with 'Thanks'
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
