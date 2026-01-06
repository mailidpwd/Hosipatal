
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { adminService, type CommandCenterData } from '@/services/api/adminService';
import { Icon } from '@/components/UI';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Demo data for command center (fallback when API is slow)
const getDemoCommandCenterData = (): CommandCenterData => {
  return {
    patientExperience: 87,
    clinicalDiscipline: 92,
    safetyHygiene: 89,
    staffEngagement: 85,
    esgCharity: 78,
    careRadar: {
      accuracy: 88,
      empathy: 85,
      timeliness: 82,
      hygiene: 90,
      compliance: 87,
    },
    loopStatus: 'healthy',
    roleContribution: {
      doctors: 45,
      nurses: 35,
      techs: 20,
    },
    journeyBottleneck: {
      detected: false,
      message: null,
    },
    remorseLearning: {
      trigger: 'Patient feedback score below 3.5',
      frequency: 'Weekly review',
      description: 'Automated analysis of patient satisfaction trends',
      systemAction: 'Alert sent to care team coordinator',
    },
    esgImpact: {
      freeSurgeries: 12,
      medicalWasteReduction: 23,
    },
  };
};

export const HospitalCommandCenter = () => {
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
  const adminIdRef = React.useRef<string | undefined>(adminId || getStoredAdminId());
  
  React.useEffect(() => {
    if (adminId) {
      adminIdRef.current = adminId;
      // Store in sessionStorage so other pages can access it
      try {
        sessionStorage.setItem('adminId', adminId);
      } catch {
        // Ignore storage errors
      }
    }
  }, [adminId]);
  
  // Use ref value for query to prevent disabling when user becomes null temporarily
  const stableAdminId = adminId || adminIdRef.current || getStoredAdminId();
  
  // Debug logging
  React.useEffect(() => {
    console.log('[HospitalCommandCenter] User:', user);
    console.log('[HospitalCommandCenter] AdminId:', adminId);
    console.log('[HospitalCommandCenter] StableAdminId:', stableAdminId);
    console.log('[HospitalCommandCenter] AuthLoading:', authLoading);
  }, [user, adminId, stableAdminId, authLoading]);

  const { data: commandData, isLoading, error, isError } = useQuery({
    queryKey: ['admin', 'commandCenter', stableAdminId],
    queryFn: async () => {
      const currentAdminId = stableAdminId || adminId || 'admin-1';
      try {
        console.log('[HospitalCommandCenter] Fetching command center data for adminId:', currentAdminId);
        
        // Short timeout (1.5 seconds) - if API doesn't respond quickly, use demo data
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 1500);
        });
        
        const data = await Promise.race([
          adminService.getCommandCenter(currentAdminId),
          timeoutPromise,
        ]) as CommandCenterData;
        
        console.log('[HospitalCommandCenter] ✅ Received data:', data);
        console.log('[HospitalCommandCenter] Data type:', typeof data);
        console.log('[HospitalCommandCenter] Data keys:', data ? Object.keys(data) : 'no keys');
        
        if (!data || typeof data !== 'object') {
          console.error('[HospitalCommandCenter] ❌ Invalid data received:', data);
          throw new Error('No data returned from server or invalid data format');
        }
        
        // Validate required fields
        if (!('patientExperience' in data) || !('clinicalDiscipline' in data)) {
          console.error('[HospitalCommandCenter] ❌ Missing required fields in data:', data);
          throw new Error('Invalid data structure: missing required fields');
        }
        
        return data;
      } catch (err: any) {
        console.warn('[HospitalCommandCenter] API call failed, using demo data:', err?.message);
        // Return demo data immediately if API fails (for demo mode or network issues)
        const demoData = getDemoCommandCenterData();
        console.log('[HospitalCommandCenter] Using demo data:', demoData);
        return demoData;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !authLoading, // Always fetch once auth is done
    retry: false, // Don't retry - use demo data immediately on failure
    staleTime: 0, // Always consider data fresh for demo mode
  });

  // Calculate Care Radar polygon points
  const radarPoints = useMemo(() => {
    if (!commandData?.careRadar) return null;
    const { accuracy, empathy, timeliness, hygiene, compliance } = commandData.careRadar;
    const centerX = 50;
    const centerY = 50;
    const maxRadius = 40;
    
    // Normalize values to 0-1 scale (assuming max is 100)
    const normalize = (val: number) => (val / 100) * maxRadius;
    
    // Calculate points for 5-axis radar (pentagon)
    const angles = [0, 72, 144, 216, 288].map(deg => (deg - 90) * (Math.PI / 180)); // Start from top
    const values = [accuracy, empathy, timeliness, hygiene, compliance];
    
    const points = angles.map((angle, i) => {
      const radius = normalize(values[i]);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    
    return points;
  }, [commandData?.careRadar]);

  // Show loading while auth is loading or query is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <p className="ml-4 text-slate-500">Loading command center data...</p>
      </div>
    );
  }

  // Show error state with helpful debugging info
  if (isError || error) {
    console.error('[HospitalCommandCenter] Error details:', error);
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <p className="font-bold mb-2">Error loading command center data</p>
        <p className="text-sm mb-4">{error instanceof Error ? error.message : String(error)}</p>
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          {!adminId && <p>❌ Admin ID not found. Please ensure you are logged in as an admin.</p>}
          {adminId && <p>✅ Admin ID: {adminId}</p>}
          {user && <p>✅ User role: {user.role}</p>}
          <p className="mt-4">Please check the browser console and server logs for more details.</p>
        </div>
      </div>
    );
  }

  // If we get here without data, it means the query succeeded but returned undefined/null
  // This can happen if the query was disabled or the data was cleared
  if (!commandData) {
    // If we have an adminId but no data, the query might be disabled
    if (adminId && !isLoading && !error) {
      console.warn('[HospitalCommandCenter] Query succeeded but no data received. Query might be disabled or data cleared.');
      return (
        <div className="p-6 text-center text-slate-500">
          <p className="font-bold mb-2">No command center data available</p>
          <p className="text-sm mb-4">The query completed but no data was returned.</p>
          <div className="text-xs text-slate-400 space-y-1">
            <p>Admin ID: {adminId}</p>
            <p>Query enabled: {String(!!adminId && !authLoading)}</p>
            <p>Please check the browser console and server logs for more information.</p>
          </div>
        </div>
      );
    }
    
    // If no adminId, show different message
    if (!adminId) {
      return (
        <div className="p-6 text-center text-slate-500">
          <p className="font-bold mb-2">Admin authentication required</p>
          <p className="text-sm mb-4">Please ensure you are logged in as an admin.</p>
          <div className="text-xs text-slate-400 space-y-1">
            <p>User: {user ? JSON.stringify(user) : 'null'}</p>
            <p>Auth loading: {String(authLoading)}</p>
          </div>
        </div>
      );
    }
    
    // Fallback
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="font-bold mb-2">Loading command center data...</p>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-6 max-w-[1800px] mx-auto w-full flex flex-col gap-5 h-full animate-[fadeIn_0.5s_ease-out]">
        <style>{`
            .radar-grid circle { fill: none; stroke: #e5e7eb; stroke-width: 1; }
            .radar-grid line { stroke: #e5e7eb; stroke-width: 1; }
            .radar-area { fill: rgba(13, 148, 136, 0.2); stroke: #0d9488; stroke-width: 2; }
            .radar-target { fill: none; stroke: #9ca3af; stroke-width: 1.5; stroke-dasharray: 4 2; }
            .dark .radar-grid circle { stroke: #374151; }
            .dark .radar-grid line { stroke: #374151; }
        `}</style>

        {/* Top Filter Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="admin_panel_settings" className="text-teal-600" />
                    Hospital Command Center (Patient & Staff RDM)
                </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="domain" className="text-slate-400 text-[18px]" />
                    </div>
                    <select className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-700 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800 min-w-[200px] cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors appearance-none outline-none">
                        <option>🏥 General Hospital (Main)</option>
                        <option>🫀 Cardiology Dept</option>
                        <option>🚑 ER</option>
                    </select>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="calendar_today" className="text-slate-400 text-[18px]" />
                    </div>
                    <select className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-700 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800 min-w-[140px] cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors appearance-none outline-none">
                        <option>This Week</option>
                        <option>Month</option>
                        <option>Quarter</option>
                    </select>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="group" className="text-teal-600 text-[18px]" />
                    </div>
                    <select className="text-sm border border-teal-200 dark:border-teal-800 rounded-lg py-2 pl-9 pr-8 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-teal-800 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 min-w-[160px] cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors shadow-sm appearance-none outline-none">
                        <option>👥 All Roles</option>
                        <option>👨‍⚕️ Doctors</option>
                        <option>👩‍⚕️ Nurses</option>
                        <option>🧪 Technicians</option>
                        <option>🤒 Patients</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="sentiment_satisfied" className="text-4xl text-teal-600" />
                </div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">Patient Experience</p>
                <div className="flex items-end justify-between mt-1">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{commandData.patientExperience.toFixed(1)}<span className="text-sm text-slate-400 font-medium">/5.0</span></h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <Icon name="check_circle" className="text-teal-500 text-xl" />
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Icon name="link" className="text-[12px] text-teal-500" /> Linked to Empathy Tokens
                    </p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="fact_check" className="text-4xl text-teal-600" />
                </div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">Clinical Discipline</p>
                <div className="flex items-end justify-between mt-1">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{commandData.clinicalDiscipline}% <span className="text-sm font-semibold text-slate-500">Adherence</span></h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <Icon name="verified" className="text-teal-500 text-xl" />
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Icon name="list_alt" className="text-[12px]" /> SOP & Protocol Checklists
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="shield" className="text-4xl text-teal-600" />
                </div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">Safety & Hygiene</p>
                <div className="flex items-end justify-between mt-1">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{commandData.safetyHygiene}%</h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <Icon name="soap" className="text-teal-500 text-xl" />
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Icon name="policy" className="text-[12px]" /> Audit Compliance
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="groups" className="text-4xl text-teal-600" />
                </div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">Staff Engagement</p>
                <div className="flex items-end justify-between mt-1">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{commandData.staffEngagement}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded dark:text-teal-300">Tokens/Avg</span>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Icon name="psychology" className="text-[12px]" /> Morale & Retention
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="volunteer_activism" className="text-4xl text-teal-600" />
                </div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">ESG & Charity</p>
                <div className="flex items-end justify-between mt-1">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${commandData.esgCharity}k <span className="text-sm font-semibold text-slate-500">Funded</span></h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <Icon name="favorite" className="text-teal-500 text-xl" />
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Icon name="public" className="text-[12px]" /> Community Impact
                    </p>
                </div>
            </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[340px]">
            {/* Radar Chart */}
            <div className="lg:col-span-4 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Care Radar</h3>
                    <div className="flex gap-2 text-[10px] font-medium">
                        <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full border border-slate-400 bg-transparent"></span> Target</span>
                        <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400"><span className="w-2 h-2 rounded-full bg-teal-600"></span> Actual</span>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center relative">
                    <div className="relative w-56 h-56">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <g className="radar-grid">
                                <circle cx="50" cy="50" r="10"></circle>
                                <circle cx="50" cy="50" r="20"></circle>
                                <circle cx="50" cy="50" r="30"></circle>
                                <circle cx="50" cy="50" r="40"></circle>
                                <line x1="50" x2="50" y1="10" y2="90"></line>
                                <line x1="10" x2="90" y1="50" y2="50"></line>
                                <line x1="22" x2="78" y1="22" y2="78"></line>
                                <line x1="22" x2="78" y1="78" y2="22"></line>
                            </g>
                            <polygon className="radar-target" points="50,15 85,38 75,80 25,80 15,38"></polygon>
                            {radarPoints && <polygon className="radar-area" points={radarPoints}></polygon>}
                        </svg>
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">Accuracy</span>
                        <span className="absolute top-[30%] right-[-10px] text-[9px] font-bold text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">Empathy</span>
                        <span className="absolute bottom-[20%] right-[-5px] text-[9px] font-bold text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">Timeliness</span>
                        <span className="absolute bottom-[20%] left-[-5px] text-[9px] font-medium text-slate-400 bg-white dark:bg-slate-800 px-1">Hygiene</span>
                        <span className="absolute top-[30%] left-[-15px] text-[9px] font-medium text-slate-400 bg-white dark:bg-slate-800 px-1">Compliance</span>
                    </div>
                </div>
            </div>

            {/* The Loop */}
            <div className="lg:col-span-4 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-900/10 pointer-events-none"></div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white text-center mb-4 z-10">The Loop</h3>
                <div className="flex-1 flex items-center justify-center z-10">
                    <div className="relative w-56 h-56">
                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" fill="none" r="40" stroke="#ccfbf1" strokeDasharray="50 200" strokeDashoffset="0" strokeWidth="8" className="dark:stroke-teal-900/30"></circle>
                            <circle cx="50" cy="50" fill="none" r="40" stroke="#5eead4" strokeDasharray="50 200" strokeDashoffset="-63" strokeWidth="8" className="dark:stroke-teal-700"></circle>
                            <circle cx="50" cy="50" fill="none" r="40" stroke="#14b8a6" strokeDasharray="50 200" strokeDashoffset="-126" strokeWidth="8" className="dark:stroke-teal-500"></circle>
                            <circle cx="50" cy="50" fill="none" r="40" stroke="#0f766e" strokeDasharray="50 200" strokeDashoffset="-189" strokeWidth="8" className="dark:stroke-teal-400"></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="size-24 rounded-full bg-white dark:bg-surface-dark shadow-lg flex flex-col items-center justify-center border border-teal-50 dark:border-teal-900 z-20">
                                <Icon name="health_and_safety" className={`text-3xl mb-1 ${
                                  commandData.loopStatus === 'healthy' ? 'text-teal-600 dark:text-teal-400' :
                                  commandData.loopStatus === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`} />
                                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">System</span>
                                <span className={`text-[10px] font-bold uppercase tracking-tight ${
                                  commandData.loopStatus === 'healthy' ? 'text-teal-600 dark:text-teal-400' :
                                  commandData.loopStatus === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {commandData.loopStatus === 'healthy' ? 'Healthy' :
                                   commandData.loopStatus === 'moderate' ? 'Moderate' :
                                   'Needs Attention'}
                                </span>
                            </div>
                        </div>
                        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-teal-100 dark:border-teal-900">COMMIT</span>
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-teal-100 dark:border-teal-900">ACT</span>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-teal-100 dark:border-teal-900">VERIFY</span>
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-teal-100 dark:border-teal-900">REWARD</span>
                    </div>
                </div>
            </div>

            {/* Role Contribution */}
            <div className="lg:col-span-4 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role Contribution</h3>
                    <span className="text-[10px] font-medium text-slate-400">Tokens Earned</span>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24 justify-end">
                            <Icon name="stethoscope" className="text-slate-400 text-sm" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Doctors</span>
                        </div>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-800 rounded-full" style={{ width: `${commandData.roleContribution.doctors}%` }}></div>
                        </div>
                        <span className="w-10 text-xs font-bold text-slate-900 dark:text-white text-right">{Math.round(commandData.roleContribution.doctors)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24 justify-end">
                            <Icon name="local_pharmacy" className="text-slate-400 text-sm" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Nurses</span>
                        </div>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${commandData.roleContribution.nurses}%` }}></div>
                        </div>
                        <span className="w-10 text-xs font-bold text-slate-900 dark:text-white text-right">{Math.round(commandData.roleContribution.nurses)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-24 justify-end">
                            <Icon name="science" className="text-slate-400 text-sm" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Techs</span>
                        </div>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${commandData.roleContribution.techs}%` }}></div>
                        </div>
                        <span className="w-10 text-xs font-bold text-slate-900 dark:text-white text-right">{Math.round(commandData.roleContribution.techs)}%</span>
                    </div>
                    <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-1">
                        <p className="text-[10px] text-slate-400">Comparing token velocity across core clinical roles.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Patient Journey Heatmap */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Icon name="alt_route" className="text-teal-600 text-lg" />
                    Patient Journey Heatmap
                </h3>
                <div className="flex-1 flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="size-8 rounded-full bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 flex items-center justify-center shadow-sm">
                            <Icon name="app_registration" className="text-[16px] text-teal-700 dark:text-teal-400" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Reg</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="size-8 rounded-full bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 flex items-center justify-center shadow-sm">
                            <Icon name="stethoscope" className="text-[16px] text-teal-700 dark:text-teal-400" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Consult</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="size-8 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 flex items-center justify-center shadow-sm relative">
                            <Icon name="radiology" className="text-[16px] text-yellow-700 dark:text-yellow-400" />
                            <span className="absolute -top-1 -right-1 size-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Diag</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="size-8 rounded-full bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500 flex items-center justify-center shadow-sm">
                            <Icon name="vaccines" className="text-[16px] text-teal-700 dark:text-teal-400" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Treat</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                        <div className="size-8 rounded-full bg-red-50 dark:bg-red-900/20 border-2 border-red-500 flex items-center justify-center shadow-sm relative">
                            <Icon name="logout" className="text-[16px] text-red-700 dark:text-red-400" />
                            <span className="absolute -top-1 -right-1 size-2 bg-red-500 rounded-full animate-pulse"></span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Discharge</span>
                    </div>
                </div>
                {commandData.journeyBottleneck.detected && commandData.journeyBottleneck.message && (
                    <div className="mt-4 p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                        <Icon name="warning" className="text-red-500 text-lg mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-red-700 dark:text-red-300">Bottleneck Detected</p>
                            <p className="text-[11px] text-red-600/80 dark:text-red-400/80">{commandData.journeyBottleneck.message}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Remorse & Learning */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Icon name="school" className="text-teal-600 text-lg" />
                    Remorse & Learning
                </h3>
                <div className="flex-1 flex flex-col gap-3">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-1 z-10 relative">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-600 dark:text-teal-400">Top Trigger</span>
                            <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded border border-teal-100 dark:border-teal-700">Frequency: {commandData.remorseLearning.frequency}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white z-10 relative">{commandData.remorseLearning.trigger}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 z-10 relative">{commandData.remorseLearning.description}</p>
                    </div>
                    <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="auto_awesome" className="text-teal-600 text-sm" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">System Action Taken</p>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{commandData.remorseLearning.systemAction}</p>
                    </div>
                </div>
            </div>

            {/* ESG Impact */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Icon name="eco" className="text-teal-600 text-lg" />
                    ESG Impact Realization
                </h3>
                <div className="flex-1 grid grid-rows-2 gap-3">
                    <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg p-3 text-white flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-2xl font-bold">{commandData.esgImpact.freeSurgeries}</p>
                            <p className="text-[11px] font-medium opacity-90">Free Surgeries Funded</p>
                        </div>
                        <Icon name="medical_services" className="text-3xl opacity-20" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1">{commandData.esgImpact.medicalWasteReduction}% <Icon name="arrow_downward" className="text-sm text-teal-500" /></p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Medical Waste Reduced</p>
                        </div>
                        <div className="size-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                            <Icon name="recycling" className="text-teal-600 dark:text-teal-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Icon name="info" className="text-sm" />
                <span>Actions taken here are logged in the immutable audit trail.</span>
            </div>
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors shadow-sm">
                    <Icon name="emoji_events" className="text-sm" />
                    Recognize Top Teams
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors shadow-sm">
                    <Icon name="school" className="text-sm" />
                    Trigger Training
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200/50">
                    <Icon name="payments" className="text-sm" />
                    Allocate Budget
                </button>
            </div>
        </div>
    </div>
  );
};
