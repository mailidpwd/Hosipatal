
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/api/adminService';
import { Icon } from '@/components/UI';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AdminAnalytics = () => {
  const { user, isLoading: authLoading } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;
  const [activeView, setActiveView] = useState<'scorecard' | 'budget' | 'remorse'>('budget');

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
      try {
        sessionStorage.setItem('adminId', adminId);
      } catch {
        // Ignore storage errors
      }
    }
  }, [adminId]);
  
  const stableAdminId = adminId || adminIdRef.current || getStoredAdminId();
  
  // Debug logging
  React.useEffect(() => {
    console.log('[AdminAnalytics] User:', user);
    console.log('[AdminAnalytics] AdminId:', adminId);
    console.log('[AdminAnalytics] StableAdminId:', stableAdminId);
    console.log('[AdminAnalytics] AuthLoading:', authLoading);
  }, [user, adminId, stableAdminId, authLoading]);

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics', stableAdminId, activeView],
    queryFn: async () => {
      const currentAdminId = stableAdminId || adminId;
      console.log('[AdminAnalytics] Fetching analytics with adminId:', currentAdminId, 'view:', activeView);
      if (!currentAdminId) {
        throw new Error('Admin ID is required');
      }
      const result = await adminService.getAnalytics(currentAdminId, activeView);
      console.log('[AdminAnalytics] ✅ Received analytics data:', result);
      console.log('[AdminAnalytics] View:', result?.view);
      return result;
    },
    refetchInterval: 120000, // Refetch every 2 minutes
    enabled: !!stableAdminId && !authLoading,
    retry: 3,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <p className="ml-4 text-slate-500">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <p className="font-bold mb-2">Error loading analytics data</p>
        <p className="text-sm">{error instanceof Error ? error.message : String(error)}</p>
        {!stableAdminId && <p className="text-xs mt-2 text-slate-500">Admin ID not found. Please ensure you are logged in as an admin.</p>}
      </div>
    );
  }

  if (!analyticsData || typeof analyticsData !== 'object' || !analyticsData.view) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="font-bold mb-2">No analytics data available</p>
        <p className="text-sm">The server returned an empty response.</p>
        {!stableAdminId && <p className="text-xs mt-2 text-slate-400">Admin ID: {adminId || 'Not found'}</p>}
      </div>
    );
  }
  
  // Ensure all required fields exist with defaults based on view
  const safeAnalyticsData = {
    view: analyticsData.view,
    budget: analyticsData.budget || {
      totalMonthly: 1000000,
      currentlySpent: 0,
      spentPercentage: 0,
      projectedStatus: 'on_track' as const,
      projectedDay: null,
      costEfficiency: 120,
    },
    scorecard: analyticsData.scorecard || {
      adherence: 85,
      satisfaction: 90,
      safety: 90,
      efficiency: 88,
    },
    hotspots: analyticsData.hotspots || [],
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Icon name="analytics" className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ADMINISTRATOR VIEW</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        {activeView === 'scorecard' && 'Strategic Departmental Scorecard'}
                        {activeView === 'budget' && 'RDM Budget Utilization'}
                        {activeView === 'remorse' && 'Remorse Hotspots Analysis'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
                        {activeView === 'scorecard' && 'Holistic matrix view of hospital performance, risk hotspots, and budget allocation.'}
                        {activeView === 'budget' && 'Manage token supply, burn rates, and departmental cost efficiency.'}
                        {activeView === 'remorse' && 'Real-time identification of compliance risks and training opportunities.'}
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    {/* Scope Toggle */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">SCOPE</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button className="px-3 py-1.5 bg-white dark:bg-surface-dark shadow-sm rounded-md text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Icon name="domain" className="text-sm" /> All Departments
                            </button>
                            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-2">
                                <Icon name="compare_arrows" className="text-sm" /> Compare Selected
                            </button>
                        </div>
                    </div>

                    {/* Metric Focus Toggle */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">METRIC FOCUS</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                            <button 
                                onClick={() => setActiveView('scorecard')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors ${activeView === 'scorecard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-surface-dark'}`}
                            >
                                <Icon name="grid_view" className="text-sm" /> RDM Scorecard
                            </button>
                            <button 
                                onClick={() => setActiveView('budget')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors ${activeView === 'budget' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-surface-dark'}`}
                            >
                                <Icon name="account_balance_wallet" className="text-sm" /> Budget Util
                            </button>
                            <button 
                                onClick={() => setActiveView('remorse')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors ${activeView === 'remorse' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-surface-dark'}`}
                            >
                                <Icon name="warning" className="text-sm" /> Remorse Hotspots
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* ------------------- VIEW: BUDGET UTILIZATION ------------------- */}
        {activeView === 'budget' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">TOTAL MONTHLY BUDGET</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{safeAnalyticsData.budget.totalMonthly.toLocaleString()} RDM</h3>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">
                                <Icon name="trending_up" className="text-xs" /> Allocated Q4
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Icon name="account_balance" className="text-6xl text-slate-900 dark:text-white" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CURRENTLY SPENT</p>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{safeAnalyticsData.budget?.spentPercentage || 0}%</span>
                            </div>
                            <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-4">{safeAnalyticsData.budget?.currentlySpent.toLocaleString() || '0'} RDM</h3>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{width: `${safeAnalyticsData.budget?.spentPercentage || 0}%`}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border-l-[6px] border-l-orange-500 border border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700 shadow-sm">
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">PROJECTED STATUS</p>
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="warning" className="text-orange-500 text-xl" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {safeAnalyticsData.budget?.projectedStatus === 'overspend_risk' ? 'Overspend Risk' : 'On Track'}
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-tight">
                            {safeAnalyticsData.budget?.projectedStatus === 'overspend_risk' && safeAnalyticsData.budget?.projectedDay ? (
                                <>On track to exceed allocation by <span className="font-bold text-slate-900 dark:text-white">Day {safeAnalyticsData.budget.projectedDay}</span> at current burn rate.</>
                            ) : (
                                <>Budget utilization is within expected range.</>
                            )}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">COST EFFICIENCY</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{safeAnalyticsData.budget?.costEfficiency || 0} RDM</h3>
                        <p className="text-xs text-slate-500 mb-2">Avg. Cost per Patient Success</p>
                        <p className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                            <Icon name="arrow_downward" className="text-xs" /> 3% vs last month
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Main Chart */}
                    <div className="lg:col-span-8 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col min-h-[450px] lg:h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">RDM Burn Rate (Trends)</h3>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <div className="w-4 h-0.5 bg-slate-400 border-t border-slate-400 border-dashed"></div> Planned Spend
                                </div>
                                <div className="flex items-center gap-2 text-blue-600">
                                    <div className="w-4 h-4 bg-blue-600 rounded-sm"></div> Actual Spend
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 relative w-full h-full min-h-0">
                            <p className="text-[10px] text-slate-400 mb-2">Planned vs. Actual Spend Analysis</p>
                            
                            {/* SVG Chart - Adjusted viewBox height to 350 to accommodate labels at y=320 */}
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 350" preserveAspectRatio="none">
                                {/* Grid Lines */}
                                <line x1="0" y1="0" x2="800" y2="0" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                                <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                                <line x1="0" y1="200" x2="800" y2="200" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                                <line x1="0" y1="300" x2="800" y2="300" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-700" />

                                {/* Y-Axis Labels */}
                                <text x="-10" y="10" textAnchor="end" className="text-[10px] fill-slate-400">1M</text>
                                <text x="-10" y="200" textAnchor="end" className="text-[10px] fill-slate-400">500k</text>
                                <text x="-10" y="300" textAnchor="end" className="text-[10px] fill-slate-400">0</text>

                                {/* Planned Spend (Dashed) */}
                                <path d="M0,300 L800,0" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />

                                {/* Actual Spend (Area) */}
                                <defs>
                                    <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,300 L400,150 L420,50 L700,20" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                                <path d="M0,300 L400,150 L420,50 L700,20 V300 H0 Z" fill="url(#spendGradient)" stroke="none" />

                                {/* Spike Point */}
                                <circle cx="420" cy="50" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
                                
                                {/* X-Axis Labels - Now properly contained within viewBox */}
                                <text x="20" y="320" textAnchor="middle" className="text-[10px] fill-slate-400">Oct 1</text>
                                <text x="200" y="320" textAnchor="middle" className="text-[10px] fill-slate-400">Oct 8</text>
                                <text x="420" y="320" textAnchor="middle" className="text-[10px] fill-blue-600 font-bold">Oct 15</text>
                                <text x="600" y="320" textAnchor="middle" className="text-[10px] fill-slate-400">Oct 22</text>
                                <text x="780" y="320" textAnchor="middle" className="text-[10px] fill-slate-400">Oct 29</text>
                            </svg>
                        </div>

                        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-3 z-10 relative">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600">
                                <Icon name="ssid_chart" className="text-lg" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                                    <span className="font-bold">Insight:</span> Cardiology spending spiked on <span className="font-bold">Oct 15th</span> (Double Reward Week), causing deviation from the planned curve.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Smart Allocation Sidebar */}
                    <div className="lg:col-span-4 bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <Icon name="psychology" className="text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Allocation</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            AI-driven budget redistribution suggestions to maximize ROI and prevent departmental shortages.
                        </p>

                        <div className="flex-1">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">AI Suggestion</div>
                                
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-4">
                                    Move <span className="text-indigo-600 dark:text-indigo-400 font-bold">15,000 RDM</span> from Orthopedics to Cardiology to sustain high performance momentum.
                                </p>

                                <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-100 dark:border-green-900/30 flex items-center gap-2 mb-6">
                                    <Icon name="trending_up" className="text-green-600 text-sm" />
                                    <span className="text-xs font-bold text-green-700 dark:text-green-300">Projected ROI Impact: +12%</span>
                                </div>

                                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                                    <Icon name="auto_fix_high" />
                                    Apply Allocation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ------------------- VIEW: REMORSE HOTSPOTS ------------------- */}
        {activeView === 'remorse' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
                        <div className="size-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
                            <Icon name="money_off" className="text-2xl text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL REMORSE DEDUCTIONS</p>
                            <h3 className="text-3xl font-black text-red-600 dark:text-red-400">-85,400 RDM</h3>
                            <p className="text-xs text-slate-500 mt-1">Current month to date</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
                        <div className="size-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
                            <Icon name="shield" className="text-2xl text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TOP VIOLATION</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Hygiene Protocol Missed</h3>
                            <span className="inline-block mt-2 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">45% of penalties</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
                        <div className="size-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                            <Icon name="groups" className="text-2xl text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MOST 'REMORSEFUL' ROLE</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Night Shift Nurses</h3>
                            <p className="text-xs text-slate-500 mt-1">High incident rate 2am - 5am</p>
                        </div>
                    </div>
                </div>

                {/* Risk Map */}
                <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Icon name="ssid_chart" className="text-slate-500" />
                            Hospital Ward Risk Map (Live)
                        </h3>
                        <div className="flex gap-4 text-xs font-bold">
                            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500"></span> Critical Risk</span>
                            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400"></span> Warning</span>
                            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500"></span> Compliant</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* ICU */}
                        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm relative group h-40 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                                    <Icon name="favorite" /> ICU
                                </div>
                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Score: 98/100</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Violations Today</p>
                                <p className="text-3xl font-black text-emerald-600">0</p>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500"></div>
                        </div>

                        {/* Pharmacy */}
                        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group h-40 flex flex-col justify-between hover:shadow-md transition-shadow opacity-75">
                            <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
                                <Icon name="local_pharmacy" /> Pharmacy
                            </div>
                            <div className="flex items-center justify-center flex-1">
                                <span className="text-sm font-medium text-slate-400">Normal Operations</span>
                            </div>
                        </div>

                        {/* Ward B (Critical) */}
                        <div className="md:col-span-2 bg-red-50/50 dark:bg-red-900/10 p-6 rounded-xl border-2 border-red-500 shadow-lg relative h-40 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200 text-lg">
                                    <Icon name="warning" className="text-red-600" /> Ward B (Orthopedics)
                                </div>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm animate-pulse">CRITICAL</span>
                            </div>
                            
                            <div className="flex gap-4 mt-2">
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3 border border-red-100 dark:border-red-900/30">
                                    <p className="text-[10px] font-bold text-red-600 uppercase mb-1">HYGIENE MISSES</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">15 <span className="text-xs font-medium text-slate-500">today</span></p>
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-3 border border-red-100 dark:border-red-900/30">
                                    <p className="text-[10px] font-bold text-red-600 uppercase mb-1">LATE LOGS</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">45 <span className="text-xs font-medium text-slate-500">incidents</span></p>
                                </div>
                            </div>
                        </div>

                        {/* ER Waiting */}
                        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 shadow-sm relative group h-40 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
                                    <Icon name="emergency" /> ER Waiting Room
                                </div>
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">Warning</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-tight">Overcrowding leading to protocol drift.</p>
                        </div>

                        {/* Radiology */}
                        <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group h-40 flex flex-col justify-between">
                            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                <Icon name="radiology" /> Radiology
                            </div>
                            <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                                <span className="size-2 rounded-full bg-red-500"></span> 1 Critical Issue
                            </p>
                        </div>

                        {/* Corridor */}
                        <div className="md:col-span-2 bg-slate-100 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner relative h-40 flex items-center justify-center">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">General Ward Corridor A</p>
                        </div>
                    </div>
                </div>

                {/* Bottom List */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Compliance Failures</h3>
                        <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            View All Incidents <Icon name="arrow_forward" className="text-sm" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">VIOLATION TYPE</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">DEPT / LOCATION</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">FREQUENCY</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ROOT CAUSE ESTIMATE</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">SYSTEM ACTION RECOMMENDATION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {safeAnalyticsData.hotspots && safeAnalyticsData.hotspots.length > 0 ? (
                                    safeAnalyticsData.hotspots.map((hotspot, index) => (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{hotspot.type}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Ward B (Entrance)</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${
                                                    hotspot.severity === 'high' ? 'text-red-600' :
                                                    hotspot.severity === 'medium' ? 'text-amber-500' :
                                                    'text-slate-500'
                                                }`}>
                                                    {hotspot.count}/day
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">Shift Changeover Rush</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100">
                                                    Deploy Nudge Notification
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No remorse hotspots found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* ------------------- VIEW: SCORECARD (EXISTING) ------------------- */}
        {activeView === 'scorecard' && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Overall Scorecard Metrics */}
                {safeAnalyticsData.scorecard && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Adherence</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{safeAnalyticsData.scorecard.adherence}%</h3>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Satisfaction</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{safeAnalyticsData.scorecard.satisfaction}%</h3>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Safety</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{safeAnalyticsData.scorecard.safety}%</h3>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Efficiency</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{safeAnalyticsData.scorecard.efficiency}%</h3>
                        </div>
                    </div>
                )}
                {/* Master Scorecard */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Departmental Master Scorecard (Q4)</h3>
                        <button className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                            Export Report <Icon name="download" className="text-sm" />
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">DEPARTMENT</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Icon name="sentiment_satisfied" className="text-sm" /> PATIENT EXP</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1"><Icon name="sanitizer" className="text-sm" /> SAFETY & HYGIENE</span></th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1"><Icon name="warning" className="text-sm text-amber-500" /> REMORSE RATE</span></th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1"><Icon name="medical_services" className="text-sm" /> STAFF ENG.</span></th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"><span className="flex items-center gap-1"><Icon name="payments" className="text-sm" /> BUDGET USED</span></th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {/* Cardiology */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="size-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Cardiology</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded">4.8 / 5.0</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{width: '98%'}}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">98%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs text-slate-500">Low (2%)</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-emerald-600">High</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">85%</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="text-slate-400 hover:text-blue-500 transition-colors"><Icon name="search" /></button>
                                    </td>
                                </tr>

                                {/* Pediatrics */}
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="size-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Pediatrics</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded">4.9 / 5.0</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{width: '99%'}}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">99%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs text-slate-500">Low (1%)</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-emerald-600">High</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">90%</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="text-slate-400 hover:text-blue-500 transition-colors"><Icon name="search" /></button>
                                    </td>
                                </tr>

                                {/* Orthopedics */}
                                <tr className="bg-red-50/10 hover:bg-red-50/20 transition-colors group border-l-4 border-l-red-500">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Orthopedics</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-1 rounded">3.5 / 5.0</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full" style={{width: '82%'}}></div>
                                            </div>
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">82%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded w-fit">
                                            <Icon name="warning" className="text-red-500 text-xs" />
                                            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">High (12%)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-bold text-slate-400">Low</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">40%</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="text-slate-400 hover:text-blue-500 transition-colors"><Icon name="search" /></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Remorse Triggers */}
                    <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Remorse Triggers by Dept</h3>
                                <p className="text-xs text-slate-500">Breakdown of safety misses and procedural errors this week.</p>
                            </div>
                            <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                                <div className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500"></span> Hygiene Missed</div>
                                <div className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400"></span> Late Docs</div>
                                <div className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-400"></span> Patient Complaint</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Row 1 */}
                            <div className="flex items-center gap-4">
                                <span className="w-24 text-xs font-bold text-slate-600 dark:text-slate-300 text-right">Orthopedics</span>
                                <div className="flex-1 h-8 rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold" style={{width: '65%'}}>Hygiene (65%)</div>
                                    <div className="h-full bg-amber-400 flex items-center justify-center text-[10px] text-white font-bold" style={{width: '20%'}}></div>
                                    <div className="h-full bg-blue-400 flex items-center justify-center text-[10px] text-white font-bold" style={{width: '15%'}}></div>
                                </div>
                                <span className="text-xs font-bold text-red-600">High</span>
                            </div>

                            {/* Row 2 */}
                            <div className="flex items-center gap-4">
                                <span className="w-24 text-xs font-bold text-slate-600 dark:text-slate-300 text-right">Emergency</span>
                                <div className="flex-1 h-8 rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold" style={{width: '10%'}}></div>
                                    <div className="h-full bg-amber-400 flex items-center justify-center text-[10px] text-white font-bold" style={{width: '70%'}}>Late Docs (70%)</div>
                                    <div className="h-full bg-blue-400 flex items-center justify-center text-[10px] text-white font-bold" style={{width: '20%'}}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">Med</span>
                            </div>

                            {/* Row 3 */}
                            <div className="flex items-center gap-4">
                                <span className="w-24 text-xs font-bold text-slate-600 dark:text-slate-300 text-right">Pediatrics</span>
                                <div className="flex-1 h-8 rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                                    <div className="h-full bg-red-500" style={{width: '5%'}}></div>
                                    <div className="h-full bg-amber-400" style={{width: '10%'}}></div>
                                    <div className="h-full bg-blue-400" style={{width: '15%'}}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">Low</span>
                            </div>
                        </div>
                    </div>

                    {/* Safety Alert Panel */}
                    <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-2xl border-l-[6px] border-red-500 border-y border-r border-slate-200 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                <Icon name="verified_user" className="text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Safety Alert</h3>
                        </div>

                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">ORTHOPEDICS DEPT</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                            <span className="font-bold text-slate-900 dark:text-white">15 Hygiene violations</span> detected this week. Correlation with shift changeover is high.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">RECOMMENDED ACTION</p>
                            <p className="text-xs font-medium text-slate-800 dark:text-white">Initiate On-site Hygiene Protocol Training immediately.</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
