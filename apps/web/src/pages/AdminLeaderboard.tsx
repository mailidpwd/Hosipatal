
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/api/adminService';
import { Icon } from '@/components/UI';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AdminLeaderboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctors' | 'nurses' | 'techs'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    console.log('[AdminLeaderboard] User:', user);
    console.log('[AdminLeaderboard] AdminId:', adminId);
    console.log('[AdminLeaderboard] StableAdminId:', stableAdminId);
    console.log('[AdminLeaderboard] AuthLoading:', authLoading);
  }, [user, adminId, stableAdminId, authLoading]);

  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['admin', 'leaderboard', stableAdminId, roleFilter, searchQuery],
    queryFn: async () => {
      const currentAdminId = stableAdminId || adminId;
      console.log('[AdminLeaderboard] Fetching leaderboard with adminId:', currentAdminId, 'role:', roleFilter, 'search:', searchQuery);
      if (!currentAdminId) {
        throw new Error('Admin ID is required');
      }
      const result = await adminService.getLeaderboard(currentAdminId, {
        role: roleFilter,
        search: searchQuery || undefined,
      });
      console.log('[AdminLeaderboard] ✅ Received leaderboard data:', result);
      console.log('[AdminLeaderboard] Staff count:', result?.staff?.length || 0);
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
        <p className="ml-4 text-slate-500">Loading leaderboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        <p className="font-bold mb-2">Error loading leaderboard</p>
        <p className="text-sm">{error instanceof Error ? error.message : String(error)}</p>
        {!stableAdminId && <p className="text-xs mt-2 text-slate-500">Admin ID not found. Please ensure you are logged in as an admin.</p>}
      </div>
    );
  }

  // Always render the UI, even if staff array is empty (show empty state in table)
  if (!leaderboardData) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="font-bold mb-2">No leaderboard data available</p>
        <p className="text-sm">The server returned an empty response.</p>
        {!stableAdminId && <p className="text-xs mt-2 text-slate-400">Admin ID: {adminId || 'Not found'}</p>}
      </div>
    );
  }
  
  // Ensure staff array exists (default to empty array)
  const staffList = leaderboardData.staff || [];
  const safeLeaderboardData = {
    ...leaderboardData,
    staff: staffList,
    topPerformer: leaderboardData.topPerformer || null,
    mostImproved: leaderboardData.mostImproved || null,
    deptVelocity: leaderboardData.deptVelocity || 0,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Staff Leaderboard & Performance</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Competitive performance tracking ranked by Responsible Provider Index (RPI).</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-white dark:bg-surface-dark px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Last updated: Just now
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <Icon name="refresh" className="text-sm" />
                </button>
            </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Performer */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center relative overflow-hidden group">
                <div className="w-1.5 h-full absolute left-0 top-0 bg-amber-400"></div>
                <div className="p-5 flex items-center gap-5 w-full">
                    <div className="size-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/50">
                        <Icon name="emoji_events" className="text-3xl text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">TOP PERFORMER</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{safeLeaderboardData.topPerformer?.name || 'N/A'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded">{safeLeaderboardData.topPerformer?.rpi || 0} RPI</span>
                            <span className="text-xs text-slate-400">#1 Global Rank</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Most Improved */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center relative overflow-hidden group">
                <div className="w-1.5 h-full absolute left-0 top-0 bg-emerald-500"></div>
                <div className="p-5 flex items-center gap-5 w-full">
                    <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50">
                        <Icon name="trending_up" className="text-3xl text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MOST IMPROVED</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{safeLeaderboardData.mostImproved?.name || 'N/A'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded">{safeLeaderboardData.mostImproved?.improvement || '+0%'}</span>
                            <span className="text-xs text-slate-400">growth this week</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dept Velocity */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center relative overflow-hidden group">
                <div className="w-1.5 h-full absolute left-0 top-0 bg-blue-500"></div>
                <div className="p-5 flex items-center gap-5 w-full">
                    <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                        <Icon name="bolt" className="text-3xl text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">DEPT RDM VELOCITY</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{safeLeaderboardData.deptVelocity.toLocaleString()} Tokens</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">Earned across all depts today</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
                <button 
                    onClick={() => setRoleFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-md whitespace-nowrap transition-colors ${
                        roleFilter === 'all' 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    All Staff
                </button>
                <button 
                    onClick={() => setRoleFilter('doctors')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                        roleFilter === 'doctors' 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <span>👩‍⚕️</span> Doctors
                </button>
                <button 
                    onClick={() => setRoleFilter('nurses')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                        roleFilter === 'nurses' 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <span>🏥</span> Nurses
                </button>
                <button 
                    onClick={() => setRoleFilter('techs')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                        roleFilter === 'techs' 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <span>⚙️</span> Technicians
                </button>
            </div>
            <div className="relative w-full md:w-64">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600" 
                />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Ranking List */}
            <div className="lg:col-span-8 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">RPI Score</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tokens Earned</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Strength</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {safeLeaderboardData.staff.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No staff members found
                                    </td>
                                </tr>
                            ) : (
                                safeLeaderboardData.staff.map((staff, index) => (
                                    <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center size-8">
                                                {staff.rank === 1 ? (
                                                    <>
                                                        <Icon name="emoji_events" className="text-amber-400 text-xl" />
                                                        <span className="text-[10px] font-bold text-amber-500">1st</span>
                                                    </>
                                                ) : staff.rank === 2 ? (
                                                    <>
                                                        <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-300 dark:border-slate-600">
                                                            <Icon name="star" className="text-[14px]" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">2nd</span>
                                                    </>
                                                ) : staff.rank === 3 ? (
                                                    <>
                                                        <div className="size-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-200 dark:border-orange-800">
                                                            <Icon name="military_tech" className="text-[14px]" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">3rd</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-400">{staff.rank}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="size-10 rounded-full bg-slate-200 bg-cover" 
                                                    style={staff.avatar ? {backgroundImage: `url("${staff.avatar}")`} : {}}
                                                ></div>
                                                <span className="font-bold text-slate-900 dark:text-white">{staff.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-bold">
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xl font-black text-slate-900 dark:text-white">{staff.rpi}</span><span className="text-[10px] text-slate-400 align-top">RPI</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Icon name="diamond" className="text-blue-500 text-sm" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{staff.tokenEarnings.toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">RDM</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{staff.keyStrength}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <p className="text-xs text-slate-500">Showing top 15 performers</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold">Prev</button>
                        <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold">Next</button>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Dept Battle */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name="swords" className="text-xl text-slate-600 dark:text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Department Battle</h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Weekly Challenge</p>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                                <span>Pediatrics</span>
                                <span>3,200</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                <div className="bg-slate-400 dark:bg-slate-500 h-2 rounded-full" style={{width: '75%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                                <span>Emergency</span>
                                <span>3,000</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                <div className="bg-slate-300 dark:bg-slate-600 h-2 rounded-full" style={{width: '68%'}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                        <div className="text-2xl">🍕</div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pizza Friday!</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                Pediatrics is leading by 200 Tokens! Winning Dept gets lunch sponsored by RDM.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">GOAL: 5,000 TOKENS</span>
                    </div>
                </div>

                {/* Boost RPI CTA */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Boost your RPI?</h3>
                        <div className="text-2xl">✨</div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Focus on patient verification speed and post-care survey results to climb the ranks.
                    </p>
                    <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white transition-colors">
                        View Guidelines
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
