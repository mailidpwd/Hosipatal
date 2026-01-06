import React, { useEffect, useState } from 'react';
import { Icon, CircularProgress } from '@/components/UI';
import { Page } from '@/types';
import { useRealTime } from '@/context/RealTimeContext';
import { useNavigation } from '@/context/NavigationContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api/userService';
import { useAuth } from '@/context/AuthContext';
import type { Pledge } from '@/services/api/providerService';

export const PatientDashboard = ({ onNavigate }: { onNavigate: (page: Page) => void }) => {
  const { heartRate, steps, walletBalance, nextAppointment, isLoading } = useRealTime();
  const { setNavigationState } = useNavigation();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Store user ID in ref to prevent query from being disabled when user temporarily becomes null
  // Initialize from sessionStorage first, then update from user
  const getStoredUserId = () => {
    try {
      return sessionStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  };
  
  const userIdRef = React.useRef<string | undefined>(user?.id || getStoredUserId());
  
  React.useEffect(() => {
    if (user?.id) {
      userIdRef.current = user.id;
      try {
        sessionStorage.setItem('userId', user.id);
      } catch (e) {
        // Ignore
      }
      console.log('[PatientDashboard] ✅ User ID stored:', user.id, 'Role:', user.role);
    } else if (!userIdRef.current) {
      // Try to get from sessionStorage if user is not available yet
      const stored = getStoredUserId();
      if (stored) {
        userIdRef.current = stored;
        console.log('[PatientDashboard] ✅ Using stored userId from sessionStorage:', stored);
      }
    }
  }, [user?.id, user?.role]);

  // Debug: Log query state only when it changes meaningfully
  React.useEffect(() => {
    if (!authLoading && (user?.id || userIdRef.current)) {
      console.log('[PatientDashboard] ✅ Query ready:', {
        userId: user?.id,
        userIdRef: userIdRef.current,
        userRole: user?.role,
        patientIdForQuery: userIdRef.current || user?.id,
      });
    }
  }, [authLoading, user?.id, user?.role]);
  const [timeLeft, setTimeLeft] = useState("02:00:00");
  const [prevBalance, setPrevBalance] = useState<number | null>(walletBalance);
  const [balanceFlash, setBalanceFlash] = useState(false);
  const [liveBP, setLiveBP] = useState({ systolic: 145, diastolic: 90 });
  const [bpDirection, setBpDirection] = useState<'up' | 'down'>('down');
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Fixed appointment time - Always 2 hours from now (resets on refresh for demo)
  // For live mode: Use localStorage to persist countdown across refreshes
  const getAppointmentTime = (): Date => {
    const STORAGE_KEY = 'patient_dashboard_appointment_time';
    const DEMO_MODE = true; // Set to false for live mode with persistent countdown

    if (DEMO_MODE) {
      // Demo mode: Always reset to 2 hours from now on refresh
      return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    } else {
      // Live mode: Persist countdown across refreshes
      const storedTime = localStorage.getItem(STORAGE_KEY);

      if (storedTime) {
        const appointmentTime = new Date(storedTime);
        // If stored time is in the past, show 0000
        if (appointmentTime.getTime() <= Date.now()) {
          return new Date(Date.now()); // Return current time (will show 00:00:00)
        }
        return appointmentTime;
      } else {
        // First time: create appointment time 2 hours from now
        const appointmentTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEY, appointmentTime.toISOString());
        return appointmentTime;
      }
    }
  };

  const [appointmentTime] = useState<Date>(() => getAppointmentTime());

  // Get patient ID - try multiple formats to match with pledges
  const getPatientId = () => {
    if (!user?.id) return null;

    // Try user.id as-is
    let patientId = user.id;

    // Also try with # prefix and without
    return [patientId, `#${patientId}`, patientId.replace('#', '')];
  };

  // Fetch active pledges for current patient - ONLY if user is a PATIENT
  // Use ref first (persists), then user.id, then sessionStorage as last resort
  const patientIdForQuery = userIdRef.current || user?.id || getStoredUserId();
  const isQueryEnabled = !authLoading && !!patientIdForQuery;
  
  // Log when query state changes
  React.useEffect(() => {
    console.log('[PatientDashboard] 🎯 Query State:', {
      patientIdForQuery,
      isQueryEnabled,
      authLoading,
      userId: user?.id,
      userIdRef: userIdRef.current,
      storedUserId: getStoredUserId(),
    });
  }, [patientIdForQuery, isQueryEnabled, authLoading, user?.id]);

  const pledgesQuery = useQuery({
    queryKey: ['patient', 'pledges', patientIdForQuery],
    queryFn: async () => {
      const patientId = patientIdForQuery;
      if (!patientId) {
        console.log('[PatientDashboard] ❌ No patient ID available in queryFn');
        return [];
      }

      console.log('[PatientDashboard] 🔍 Fetching pledges for patient ID:', patientId);
      console.log('[PatientDashboard] User ID:', user?.id);
      console.log('[PatientDashboard] User role:', user?.role);
      console.log('[PatientDashboard] userIdRef.current:', userIdRef.current);
      
      try {
        // Short timeout (2 seconds) - if API doesn't respond quickly, check sessionStorage
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 2000);
        });
        
        const pledges = await Promise.race([
          userService.getMyPledges(patientId),
          timeoutPromise,
        ]) as Pledge[];
        
        console.log('[PatientDashboard] 📦 Received pledges:', pledges);
        console.log('[PatientDashboard] 📦 Pledges array check:', Array.isArray(pledges), pledges?.length);
        
        const result = Array.isArray(pledges) ? pledges : (pledges ? [pledges] : []);
        console.log('[PatientDashboard] ✅ Returning', result.length, 'pledge(s)');
        if (result.length > 0) {
          console.log('[PatientDashboard] Pledge details:', result.map(p => ({
            id: p.id,
            patientId: p.patientId,
            status: p.status,
            accepted: p.accepted,
            goal: p.goal
          })));
        } else {
          console.log('[PatientDashboard] ⚠️ No pledges returned - checking sessionStorage');
        }
        return result;
      } catch (error: any) {
        console.warn('[PatientDashboard] API call failed, checking sessionStorage:', error?.message);
        // Demo mode fallback - check sessionStorage
        try {
          const storedPledges = sessionStorage.getItem('demo_pledges');
          if (storedPledges) {
            const pledges = JSON.parse(storedPledges);
            console.log('[PatientDashboard] 📦 All stored pledges:', pledges);
            console.log('[PatientDashboard] 🔍 Looking for patientId:', patientId);
            
            // Normalize patient IDs for comparison (remove #, handle different formats)
            const normalizeId = (id: string | undefined | null): string => {
              if (!id) return '';
              return String(id).replace('#', '').trim();
            };
            
            const normalizedPatientId = normalizeId(patientId);
            
            // Filter pledges for this user - check multiple ID formats
            const userPledges = pledges.filter((p: Pledge) => {
              const pledgePatientId = normalizeId(p.patientId);
              const matches = 
                pledgePatientId === normalizedPatientId ||
                pledgePatientId === '83921' ||
                normalizedPatientId === '83921' ||
                pledgePatientId.includes('83921') ||
                normalizedPatientId.includes(pledgePatientId) ||
                pledgePatientId.includes(normalizedPatientId);
              
              if (matches) {
                console.log('[PatientDashboard] ✅ Matched pledge:', {
                  pledgeId: p.id,
                  pledgePatientId: p.patientId,
                  normalizedPledgeId: pledgePatientId,
                  queryPatientId: patientId,
                  normalizedQueryId: normalizedPatientId,
                });
              }
              return matches;
            });
            
            if (userPledges.length > 0) {
              console.log('[PatientDashboard] ✅ Found', userPledges.length, 'pledge(s) in sessionStorage');
              return userPledges;
            } else {
              console.log('[PatientDashboard] ⚠️ No matching pledges found. Stored pledges:', pledges.map((p: Pledge) => ({
                id: p.id,
                patientId: p.patientId,
                goal: p.goal,
              })));
            }
          } else {
            console.log('[PatientDashboard] ⚠️ No stored pledges in sessionStorage');
          }
        } catch (e) {
          console.warn('[PatientDashboard] Failed to parse stored pledges:', e);
        }
        console.error('[PatientDashboard] ❌ Error fetching pledges:', error);
        return [];
      }
    },
    enabled: isQueryEnabled,
    refetchInterval: 5000, // Refetch every 5 seconds to catch new pledges quickly
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: false, // Don't retry - use demo data immediately
    retryDelay: 1000,
  });

  // Debug query status only when query runs or completes
  React.useEffect(() => {
    if (pledgesQuery.isFetching || pledgesQuery.data || pledgesQuery.error) {
      console.log('[PatientDashboard] 📊 Pledge Query Status:', {
        isLoading: pledgesQuery.isLoading,
        isFetching: pledgesQuery.isFetching,
        isEnabled: pledgesQuery.isEnabled,
        dataLength: pledgesQuery.data?.length || 0,
        error: pledgesQuery.error?.message,
        status: pledgesQuery.status,
      });
    }
  }, [pledgesQuery.isFetching, pledgesQuery.data, pledgesQuery.error]);



  // Extract data - use query data directly
  const activePledges = pledgesQuery.data || [];
  const pledgesLoading = pledgesQuery.isLoading;
  const pledgesError = pledgesQuery.error;

  // Get the most recent pending or active pledge
  const currentPledge = React.useMemo(() => {
    if (!activePledges || !Array.isArray(activePledges) || activePledges.length === 0) {
      return null;
    }
    const pledge = activePledges[0];
    console.log('[PatientDashboard] ✅ Current pledge set:', pledge?.id, pledge?.patientId, pledge?.status);
    return pledge;
  }, [activePledges]);

  // Accept pledge mutation
  const acceptPledgeMutation = useMutation({
    mutationFn: (pledgeId: string) => userService.acceptPledge(pledgeId),
    onSuccess: () => {
      console.log('[PatientDashboard] ✅ Pledge accepted, invalidating queries');
      // Invalidate all patient pledge queries
      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges', userIdRef.current] });
      // Force immediate refetch
      setTimeout(() => {
        pledgesQuery.refetch();
      }, 100);
    },
  });

  // Force refetch when user changes to PATIENT or when component mounts/becomes visible
  React.useEffect(() => {
    const patientId = userIdRef.current || user?.id || getStoredUserId();
    if (patientId && !authLoading) {
      console.log('[PatientDashboard] 🔄 Invalidating pledges for patient:', patientId);
      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges', patientId] });
      // Force refetch after a short delay to ensure query is enabled
      setTimeout(() => {
        if (pledgesQuery.isEnabled) {
          console.log('[PatientDashboard] 🔄 Manually refetching pledges');
          pledgesQuery.refetch();
        } else {
          console.log('[PatientDashboard] ⚠️ Query not enabled, cannot refetch');
        }
      }, 300);
    }
  }, [user?.role, user?.id, authLoading, queryClient, pledgesQuery]);

  // Refetch when page becomes visible (for when navigating back from other pages)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (user?.role === 'PATIENT' || userIdRef.current)) {
        console.log('[PatientDashboard] 👁️ Page visible, refetching pledges');
        pledgesQuery.refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Also refetch on focus (when user clicks back to the tab)
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user?.role, pledgesQuery]);

  // Calculate days remaining for accepted pledges
  const getDaysRemaining = (pledge: Pledge): number | null => {
    if (!pledge.accepted || !pledge.endDate) return null;
    const endDate = new Date(pledge.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleAcceptPledge = async (pledge: Pledge) => {
    try {
      console.log('[PatientDashboard] 🎯 Accepting pledge:', pledge.id);
      await acceptPledgeMutation.mutateAsync(pledge.id);
      console.log('[PatientDashboard] ✅ Pledge accepted successfully');
      // Wait a bit for the query to refetch, then show alert
      setTimeout(() => {
        alert(`✅ Challenge accepted! You have ${pledge.totalDays} days to complete: ${pledge.goal}`);
      }, 300);
    } catch (error: any) {
      console.error('[PatientDashboard] ❌ Failed to accept pledge:', error);
      alert(`Failed to accept challenge: ${error?.message || 'Please try again.'}`);
    }
  };

  // Live Blood Pressure Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBP(prev => {
        const newSystolic = prev.systolic + (bpDirection === 'down' ? -Math.random() * 0.5 : Math.random() * 0.5);
        const newDiastolic = prev.diastolic + (bpDirection === 'down' ? -Math.random() * 0.3 : Math.random() * 0.3);

        // Keep within realistic bounds
        const clampedSystolic = Math.max(110, Math.min(160, newSystolic));
        const clampedDiastolic = Math.max(70, Math.min(100, newDiastolic));

        // Change direction occasionally
        if (Math.random() < 0.1) {
          setBpDirection(prev => prev === 'down' ? 'up' : 'down');
        }

        return {
          systolic: Math.round(clampedSystolic * 10) / 10,
          diastolic: Math.round(clampedDiastolic * 10) / 10
        };
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [bpDirection]);

  // Animate balance changes
  useEffect(() => {
    if (walletBalance !== null && prevBalance !== null && walletBalance > prevBalance) {
      setBalanceFlash(true);
      const timer = setTimeout(() => setBalanceFlash(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevBalance(walletBalance);
  }, [walletBalance, prevBalance]);

  // Fixed 2-Hour Countdown Timer - Persists across refreshes
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = appointmentTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Timer expired - show 0000
        setTimeLeft("0000");
        return;
      }

      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    // Initial calculation
    const now = new Date();
    const diff = appointmentTime.getTime() - now.getTime();
    if (diff <= 0) {
      setTimeLeft("0000");
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }

    return () => clearInterval(timer);
  }, [appointmentTime]);

  const shouldShowBanner = user?.role === 'PATIENT' || (userIdRef.current && !user) || currentPledge;

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-20">
      {/* Header */}
      <header className="grid grid-cols-12 gap-y-4 md:flex md:justify-between md:items-center md:gap-4">

        {/* Left: Greeting & Subtitle */}
        <div className="col-span-7 sm:col-span-8 md:w-auto flex flex-col items-start justify-center">
          <h2 className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Welcome.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs md:text-base mt-0.5 md:mt-1 font-medium line-clamp-1">Here is your daily health overview.</p>
        </div>

        {/* Right: Wallet & Notif */}
        <div className="col-span-5 sm:col-span-4 md:w-auto flex items-center justify-end gap-2 md:gap-4 self-start md:self-auto">
          <div className={`flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2.5 bg-white dark:bg-surface-dark rounded-xl shadow-sm border transition-all duration-300 ${balanceFlash ? 'border-green-400 bg-green-50 dark:bg-green-900/20 scale-105' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="size-7 md:size-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Icon name="account_balance_wallet" className="text-base md:text-xl" />
            </div>
            <div className="flex flex-col">
              <p className={`text-xs md:text-lg font-black leading-none transition-colors ${balanceFlash ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                {walletBalance !== null
                  ? walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : isLoading ? '...' : '--'
                } <span className="text-[9px] md:text-xs text-slate-400 font-bold">RDM</span>
              </p>
              <p className="text-[8px] md:text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5 leading-none mt-0.5 md:mt-1 whitespace-nowrap">
                <span>▲</span> +120 this week
              </p>
            </div>
          </div>
          <button
            className="relative size-9 md:size-12 flex items-center justify-center bg-white dark:bg-surface-dark rounded-full shadow-sm text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 shrink-0"
            title="Notifications"
            aria-label="View notifications"
          >
            <Icon name="notifications" className="text-base md:text-xl" />
            <span className="absolute top-2 right-2.5 md:top-2.5 md:right-3 size-1.5 md:size-2 bg-red-500 rounded-full border border-white dark:border-surface-dark animate-pulse"></span>
          </button>
        </div>
      </header>

      {/* NEW: Live Health Monitor */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Live Heart Rate Card */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse"></span> LIVE
          </div>
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
                <Icon name="monitor_heart" className="animate-pulse" />
              </div>
              <h3 className="font-bold text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">Heart Rate</h3>
            </div>
            <div>
              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                {heartRate !== null ? heartRate : isLoading ? '...' : '--'}
              </span>
              <span className="text-lg font-bold text-slate-400 ml-2">bpm</span>
            </div>
            <div className="w-full h-12 mt-4 opacity-50">
              <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,10 L10,10 L15,5 L20,15 L25,10 L35,10 L40,5 L45,15 L50,10 L60,10 L65,5 L70,15 L75,10 L85,10 L90,5 L95,15 L100,10" fill="none" stroke="#f43f5e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pledge/Challenge Banner - Dynamic based on active pledges - Match second image design */}
        {shouldShowBanner && (
          <>
            {pledgesLoading ? (
              <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : currentPledge ? (
              <div className="lg:col-span-2 bg-gradient-to-r from-white to-rose-50/30 dark:from-surface-dark dark:to-rose-900/10 rounded-[24px] p-1 border-2 border-rose-100 dark:border-rose-900/30 shadow-sm">
                <div className="h-full rounded-[20px] p-5 md:p-6 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
                  {/* Doctor Profile Picture - Match second image */}
                  <div className="relative shrink-0">
                    <div className="size-16 md:size-20 rounded-full border-4 border-white dark:border-surface-dark shadow-md bg-cover bg-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 flex items-center justify-center overflow-hidden">
                      {currentPledge.providerName ? (
                        <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                          {currentPledge.providerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      ) : (
                        <Icon name="medical_services" className="text-2xl text-blue-600 dark:text-blue-300" />
                      )}
                    </div>
                    {currentPledge.status === 'pending' && (
                      <div className="absolute bottom-0 right-0 bg-red-500 text-white p-1.5 rounded-full border-2 border-white dark:border-surface-dark shadow-sm flex items-center justify-center">
                        <Icon name="priority_high" className="text-xs font-bold" />
                      </div>
                    )}
                    {currentPledge.status === 'active' && currentPledge.accepted && (
                      <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full border-2 border-white dark:border-surface-dark shadow-sm flex items-center justify-center">
                        <Icon name="check_circle" className="text-xs font-bold" />
                      </div>
                    )}
                  </div>

                  {/* Content - Match second image layout */}
                  <div className="flex-1 text-center md:text-left z-10 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                      Message from <span className="text-red-600 dark:text-red-400">{currentPledge.providerName || 'Dr. Smith'}</span>: <span className="text-red-600 dark:text-red-400">Critical Recovery Challenge</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mb-3 max-w-xl font-medium">
                      {currentPledge.status === 'pending'
                        ? currentPledge.message || `${user?.name || 'Patient'}, your recent ${currentPledge.metricType?.toLowerCase() || 'health'} readings are dangerous. I have set up a ${currentPledge.totalDays}-Day Recovery Pledge for you.`
                        : currentPledge.message || `You're working on: ${currentPledge.goal}`
                      }
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[10px] md:text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/30">
                        <Icon name="lock" className="text-xs" />
                        Reward: {currentPledge.amount.toLocaleString()} RDM {currentPledge.status === 'pending' ? '(Locked)' : '(In Progress)'}
                      </div>
                      {currentPledge.status === 'pending' ? (
                        <button
                          onClick={() => handleAcceptPledge(currentPledge)}
                          disabled={acceptPledgeMutation.isPending}
                          className="px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold text-xs md:text-sm rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acceptPledgeMutation.isPending ? 'Accepting...' : 'View Challenge & Accept'}
                        </button>
                      ) : currentPledge.accepted ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded border border-teal-100 dark:border-teal-900/30">
                            <Icon name="schedule" className="text-xs" />
                            {getDaysRemaining(currentPledge) !== null
                              ? `${getDaysRemaining(currentPledge)} days remaining`
                              : 'Challenge in progress'
                            }
                          </div>
                          <button
                            onClick={() => {
                              setNavigationState({
                                selectedChallenge: {
                                  type: currentPledge.metricType?.toLowerCase().replace(' ', '_') || 'challenge',
                                  doctor: currentPledge.providerName || 'Provider',
                                  challengeId: currentPledge.id,
                                  reward: currentPledge.amount,
                                  target: currentPledge.target || currentPledge.goal,
                                  title: `${currentPledge.metricType || 'Health'} Challenge`,
                                  description: currentPledge.goal
                                }
                              });
                              onNavigate(Page.P_GOALS);
                            }}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs md:text-sm rounded-lg shadow-sm transition-all active:scale-95"
                          >
                            View Progress
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {currentPledge.accepted && currentPledge.target && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Target:</span> {currentPledge.target} |
                        <span className="font-semibold ml-2">Duration:</span> {currentPledge.totalDays} days
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Impact & Badges Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Health Helps Others (Impact) */}
        <div className="lg:col-span-7 bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/10 transition-colors"></div>

          <div className="relative shrink-0 scale-90 md:scale-100">
            <CircularProgress percentage={25} size={120} strokeWidth={10} color="#0df2df">
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-none">25</span>
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">STREAK</span>
              </div>
            </CircularProgress>
          </div>
          <div className="flex-1 z-10 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white">Your Health Helps Others</h3>
              <span className="text-lg md:text-xl">🌍</span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-5">
              Your 25-Day Streak generated <span className="text-amber-500 font-bold">500 Charity Tokens</span>.
            </p>

            <div className="bg-[#f0fdfa] dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-4 flex items-start gap-3 md:gap-4 text-left shadow-sm">
              <div className="bg-white dark:bg-surface-dark p-2 rounded-xl border border-teal-100 dark:border-teal-800 shadow-sm shrink-0 text-teal-600 dark:text-teal-400">
                <Icon name="medical_services" className="text-xl md:text-2xl" />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-1">IMPACT OUTCOME</p>
                <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  You helped fund <span className="text-teal-600 dark:text-teal-400 underline decoration-dotted">1 Free Cataract Surgery</span> for a low-income patient.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Hero Badge */}
        <div className="lg:col-span-5 bg-white dark:bg-surface-dark rounded-[24px] border border-amber-100 dark:border-amber-900/30 p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="size-14 md:size-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-800 mb-4 shadow-sm">
            <Icon name="security" className="text-2xl md:text-3xl" />
          </div>

          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">THE HERO BADGE</p>
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-2">Community Guardian</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs leading-relaxed">
            Donate <span className="font-bold text-amber-600 dark:text-amber-400">1,000 RDM</span> to Hospital Charity Fund.
          </p>

          <button
            onClick={() => {
              setNavigationState({ charityTab: true });
              onNavigate(Page.P_MARKETPLACE);
            }}
            className="w-full py-3 border-2 border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 rounded-xl font-bold text-xs md:text-sm transition-colors uppercase tracking-wide"
            title="View charity donation challenge"
            aria-label="View charity donation challenge"
          >
            View Challenge
          </button>
        </div>
      </section>

      {/* My Appointments */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">My Appointments</h3>
          <button
            onClick={() => onNavigate(Page.P_APPOINTMENT_HISTORY)}
            className="text-xs md:text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline"
            title="View appointment calendar"
            aria-label="View appointment calendar"
          >
            See Calendar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Next Up Card - LIVE COUNTDOWN */}
          <div className="bg-white dark:bg-surface-dark p-5 md:p-6 rounded-[24px] border-2 border-teal-400 dark:border-teal-500 shadow-lg shadow-teal-100 dark:shadow-teal-900/10 flex flex-col justify-between h-full min-h-[180px] relative overflow-hidden group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">NEXT UP</p>
                  <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white">Dr. Sarah Smith</h4>
                  <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">Cardiology</p>
                </div>
                <div className="text-right bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-none font-mono tabular-nums">
                    {timeLeft === "0000" ? "00:00" : timeLeft}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-0.5 uppercase">
                    {timeLeft === "0000" ? "Expired" : "Starts In"}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2.5">
                <span className="text-base">🏆</span>
                <p className="text-[10px] md:text-xs font-bold text-amber-800 dark:text-amber-200 leading-tight pt-0.5">
                  Earn <span className="text-amber-600 dark:text-amber-400">+50 RDM</span> for on-time check-in
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCheckInModal(true)}
              className="mt-5 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-bold text-xs transition-all flex items-center justify-center gap-2 group-hover:shadow-sm"
              title="Check in for appointment"
              aria-label="Check in for appointment"
            >
              <Icon name="check_circle" className="text-base" />
              Check-In Now
            </button>
          </div>

          {/* Last Visit Card */}
          <div className="bg-white dark:bg-surface-dark p-5 md:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full min-h-[180px] hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LAST VISIT</p>
                  <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white">Dr. Jones</h4>
                  <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-0.5">Gen. Physician</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">Oct 15</p>
                  <span className="mt-1 inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold border border-green-200 dark:border-green-800">
                    Completed <Icon name="check" className="text-[10px] md:text-[12px]" />
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
              <div className="size-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-[9px] md:text-[10px] font-bold">$</div>
              <span className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">+50 RDM Received</span>
            </div>
          </div>

          {/* History Card */}
          <button
            onClick={() => onNavigate(Page.P_APPOINTMENT_HISTORY)}
            className="bg-white dark:bg-surface-dark p-5 md:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-4 group hover:border-teal-200 dark:hover:border-teal-800 transition-all h-full min-h-[180px]"
            title="View full appointment history"
            aria-label="View full appointment history"
          >
            <div className="size-14 md:size-16 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 flex items-center justify-center text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              <Icon name="history" className="text-2xl md:text-3xl" />
            </div>
            <div className="text-center">
              <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">View Full History</h4>
              <p className="text-[10px] md:text-xs text-slate-500 mt-1">Past appointments & reports</p>
            </div>
            <Icon name="arrow_forward" className="text-slate-300 group-hover:text-teal-500 transition-colors text-lg md:text-xl" />
          </button>
        </div>
      </section>

      {/* Daily Habits - LIVE STEPS */}
      <section>
        <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white mb-5">Daily Habits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drink Water Card - Clickable */}
          <button
            onClick={() => {
              setNavigationState({
                selectedHabit: 'water',
                focusHabit: 'water'
              });
              onNavigate(Page.P_ROUTINE);
            }}
            className="bg-white dark:bg-surface-dark p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full text-left transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
            title="Click to add water intake"
            aria-label="Navigate to routine page to add water intake"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Icon name="water_drop" className="text-lg" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Drink Water</h4>
              </div>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">1250 / 2500 ml</span>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-3 rounded-full w-1/2 group-hover:bg-blue-600 transition-colors"></div>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-gray-300 flex items-center gap-1.5">
                <span className="text-orange-500">🔥 5 Day Streak!</span>
                <span className="text-amber-600 dark:text-amber-400 opacity-80">(2 days to Bonus +20 RDM)</span>
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="arrow_forward" className="text-sm" />
              <span className="font-bold">Click to add water</span>
            </div>
          </button>

          {/* 10k Steps Card - Clickable */}
          <button
            onClick={() => {
              setNavigationState({
                selectedHabit: 'steps',
                focusHabit: 'steps'
              });
              onNavigate(Page.P_ROUTINE);
            }}
            className="bg-white dark:bg-surface-dark p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between relative overflow-hidden h-full text-left transition-all hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
            title="Click to view steps tracking"
            aria-label="Navigate to routine page to track steps"
          >
            <div className="z-10 flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                  <Icon name="directions_walk" className="text-lg animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">10k Steps</h4>
                  <p className="text-xs text-slate-500 font-medium tabular-nums">
                    {steps !== null ? steps.toLocaleString() : isLoading ? '...' : '--'} / 10,000
                  </p>
                </div>
              </div>
              <div className="mt-1 bg-amber-50 dark:bg-amber-900/10 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800 inline-block w-fit">
                <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                  Live Earning: <span className="text-amber-700 dark:text-amber-200">+5 RDM</span>
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="arrow_forward" className="text-sm" />
                <span className="font-bold">Click to track steps</span>
              </div>
            </div>

            <div className="relative shrink-0 mr-2">
              <CircularProgress
                percentage={steps !== null ? Math.min(100, Math.round((steps / 10000) * 100)) : 0}
                size={70}
                strokeWidth={8}
                color="#f97316"
              >
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {steps !== null ? Math.min(100, Math.round((steps / 10000) * 100)) : isLoading ? '...' : '--'}%
                </span>
              </CircularProgress>
            </div>
          </button>
        </div>
      </section>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCheckInModal(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Check-In for Appointment</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Dr. Sarah Smith - Cardiology</p>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Close modal"
                aria-label="Close check-in modal"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Google Maps Embed */}
              <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.184132239234!2d-73.98811768459418!3d40.75889597932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Hospital Location"
                />
              </div>

              {/* Location Details */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="location_on" className="text-teal-500 text-xl shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">RDM Health Center</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">123 Medical Plaza, Suite 456</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">New York, NY 10001</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="phone" className="text-teal-500 text-xl shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">(555) 123-4567</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://maps.google.com/?q=RDM+Health+Center"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  title="Open in Google Maps"
                  aria-label="Get directions to hospital"
                >
                  <Icon name="directions" className="text-base" />
                  Get Directions
                </a>
                <a
                  href="https://meet.google.com/abc-defg-hij"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  title="Join video call"
                  aria-label="Join video call for appointment"
                >
                  <Icon name="videocam" className="text-base" />
                  Join Video Call
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

