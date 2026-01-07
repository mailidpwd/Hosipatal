
import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon, Card, Badge } from '@/components/UI';
import { providerService } from '@/services/api/providerService';
import { useStaffRealTime } from '@/hooks/useStaffRealTime';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

export const ProviderEarnings = () => {
  const { user, isLoading: authLoading } = useAuth();
  const providerId = user?.role === 'STAFF' ? user.id : undefined;
  
  // Get providerId from sessionStorage as fallback
  const getStoredProviderId = () => {
    try {
      return sessionStorage.getItem('providerId') || undefined;
    } catch {
      return undefined;
    }
  };
  
  const providerIdRef = useRef<string | undefined>(providerId || getStoredProviderId());
  
  useEffect(() => {
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

  const { recentTips, activePledges, isLoading: realtimeLoading } = useStaffRealTime(stableProviderId);

  // Fetch earnings data - filtered by providerId
  const { data: earningsData, isLoading: earningsLoading, error } = useQuery({
    queryKey: ['provider', 'earnings', stableProviderId],
    queryFn: () => providerService.getEarnings(stableProviderId),
    refetchInterval: 300000, // Refetch every 5 minutes
    enabled: !authLoading, // Always enabled if auth is loaded
    retry: false, // Don't retry - use demo data immediately on failure
    staleTime: 0, // Always consider data fresh for demo mode
  });

  const isLoading = authLoading || (earningsLoading && !earningsData) || realtimeLoading;

  // Show loading only if we don't have any data yet and auth is still loading
  if (isLoading && !earningsData && authLoading) {
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
          <p className="font-bold">Error loading earnings</p>
          <p className="text-sm mt-1">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  const data = earningsData || {
    totalAvailable: 0,
    clinicalIncome: 0,
    performanceBonus: 0,
    patientTips: 0,
    recentTips: [],
    activePledges: [],
    rankings: [],
  };

  const displayTips = recentTips.length > 0 ? recentTips : data.recentTips || [];
  const displayPledges = activePledges.length > 0 ? activePledges : data.activePledges || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24 md:pb-12 animate-[fadeIn_0.5s_ease-out]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial & Reputation Overview</h2>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Icon name="work" className="text-lg" />
            <span className="text-xs md:text-sm">Medical Wealth Portfolio</span>
          </div>
        </div>
        <div className="text-right bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Available</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            {data.totalAvailable.toLocaleString()} <span className="text-base md:text-lg text-slate-500 font-medium">RDM</span>
          </p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clinical Income */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 border-l-[4px] border-l-primary p-5 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">CLINICAL INCOME</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{data.clinicalIncome.toLocaleString()} RDM</h3>
            <p className="text-[10px] font-bold text-primary-dark dark:text-primary bg-primary/10 px-2 py-0.5 rounded w-fit">Base Salary</p>
          </div>
          <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary-dark">
            <Icon name="stethoscope" className="text-xl" />
          </div>
        </div>

        {/* Performance Bonus */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 border-l-[4px] border-l-orange-400 p-5 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PERFORMANCE BONUS</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{data.performanceBonus.toLocaleString()} RDM</h3>
            <p className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded w-fit">Targets Met</p>
          </div>
          <div className="size-10 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-500">
            <Icon name="emoji_events" className="text-xl" />
          </div>
        </div>

        {/* Patient Tips */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 border-l-[4px] border-l-rose-400 p-5 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PATIENT TIPS</p>
              <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">NEW</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{data.patientTips.toLocaleString()} RDM</h3>
            <p className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded w-fit">Direct Gratitude</p>
          </div>
          <div className="size-10 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500">
            <Icon name="volunteer_activism" className="text-xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Tips & Pledges */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Recent Patient Tips Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="favorite" className="text-rose-500 fill-1" />
                Recent Patient Tips & Wishes
                </h3>
                <button className="text-xs font-bold text-primary-dark dark:text-primary hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayTips.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                  No tips or wishes yet
                </div>
              ) : (
                <>
                  {displayTips.slice(0, 2).map((tip) => {
                    const timeAgo = new Date(tip.timestamp);
                    const hoursAgo = Math.floor((Date.now() - timeAgo.getTime()) / (1000 * 60 * 60));
                    const daysAgo = Math.floor(hoursAgo / 24);
                    const timeDisplay = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';
                    const initials = tip.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    
                    return (
                      <div key={tip.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col h-full hover:border-rose-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {tip.avatar ? (
                              <div className="size-8 rounded-full bg-cover border border-slate-100 dark:border-slate-600" style={{ backgroundImage: `url("${tip.avatar}")` }}></div>
                            ) : (
                              <div className="size-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-xs border border-slate-100 dark:border-slate-600">
                                {initials}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{tip.patientName}</p>
                              <p className="text-[10px] text-slate-500 truncate">Patient ID {tip.patientId}</p>
                            </div>
                          </div>
                          <span className="text-rose-600 font-bold text-[10px] bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-800">+{tip.amount} RDM</span>
                        </div>
                        {tip.message && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg relative grow">
                            <Icon name="format_quote" className="absolute top-1 left-1 text-slate-300 dark:text-slate-600 text-xl -scale-x-100" />
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed pl-1 pt-1 relative z-10">
                              "{tip.message}"
                            </p>
                          </div>
                        )}
                        <p className="mt-2 text-[9px] text-slate-400 flex items-center gap-1 font-medium">
                          <Icon name="schedule" className="text-[10px]" /> {timeDisplay}
                        </p>
                      </div>
                    );
                  })}
                  {/* View Older Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 p-4 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-full min-h-[140px]">
                    <div className="size-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-200 dark:border-slate-700">
                      <Icon name="history" className="text-xl" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors uppercase tracking-wider text-center">View older<br/>messages</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Pledges Table */}
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="lock" className="text-slate-500" />
              Active Pledges (Escrow)
            </h3>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">PATIENT</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">HEALTH GOAL</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">STAKE</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">STATUS</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ACTION</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayPledges.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                          No active pledges
                        </td>
                      </tr>
                    ) : (
                      displayPledges.map((pledge) => {
                        const initials = pledge.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        const statusColor = pledge.status === 'active' ? 'emerald' : pledge.status === 'at-risk' ? 'rose' : 'slate';
                        const statusText = pledge.status === 'active' ? `Day ${pledge.progress}/${pledge.totalDays} (On Track)` : pledge.status === 'at-risk' ? 'At Risk' : 'Completed';
                        
                        return (
                          <tr key={pledge.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                                  {initials}
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{pledge.patientName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-medium">{pledge.goal}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                <Icon name="lock" className="text-[10px] text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{pledge.amount} RDM</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                <span className={`size-1.5 rounded-full bg-${statusColor}-500 ${pledge.status === 'at-risk' ? 'animate-pulse' : ''}`}></span>
                                {statusText}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {pledge.status === 'at-risk' ? (
                                <button className="text-[10px] font-bold text-primary-dark dark:text-primary hover:underline">Intervene</button>
                              ) : (
                                <button className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">View Details</button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rankings Section */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="emoji_events" className="text-primary text-lg" />
                Rankings
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Dept: Cardiology</span>
          </div>
          
          <div className="bg-[#f0fdfc] dark:bg-surface-dark rounded-xl border border-primary/20 p-6 flex flex-col items-center text-center shadow-sm">
            <div className="relative mb-4">
              <div className="size-20 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Icon name="emoji_events" className="text-4xl text-white drop-shadow-md" />
              </div>
              <div className="absolute -bottom-2 -right-2 size-7 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-lg shadow-sm border border-slate-100 dark:border-slate-700">
                🥇
              </div>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-0.5">You are #1</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">in "Patient Satisfaction"</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
              <Icon name="check_circle" className="text-sm" />
              Earned +500 RDM Bonus
            </div>

            <div className="w-full mt-6 space-y-3 text-left border-t border-slate-200/60 dark:border-slate-700 pt-4">
              {data.rankings && data.rankings.length > 0 ? (
                data.rankings.map((ranking, index) => {
                  const initials = ranking.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isFirst = index === 0;
                  
                  return (
                    <div key={ranking.rank} className={`flex items-center justify-between group cursor-pointer p-2 rounded-lg ${isFirst ? 'bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-white/5 transition-all'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black w-3 text-center ${isFirst ? 'text-amber-500' : 'text-slate-300'}`}>{ranking.rank}</span>
                        {ranking.avatar ? (
                          <div className="size-8 rounded-full border border-primary bg-cover" style={{ backgroundImage: `url("${ranking.avatar}")` }}></div>
                        ) : (
                          <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                            {initials}
                          </div>
                        )}
                        <span className={`text-xs font-bold ${isFirst ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{ranking.name}</span>
                      </div>
                      <span className={`text-xs ${isFirst ? 'font-black text-primary-dark dark:text-primary' : 'font-bold text-slate-400'}`}>{ranking.score}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
                  No rankings available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
