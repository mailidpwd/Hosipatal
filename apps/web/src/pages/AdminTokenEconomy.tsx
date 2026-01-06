
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/api/adminService';
import { Icon } from '@/components/UI';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AdminTokenEconomy = () => {
  const { user, isLoading: authLoading } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
    console.log('[AdminTokenEconomy] User:', user);
    console.log('[AdminTokenEconomy] AdminId:', adminId);
    console.log('[AdminTokenEconomy] StableAdminId:', stableAdminId);
    console.log('[AdminTokenEconomy] AuthLoading:', authLoading);
  }, [user, adminId, stableAdminId, authLoading]);

  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ['admin', 'tokenEconomy', stableAdminId],
    queryFn: async () => {
      const currentAdminId = stableAdminId || adminId;
      console.log('[AdminTokenEconomy] Fetching token economy with adminId:', currentAdminId);
      if (!currentAdminId) {
        throw new Error('Admin ID is required');
      }
      const result = await adminService.getTokenEconomy(currentAdminId);
      console.log('[AdminTokenEconomy] ✅ Received token economy data:', result);
      return result;
    },
    refetchInterval: 60000, // Refetch every minute
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
        <p className="ml-4 text-slate-500">Loading token economy data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <p className="font-bold mb-2">Error loading token economy data</p>
        <p className="text-sm">{error instanceof Error ? error.message : String(error)}</p>
        {!stableAdminId && <p className="text-xs mt-2 text-slate-500">Admin ID not found. Please ensure you are logged in as an admin.</p>}
      </div>
    );
  }

  if (!tokenData || typeof tokenData !== 'object') {
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="font-bold mb-2">No token economy data available</p>
        <p className="text-sm">The server returned an empty response.</p>
        {!stableAdminId && <p className="text-xs mt-2 text-slate-400">Admin ID: {adminId || 'Not found'}</p>}
      </div>
    );
  }
  
  // Ensure all required fields exist with defaults
  const safeTokenData = {
    circulatingLiability: tokenData.circulatingLiability ?? 0,
    remorsePool: tokenData.remorsePool ?? 0,
    csrFundValue: tokenData.csrFundValue ?? 0,
    conversionRate: tokenData.conversionRate || { rdm: 100, usd: 1 },
    minting: tokenData.minting || { adherenceRewards: 0, efficiencyBonuses: 0, tips: 0, total: 0 },
    burning: tokenData.burning || { donations: 0, penalties: 0, total: 0 },
    tangibleImpact: tokenData.tangibleImpact || { patientsSubsidized: 0, freeLabTests: 0, energySaved: 0 },
  };

  // Format large numbers
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Token Economy & CSR Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time tracking of token conversion into tangible ESG impact.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Icon name="calendar_today" className="text-base" /> {today}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-lg transition-colors">
                    <Icon name="download" className="text-base" /> ESG Report
                </button>
            </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CIRCULATING LIABILITY</p>
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <Icon name="account_balance_wallet" className="text-lg" />
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatLargeNumber(safeTokenData.circulatingLiability)} <span className="text-sm font-medium text-slate-400">RDM</span></h3>
                </div>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Tokens currently held by users</span>
                    <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
                </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">THE 'REMORSE' POOL</p>
                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                        <Icon name="local_fire_department" className="text-lg" />
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-red-600 dark:text-red-400">{formatLargeNumber(safeTokenData.remorsePool)} <span className="text-sm font-medium text-slate-900 dark:text-slate-400">RDM Recaptured</span></h3>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-[9px] font-bold px-1.5 py-0.5 rounded">Tokens Burned</span>
                    <span className="text-[9px] text-slate-400">Via penalties & missed SLAs</span>
                </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CSR FUND VALUE</p>
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Icon name="savings" className="text-lg" />
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${safeTokenData.csrFundValue.toLocaleString()} <span className="text-sm font-medium text-slate-900 dark:text-slate-400">USD</span></h3>
                </div>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 leading-tight">Real money backed by Hospital Donors</span>
                </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CONVERSION RATE</p>
                    <div className="p-1.5 bg-slate-800 rounded-lg text-white">
                        <Icon name="currency_exchange" className="text-lg" />
                    </div>
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black">{safeTokenData.conversionRate.rdm} RDM</h3>
                    <p className="text-xs font-medium text-slate-400 mt-1">= ${safeTokenData.conversionRate.usd} Donation</p>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-800 relative z-10">
                    <span className="text-[9px] text-slate-400">Pegged Value</span>
                    <span className="bg-emerald-900/50 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-900">Stable</span>
                </div>
            </div>
        </div>

        {/* Tangible Impact Header */}
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="volunteer_activism" className="text-emerald-600" />
                Tangible Social Impact (YTD)
            </h3>
            <span className="text-xs font-medium text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">Updated: Real-time</span>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <Icon name="medical_services" className="text-2xl" />
                </div>
                <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{safeTokenData.tangibleImpact.patientsSubsidized}</h4>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Patients Subsidized</p>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-1">
                    <Icon name="info" className="text-blue-500 text-xs" /> Funded via Staff Donations
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="size-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                    <Icon name="bloodtype" className="text-2xl" />
                </div>
                <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{safeTokenData.tangibleImpact.freeLabTests}</h4>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Free Lab Tests</p>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-1">
                    <Icon name="info" className="text-red-500 text-xs" /> For Low-Income Community
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-4">
                    <Icon name="eco" className="text-2xl" />
                </div>
                <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{safeTokenData.tangibleImpact.energySaved}%</h4>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Energy Saved</p>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-1">
                    <Icon name="info" className="text-green-500 text-xs" /> Reinvested into Charity Pool
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Minting vs Burning */}
            <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Minting vs. Burning</h3>
                        <p className="text-xs text-slate-500">Behavior Engine: Incentives vs. Deductions</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"><span className="size-2 bg-blue-500 rounded-full"></span> Minted (In)</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded"><span className="size-2 bg-red-500 rounded-full"></span> Burned/Out</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sources */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">SOURCES (MINTED)</p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-slate-700 dark:text-slate-300">Adherence Rewards (Patients)</span>
                                    <span className="text-blue-600 font-bold">+{formatLargeNumber(safeTokenData.minting.adherenceRewards)}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{width: `${(safeTokenData.minting.adherenceRewards / Math.max(safeTokenData.minting.total, 1)) * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-slate-700 dark:text-slate-300">Efficiency Bonuses (Staff)</span>
                                    <span className="text-blue-600 font-bold">+{formatLargeNumber(safeTokenData.minting.efficiencyBonuses)}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full" style={{width: `${(safeTokenData.minting.efficiencyBonuses / Math.max(safeTokenData.minting.total, 1)) * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-slate-700 dark:text-slate-300">Patient Tips</span>
                                    <span className="text-blue-600 font-bold">+{formatLargeNumber(safeTokenData.minting.tips)}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-300 rounded-full" style={{width: `${(safeTokenData.minting.tips / Math.max(safeTokenData.minting.total, 1)) * 100}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sinks */}
                    <div className="md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">SINKS (BURNED/SPENT)</p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1"><Icon name="volunteer_activism" className="text-xs text-green-500" /> Donated to Charity</span>
                                    <span className="text-green-600 font-bold">-{formatLargeNumber(safeTokenData.burning.donations)}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{width: `${(safeTokenData.burning.donations / Math.max(safeTokenData.burning.total, 1)) * 100}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1"><Icon name="local_fire_department" className="text-xs text-red-500" /> Remorse / Penalties</span>
                                    <span className="text-red-600 font-bold">-{formatLargeNumber(safeTokenData.burning.penalties)}</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{width: `${(safeTokenData.burning.penalties / Math.max(safeTokenData.burning.total, 1)) * 100}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="text-slate-500">Total Inflow: <strong className="text-slate-900 dark:text-white">{formatLargeNumber(safeTokenData.minting.total)} RDM</strong></span>
                    <span className="text-slate-500">Total Outflow: <strong className="text-slate-900 dark:text-white">{formatLargeNumber(safeTokenData.burning.total)} RDM</strong></span>
                </div>
            </div>

            {/* Incentive Budget */}
            <div className="lg:col-span-1 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Incentive Budget</h3>
                    <p className="text-xs text-slate-500">Utilization by Department</p>
                </div>

                <div className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase">
                        <div className="col-span-6">Dept</div>
                        <div className="col-span-4 text-right">Used / Budget</div>
                        <div className="col-span-2 text-right">Impact</div>
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-12 items-center">
                        <div className="col-span-6 flex items-center gap-2">
                            <span className="size-2 rounded-full bg-pink-500"></span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Cardiology</span>
                        </div>
                        <div className="col-span-4 text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">45k / 50k</p>
                            <p className="text-[10px] text-green-500 font-bold">90% Used</p>
                        </div>
                        <div className="col-span-2 text-right">
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">High 🟢</span>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-12 items-center">
                        <div className="col-span-6 flex items-center gap-2">
                            <span className="size-2 rounded-full bg-blue-500"></span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Radiology</span>
                        </div>
                        <div className="col-span-4 text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">12k / 30k</p>
                            <p className="text-[10px] text-orange-500 font-bold">40% Used</p>
                        </div>
                        <div className="col-span-2 text-right">
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Low 🟡</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors">
                        <Icon name="sync_alt" />
                        Re-Allocate Unused Budget
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
