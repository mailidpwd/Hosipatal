
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Page, UserRole } from '@/types';
import { Icon, Button, Modal } from '@/components/UI';
import { providerService } from '@/services/api/providerService';
import { authService } from '@/services/api/authService';
import { healthService } from '@/services/api/healthService';
import { useStaffRealTime } from '@/hooks/useStaffRealTime';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigation } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProviderPatientsProps {
  onNavigate: (page: Page) => void;
}

// Demo data matching backend in-memory store for staff-1 (Dr. Sarah Smith)
const getDemoPatientsData = (providerId: string) => {
  return {
    patients: [
      {
        id: '83921',
        name: 'Michael Chen',
        age: 45,
        gender: 'Male',
        patientId: '#83921',
        diagnosis: 'Hypertension',
        adherenceScore: 75,
        rdmEarnings: 1250,
        status: 'critical' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIRqf1C3W41bQ_OyYVAvYrNB1nxLeTpHLj9lVvJTV2cLA50I7ZcqqPsHgi_a7d72pwjd6e6MqQ9gHv-hNvH7A_r8EE3UPcQsPliBXk4QqXsCxuyJjO6-LbsDSkaMqFQAPIw2oDkYGDJgR6SC4FH849l2xaT1ALDbO6wjZW6rC3GYfXtL-oepz4bz9ufOZ7o8s6k4Sv_QIIwLcR1ks9oQjjc2CyxsxaT7lbxUBGmmPEVLlvesO1jqVNpCpnImHPlHaWqPH8OdvG8694',
      },
      {
        id: '99201',
        name: 'Sarah Jenkins',
        age: 38,
        gender: 'Female',
        patientId: '#99201',
        diagnosis: 'Diabetes T2',
        adherenceScore: 65,
        rdmEarnings: 890,
        status: 'critical' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH',
      },
      {
        id: '1129',
        name: 'David Kim',
        age: 52,
        gender: 'Male',
        patientId: '#1129',
        diagnosis: 'Heart Disease',
        adherenceScore: 88,
        rdmEarnings: 2100,
        status: 'stable' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIRqf1C3W41bQ_OyYVAvYrNB1nxLeTpHLj9lVvJTV2cLA50I7ZcqqPsHgi_a7d72pwjd6e6MqQ9gHv-hNvH7A_r8EE3UPcQsPliBXk4QqXsCxuyJjO6-LbsDSkaMqFQAPIw2oDkYGDJgR6SC4FH849l2xaT1ALDbO6wjZW6rC3GYfXtL-oepz4bz9ufOZ7o8s6k4Sv_QIIwLcR1ks9oQjjc2CyxsxaT7lbxUBGmmPEVLlvesO1jqVNpCpnImHPlHaWqPH8OdvG8694',
      },
      {
        id: '4456',
        name: 'Emily Rodriguez',
        age: 34,
        gender: 'Female',
        patientId: '#4456',
        diagnosis: 'Asthma',
        adherenceScore: 92,
        rdmEarnings: 1850,
        status: 'stable' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH',
      },
      {
        id: '7788',
        name: 'James Wilson',
        age: 61,
        gender: 'Male',
        patientId: '#7788',
        diagnosis: 'COPD',
        adherenceScore: 70,
        rdmEarnings: 1100,
        status: 'at-risk' as const,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIRqf1C3W41bQ_OyYVAvYrNB1nxLeTpHLj9lVvJTV2cLA50I7ZcqqPsHgi_a7d72pwjd6e6MqQ9gHv-hNvH7A_r8EE3UPcQsPliBXk4QqXsCxuyJjO6-LbsDSkaMqFQAPIw2oDkYGDJgR6SC4FH849l2xaT1ALDbO6wjZW6rC3GYfXtL-oepz4bz9ufOZ7o8s6k4Sv_QIIwLcR1ks9oQjjc2CyxsxaT7lbxUBGmmPEVLlvesO1jqVNpCpnImHPlHaWqPH8OdvG8694',
      },
    ],
    total: 5,
  };
};

// Demo patient profile data for pledge modal
const getDemoPatientProfile = (patientId: string) => {
  if (patientId === '83921' || patientId === '#83921' || patientId?.includes('83921')) {
    return {
      id: '83921',
      name: 'Michael Chen',
      age: 45,
      gender: 'Male',
      patientId: '#83921',
      diagnosis: 'Hypertension',
      adherenceScore: 75,
      rdmEarnings: 1250,
      status: 'critical',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIRqf1C3W41bQ_OyYVAvYrNB1nxLeTpHLj9lVvJTV2cLA50I7ZcqqPsHgi_a7d72pwjd6e6MqQ9gHv-hNvH7A_r8EE3UPcQsPliBXk4QqXsCxuyJjO6-LbsDSkaMqFQAPIw2oDkYGDJgR6SC4FH849l2xaT1ALDbO6wjZW6rC3GYfXtL-oepz4bz9ufOZ7o8s6k4Sv_QIIwLcR1ks9oQjjc2CyxsxaT7lbxUBGmmPEVLlvesO1jqVNpCpnImHPlHaWqPH8OdvG8694',
      email: 'michael.chen@rdmhealth.patient',
      contactNumber: '+1-555-0123',
      address: '123 Health St, Medical City, MC 12345',
      vitals: {
        bloodPressure: '150/95',
        heartRate: 78,
        weight: 185,
        height: 175,
      },
      medications: [
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      ],
      emergencyContact: {
        name: 'Jane Chen',
        relationship: 'Spouse',
        phone: '+1-555-0124',
      },
    };
  }
  return null;
};

export const ProviderPatients: React.FC<ProviderPatientsProps> = ({ onNavigate }) => {
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [selectedPatientForPledge, setSelectedPatientForPledge] = useState<any>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showPledgesModal, setShowPledgesModal] = useState(false);
  const [selectedPatientForActions, setSelectedPatientForActions] = useState<any>(null);
  const [patientCredentials, setPatientCredentials] = useState<{ email: string; password: string } | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'critical' | 'stable' | 'at-risk' | 'moderate' | undefined>(undefined);
  const [isCreatingPledge, setIsCreatingPledge] = useState(false);

  // Pledge form state
  const [pledgeData, setPledgeData] = useState({
    metricType: 'Blood Pressure',
    target: '< 130/85',
    duration: '7',
    verificationMethod: 'Device Verified Only',
    rdmAmount: 500,
    message: '',
  });

  // Fetch patient profile and health data when opening pledge modal
  const { data: patientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['provider', 'patientProfile', selectedPatientForPledge?.id],
    queryFn: async () => {
      console.log('[ProviderPatients] Fetching profile for pledge, patientId:', selectedPatientForPledge?.id);
      try {
        // Short timeout (1 second) - if API doesn't respond quickly, use demo data
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1000);
        });
        
        const result = await Promise.race([
          providerService.getPatientProfile(selectedPatientForPledge!.id, providerId),
          timeoutPromise,
        ]);
        
        console.log('[ProviderPatients] Profile result:', result);
        return result;
      } catch (error: any) {
        console.warn('[ProviderPatients] API call failed, using demo data:', error?.message);
        // Return demo data immediately if API fails (for demo mode or network issues)
        const demoData = getDemoPatientProfile(selectedPatientForPledge!.id);
        if (demoData) {
          console.log('[ProviderPatients] Using demo data for pledge:', demoData);
          return demoData;
        }
        throw error; // Re-throw if no demo data available
      }
    },
    enabled: !!selectedPatientForPledge && showPledgeModal,
    retry: false,
    staleTime: 0,
  });

  // Fetch patient vitals for real-time data
  const { data: patientVitals } = useQuery({
    queryKey: ['health', 'vitals', selectedPatientForPledge?.id],
    queryFn: async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1000);
        });
        
        const result = await Promise.race([
          healthService.getVitals(selectedPatientForPledge!.id),
          timeoutPromise,
        ]);
        return result;
      } catch (error: any) {
        // Return demo vitals for Michael Chen
        if (selectedPatientForPledge?.id === '83921' || selectedPatientForPledge?.id?.includes('83921')) {
          return {
            bloodPressure: '150/95',
            heartRate: 78,
            weight: 185,
            timestamp: new Date().toISOString(),
          };
        }
        throw error;
      }
    },
    enabled: !!selectedPatientForPledge && showPledgeModal,
    retry: false,
    staleTime: 0,
  });

  // Initialize pledge data with patient's actual health metrics - intelligently adapts to condition
  useEffect(() => {
    if (selectedPatientForPledge && showPledgeModal) {
      // Get current health data
      const currentBP = patientVitals?.bloodPressure || patientProfile?.vitals?.bloodPressure || '120/80';
      const alertMessage = selectedPatientForPledge.alertMessage || '';
      const alertType = selectedPatientForPledge.alertType || '';

      // Intelligent condition detection based on alert message and type
      let metricType = 'Blood Pressure';
      let target = '< 130/85';
      let duration = '7';
      let rdmAmount = 250;
      let defaultMessage = '';

      // Parse alert message for specific conditions
      const isMissedMeds = alertType === 'missed_meds' ||
        alertMessage.toLowerCase().includes('missed med') ||
        alertMessage.toLowerCase().includes('missed medication');

      const isBPSpike = alertType === 'bp_spike' ||
        alertMessage.toLowerCase().includes('bp spike') ||
        alertMessage.toLowerCase().includes('blood pressure');

      const isWeightIssue = alertMessage.toLowerCase().includes('weight') ||
        alertMessage.toLowerCase().includes('bmi');

      const isStepsIssue = alertMessage.toLowerCase().includes('steps') ||
        alertMessage.toLowerCase().includes('activity');

      const isHeartRateIssue = alertMessage.toLowerCase().includes('heart rate') ||
        alertMessage.toLowerCase().includes('irregular heartbeat');

      // Extract specific values from alert message
      let daysMissed = 0;
      if (isMissedMeds) {
        const daysMatch = alertMessage.match(/(\d+)\s*days?/i);
        if (daysMatch) {
          daysMissed = parseInt(daysMatch[1]);
        }
      }

      let currentBPValue = currentBP;
      if (isBPSpike) {
        // Try to extract BP from alert message first (e.g., "BP Spike (150/95)")
        const bpInMessage = alertMessage.match(/(\d+)\/(\d+)/);
        if (bpInMessage) {
          currentBPValue = `${bpInMessage[1]}/${bpInMessage[2]}`;
        } else {
          // Use current vitals
          const bpMatch = currentBP.match(/(\d+)\/(\d+)/);
          if (bpMatch) {
            currentBPValue = `${bpMatch[1]}/${bpMatch[2]}`;
          }
        }
      }

      // Set metric type, target, duration, and RDM based on condition
      if (isMissedMeds) {
        metricType = 'Medication Adherence';
        target = '100% Daily';
        duration = daysMissed > 0 ? Math.min(Math.max(daysMissed + 4, 7), 14).toString() : '7';
        rdmAmount = selectedPatientForPledge.severity === 'high' ? 500 : 250;
        defaultMessage = daysMissed > 0
          ? `${selectedPatientForPledge.name}, I noticed you've missed your medications for ${daysMissed} days. Let's get back on track this week. I've attached a bonus to help motivate you!`
          : `${selectedPatientForPledge.name}, I noticed you've missed your medications. Let's get back on track this week. I've attached a bonus to help motivate you!`;
      } else if (isBPSpike) {
        metricType = 'Blood Pressure';
        // Calculate target based on current BP
        const bpMatch = currentBPValue.match(/(\d+)\/(\d+)/);
        if (bpMatch) {
          const systolic = parseInt(bpMatch[1]);
          const diastolic = parseInt(bpMatch[2]);
          // Set target to normal range
          if (systolic >= 140 || diastolic >= 90) {
            target = '< 130/85';
          } else if (systolic >= 130 || diastolic >= 85) {
            target = '< 120/80';
          } else {
            target = '< 120/80';
          }
        } else {
          target = '< 130/85';
        }
        duration = '7';
        rdmAmount = selectedPatientForPledge.severity === 'high' ? 500 : 250;
        defaultMessage = `${selectedPatientForPledge.name}, I noticed your BP spike (Current: ${currentBPValue}). Let's get this back on track this week. I've attached a bonus to help motivate you!`;
      } else if (isWeightIssue) {
        metricType = 'Weight';
        const weightMatch = alertMessage.match(/(\d+\.?\d*)\s*(kg|lbs?|pounds?)/i);
        if (weightMatch) {
          target = `Maintain healthy weight`;
        } else {
          target = 'Target weight range';
        }
        duration = '14';
        rdmAmount = 300;
        defaultMessage = `${selectedPatientForPledge.name}, I noticed a weight concern. Let's work together to achieve your health goals. I've attached a bonus to help motivate you!`;
      } else if (isStepsIssue) {
        metricType = 'Steps';
        target = '10,000 steps/day';
        duration = '7';
        rdmAmount = 200;
        defaultMessage = `${selectedPatientForPledge.name}, let's increase your daily activity! I've attached a bonus to help motivate you!`;
      } else if (isHeartRateIssue) {
        metricType = 'Heart Rate';
        target = '60-100 bpm (Resting)';
        duration = '7';
        rdmAmount = selectedPatientForPledge.severity === 'high' ? 500 : 250;
        defaultMessage = `${selectedPatientForPledge.name}, I noticed a heart rate concern. Let's monitor this closely. I've attached a bonus to help motivate you!`;
      } else {
        // Default to Blood Pressure if no specific condition detected
        metricType = 'Blood Pressure';
        target = '< 130/85';
        duration = '7';
        rdmAmount = selectedPatientForPledge.severity === 'high' ? 500 : 250;
        defaultMessage = `${selectedPatientForPledge.name}, I noticed a health concern. Let's work together to improve this. I've attached a bonus to help motivate you!`;
      }

      setPledgeData(prev => ({
        ...prev,
        metricType,
        target,
        duration,
        message: defaultMessage,
        rdmAmount,
      }));
    }
  }, [selectedPatientForPledge, showPledgeModal, patientProfile, patientVitals]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    contactNumber: '',
    primaryCondition: '',
    riskLevel: '',
    allergies: [] as string[],
    nurse: '',
    tier: 'Standard (Silver)',
    initialBonus: true,
    email: '',
    password: '',
    patientId: '',
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [autoGenerateCredentials, setAutoGenerateCredentials] = useState(true);
  const { setNavigationState } = useNavigation();
  const queryClient = useQueryClient();

  // Function to generate patient credentials
  const generatePatientCredentials = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedId = `PAT-${timestamp.toString().slice(-6)}-${randomSuffix}`;
    const generatedEmail = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}.${timestamp.toString().slice(-4)}@rdmhealth.patient`;
    // Generate a secure password: 12 characters with mix of letters, numbers, and special chars
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    const generatedPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    return {
      patientId: generatedId,
      email: generatedEmail,
      password: generatedPassword,
    };
  };

  // Auto-generate credentials when entering step 3
  useEffect(() => {
    if (currentStep === 3 && autoGenerateCredentials && formData.firstName && formData.lastName && !formData.patientId) {
      const creds = generatePatientCredentials();
      setFormData(prev => ({ ...prev, ...creds }));
    }
  }, [currentStep, formData.firstName, formData.lastName]);

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: any) => {
      return await providerService.createPatient(patientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'patients'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
    },
  });

  // Send SMS mutation
  const sendSMSMutation = useMutation({
    mutationFn: async ({ patientId, message }: { patientId: string; message: string }) => {
      return await providerService.sendSMSToPatient(patientId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'patients'] });
    },
  });

  // Generate credentials mutation
  const generateCredentialsMutation = useMutation({
    mutationFn: async (patientId: string) => {
      return await providerService.generatePatientCredentials(patientId);
    },
    onSuccess: (data) => {
      setPatientCredentials({ email: data.email, password: data.password });
      queryClient.invalidateQueries({ queryKey: ['provider', 'patients'] });
    },
  });

  // Get patient pledges query
  const getPatientPledgesQuery = useQuery({
    queryKey: ['provider', 'patientPledges', selectedPatientForActions?.id],
    queryFn: () => providerService.getPatientPledges(selectedPatientForActions?.id || ''),
    enabled: !!selectedPatientForActions && showPledgesModal,
  });

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
  const providerIdRef = React.useRef<string | undefined>(providerId || getStoredProviderId());

  React.useEffect(() => {
    if (providerId) {
      providerIdRef.current = providerId;
      try {
        sessionStorage.setItem('providerId', providerId);
      } catch {
        // Ignore storage errors
      }
    }
  }, [providerId]);

  const stableProviderId = providerId || providerIdRef.current || getStoredProviderId() || 'staff-1';

  // Fetch patients with filters - filtered by providerId
  const { data: patientsData, isLoading: patientsLoading, error } = useQuery({
    queryKey: ['provider', 'patients', stableProviderId, searchQuery, statusFilter],
    queryFn: async () => {
      console.log('[ProviderPatients] Fetching patients with providerId:', stableProviderId);
      try {
        // Short timeout (3 seconds) - if API doesn't respond quickly, use demo data
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 3000);
        });
        
        const result = await Promise.race([
          providerService.getPatients({
            search: searchQuery || undefined,
            status: statusFilter,
            providerId: stableProviderId,
          }),
          timeoutPromise,
        ]);
        
        console.log('[ProviderPatients] Patients result:', result);
        return result;
      } catch (error: any) {
        console.warn('[ProviderPatients] API call failed, using demo data:', error?.message);
        // Return demo data immediately if API fails (for demo mode or network issues)
        const demoData = getDemoPatientsData(stableProviderId);
        console.log('[ProviderPatients] Using demo data:', demoData);
        return demoData;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !authLoading, // Always fetch once auth is loaded
    retry: false, // Don't retry - use demo data immediately on failure
    staleTime: 0, // Always consider data fresh for demo mode
  });

  // Get critical alerts - filtered by providerId
  const { criticalAlerts } = useStaffRealTime(stableProviderId);

  const patients = patientsData?.patients || [];
  
  // Use demo data for critical alerts if available (from patients data)
  // First, try to get critical patients from patients data (those with status 'critical')
  const criticalPatientsFromData = patients.filter(p => p.status === 'critical');
  
  // If we have critical patients from demo data, use them for critical alerts
  // Otherwise, use realtime alerts
  const criticalPatients = criticalPatientsFromData.length > 0 
    ? criticalPatientsFromData.map(patient => ({
        id: `alert-${patient.id}`,
        patientId: patient.id,
        patientName: patient.name,
        type: patient.diagnosis === 'Hypertension' ? 'bp_spike' : 'missed_meds',
        severity: 'high' as const,
        message: patient.diagnosis === 'Hypertension' ? 'BP Spike (150/95)' : 'Missed Meds (3 Days)',
        details: 'Recorded 2h ago',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ...patient,
      }))
    : criticalAlerts.slice(0, 2).map(alert => {
        const patient = patients.find(p => p.id === alert.patientId || p.patientId === alert.patientId);
        return { ...alert, ...patient };
      });

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 md:pb-12 animate-[fadeIn_0.5s_ease-out]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">My Patient Cohort</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monitor adherence scores and manage RDM incentives.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="relative grow md:grow-0">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-60 transition-shadow"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-white hover:border-primary transition-colors">
            <Icon name="filter_list" />
            Filters
          </button>
          <button
            onClick={() => setShowAddPatientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-slate-900 rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Icon name="add" /> Add Patient
          </button>
        </div>
      </div>

      {/* Critical Attention Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Icon name="warning" className="text-red-500 animate-pulse text-lg" />
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Critical Attention Required</h3>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/30 uppercase tracking-wide">Priority Interventions</span>
        </div>

        {patientsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
            <p className="font-bold">Error loading patients</p>
            <p className="text-sm mt-1">Please refresh the page or try again later.</p>
          </div>
        ) : criticalPatients.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
            No critical patients requiring attention at this time
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {criticalPatients.map((alert: any, index: number) => {
              const borderColor = alert.severity === 'high' ? 'border-l-red-500' : 'border-l-orange-500';
              const iconColor = alert.severity === 'high' ? 'bg-red-500' : 'bg-orange-500';
              const iconName = alert.type === 'missed_meds' ? 'medication' : 'priority_high';
              const alertBg = alert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20';
              const alertText = alert.severity === 'high' ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300';
              const alertBorder = alert.severity === 'high' ? 'border-red-100 dark:border-red-900/30' : 'border-orange-100 dark:border-orange-900/30';
              const timeAgo = alert.lastVisit ? new Date(alert.lastVisit) : null;
              const daysAgo = timeAgo ? Math.floor((Date.now() - timeAgo.getTime()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div key={alert.id || index} className={`flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-surface-dark border border-l-4 border-slate-200 dark:border-slate-700 ${borderColor} shadow-sm hover:shadow-md transition-all group`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <div className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover border border-red-100 dark:border-red-900/50" style={{ backgroundImage: alert.avatar ? `url("${alert.avatar}")` : 'none' }}></div>
                      <div className={`absolute -bottom-1 -right-1 ${iconColor} text-white p-0.5 rounded-full border-2 border-white dark:border-surface-dark`}>
                        <Icon name={iconName} className="text-[10px] block" />
                      </div>
                    </div>
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4
                              onClick={() => {
                                setNavigationState({ selectedPatientId: alert.patientId });
                                onNavigate(Page.S_PATIENT_PROFILE);
                              }}
                              className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer"
                            >
                              {alert.patientName}
                            </h4>
                            <button
                              onClick={() => {
                                // Only allow pledge for Michael Chen (id: '83921')
                                if (alert.patientId !== '83921' && alert.patientId !== '#83921' && !alert.patientId?.includes('83921')) {
                                  alert('Pledge feature is currently only available for Michael Chen (#83921) in demo mode.');
                                  return;
                                }

                                // Find the actual patient to get the correct ID format
                                const actualPatient = patients.find(p =>
                                  p.id === alert.patientId ||
                                  p.patientId === alert.patientId ||
                                  p.id === `#${alert.patientId}` ||
                                  p.patientId === `#${alert.patientId}` ||
                                  p.id === alert.patientId.replace('#', '') ||
                                  p.patientId === alert.patientId.replace('#', '')
                                );

                                // Use patient.id (which matches user.id) for pledge creation
                                const patientIdForPledge = actualPatient?.id || alert.patientId;

                                console.log('[ProviderPatients] Creating pledge for patient:', {
                                  alertPatientId: alert.patientId,
                                  actualPatientId: actualPatient?.id,
                                  actualPatientPatientId: actualPatient?.patientId,
                                  usingId: patientIdForPledge,
                                });

                                setSelectedPatientForPledge({
                                  id: patientIdForPledge, // Use patient.id to match user.id
                                  originalId: alert.patientId, // Keep original for display
                                  name: alert.patientName,
                                  alertType: alert.type,
                                  alertMessage: alert.message,
                                  severity: alert.severity,
                                });
                                setShowPledgeModal(true);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] font-bold border border-amber-200 dark:border-amber-800 transition-colors uppercase tracking-wide"
                              aria-label={`Create pledge for ${alert.patientName}`}
                              title={`Create pledge for ${alert.patientName}`}
                            >
                              <Icon name="volunteer_activism" className="text-[10px]" />
                              Pledge
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mb-1.5">ID: {alert.patientId}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${alertBg} ${alertText} text-[10px] font-bold border ${alertBorder} w-fit`}>
                        <Icon name={alert.type === 'missed_meds' ? 'event_busy' : 'monitor_heart'} className="text-xs" />
                        {alert.message}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-auto pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                      <span className="text-sm">🏆</span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {alert.severity === 'high' ? 'Stabilization Bounty: 250 RDM' : 'Re-engagement Bonus: 100 RDM'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                      <p className="text-[10px] font-medium text-slate-500">
                        {daysAgo !== null ? `Last Visit: ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : 'Alert: Today'}
                      </p>
                      <button
                        onClick={async () => {
                          if (alert.severity === 'high') {
                            // Call & Intervene - Open phone dialer or show contact info
                            const patient = patients.find(p => p.id === alert.patientId || p.patientId === alert.patientId);
                            if (patient && (patient as any).contactNumber) {
                              const phoneNumber = (patient as any).contactNumber.replace(/\D/g, ''); // Remove non-digits
                              if (phoneNumber) {
                                // Try to open phone dialer
                                window.location.href = `tel:${phoneNumber}`;
                              } else {
                                alert(`Patient: ${alert.patientName}\nID: ${alert.patientId}\n\nPlease contact this patient directly.`);
                              }
                            } else {
                              alert(`Patient: ${alert.patientName}\nID: ${alert.patientId}\n\nPlease contact this patient directly.\n\nAlert: ${alert.message}`);
                            }
                          } else {
                            // Send Warning - Send SMS with warning message
                            const defaultMessage = alert.type === 'missed_meds'
                              ? `Hi ${alert.patientName}, we noticed you've missed your medications for 3 days. Please take your medications as prescribed. If you have concerns, please contact us.`
                              : `Hi ${alert.patientName}, we noticed a health concern. Please contact us or schedule an appointment soon.`;

                            if (confirm(`Send warning message to ${alert.patientName}?\n\nMessage: "${defaultMessage}"`)) {
                              try {
                                await sendSMSMutation.mutateAsync({
                                  patientId: alert.patientId,
                                  message: defaultMessage,
                                });
                                alert(`Warning message sent successfully to ${alert.patientName}!`);
                              } catch (error: any) {
                                alert(`Failed to send message: ${error?.message || 'Please try again.'}`);
                              }
                            }
                          }
                        }}
                        className={`px-3 py-1 ${alert.severity === 'high' ? 'bg-white border border-red-500 hover:bg-red-50 dark:bg-surface-dark dark:hover:bg-red-900/10 text-red-600 dark:text-red-400' : 'bg-primary/10 hover:bg-primary hover:text-slate-900 text-primary-dark dark:text-primary'} text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer`}
                        aria-label={alert.severity === 'high' ? `Call ${alert.patientName}` : `Send warning to ${alert.patientName}`}
                        title={alert.severity === 'high' ? `Call ${alert.patientName}` : `Send warning to ${alert.patientName}`}
                      >
                        <Icon name={alert.severity === 'high' ? 'call' : 'send'} className="text-xs" />
                        {alert.severity === 'high' ? 'Call & Intervene' : 'Send Warning'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* General Patient List */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">General Patient List (Portfolio)</h3>
          <div className="flex gap-2">
            <button
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary"
              aria-label="Sort patients"
              title="Sort patients"
            >
              <Icon name="sort" />
            </button>
            <button
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary"
              aria-label="Download patient list"
              title="Download patient list"
            >
              <Icon name="file_download" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Details</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Diagnosis</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adherence Score</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RDM Earnings</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {patientsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const initials = patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const adherenceColor = patient.adherenceScore >= 90 ? 'emerald' : patient.adherenceScore >= 70 ? 'amber' : 'red';
                  const adherenceLabel = patient.adherenceScore >= 90 ? 'Excellent' : patient.adherenceScore >= 70 ? 'Stable' : 'At Risk';
                  const rdmColor = patient.rdmEarnings > 0 ? 'emerald' : patient.status === 'at-risk' ? 'red' : 'slate';
                  const rdmIcon = patient.rdmEarnings > 0 ? '🟢' : patient.status === 'at-risk' ? '🔴' : '🟠';
                  const rdmText = patient.rdmEarnings > 0 ? `+${patient.rdmEarnings} RDM/Week` : patient.status === 'at-risk' ? '0 RDM (Paused)' : `+${patient.rdmEarnings || 0} RDM/Week`;

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => {
                        setNavigationState({ selectedPatientId: patient.id });
                        onNavigate(Page.S_PATIENT_PROFILE);
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {patient.avatar ? (
                            <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover border border-slate-300 dark:border-slate-600" style={{ backgroundImage: `url("${patient.avatar}")` }}></div>
                          ) : (
                            <div className={`size-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-800`}>
                              {initials}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{patient.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatientForPledge({
                                    id: patient.patientId || patient.id,
                                    name: patient.name,
                                    alertType: 'general',
                                    alertMessage: 'General intervention',
                                    severity: patient.status === 'critical' ? 'high' : 'moderate',
                                  });
                                  setShowPledgeModal(true);
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-600 transition-colors text-[9px] font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100"
                                aria-label={`Create pledge for ${patient.name}`}
                                title={`Create pledge for ${patient.name}`}
                              >
                                <Icon name="volunteer_activism" className="text-[10px]" />
                                Pledge
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500">ID: {patient.patientId} • {patient.age} yrs</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {patient.diagnosis}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 w-28">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{patient.adherenceScore}%</span>
                            <span className={`text-${adherenceColor}-600 dark:text-${adherenceColor}-400 font-bold`}>{adherenceLabel}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`bg-${adherenceColor}-500 h-full rounded-full`} style={{ width: `${patient.adherenceScore}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={`flex items-center gap-1.5 bg-${rdmColor}-50 dark:bg-${rdmColor}-900/20 px-2 py-0.5 rounded-md w-fit border border-${rdmColor}-100 dark:border-${rdmColor}-900/30`}>
                          <span className={`text-${rdmColor}-600 dark:text-${rdmColor}-400 text-[10px]`}>{rdmIcon}</span>
                          <span className={`text-xs font-bold text-${rdmColor}-700 dark:text-${rdmColor}-400`}>{rdmText}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Credentials Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForActions(patient);
                              setShowCredentialsModal(true);
                              // Try to get existing credentials
                              providerService.getPatientCredentials(patient.id)
                                .then(creds => setPatientCredentials({ email: creds.email, password: creds.password }))
                                .catch(() => setPatientCredentials(null));
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-md transition-colors text-[9px] font-bold flex items-center gap-1"
                            title="View Credentials"
                            aria-label="View Credentials"
                          >
                            <Icon name="key" className="text-[10px]" />
                          </button>

                          {/* Send SMS Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForActions(patient);
                              setSmsMessage('');
                              setShowSMSModal(true);
                            }}
                            className="px-2 py-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 rounded-md transition-colors text-[9px] font-bold flex items-center gap-1"
                            title="Send SMS"
                            aria-label="Send SMS"
                          >
                            <Icon name="sms" className="text-[10px]" />
                          </button>

                          {/* View Pledges Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForActions(patient);
                              setShowPledgesModal(true);
                            }}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-md transition-colors text-[9px] font-bold flex items-center gap-1"
                            title="View Pledges"
                            aria-label="View Pledges"
                          >
                            <Icon name="volunteer_activism" className="text-[10px]" />
                          </button>

                          {/* Existing View Profile or Nudge button */}
                          {patient.status === 'at-risk' ? (
                            <button className="px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary-dark dark:text-primary hover:text-slate-900 rounded-md transition-colors text-[10px] font-bold flex items-center gap-1">
                              <Icon name="notifications_active" className="text-[14px]" />
                              Nudge
                            </button>
                          ) : (
                            <button className="px-2.5 py-1 border border-slate-200 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white transition-colors text-[10px] font-bold shadow-sm">View Profile</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium">Showing {patients.length} of {patientsData?.total || 0} patients</span>
          <div className="flex gap-2">
            <button className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled>Previous</button>
            <button className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600">Next</button>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 ring-1 ring-black/5">
            {/* Header */}
            <div className="flex flex-col gap-6 px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Onboard New Patient</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Create a new medical profile and assign RDM eligibility.</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddPatientModal(false);
                    setCurrentStep(1);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      dateOfBirth: '',
                      age: '',
                      gender: '',
                      contactNumber: '',
                      primaryCondition: '',
                      riskLevel: '',
                      allergies: [],
                      nurse: '',
                      tier: 'Standard (Silver)',
                      initialBonus: true,
                      email: '',
                      password: '',
                      patientId: '',
                    });
                    setAllergyInput('');
                    setAutoGenerateCredentials(true);
                  }}
                  className="group p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Icon name="close" className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto mt-2">
                <div className="absolute top-[15px] left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
                <div className="flex flex-col items-center gap-2 bg-surface-light dark:bg-surface-dark px-4 z-10">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm ring-4 ring-white dark:ring-surface-dark ${currentStep >= 1
                      ? 'bg-primary text-slate-900 shadow-primary/30'
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}>
                    1
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${currentStep >= 1
                      ? 'text-primary-dark dark:text-primary'
                      : 'text-slate-500'
                    }`}>
                    Demographics
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-surface-light dark:bg-surface-dark px-4 z-10">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ring-4 ring-white dark:ring-surface-dark ${currentStep >= 2
                      ? 'bg-primary text-slate-900 shadow-sm shadow-primary/30'
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${currentStep >= 2
                      ? 'text-primary-dark dark:text-primary'
                      : 'text-slate-500'
                    }`}>
                    Clinical Baseline
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-surface-light dark:bg-surface-dark px-4 z-10">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ring-4 ring-white dark:ring-surface-dark ${currentStep >= 3
                      ? 'bg-primary text-slate-900 shadow-sm shadow-primary/30'
                      : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}>
                    3
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${currentStep >= 3
                      ? 'text-primary-dark dark:text-primary'
                      : 'text-slate-500'
                    }`}>
                    Account Setup
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto flex flex-col gap-10">
                {/* Step 1: Demographics */}
                {currentStep === 1 && (
                  <section className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary-dark dark:text-primary text-xs font-bold">1</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Demographics</h3>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex flex-col gap-2 items-center shrink-0">
                        <div className="group relative w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                          <Icon name="add_a_photo" className="text-4xl text-slate-300 group-hover:text-primary transition-colors" />
                          <span className="text-xs font-medium text-slate-400 group-hover:text-primary mt-2">Upload Photo</span>
                          <input
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            type="file"
                            accept="image/*"
                            aria-label="Upload patient photo"
                            title="Upload patient photo"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">First Name</label>
                          <input
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                            placeholder="e.g. Jane"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Last Name</label>
                          <input
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                            placeholder="e.g. Doe"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col gap-2 flex-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Date of Birth</label>
                            <input
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) => {
                                const dob = e.target.value;
                                const age = dob ? Math.floor((new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toString() : '';
                                setFormData({ ...formData, dateOfBirth: dob, age });
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-2 w-28">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Age</label>
                            <input
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-center text-slate-500 dark:text-slate-400 cursor-not-allowed"
                              disabled
                              type="text"
                              value={formData.age || '--'}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Gender</label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            aria-label="Select gender"
                            title="Select gender"
                          >
                            <option value="" className="text-slate-400">Select Gender...</option>
                            <option value="Male" className="text-slate-900 dark:text-white">Male</option>
                            <option value="Female" className="text-slate-900 dark:text-white">Female</option>
                            <option value="Non-binary" className="text-slate-900 dark:text-white">Non-binary</option>
                            <option value="Other" className="text-slate-900 dark:text-white">Other</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Contact Number <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(for SMS Alerts)</span>
                          </label>
                          <div className="relative">
                            <Icon name="smartphone" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg pointer-events-none" />
                            <input
                              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                              placeholder="(555) 000-0000"
                              type="tel"
                              value={formData.contactNumber}
                              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 2: Clinical Baseline */}
                {currentStep === 2 && (
                  <section className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold">2</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Clinical Baseline</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Primary Condition</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat"
                          value={formData.primaryCondition}
                          onChange={(e) => setFormData({ ...formData, primaryCondition: e.target.value })}
                          aria-label="Select primary condition"
                          title="Select primary condition"
                        >
                          <option value="" className="text-slate-400">Select Condition...</option>
                          <option value="Type 2 Diabetes" className="text-slate-900 dark:text-white">Type 2 Diabetes</option>
                          <option value="Hypertension" className="text-slate-900 dark:text-white">Hypertension</option>
                          <option value="COPD" className="text-slate-900 dark:text-white">COPD</option>
                          <option value="Chronic Heart Failure" className="text-slate-900 dark:text-white">Chronic Heart Failure</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Risk Level</label>
                        <div className="grid grid-cols-3 gap-3">
                          <label className="cursor-pointer relative">
                            <input
                              className="peer sr-only"
                              name="risk_level"
                              type="radio"
                              value="Low"
                              checked={formData.riskLevel === 'Low'}
                              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                              aria-label="Low risk level"
                            />
                            <div className="h-12 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 peer-checked:border-emerald-400 dark:peer-checked:bg-emerald-900/20 dark:peer-checked:text-emerald-400 dark:peer-checked:border-emerald-500 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm">
                              Low
                            </div>
                          </label>
                          <label className="cursor-pointer relative">
                            <input
                              className="peer sr-only"
                              name="risk_level"
                              type="radio"
                              value="Moderate"
                              checked={formData.riskLevel === 'Moderate'}
                              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                              aria-label="Moderate risk level"
                            />
                            <div className="h-12 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 peer-checked:bg-amber-50 peer-checked:text-amber-700 peer-checked:border-amber-400 dark:peer-checked:bg-amber-900/20 dark:peer-checked:text-amber-400 dark:peer-checked:border-amber-500 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm">
                              Moderate
                            </div>
                          </label>
                          <label className="cursor-pointer relative">
                            <input
                              className="peer sr-only"
                              name="risk_level"
                              type="radio"
                              value="Critical"
                              checked={formData.riskLevel === 'Critical'}
                              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                              aria-label="Critical risk level"
                            />
                            <div className="h-12 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 peer-checked:bg-red-50 peer-checked:text-red-700 peer-checked:border-red-400 dark:peer-checked:bg-red-900/20 dark:peer-checked:text-red-400 dark:peer-checked:border-red-500 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm">
                              Critical 🔴
                            </div>
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Allergies</label>
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 min-h-[56px] shadow-sm">
                          {formData.allergies.map((allergy, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold select-none shadow-sm"
                            >
                              {allergy}
                              <button
                                onClick={() => setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== idx) })}
                                className="hover:text-red-900 dark:hover:text-red-200 font-bold ml-0.5 transition-colors"
                                aria-label={`Remove ${allergy}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            className="bg-transparent border-none p-0 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-w-[150px] flex-1"
                            placeholder="Type allergy & hit enter..."
                            type="text"
                            value={allergyInput}
                            onChange={(e) => setAllergyInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && allergyInput.trim()) {
                                e.preventDefault();
                                setFormData({ ...formData, allergies: [...formData.allergies, allergyInput.trim()] });
                                setAllergyInput('');
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 3: Account Setup */}
                {currentStep === 3 && (
                  <section className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary-dark dark:text-primary text-xs font-bold">3</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Account Setup</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Account Credentials */}
                      <div className="flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase opacity-70">Patient Credentials</h4>

                        {/* Auto-generate toggle */}
                        <div className="mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoGenerateCredentials}
                              onChange={(e) => {
                                setAutoGenerateCredentials(e.target.checked);
                                if (e.target.checked) {
                                  const creds = generatePatientCredentials();
                                  setFormData({ ...formData, ...creds });
                                } else {
                                  setFormData({ ...formData, email: '', password: '', patientId: '' });
                                }
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Auto-generate credentials</span>
                          </label>
                        </div>

                        {/* Patient ID */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Patient Unique ID <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                              placeholder="PAT-XXXXXX-XXXX"
                              type="text"
                              value={formData.patientId}
                              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                              disabled={autoGenerateCredentials}
                              required
                            />
                            {autoGenerateCredentials && (
                              <button
                                type="button"
                                onClick={() => {
                                  const creds = generatePatientCredentials();
                                  setFormData({ ...formData, ...creds });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Regenerate ID"
                                aria-label="Regenerate Patient ID"
                              >
                                <Icon name="refresh" className="text-base" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Unique identifier for this patient</p>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                              placeholder="patient.email@rdmhealth.patient"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              disabled={autoGenerateCredentials}
                              required
                            />
                            {autoGenerateCredentials && (
                              <button
                                type="button"
                                onClick={() => {
                                  const creds = generatePatientCredentials();
                                  setFormData({ ...formData, ...creds });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Regenerate email"
                                aria-label="Regenerate Email"
                              >
                                <Icon name="refresh" className="text-base" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Patient will use this email to log in</p>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                              placeholder="••••••••"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              disabled={autoGenerateCredentials}
                              required
                              minLength={6}
                            />
                            {autoGenerateCredentials && (
                              <button
                                type="button"
                                onClick={() => {
                                  const creds = generatePatientCredentials();
                                  setFormData({ ...formData, ...creds });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Regenerate password"
                                aria-label="Regenerate Password"
                              >
                                <Icon name="refresh" className="text-base" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Temporary password (will be sent via SMS)</p>
                        </div>

                        {/* Info message */}
                        <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                          <div className="flex items-start gap-2">
                            <Icon name="info" className="text-blue-600 dark:text-blue-400 text-sm mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Credentials will be sent via SMS</p>
                              <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5">
                                Patient can log in immediately using these credentials. They will be prompted to change password on first login.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: RDM & Care Team */}
                      <div className="flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase opacity-70">RDM & Care Team</h4>

                        {/* Assign Care Team */}
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">Primary Doctor</label>
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-70 cursor-not-allowed select-none">
                              <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrmOqFjKUO4FY7_pEHrGX7I7Oha9c6NH8C2KaMWM1FPGVP4CjFB1nUuErLcxV7jdP6n-L3eZ8duSf9hLU5F8jmULlL2N6-srZejNgf3mJ96NrnLOdYibXWywxUMuCzUeUC1Nr8D1EiIv6yNOwzxiQCIoZeMzXa7roCIem9f8nYYi7P3RJs-eiWFodcZz_gboTxcV93YSehvQTXwlu7S0Rr7DgAN3ZiFG_VMmhZDJTg_OX1JxX1NWQn2lVOUwx3JjF9chnIvs8cf3rk")' }}></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dr. Sarah Smith</span>
                              <Icon name="lock" className="ml-auto text-sm text-slate-400" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Nurse</label>
                            <select
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat"
                              value={formData.nurse}
                              onChange={(e) => setFormData({ ...formData, nurse: e.target.value })}
                              aria-label="Select nurse"
                              title="Select nurse"
                            >
                              <option value="" className="text-slate-400">Select Nurse...</option>
                              <option value="Nurse Ratched" className="text-slate-900 dark:text-white">Nurse Ratched</option>
                              <option value="Nurse Jackie" className="text-slate-900 dark:text-white">Nurse Jackie</option>
                            </select>
                          </div>
                        </div>

                        {/* RDM Eligibility */}
                        <div className="flex flex-col gap-2 mt-4">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Tier</label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzY0NzQ4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat"
                            value={formData.tier}
                            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                            aria-label="Select RDM tier"
                            title="Select RDM tier"
                          >
                            <option value="Standard (Silver)" className="text-slate-900 dark:text-white">Standard (Silver)</option>
                            <option value="Gold" className="text-slate-900 dark:text-white">Gold</option>
                            <option value="Platinum" className="text-slate-900 dark:text-white">Platinum</option>
                          </select>
                        </div>
                        <div className="mt-2">
                          <label className="flex items-start gap-3 p-3 rounded-lg border border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                            <input
                              checked={formData.initialBonus}
                              onChange={(e) => setFormData({ ...formData, initialBonus: e.target.checked })}
                              className="mt-1 rounded border-slate-300 text-primary focus:ring-primary bg-white"
                              type="checkbox"
                              aria-label="Enable initial bonus"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">Initial Bonus</span>
                              <span className="text-xs font-medium text-primary-dark dark:text-primary">Credit +100 RDM Welcome Bonus</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Icon name="info" className="text-lg" />
                <span className="text-xs italic">This will SMS the temporary password to the patient.</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShowAddPatientModal(false);
                    setCurrentStep(1);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      dateOfBirth: '',
                      age: '',
                      gender: '',
                      contactNumber: '',
                      primaryCondition: '',
                      riskLevel: '',
                      allergies: [],
                      nurse: '',
                      tier: 'Standard (Silver)',
                      initialBonus: true,
                      email: '',
                      password: '',
                      patientId: '',
                    });
                    setAllergyInput('');
                    setAutoGenerateCredentials(true);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="arrow_back" className="text-lg" />
                    <span>Back</span>
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark dark:hover:bg-primary/90 text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Next</span>
                    <Icon name="arrow_forward" className="text-lg" />
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      // Validate required fields
                      if (!formData.patientId || !formData.email || !formData.password) {
                        alert('Please ensure Patient ID, Email, and Password are filled in.');
                        return;
                      }

                      if (formData.password.length < 6) {
                        alert('Password must be at least 6 characters long.');
                        return;
                      }

                      if (!formData.email.includes('@')) {
                        alert('Please enter a valid email address.');
                        return;
                      }

                      try {
                        // Step 1: Create user account via auth service
                        const fullName = `${formData.firstName} ${formData.lastName}`;
                        await authService.register({
                          email: formData.email,
                          password: formData.password,
                          name: fullName,
                          role: UserRole.PATIENT,
                        });

                        // Step 2: Create patient record via provider service
                        await createPatientMutation.mutateAsync({
                          firstName: formData.firstName,
                          lastName: formData.lastName,
                          dateOfBirth: formData.dateOfBirth,
                          age: formData.age,
                          gender: formData.gender,
                          contactNumber: formData.contactNumber,
                          primaryCondition: formData.primaryCondition,
                          riskLevel: formData.riskLevel,
                          allergies: formData.allergies,
                          nurse: formData.nurse,
                          tier: formData.tier,
                          initialBonus: formData.initialBonus,
                          email: formData.email,
                          password: formData.password,
                          patientId: formData.patientId,
                          providerId: '1', // Current doctor/provider
                        });

                        // Show success message
                        alert(`Patient created successfully!\n\nPatient ID: ${formData.patientId}\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nCredentials will be sent via SMS to ${formData.contactNumber}`);

                        setShowAddPatientModal(false);
                        setCurrentStep(1);
                        setFormData({
                          firstName: '',
                          lastName: '',
                          dateOfBirth: '',
                          age: '',
                          gender: '',
                          contactNumber: '',
                          primaryCondition: '',
                          riskLevel: '',
                          allergies: [],
                          nurse: '',
                          tier: 'Standard (Silver)',
                          initialBonus: true,
                          email: '',
                          password: '',
                          patientId: '',
                        });
                        setAutoGenerateCredentials(true);
                        setAllergyInput('');
                      } catch (error: any) {
                        console.error('Error creating patient:', error);
                        alert(`Failed to create patient: ${error?.message || 'Please try again.'}`);
                      }
                    }}
                    disabled={createPatientMutation.isPending}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark dark:hover:bg-primary/90 text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createPatientMutation.isPending ? (
                      <>
                        <LoadingSpinner />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Patient ID & Send Invite</span>
                        <Icon name="send" className="text-lg" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pledge Modal */}
      {showPledgeModal && selectedPatientForPledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700 ring-1 ring-black/5">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <Icon name="lock" className="text-2xl text-slate-400" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Initialize Critical Intervention</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPatientForPledge.name}</span>
                    {' '}(ID #{selectedPatientForPledge.id})
                    {selectedPatientForPledge.severity === 'high' && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded border border-red-200 dark:border-red-800">
                        HIGH RISK (BP SPIKE)
                      </span>
                    )}
                  </p>
                  {/* Show current patient health data */}
                  {profileLoading ? (
                    <div className="mt-2 text-xs text-slate-400">Loading patient data...</div>
                  ) : (
                    (patientVitals || patientProfile?.vitals) && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Current BP:</span> {patientVitals?.bloodPressure || patientProfile?.vitals?.bloodPressure || 'N/A'} |
                        <span className="font-semibold ml-2">Heart Rate:</span> {patientVitals?.heartRate || patientProfile?.vitals?.heartRate || 'N/A'} bpm
                      </div>
                    )
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPledgeModal(false);
                  setSelectedPatientForPledge(null);
                  setPledgeData({
                    metricType: 'Blood Pressure',
                    target: '< 130/85',
                    duration: '7',
                    verificationMethod: 'Device Verified Only',
                    rdmAmount: 500,
                    message: '',
                  });
                }}
                className="group p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <Icon name="close" className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto flex flex-col gap-8">
                {/* Section 1: The Clinical Target */}
                <section className="flex flex-col gap-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">
                    The Clinical Target (The "Ask")
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">DEFINE SUCCESS METRICS</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Metric Type</label>
                        <select
                          className="form-select w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-colors"
                          value={pledgeData.metricType}
                          onChange={(e) => {
                            // When metric type changes, update target accordingly
                            let newTarget = pledgeData.target;
                            if (e.target.value === 'Medication Adherence') {
                              newTarget = '100% Daily';
                            } else if (e.target.value === 'Blood Pressure') {
                              newTarget = '< 130/85';
                            } else if (e.target.value === 'Steps') {
                              newTarget = '10,000 steps/day';
                            } else if (e.target.value === 'Weight') {
                              newTarget = 'Target weight range';
                            } else if (e.target.value === 'Blood Sugar') {
                              newTarget = '< 100 mg/dL (Fasting)';
                            } else if (e.target.value === 'Heart Rate') {
                              newTarget = '60-100 bpm (Resting)';
                            }
                            setPledgeData({ ...pledgeData, metricType: e.target.value, target: newTarget });
                          }}
                          aria-label="Select metric type"
                          title="Select metric type"
                        >
                          <option value="Blood Pressure">Blood Pressure</option>
                          <option value="Medication Adherence">Medication Adherence</option>
                          <option value="Steps">Steps</option>
                          <option value="Weight">Weight</option>
                          <option value="Blood Sugar">Blood Sugar</option>
                          <option value="Heart Rate">Heart Rate</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target</label>
                        <input
                          className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-colors"
                          placeholder={pledgeData.metricType === 'Medication Adherence' ? 'Target: 100% Daily' : pledgeData.metricType === 'Blood Pressure' ? 'Target: < 130/85' : pledgeData.metricType === 'Steps' ? 'Target: 10,000 steps/day' : 'Enter target value'}
                          type="text"
                          value={pledgeData.target}
                          onChange={(e) => setPledgeData({ ...pledgeData, target: e.target.value })}
                          aria-label="Target value"
                          title="Enter target value"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Duration</label>
                        <div className="flex items-center gap-2">
                          <input
                            className="form-input flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-colors"
                            placeholder="Duration in days"
                            type="number"
                            min="1"
                            max="30"
                            value={pledgeData.duration}
                            onChange={(e) => {
                              const days = e.target.value;
                              if (days === '' || (parseInt(days) >= 1 && parseInt(days) <= 30)) {
                                setPledgeData({ ...pledgeData, duration: days });
                              }
                            }}
                            aria-label="Duration in days"
                            title="Enter duration in days"
                          />
                          <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Days</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                        <input
                          checked={pledgeData.verificationMethod === 'Device Verified Only'}
                          onChange={(e) => setPledgeData({ ...pledgeData, verificationMethod: e.target.checked ? 'Device Verified Only' : 'Manual' })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 bg-white"
                          type="checkbox"
                          aria-label="Device verified only"
                        />
                        <Icon name="verified" className="text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Verification Method: Device Verified Only</span>
                        <Icon name="arrow_drop_down" className="ml-auto text-slate-400" />
                      </label>
                    </div>
                  </div>
                </section>

                {/* Section 2: The Reward Stake */}
                <section className="flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      The Reward Stake (The "Incentive")
                    </h3>
                    <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{pledgeData.rdmAmount} RDM</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">ALLOCATE RDM FROM DEPARTMENT BUDGET</label>
                    <div className="relative">
                      <input
                        type="range"
                        min="100"
                        max="1000"
                        step="50"
                        value={pledgeData.rdmAmount}
                        onChange={(e) => setPledgeData({ ...pledgeData, rdmAmount: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        aria-label="RDM amount slider"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>100</span>
                        <span>500</span>
                        <span>1,000</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Icon name="lock" className="text-slate-400" />
                      <span>{pledgeData.rdmAmount} RDM will be locked in Escrow. Released automatically upon success via Smart Contract.</span>
                    </div>
                  </div>
                </section>

                {/* Section 3: The Dedication Note */}
                <section className="flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      The Dedication Note
                    </h3>
                    <span className={`text-xs font-semibold ${pledgeData.message.length > 200 ? 'text-red-500' : 'text-slate-500'}`}>
                      {pledgeData.message.length}/200 chars
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">PERSONAL MOTIVATION MESSAGE</label>
                    <textarea
                      className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-colors min-h-[100px] resize-none"
                      placeholder="Write a personal message to motivate the patient..."
                      value={pledgeData.message}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          setPledgeData({ ...pledgeData, message: e.target.value });
                        }
                      }}
                      maxLength={200}
                      aria-label="Personal motivation message"
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Icon name="visibility" className="text-slate-400" />
                      <span>This message will appear on the patient's home screen.</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setShowPledgeModal(false);
                  setSelectedPatientForPledge(null);
                }}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-sm transition-colors"
              >
                Discard Draft
              </button>
              <button
                onClick={async () => {
                  if (isCreatingPledge) return; // Prevent double clicks
                  
                  setIsCreatingPledge(true);
                  const loadingToast = toast.loading('Creating pledge...', {
                    description: 'Please wait while we set up the challenge',
                  });

                  try {
                    // Get provider info for email
                    const providerInfo = {
                      providerId: providerId || user?.id || 'staff-1',
                      providerName: user?.name || 'Dr. Sarah Smith',
                      providerEmail: user?.email || 'doctor@rdmhealth.com',
                    };

                    // Create pledge with full details including email info
                    const pledge = await providerService.createPledge(
                      selectedPatientForPledge.id,
                      pledgeData.rdmAmount,
                      `${pledgeData.metricType}: ${pledgeData.target} for ${pledgeData.duration} days`,
                      {
                        message: pledgeData.message,
                        metricType: pledgeData.metricType,
                        target: pledgeData.target,
                        duration: pledgeData.duration,
                        ...providerInfo,
                      }
                    );

                    if (pledge) {
                      // Store pledge in both sessionStorage and localStorage for demo mode
                      // localStorage persists across logout/role switches, sessionStorage for immediate access
                      try {
                        const storedS = sessionStorage.getItem('demo_pledges');
                        const storedL = localStorage.getItem('demo_pledges');
                        const sPledges = storedS ? JSON.parse(storedS) : [];
                        const lPledges = storedL ? JSON.parse(storedL) : [];
                        
                        // Ensure patientId is set correctly (use '83921' for Michael Chen)
                        const normalizedPledge = {
                          ...pledge,
                          patientId: '83921', // Always use '83921' for Michael Chen in demo mode
                        };
                        
                        sPledges.push(normalizedPledge);
                        lPledges.push(normalizedPledge);
                        
                        sessionStorage.setItem('demo_pledges', JSON.stringify(sPledges));
                        localStorage.setItem('demo_pledges', JSON.stringify(lPledges));
                        
                        // Dispatch custom event for same-tab listeners (storage event only fires cross-tab)
                        window.dispatchEvent(new Event('demo_pledges_updated'));

                        // Create a single demo notification ONLY when pledge is created
                        try {
                          const KEY = 'demo_notifications';
                          const notif = {
                            id: `n-pledge-${normalizedPledge.id}`,
                            message: `Pledge created for ${selectedPatientForPledge?.name || 'Michael Chen'}`,
                            type: 'success',
                            timestamp: new Date().toISOString(),
                          };
                          const list = [notif];
                          sessionStorage.setItem(KEY, JSON.stringify(list));
                          localStorage.setItem(KEY, JSON.stringify(list));
                          // Notify same-tab listeners
                          window.dispatchEvent(new Event('demo_notifications_updated'));
                        } catch (e) {
                          console.warn('[ProviderPatients] Failed to write demo notification:', e);
                        }
                        
                        console.log('[ProviderPatients] ✅ Saved pledge to sessionStorage + localStorage:', {
                          id: normalizedPledge.id,
                          patientId: normalizedPledge.patientId,
                          goal: normalizedPledge.goal,
                          totalSession: sPledges.length,
                          totalLocal: lPledges.length,
                        });
                      } catch (e) {
                        console.warn('[ProviderPatients] Failed to store pledge:', e);
                      }

                      // Invalidate queries to refresh patient data in real-time
                      queryClient.invalidateQueries({ queryKey: ['provider', 'patients'] });
                      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
                      queryClient.invalidateQueries({ queryKey: ['provider', 'patientProfile', selectedPatientForPledge.id] });
                      queryClient.invalidateQueries({ queryKey: ['health', 'vitals', selectedPatientForPledge.id] });
                      queryClient.invalidateQueries({ queryKey: ['provider', 'patientPledges'] });
                      // CRITICAL: Invalidate patient pledges query so it shows up on patient dashboard
                      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges'] });
                      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges', selectedPatientForPledge.id] });
                      queryClient.invalidateQueries({ queryKey: ['patient', 'pledges', '83921'] });

                      // Get patient email from profile or find in patients list
                      const patient = patients.find(p => p.id === selectedPatientForPledge.id || p.patientId === selectedPatientForPledge.id);
                      const patientEmail = patientProfile?.email || (patient as any)?.email || 'michael.chen@rdmhealth.patient';

                      // Dismiss loading toast and show success
                      toast.dismiss(loadingToast);
                      toast.success('Pledge Activated Successfully!', {
                        description: `${pledgeData.rdmAmount} RDM allocated for ${selectedPatientForPledge.name}. The patient has been notified and can track progress in real-time.`,
                        duration: 5000,
                      });

                      // Close modal after a short delay
                      setTimeout(() => {
                        setShowPledgeModal(false);
                        setSelectedPatientForPledge(null);
                        setPledgeData({
                          metricType: 'Blood Pressure',
                          target: '< 130/85',
                          duration: '7',
                          verificationMethod: 'Device Verified Only',
                          rdmAmount: 500,
                          message: '',
                        });
                        setIsCreatingPledge(false);
                      }, 1000);
                    } else {
                      throw new Error('Failed to create pledge');
                    }
                  } catch (error: any) {
                    console.error('Error creating pledge:', error);
                    toast.dismiss(loadingToast);
                    toast.error('Failed to Create Pledge', {
                      description: error?.message || 'Please try again.',
                      duration: 4000,
                    });
                    setIsCreatingPledge(false);
                  }
                }}
                disabled={(profileLoading && !patientProfile && !patientVitals) || isCreatingPledge}
                className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark dark:hover:bg-primary/90 text-slate-900 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingPledge ? (
                  <>
                    <LoadingSpinner />
                    <span>Activating Challenge...</span>
                  </>
                ) : profileLoading && !patientProfile && !patientVitals ? (
                  <>
                    <LoadingSpinner />
                    <span>Loading patient data...</span>
                  </>
                ) : (
                  <>
                    <Icon name="edit" className="text-lg" />
                    <span>Sign Pledge & Activate Challenge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedPatientForActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Patient Credentials</h3>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setSelectedPatientForActions(null);
                  setPatientCredentials(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <Icon name="close" className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span className="font-semibold">Patient:</span> {selectedPatientForActions.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  <span className="font-semibold">ID:</span> {selectedPatientForActions.patientId}
                </p>
              </div>

              {patientCredentials ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1 block">Email</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                      <code className="text-sm font-mono text-slate-900 dark:text-white flex-1">{patientCredentials.email}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(patientCredentials.email);
                          alert('Email copied to clipboard!');
                        }}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Copy email"
                        aria-label="Copy email"
                      >
                        <Icon name="content_copy" className="text-sm text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1 block">Password</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                      <code className="text-sm font-mono text-slate-900 dark:text-white flex-1">{patientCredentials.password}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(patientCredentials.password);
                          alert('Password copied to clipboard!');
                        }}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Copy password"
                        aria-label="Copy password"
                      >
                        <Icon name="content_copy" className="text-sm text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <Icon name="info" className="inline text-sm mr-1" />
                      These credentials can be sent to the patient via SMS.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No credentials generated yet</p>
                  <button
                    onClick={() => generateCredentialsMutation.mutate(selectedPatientForActions.id)}
                    disabled={generateCredentialsMutation.isPending}
                    className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {generateCredentialsMutation.isPending ? (
                      <>
                        <LoadingSpinner />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="key" />
                        <span>Generate Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSMSModal && selectedPatientForActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Patient</h3>
              <button
                onClick={() => {
                  setShowSMSModal(false);
                  setSelectedPatientForActions(null);
                  setSmsMessage('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <Icon name="close" className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {/* Patient Info */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  {selectedPatientForActions.avatar ? (
                    <img
                      src={selectedPatientForActions.avatar}
                      alt={selectedPatientForActions.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary-dark dark:text-primary font-bold text-lg">
                        {selectedPatientForActions.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedPatientForActions.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Patient ID: {selectedPatientForActions.patientId || selectedPatientForActions.id}
                    </p>
                  </div>
                </div>

                {/* Contact Number Display */}
                {selectedPatientForActions.contactNumber ? (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                      Contact Number
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                        <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                          {selectedPatientForActions.contactNumber}
                        </p>
                      </div>
                      <a
                        href={`tel:${selectedPatientForActions.contactNumber.replace(/[^0-9+]/g, '')}`}
                        className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 font-bold text-sm shadow-sm"
                        title="Call from your mobile phone"
                        aria-label={`Call ${selectedPatientForActions.name} at ${selectedPatientForActions.contactNumber}`}
                      >
                        <Icon name="phone" className="text-lg" />
                        <span>Call</span>
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPatientForActions.contactNumber);
                          alert('Phone number copied to clipboard!');
                        }}
                        className="px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
                        title="Copy phone number"
                        aria-label="Copy phone number to clipboard"
                      >
                        <Icon name="content_copy" className="text-lg" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <Icon name="info" className="text-xs" />
                      Click "Call" to dial from your mobile device
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Icon name="warning" className="text-base" />
                      No contact number available for this patient
                    </p>
                  </div>
                )}
              </div>

              {/* SMS Message Section */}
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2 block">
                  Send SMS Message
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  rows={4}
                  placeholder="Type your message here..."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {smsMessage.length} characters
                </p>
              </div>
              <button
                onClick={() => {
                  if (!smsMessage.trim()) {
                    alert('Please enter a message');
                    return;
                  }
                  sendSMSMutation.mutate({
                    patientId: selectedPatientForActions.id,
                    message: smsMessage,
                  }, {
                    onSuccess: () => {
                      alert('SMS sent successfully!');
                      setShowSMSModal(false);
                      setSmsMessage('');
                      setSelectedPatientForActions(null);
                    },
                    onError: (error: any) => {
                      alert(`Failed to send SMS: ${error?.message || 'Please try again.'}`);
                    },
                  });
                }}
                disabled={!smsMessage.trim() || sendSMSMutation.isPending || !selectedPatientForActions.contactNumber}
                className="w-full px-4 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendSMSMutation.isPending ? (
                  <>
                    <LoadingSpinner />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" />
                    <span>Send SMS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pledges Modal */}
      {showPledgesModal && selectedPatientForActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pledges for {selectedPatientForActions.name}</h3>
              <button
                onClick={() => {
                  setShowPledgesModal(false);
                  setSelectedPatientForActions(null);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <Icon name="close" className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {getPatientPledgesQuery.isLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner />
                </div>
              ) : getPatientPledgesQuery.data && getPatientPledgesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {getPatientPledgesQuery.data.map((pledge: any) => (
                    <div key={pledge.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white mb-1">{pledge.goal}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Created: {new Date(pledge.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${pledge.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            pledge.status === 'at-risk' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              pledge.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {pledge.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-lg font-bold text-primary-dark dark:text-primary">{pledge.amount} RDM</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Progress: {pledge.progress}/{pledge.totalDays} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="volunteer_activism" className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">No pledges sent to this patient yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create a pledge to motivate this patient</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
