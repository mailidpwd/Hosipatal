import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/UI';
import { Page } from '@/types';
import { providerService } from '@/services/api/providerService';
import { useNavigation } from '@/context/NavigationContext';
import { useRealTime } from '@/context/RealTimeContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

// Demo patient profile data
const getDemoPatientProfile = (patientId: string) => {
  // Demo data for Michael Chen (83921)
  if (patientId === '83921' || patientId === '#83921' || patientId.includes('83921')) {
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
      contactNumber: '+1-555-0123',
      email: 'michael.chen@rdmhealth.patient',
      address: '123 Health St, Medical City, MC 12345',
      emergencyContact: {
        name: 'Jane Chen',
        relationship: 'Spouse',
        phone: '+1-555-0124',
      },
      medications: [
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
        { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      ],
      vitals: {
        bloodPressure: '150/95',
        heartRate: 78,
        weight: 185,
        height: 175,
      },
    };
  }
  
  // Add other patients' demo data as needed
  // For now, return null for others to trigger error handling
  return null;
};

export const ProviderPatientProfile = ({ onNavigate }: { onNavigate: (page: Page) => void }) => {
  const { navigationState } = useNavigation();
  const { heartRate } = useRealTime();
  const { user, isLoading: authLoading } = useAuth();
  const providerId = user?.role === 'STAFF' ? user.id : undefined;
  const patientId = navigationState?.selectedPatientId || '83921'; // Default to first patient

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
  
  const stableProviderId = providerId || providerIdRef.current || getStoredProviderId();

  // Fetch patient profile - filtered by providerId
  const { data: patientProfile, isLoading, error } = useQuery({
    queryKey: ['provider', 'patientProfile', patientId, stableProviderId],
    queryFn: async () => {
      console.log('[ProviderPatientProfile] Fetching profile for patientId:', patientId);
      try {
        // Short timeout (1 second) - if API doesn't respond quickly, use demo data
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1000);
        });
        
        const result = await Promise.race([
          providerService.getPatientProfile(patientId, stableProviderId),
          timeoutPromise,
        ]);
        
        console.log('[ProviderPatientProfile] Profile result:', result);
        return result;
      } catch (error: any) {
        console.warn('[ProviderPatientProfile] API call failed, using demo data:', error?.message);
        // Return demo data immediately if API fails (for demo mode or network issues)
        const demoData = getDemoPatientProfile(patientId);
        if (demoData) {
          console.log('[ProviderPatientProfile] Using demo data:', demoData);
          return demoData;
        }
        throw error; // Re-throw if no demo data available
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!stableProviderId && !authLoading, // Only fetch if providerId is available
    retry: false, // Don't retry - use demo data immediately on failure
    staleTime: 0, // Always consider data fresh for demo mode
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !patientProfile) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
          <p className="font-bold">Error loading patient profile</p>
          <p className="text-sm mt-1">Please go back and try again.</p>
        </div>
      </div>
    );
  }

  const initials = patientProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-20">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <button 
            onClick={() => onNavigate(Page.S_PATIENTS)}
            className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
        >
            <Icon name="arrow_back" className="text-lg" />
            Back to My Patients
        </button>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
            {patientProfile.avatar ? (
              <div className="size-20 rounded-full bg-cover bg-center border-2 border-white dark:border-surface-dark shadow-lg shrink-0" style={{backgroundImage: `url('${patientProfile.avatar}')`}}></div>
            ) : (
              <div className="size-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-2xl border-2 border-white dark:border-surface-dark shadow-lg shrink-0">
                {initials}
              </div>
            )}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h1 className="text-2xl font-bold text-text-main dark:text-white">{patientProfile.name}</h1>
                    {patientProfile.status === 'stable' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                        <Icon name="trophy" className="text-[14px] text-amber-500 fill-1" />
                        Gold Member
                      </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-text-secondary dark:text-gray-400">
                    <span>Age: <span className="font-semibold text-text-main dark:text-white">{patientProfile.age}</span></span>
                    <span className="size-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                    <span>ID: <span className="font-semibold text-text-main dark:text-white">{patientProfile.patientId}</span></span>
                    <span className="size-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                    <span>{patientProfile.gender}</span>
                </div>
            </div>
        </div>
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400">
                <Icon name="warning" className="text-xl" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Key Alert</span>
                    <span className="text-sm font-bold">Allergies: Penicillin</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Physical Activity Chart */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="directions_walk" className="text-blue-500" />
                        Physical Activity
                    </h3>
                    <span className="text-xs text-text-secondary dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-100 dark:border-gray-700">Synced Device</span>
                </div>
                <div className="p-6">
                    <div className="flex items-end justify-between h-32 gap-1.5 mb-4">
                        {(() => {
                            const weeklyData = patientProfile.activity?.weeklyData || [40, 60, 85, 55, 90, 80, 95];
                            // Calculate average to determine high vs low activity
                            const average = weeklyData.reduce((sum: number, val: number) => sum + val, 0) / weeklyData.length;
                            
                            return weeklyData.map((h: number, i: number) => {
                                // Green/teal for higher activity (above average), grey for lower activity
                                const isHighActivity = h >= average;
                                const barColor = isHighActivity 
                                    ? 'bg-primary dark:bg-teal-500' // Green/teal for high activity
                                    : 'bg-slate-300 dark:bg-slate-600'; // Grey for lower activity
                                
                                return (
                                    <div 
                                        key={i} 
                                        className={`flex-1 min-w-0 rounded-t-md hover:opacity-80 transition-opacity relative group ${barColor}`} 
                                        style={{height: `${h}%`}}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold pointer-events-none">
                                            {4000 + (h * 50)} steps
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div className="flex justify-between items-center mb-4 text-xs text-text-secondary dark:text-gray-500 font-medium">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div>
                            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Weekly Average</div>
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{patientProfile.activity?.weeklyAverage?.toLocaleString() || '8,200'} <span className="text-xs font-normal">Steps/day</span></div>
                        </div>
                        <div className="bg-white dark:bg-surface-dark size-8 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                            <Icon name="trending_up" className="text-lg" />
                        </div>
                    </div>
                    {patientProfile.rdmEarnings > 0 && (
                      <p className="mt-3 text-xs text-text-secondary dark:text-gray-400 text-center">
                        <Icon name="stars" className="text-sm align-bottom text-amber-500 mr-1" />
                        Patient earned <span className="font-bold text-text-main dark:text-white">+{patientProfile.rdmEarnings} RDM</span> this week for activity.
                      </p>
                    )}
                </div>
            </div>

            {/* Vitals Snapshot */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="vital_signs" className="text-red-500" />
                        Vitals Snapshot
                    </h3>
                </div>
                <div className="p-5 grid grid-cols-1 gap-4">
                    {[
                        { icon: 'cardiology', color: 'text-red-500', label: 'Blood Pressure', value: patientProfile.vitals?.bloodPressure || '120/80 mmHg', status: 'Normal', statusColor: 'green' },
                        { icon: 'monitor_heart', color: 'text-pink-500', label: 'Heart Rate', value: `${heartRate || patientProfile.vitals?.heartRate || 72} bpm`, status: 'Resting', statusColor: 'gray' },
                        { icon: 'scale', color: 'text-blue-500', label: 'Weight', value: patientProfile.vitals?.weight || '78 kg', status: 'Trending Down', statusColor: 'teal', statusIcon: 'trending_down' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-white dark:bg-surface-dark rounded-lg shadow-sm ${item.color}`}>
                                    <Icon name={item.icon} />
                                </div>
                                <div>
                                    <div className="text-xs text-text-secondary dark:text-gray-400">{item.label}</div>
                                    <div className="text-sm font-bold text-text-main dark:text-white">{item.value}</div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                                item.statusColor === 'green' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' :
                                item.statusColor === 'teal' ? 'text-teal-600 dark:text-teal-400' :
                                'text-gray-400'
                            }`}>
                                {item.status}
                                {item.statusIcon && <Icon name={item.statusIcon} className="text-sm" />}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Middle Column */}
        <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Active Prescriptions */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="pill" className="text-teal-600 dark:text-teal-400" />
                        Active Prescriptions
                    </h3>
                    <button className="text-xs font-bold text-primary hover:underline">Manage</button>
                </div>
                <div className="p-5 flex flex-col gap-5">
                    {[
                        { name: 'Metformin (500mg)', adherence: '98% (High)', refills: 2, color: 'green', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBswOt6UPmS-mEUYCcV1Ecyov3j8hiIRMnZKCXRWPrljUtaAWcfLDdT-Nz6C91yIJ2Bnl6LFM4SNgzdH359txE6vNB2J-mG42B5bMwBDEuQKIUU6XXXum0lv75zRALSdopUlWY9P0iPzIFlXPXdC99Bna6_JLjn7RieZD5o1OgKe_UIHcDB3XGNu6gzDFL3lfh2VrpYStN6E8BQUjSHvzB0GVqR3pzlLMH2LQiJ7N0JltLexxINK59IbTWegWQjgw1z_gI_brJVayk' },
                        { name: 'Lisinopril (10mg)', adherence: '85% (Med)', refills: 1, color: 'yellow', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcw1RKMIjeFMU2lhzxnpt_1JLdguZreG31lzNj7NJ32SHcWztK4Dxp8S-k_kiDJu1qa9U9HjLu1PRamVTrle0xDCN4zJvODm3oe1CfDEzC09zkqXQ7TLAchqVNcnUa19bCiVTX40oH-scfzEG9sOzPGmnFf8XS0VMxllyjjk0FSFGy5uKOoUI9dmkZsR6QNQ42DcMRcvFRUfMliY1qT0RXFPu_8rfHr8x9uRDJybIK2ufalUeYGsW537pIphyeGwF9ArZL7IpU2Q4' },
                        { name: 'Atorvastatin (20mg)', adherence: '95% (High)', status: 'Needs Renewal', color: 'green', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBczYy3d2nRwe5WKMsVxRWbnTVx0fyqK1pKPjb94L3FYU1hv_-E02Ps4vLFt94lWZ3X4lZ9xWiRH6IAIEjWBKLijZbH9IPtU6t0W45UUcoUbVu1fknqju8WXcFBDWcWGlENazgPyLk_N0UojPQ5VGzL6dgoxKNZxzjjFhz2_AUdYPMCq685z22f38V-HUjq9IWcwikc2Kez4OUvSXxZGkyW_-GxS3bEvjkcxazCI95fLSqgKnlMPGnOU-3E4l2hzukvQ4-BkdtrTqU' }
                    ].map((med, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="size-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
                                <img alt={med.name} className="w-full h-full object-cover" src={med.img} />
                            </div>
                            <div className={`flex-1 relative pl-3 border-l-2 ${med.color === 'green' ? 'border-green-500' : 'border-yellow-400'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-text-main dark:text-white text-sm leading-tight">{med.name}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                        med.color === 'green' 
                                        ? 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800' 
                                        : 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800'
                                    }`}>{med.adherence}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-text-secondary dark:text-gray-400 mb-1.5">
                                    <span>Daily</span>
                                    {med.status ? (
                                        <span className="font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">{med.status}</span>
                                    ) : (
                                        <span className="font-medium text-text-main dark:text-gray-300">Refills: {med.refills}</span>
                                    )}
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className={`${med.color === 'green' ? 'bg-green-500' : 'bg-yellow-400'} h-1.5 rounded-full`} style={{width: med.adherence.split('%')[0] + '%'}}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visit History */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="history" className="text-indigo-500" />
                        Visit History
                    </h3>
                </div>
                <div className="p-5">
                    <div className="relative pl-4 border-l border-gray-200 dark:border-gray-700 space-y-6">
                        {[
                            { date: 'Oct 10, 2023', title: 'Flu Vaccination', sub: 'Administered at Main Clinic.', type: 'verified', color: 'green' },
                            { date: 'Sep 15, 2023', title: 'Cardiology Check-up', sub: 'Dr. Sarah Smith', type: 'avatar', color: 'blue' },
                            { date: 'Aug 01, 2023', title: 'Emergency Room', sub: 'Chest Pain', type: 'tag', color: 'red' }
                        ].map((visit, i) => (
                            <div key={i} className="relative group">
                                <div className={`absolute -left-[21px] mt-1.5 size-2.5 rounded-full border border-white dark:border-surface-dark ring-4 ring-${visit.color}-50 dark:ring-${visit.color}-900/20 bg-${visit.color}-500`}></div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase">{visit.date}</span>
                                        {visit.type === 'verified' && <Icon name="verified" className="text-green-600 text-[16px]" />}
                                    </div>
                                    <h4 className="text-sm font-bold text-text-main dark:text-white">{visit.title}</h4>
                                    {visit.type === 'avatar' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="size-5 rounded-full bg-gray-200 bg-cover" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDbWZ9E9yo5FQXr95YMQj-cU6OY4a21LnQ4mKgLpYPttBpIyz8mbF2Mi1rGcnsf-YzPZMXRw3J5cuocyMf494tcA3fyS4Ib_cUlEkH9pvK36Cv6cldfAmdDM5w8aIYVeMjLqzv9qXcEYbC9KB4qQh50--Vk64f80nL6W2yhOkRUK1G13OPH2b7QnXmbgealchHceTMP4DCqeRjFBnCSLtbTQ7KDvd0W0z0hetJsZ4M5-xO1avEQt8DFaNGhYbyaRgQBphTjJ7SNr8U')"}}></div>
                                            <p className="text-xs text-text-secondary dark:text-gray-400">{visit.sub}</p>
                                        </div>
                                    ) : visit.type === 'tag' ? (
                                        <span className="inline-block px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-[10px] font-bold rounded w-fit mt-1">{visit.sub}</span>
                                    ) : (
                                        <p className="text-xs text-text-secondary dark:text-gray-400">{visit.sub}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Next Appointment */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="calendar_month" className="text-text-secondary dark:text-gray-400" />
                        Next Appointment
                    </h3>
                    <p className="text-red-600 dark:text-red-400 text-xs font-bold mt-1 flex items-center gap-1">
                        <Icon name="error" className="text-sm" />
                        Overdue by 2 weeks
                    </p>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                        <Icon name="edit_calendar" />
                        Schedule Next Visit
                    </button>
                    <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-text-main dark:text-white">November 2023</span>
                            <div className="flex gap-1">
                                <Icon name="chevron_left" className="text-text-secondary cursor-pointer hover:text-text-main text-sm" />
                                <Icon name="chevron_right" className="text-text-secondary cursor-pointer hover:text-text-main text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-text-secondary mb-1">
                            <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {/* Simple Calendar Grid Mockup */}
                            {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((d, i) => (
                                <div key={i} className={`p-1 rounded cursor-pointer 
                                    ${d === 7 ? 'bg-white dark:bg-surface-dark border border-teal-500 text-teal-600 font-bold shadow-sm' : 
                                      (d === 15 || d === 16) ? 'bg-teal-600 text-white hover:bg-teal-700' : 
                                      'hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                    {d}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Notes */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-gray-100 dark:border-[#2a3e3d] shadow-sm flex-1 flex flex-col">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="edit_note" className="text-text-secondary" />
                        Quick Notes
                    </h3>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <textarea className="w-full flex-1 bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-700 rounded-xl text-sm p-3 focus:ring-teal-500 focus:border-teal-500 resize-none placeholder:text-gray-400 outline-none transition-all text-text-main dark:text-white min-h-[150px]" placeholder="Add internal clinical note..."></textarea>
                    <div className="mt-3 flex justify-end">
                        <button className="text-xs font-bold text-text-secondary hover:text-teal-600 transition-colors uppercase tracking-wide">Save Note</button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Floating Footer Actions */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-[#2a3e3d] shadow-lg flex flex-col sm:flex-row justify-end gap-3 sticky bottom-4 z-10 mx-auto w-full max-w-[1600px]">
        <button className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-text-main dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
            <Icon name="description" />
            Generate Health Report
        </button>
        <button className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2">
            <Icon name="update" />
            Update Care Plan
        </button>
      </div>
    </div>
  );
};