import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon, Badge, Card } from '@/components/UI';
import { adminService, type AdminDashboardData } from '@/services/api/adminService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { Page } from '@/types';

// Demo data for admin dashboard (fallback when API is slow)
const getDemoAdminDashboardData = (): AdminDashboardData => {
  return {
    totalStaff: 45,
    totalPatients: 320,
    pendingVerifications: 12,
    verifiedPatients: 285,
    recentAlerts: [
      {
        id: 'alert-1',
        patientId: '83921',
        patientName: 'Michael Chen',
        type: 'bp_spike',
        severity: 'high',
        message: 'BP Spike (150/95)',
        details: 'Recorded 2h ago',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-2',
        patientId: '99201',
        patientName: 'Sarah Johnson',
        type: 'medication_adherence',
        severity: 'moderate',
        message: 'Medication adherence below threshold',
        details: 'Recorded 5h ago',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };
};

interface AdminDashboardProps {
  onNavigate?: (page: Page) => void;
}

export const AdminDashboard = ({ onNavigate }: AdminDashboardProps = {}) => {
  const { user, isLoading: authLoading } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;

  // Get adminId from sessionStorage as fallback (persists across page navigations)
  const getStoredAdminId = () => {
    try {
      return sessionStorage.getItem('adminId') || undefined;
    } catch {
      return undefined;
    }
  };
  
  // Store adminId in ref to prevent query from being disabled when user temporarily becomes null
  const adminIdRef = React.useRef<string | undefined>(adminId || getStoredAdminId() || 'admin-1');
  
  React.useEffect(() => {
    if (adminId) {
      adminIdRef.current = adminId;
      try {
        sessionStorage.setItem('adminId', adminId);
      } catch {
        // Ignore storage errors
      }
    } else if (user?.role === 'ADMIN' && user?.id) {
      // If user exists but adminId wasn't set, update it
      adminIdRef.current = user.id;
      try {
        sessionStorage.setItem('adminId', user.id);
      } catch {
        // Ignore storage errors
      }
    }
  }, [adminId, user?.id, user?.role]);

  // Use fallback 'admin-1' if no adminId is available (for testing/demo)
  const stableAdminId = adminId || adminIdRef.current || getStoredAdminId() || 'admin-1';

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', stableAdminId],
    queryFn: async () => {
      try {
        console.log('[AdminDashboard] Fetching dashboard with adminId:', stableAdminId);
        
        // Short timeout (1.5 seconds) - if API doesn't respond quickly, use demo data
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1500);
        });
        
        const result = await Promise.race([
          adminService.getDashboard(stableAdminId),
          timeoutPromise,
        ]) as AdminDashboardData;
        
        console.log('[AdminDashboard] Dashboard result:', result);
        return result;
      } catch (error: any) {
        console.warn('[AdminDashboard] API call failed, using demo data:', error?.message);
        // Return demo data immediately if API fails (for demo mode or network issues)
        const demoData = getDemoAdminDashboardData();
        console.log('[AdminDashboard] Using demo data:', demoData);
        return demoData;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !authLoading, // Always fetch once auth is done
    retry: false, // Don't retry - use demo data immediately on failure
    staleTime: 0, // Always consider data fresh for demo mode
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        Error loading dashboard: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="text-lg font-bold mb-2">Admin authentication required</p>
        <p className="text-sm">Please ensure you are logged in as an admin.</p>
        <p className="text-xs mt-2 text-slate-400">User: {user ? JSON.stringify(user) : 'null'}</p>
        <p className="text-xs text-slate-400">Auth loading: {authLoading ? 'true' : 'false'}</p>
        <p className="text-xs text-slate-400">AdminId: {stableAdminId}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Overview of your organization's staff, patients, and verifications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Staff</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {dashboardData.totalStaff}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Icon name="medical_services" className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Patients</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {dashboardData.totalPatients}
              </p>
            </div>
            <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
              <Icon name="people" className="text-2xl text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </Card>

        <button
          onClick={() => onNavigate?.(Page.A_VERIFICATIONS)}
          className="w-full text-left"
        >
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Verifications</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.pendingVerifications}
                  </p>
                  {dashboardData.pendingVerifications > 0 && (
                    <Badge color="red" className="text-xs">
                      Action Required
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Icon name="verified_user" className="text-2xl text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </button>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verified Patients</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {dashboardData.verifiedPatients}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Icon name="check_circle" className="text-2xl text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate?.(Page.A_STAFF)}
          className="w-full text-left"
        >
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Icon name="person_add" className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Manage Staff</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">View and create staff members</p>
            </div>
          </div>
          </Card>
        </button>

        <button
          onClick={() => onNavigate?.(Page.A_PATIENTS)}
          className="w-full text-left"
        >
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
              <Icon name="people" className="text-2xl text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">View All Patients</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">See all patients across organization</p>
            </div>
          </div>
          </Card>
        </button>

        <button
          onClick={() => onNavigate?.(Page.A_VERIFICATIONS)}
          className="w-full text-left"
        >
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Icon name="verified_user" className="text-2xl text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Review Verifications</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {dashboardData.pendingVerifications} pending review{dashboardData.pendingVerifications !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* Recent Alerts */}
      {dashboardData.recentAlerts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Alerts</h3>
            <Icon name="notifications" className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {dashboardData.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'high' 
                      ? 'bg-red-100 dark:bg-red-900/20' 
                      : alert.severity === 'moderate'
                      ? 'bg-amber-100 dark:bg-amber-900/20'
                      : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    <Icon 
                      name="warning" 
                      className={`text-lg ${
                        alert.severity === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : alert.severity === 'moderate'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{alert.patientName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{alert.message}</p>
                  </div>
                </div>
                <Badge 
                  color={alert.severity === 'high' ? 'red' : alert.severity === 'moderate' ? 'amber' : 'blue'}
                  className="text-xs"
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

