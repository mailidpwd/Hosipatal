import React, { useEffect } from 'react';
import { UserRole, Page } from '@/types';
import { AuthScreen } from '@/pages/Auth';
import { PatientDashboard } from '@/pages/PatientDashboard';
import { PatientGoals } from '@/pages/PatientGoals';
import { PatientRoutine } from '@/pages/PatientRoutine';
import { PatientVitals } from '@/pages/PatientVitals';
import { PatientMeds } from '@/pages/PatientMeds';
import { PatientRewards } from '@/pages/PatientRewards';
import { PatientCareTeam } from '@/pages/PatientCareTeam';
import { RewardsMarketplace } from '@/pages/RewardsMarketplace';
import { PatientAppointmentHistory } from '@/pages/PatientAppointmentHistory';
// Provider Pages
import { ProviderDashboard } from '@/pages/ProviderDashboard';
import { ProviderPatients } from '@/pages/ProviderPatients';
import { ProviderPatientProfile } from '@/pages/ProviderPatientProfile';
import { ProviderClaims } from '@/pages/ProviderClaims';
import { ProviderEarnings } from '@/pages/ProviderEarnings';
import { ProviderSettings } from '@/pages/ProviderSettings';
// Admin Pages
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminStaffManagement } from '@/pages/AdminStaffManagement';
import { AdminPatients } from '@/pages/AdminPatients';
import { HospitalCommandCenter } from '@/pages/HospitalCommandCenter';
import { AdminVerifications } from '@/pages/AdminVerifications';
import { AdminLeaderboard } from '@/pages/AdminLeaderboard';
import { AdminTokenEconomy } from '@/pages/AdminTokenEconomy';
import { AdminAnalytics } from '@/pages/AdminAnalytics';
import { AdminSettings } from '@/pages/AdminSettings';

import { Layout } from '@/components/Layout';
import { RealTimeProvider, useRealTime } from '@/context/RealTimeContext';
import { DataProvider } from '@/context/DataContext';
import { NavigationProvider, useNavigation } from '@/context/NavigationContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/orpc';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ToastContainer } from '@/components/UI';

const AppContent = () => {
  const [role, setRole] = React.useState<UserRole>(UserRole.NONE);
  const [currentPage, setCurrentPage] = React.useState<Page>(Page.P_DASHBOARD);
  const { notifications, dismissNotification } = useRealTime();
  const { navigationState } = useNavigation();
  const { user, logout: authLogout } = useAuth();

  // Set initial page based on user role
  useEffect(() => {
    if (role !== UserRole.NONE) {
      if (role === UserRole.PATIENT) {
        setCurrentPage(Page.P_DASHBOARD);
      } else if (role === UserRole.ADMIN) {
        setCurrentPage(Page.S_COMMAND_CENTER);
      } else {
        setCurrentPage(Page.S_DASHBOARD);
      }
    }
  }, [role]);

  // Sync role with auth user
  useEffect(() => {
    if (user?.role) {
      const userRole = user.role as UserRole;
      if (userRole !== role) {
        setRole(userRole);
      }
    } else if (!user && role !== UserRole.NONE) {
      // If user is null, reset to NONE
      setRole(UserRole.NONE);
      setCurrentPage(Page.P_DASHBOARD);
    }
  }, [user, role]);

  const handleLogin = (selectedRole: UserRole, userData?: any) => {
    setRole(selectedRole);
    // User is already set in auth context by Auth.tsx calling authLogin
  };

  const handleLogout = async () => {
    try {
      // Call auth context logout to clear user and cache
      await authLogout();
      
      // Clear all sessionStorage data (but keep demo_pledges for cross-role demo switching)
      try {
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('providerId');
        sessionStorage.removeItem('adminId');
        // DO NOT clear demo_pledges here - needed for demo cross-role switch
        console.log('[App] ✅ Cleared sessionStorage on logout (kept demo_pledges)');
      } catch (e) {
        console.warn('[App] Failed to clear sessionStorage:', e);
      }
      
      // Reset role and page
      setRole(UserRole.NONE);
      setCurrentPage(Page.P_DASHBOARD);
      
      console.log('[App] ✅ Logout completed');
    } catch (error: any) {
      console.error('[App] Logout error:', error);
      // Even if logout fails, clear everything locally (but preserve demo_pledges)
      try {
        // Preserve demo_pledges before clearing
        const demoPledges = sessionStorage.getItem('demo_pledges');
        sessionStorage.clear();
        // Restore demo_pledges if it existed
        if (demoPledges) {
          sessionStorage.setItem('demo_pledges', demoPledges);
        }
      } catch (e) {
        // Ignore
      }
      setRole(UserRole.NONE);
      setCurrentPage(Page.P_DASHBOARD);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      // Patient Pages
      case Page.P_DASHBOARD:
        return <PatientDashboard onNavigate={setCurrentPage} />;
      case Page.P_GOALS:
        return <PatientGoals />;
      case Page.P_ROUTINE:
        return <PatientRoutine />;
      case Page.P_VITALS:
        return <PatientVitals />;
      case Page.P_MEDS:
        return <PatientMeds />;
      case Page.P_CARE_TEAM:
        return <PatientCareTeam />;
      case Page.P_MARKETPLACE:
        return <RewardsMarketplace initialTab={navigationState?.charityTab ? 'charity' : 'perks'} />;
      case Page.P_APPOINTMENT_HISTORY:
        return <PatientAppointmentHistory />;
      case Page.P_EARN:
        return <PatientRewards />;

      // Staff Pages
      case Page.S_DASHBOARD:
        return <ProviderDashboard />;
      case Page.S_PATIENTS:
        return <ProviderPatients onNavigate={setCurrentPage} />;
      case Page.S_MARKETPLACE:
        return <RewardsMarketplace />;
      case Page.S_PATIENT_PROFILE:
        return <ProviderPatientProfile onNavigate={setCurrentPage} />;
      case Page.S_CLAIMS_NLP:
        return <ProviderClaims />;
      case Page.S_EARNINGS:
        return <ProviderEarnings />;
      case Page.S_SETTINGS:
        return <ProviderSettings />;
      
      // Admin Pages
      case Page.A_DASHBOARD:
        return <AdminDashboard />;
      case Page.A_STAFF:
        return <AdminStaffManagement />;
      case Page.A_PATIENTS:
        return <AdminPatients onNavigate={setCurrentPage} />;
      case Page.S_COMMAND_CENTER:
        return <HospitalCommandCenter />;
      case Page.A_VERIFICATIONS:
        return <AdminVerifications />;
      case Page.A_LEADERBOARD:
        return <AdminLeaderboard />;
      case Page.A_TOKEN_ECONOMY:
        return <AdminTokenEconomy />;
      case Page.A_DEPT_ANALYTICS:
        return <AdminAnalytics />;
      case Page.A_SETTINGS:
        return <AdminSettings />;
      
      default:
        return <div className="p-10 text-center text-text-secondary">Page currently under development.</div>;
    }
  };

  if (role === UserRole.NONE) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Layout 
      role={role} 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      <DataProvider>
        {renderContent()}
      </DataProvider>
      <ToastContainer notifications={notifications} onDismiss={dismissNotification} />
      <ConnectionStatus />
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NavigationProvider>
          <AuthProvider>
            <RealTimeProvider>
              <AppContent />
            </RealTimeProvider>
          </AuthProvider>
        </NavigationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
