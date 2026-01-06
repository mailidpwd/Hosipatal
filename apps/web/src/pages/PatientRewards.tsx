import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon, Card, CircularProgress, ProgressBar } from '@/components/UI';
import { useRealTime } from '@/context/RealTimeContext';
import { walletService } from '@/services/api/walletService';
import { healthService } from '@/services/api/healthService';
import { medicationService } from '@/services/api/medicationService';

// Data interfaces for production
interface DailyHabit {
  id: string;
  name: string;
  icon: string;
  rewardPerDay: number;
  description: string;
  currentValue: number;
  targetValue: number;
  streakBonus?: {
    amount: number;
    daysRequired: number;
    currentDays: number;
  };
  status: 'active' | 'inactive';
}

interface VerificationBounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  requirements: string;
  status: 'available' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  icon: string;
}

interface PassiveDataStream {
  id: string;
  name: string;
  source: string;
  status: 'connected' | 'disconnected' | 'pending';
  dailyEarnings: number;
  icon: string;
}

interface NFTMultiplier {
  id: string;
  name: string;
  level: number;
  multiplier: number;
  description: string;
  progressToNext: number;
  nextLevel?: {
    level: number;
    multiplier: number;
    requirement: string;
  };
}

interface EarningMetrics {
  weeklyEarnings: number;
  earningVelocity: number; // RDM per week
  capPercentage: number; // Percentage to weekly cap
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierMultiplier: number;
}

export const PatientRewards = () => {
  // Safely get real-time data with error handling
  let steps: number | null = null;
  let walletBalance: number | null = null;
  let isConnected = false;
  
  try {
    const realTimeData = useRealTime();
    steps = realTimeData.steps;
    walletBalance = realTimeData.walletBalance;
    isConnected = realTimeData.isConnected;
  } catch (error) {
    console.warn('RealTime context not available:', error);
  }

  // Fetch wallet data with error handling
  const { data: wallet, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      try {
        return await walletService.getBalance();
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        return null;
      }
    },
    refetchInterval: 60000,
  });

  // Fetch earnings summary with error handling
  const { data: earnings, isLoading: earningsLoading, error: earningsError } = useQuery({
    queryKey: ['wallet', 'earnings', 'weekly'],
    queryFn: async () => {
      try {
        return await walletService.getEarnings('weekly');
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
        return null;
      }
    },
    refetchInterval: 60000,
  });

  // Fetch health metrics with error handling
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['health', 'metrics'],
    queryFn: async () => {
      try {
        return await healthService.getMetrics();
      } catch (error) {
        console.error('Failed to fetch health metrics:', error);
        return null;
      }
    },
    refetchInterval: 30000,
  });

  // Fetch medications for adherence tracking with error handling
  const { data: medications, isLoading: medicationsLoading, error: medicationsError } = useQuery({
    queryKey: ['medications', 'active'],
    queryFn: async () => {
      try {
        return await medicationService.getMedications();
      } catch (error) {
        console.error('Failed to fetch medications:', error);
        return [];
      }
    },
    refetchInterval: 300000, // 5 minutes
  });

  // Calculate daily habits from real data
  const dailyHabits: DailyHabit[] = React.useMemo(() => {
    const habits: DailyHabit[] = [];
    
    // Medication Adherence - calculate based on verified medications
    if (medications && medications.length > 0) {
      const verifiedCount = medications.filter(med => med.isVerified).length;
      const adherenceRate = (verifiedCount / medications.length) * 100;
      const currentStreak = metrics?.streak || 0;
      
      habits.push({
        id: 'medication-adherence',
        name: 'Perfect Adherence',
        icon: 'medication',
        rewardPerDay: 5,
        description: 'Log medication intake on time.',
        currentValue: Math.round(adherenceRate),
        targetValue: 100,
        streakBonus: currentStreak >= 7 ? {
          amount: 50,
          daysRequired: 7,
          currentDays: currentStreak,
        } : undefined,
        status: 'active',
      });
    }
    
    // Steps
    if (metrics) {
      habits.push({
        id: 'steps',
        name: '10k Steps',
        icon: 'directions_run',
        rewardPerDay: 10,
        description: 'Daily movement goal achievement.',
        currentValue: metrics.steps || 0,
        targetValue: metrics.stepsTarget || 10000,
        status: 'active',
      });
      
      // Water
      habits.push({
        id: 'water',
        name: '2.5L Water',
        icon: 'water_drop',
        rewardPerDay: 5,
        description: 'Proper hydration tracking.',
        currentValue: metrics.water || 0,
        targetValue: metrics.waterTarget || 2500,
        status: 'active',
      });
    }
    
    return habits;
  }, [metrics, medications]);

  // Calculate earning metrics
  const earningMetrics: EarningMetrics = React.useMemo(() => {
    const weeklyEarnings = wallet?.weeklyEarnings || earnings?.earnings || 0;
    const tierMultiplier = 1.0; // TODO: Get from wallet service when available
    const tier = 'bronze' as const; // TODO: Get from wallet service when available
    
    // Calculate cap percentage (assuming weekly cap of 200 RDM)
    const weeklyCap = 200;
    const capPercentage = Math.min((weeklyEarnings / weeklyCap) * 100, 100);
    
    return {
      weeklyEarnings,
      earningVelocity: weeklyEarnings,
      capPercentage,
      tier,
      tierMultiplier,
    };
  }, [wallet, earnings]);

  // Verification bounties (would come from API in production)
  const { data: bounties, isLoading: bountiesLoading } = useQuery({
    queryKey: ['verification', 'bounties'],
    queryFn: async () => {
      // TODO: Create verificationService.getBounties() in production
      // For now, return empty array - this would be fetched from backend
      return [] as VerificationBounty[];
    },
    refetchInterval: 300000,
  });

  // Passive data streams (would come from API in production)
  const { data: passiveStreams, isLoading: streamsLoading } = useQuery({
    queryKey: ['passive', 'streams', metrics?.steps, steps],
    queryFn: async () => {
      // TODO: Create dataStreamService.getStreams() in production
      // For now, check if we have health data synced
      const streams: PassiveDataStream[] = [];
      
      if (metrics && (metrics.steps !== undefined || steps !== null)) {
        streams.push({
          id: 'apple-health',
          name: 'Apple Health',
          source: 'Apple Health > Steps',
          status: 'connected',
          dailyEarnings: 5,
          icon: 'health_and_safety',
        });
      }
      
      return streams;
    },
    enabled: true, // Always enabled, but returns empty array if no data
    refetchInterval: 60000,
  });

  // NFT Multipliers (would come from API in production)
  const { data: nftMultipliers, isLoading: nftLoading } = useQuery({
    queryKey: ['nft', 'multipliers', metrics?.streak],
    queryFn: async () => {
      // TODO: Create nftService.getMultipliers() in production
      // For now, calculate from streak
      const streak = metrics?.streak || 0;
      const level = streak >= 30 ? 2 : streak >= 7 ? 1 : 0;
      
      if (level === 0) return [];
      
      const multipliers: NFTMultiplier[] = [{
        id: 'health-guardian',
        name: 'Health Guardian',
        level,
        multiplier: level === 2 ? 1.5 : 1.2,
        description: 'Applies to all daily habit earnings.',
        progressToNext: level === 1 ? (streak / 30) * 100 : 100,
        nextLevel: level === 1 ? {
          level: 2,
          multiplier: 1.5,
          requirement: '30 Day Streak',
        } : undefined,
      }];
      
      return multipliers;
    },
    enabled: !!metrics, // Only run if metrics is available
    refetchInterval: 60000,
  });

  const isLoading = walletLoading || earningsLoading || metricsLoading || medicationsLoading || 
                    bountiesLoading || streamsLoading || nftLoading;

  // Calculate available bounties count
  const availableBounties = bounties?.filter(b => b.status === 'available').length || 0;

  // Format water display (mL to L)
  const formatWater = (ml: number) => {
    return `${(ml / 1000).toFixed(1)}L`;
  };

  // Ensure we always return valid JSX
  if (typeof window === 'undefined') {
    return null; // SSR safety
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-12 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">RDM Earning Ecosystem</h2>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wide">DASHBOARD</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Maximize your 'Health Wealth' with these 4 income streams.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-full shadow-sm">
                <span className={`relative flex h-2 w-2 ${isConnected ? 'animate-ping' : ''}`}>
                  <span className={`absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 opacity-50'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  RDM Network: {isConnected ? 'Online' : 'Offline'}
                </span>
            </div>
            <button className="size-10 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shadow-sm">
                <Icon name="notifications" className="text-xl" />
            </button>
        </div>
      </header>

      {/* Live Metrics Banner */}
      {isLoading ? (
        <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center h-64">
          <div className="text-slate-400">Loading metrics...</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Icon name="show_chart" className="text-lg" />
                <span className="text-xs font-bold uppercase tracking-widest">LIVE METRICS</span>
              </div>
              
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Current Earning Velocity:</p>
                <div className="flex items-center gap-3">
                  <Icon name="bolt" className="text-5xl md:text-6xl text-amber-400 fill-1" />
                  <div>
                    <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {earningMetrics.earningVelocity}
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white"> RDM</span>
                    <span className="text-lg text-slate-400 font-medium ml-2">/ Week</span>
                  </div>
                </div>
              </div>

              {earningMetrics.tier !== 'bronze' && (
                <div className="inline-flex items-center gap-2 bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 px-4 py-3 rounded-xl">
                  <Icon name="emoji_events" className="text-amber-500 text-xl" />
                  <span className="text-xs md:text-sm font-bold text-amber-800 dark:text-amber-200">
                    {earningMetrics.tier.charAt(0).toUpperCase() + earningMetrics.tier.slice(1)} Tier Multiplier Active (x{earningMetrics.tierMultiplier})
                  </span>
                </div>
              )}
            </div>

            <div className="relative size-40 md:size-48 flex items-center justify-center shrink-0">
              {/* Custom Circle implementation */}
              <div className="absolute inset-0 rounded-full border-[12px] border-slate-100 dark:border-slate-800"></div>
              <svg className="absolute inset-0 size-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="44" 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="12" 
                  strokeDasharray="276" 
                  strokeDashoffset={276 - (276 * earningMetrics.capPercentage / 100)} 
                  strokeLinecap="round" 
                  className="drop-shadow-lg" 
                />
              </svg>
              <div className="flex flex-col items-center justify-center text-center z-10">
                <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                  {Math.round(earningMetrics.capPercentage)}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">TO CAP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 01 Daily Habits */}
      <section>
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-600 font-bold text-xs px-2 py-1 rounded">01</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Habits & Adherence</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase">Active Income</span>
            </div>
            {dailyHabits.length > 3 && (
              <button className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                Swipe for more <Icon name="arrow_forward" className="text-sm" />
              </button>
            )}
         </div>

         {dailyHabits.length === 0 ? (
           <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400">
             No daily habits available. Complete your health profile to start earning!
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {dailyHabits.map((habit) => {
               const progress = (habit.currentValue / habit.targetValue) * 100;
               const isSteps = habit.id === 'steps';
               const isWater = habit.id === 'water';
               
               return (
                 <div key={habit.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-4">
                     <div className={`size-12 rounded-2xl ${
                       habit.id === 'medication-adherence' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                       habit.id === 'steps' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                       'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
                     } flex items-center justify-center group-hover:scale-110 transition-transform`}>
                       <Icon name={habit.icon as any} className="text-2xl" />
                     </div>
                     <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 dark:border-blue-900/30">
                       +{habit.rewardPerDay} RDM/Day
                     </span>
                   </div>
                   <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{habit.name}</h4>
                   <p className="text-sm text-slate-500 mb-4">{habit.description}</p>
                   
                   {isSteps && (
                     <>
                       <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-1 overflow-hidden">
                         <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                       </div>
                       <div className="text-right text-[10px] font-bold text-slate-400">
                         {habit.currentValue.toLocaleString()} / {habit.targetValue.toLocaleString()}
                       </div>
                     </>
                   )}
                   
                   {isWater && (
                     <>
                       <div className="flex gap-1 mb-1">
                         {[...Array(5)].map((_, i) => (
                           <div 
                             key={i} 
                             className={`h-2 rounded-full flex-1 ${
                               i < Math.floor((habit.currentValue / habit.targetValue) * 5)
                                 ? 'bg-cyan-400'
                                 : 'bg-slate-100 dark:bg-slate-800'
                             }`}
                           ></div>
                         ))}
                       </div>
                       <div className="text-right text-[10px] font-bold text-slate-400">
                         {formatWater(habit.currentValue)} / {formatWater(habit.targetValue)}
                       </div>
                     </>
                   )}
                   
                   {habit.id === 'medication-adherence' && (
                     <>
                       <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mb-1 overflow-hidden">
                         <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                       </div>
                       <div className="text-right text-[10px] font-bold text-slate-400">
                         {habit.currentValue}% / {habit.targetValue}%
                       </div>
                     </>
                   )}
                   
                   {habit.streakBonus && (
                     <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-amber-500 font-bold text-xs mt-4">
                       <Icon name="bolt" className="text-sm fill-1" />
                       Streak Bonus: +{habit.streakBonus.amount} RDM / {habit.streakBonus.daysRequired} days
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         )}
      </section>

      {/* 03 Verification Bounties */}
      <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-600 font-bold text-xs px-2 py-1 rounded">03</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verification Bounties (High Value)</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">Earn big for building a complete, verified medical history.</p>
            </div>
            {availableBounties > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
                Available Bounties: {availableBounties}
              </div>
            )}
         </div>

         {bountiesLoading ? (
           <div className="text-center py-8 text-slate-400">Loading bounties...</div>
         ) : bounties && bounties.length > 0 ? (
           <div className="space-y-4">
             {bounties.map((bounty) => (
               <div 
                 key={bounty.id} 
                 className={`border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:border-amber-200 transition-colors group ${
                   bounty.status !== 'available' ? 'opacity-70' : ''
                 }`}
               >
                 <div className={`size-14 rounded-2xl ${
                   bounty.status === 'available' 
                     ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                     : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                 } flex items-center justify-center shrink-0`}>
                   <Icon name={bounty.icon as any} className="text-2xl" />
                 </div>
                 <div className="flex-1 w-full text-center md:text-left">
                   <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">{bounty.title}</h4>
                   <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
                     <span className="text-xs text-slate-500 font-medium">
                       {bounty.status === 'submitted' && bounty.submittedAt 
                         ? `Submitted: ${new Date(bounty.submittedAt).toLocaleDateString()}`
                         : `Requirements: ${bounty.requirements}`}
                     </span>
                     <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit mx-auto md:mx-0">
                       Bounty: 💰 {bounty.reward} RDM
                     </span>
                   </div>
                 </div>
                 {bounty.status === 'available' ? (
                   <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-transform active:scale-95 whitespace-nowrap">
                     <Icon name="upload_file" className="text-lg" />
                     [ Upload Proof ]
                   </button>
                 ) : bounty.status === 'submitted' ? (
                   <button disabled className="w-full md:w-auto border border-slate-300 dark:border-slate-600 text-slate-400 px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed whitespace-nowrap">
                     <Icon name="hourglass_top" className="text-lg" />
                     [ Pending Dr. Approval ⏳ ]
                   </button>
                 ) : bounty.status === 'approved' ? (
                   <button disabled className="w-full md:w-auto bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed whitespace-nowrap">
                     <Icon name="check_circle" className="text-lg" />
                     [ Approved ✓ ]
                   </button>
                 ) : null}
               </div>
             ))}
           </div>
         ) : (
           <div className="text-center py-8 text-slate-400">
             No verification bounties available at this time.
           </div>
         )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 02 Passive Data Streams */}
          <section className="flex flex-col h-full">
             <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-100 text-blue-600 font-bold text-xs px-2 py-1 rounded">02</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Passive Data Streams</h3>
             </div>
             
             <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex-1 flex flex-col justify-between">
                {passiveStreams && passiveStreams.length > 0 ? (
                  <>
                    <div className="flex items-center justify-center py-8">
                      <div className="relative w-full max-w-sm flex items-center justify-between">
                        {/* Node 1 */}
                        <div className="size-14 rounded-full border-2 border-green-500 bg-white dark:bg-surface-dark flex items-center justify-center z-10 shadow-sm">
                          <Icon name="health_and_safety" className="text-2xl text-green-600" />
                        </div>
                        
                        {/* Connecting Line */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 dark:bg-slate-700 -z-0"></div>
                        
                        {/* Central Node */}
                        <div className="size-24 rounded-full border-4 border-blue-500 bg-white dark:bg-surface-dark flex items-center justify-center z-10 shadow-lg shadow-blue-500/20">
                          <span className="font-black text-blue-600 text-xl">RDM</span>
                        </div>

                        {/* Node 2 (Ghost or Connected) */}
                        <div className={`size-14 rounded-full border-2 ${
                          passiveStreams.some(s => s.status === 'connected')
                            ? 'border-green-500 text-green-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-300'
                        } bg-white dark:bg-surface-dark flex items-center justify-center z-10`}>
                          <Icon name="watch" className="text-2xl" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {passiveStreams.map((stream) => (
                        <div 
                          key={stream.id}
                          className={`border rounded-xl p-4 flex items-center justify-between ${
                            stream.status === 'connected'
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`size-3 rounded-full ${
                              stream.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                            }`}></div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{stream.name}</span>
                          </div>
                          {stream.status === 'connected' && (
                            <span className="text-xs font-mono font-bold text-green-700 dark:text-green-400">
                              Mining +{stream.dailyEarnings} RDM/Day
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    No passive data streams connected
                  </div>
                )}
             </div>
          </section>

          {/* 04 NFT Multipliers */}
          <section className="flex flex-col h-full">
             <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-100 text-blue-600 font-bold text-xs px-2 py-1 rounded">04</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">NFT Multipliers & Utility</h3>
             </div>

             <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex-1">
                {nftLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading multipliers...</div>
                ) : nftMultipliers && nftMultipliers.length > 0 ? (
                  <>
                    <p className="text-slate-500 text-sm mb-6">Owning Badges boosts your base earning rate.</p>
                    
                    {nftMultipliers.map((nft) => (
                      <div key={nft.id} className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative shrink-0">
                          {/* Hexagon Shape - using clip-path */}
                          <div 
                            className="size-28 bg-white border-2 border-amber-400 flex items-center justify-center relative shadow-sm"
                            style={{
                              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                            }}
                          >
                            <div 
                              className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 opacity-50"
                              style={{
                                clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                              }}
                            ></div>
                            <div className="flex flex-col items-center z-10">
                              <Icon name="verified_user" className="text-4xl text-amber-500 mb-1" />
                              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">LEVEL {nft.level}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 w-full">
                          <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-2">{nft.name} (Level {nft.level})</h4>
                          <div className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-bold px-2 py-1 rounded border border-amber-200 dark:border-amber-800 mb-3">
                            Effect: Global Multiplier x{nft.multiplier}
                          </div>
                          <p className="text-xs text-slate-500 mb-6">{nft.description}</p>

                          {nft.nextLevel && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-700 dark:text-slate-300">Next Tier: Level {nft.nextLevel.level}</span>
                                <span className="text-blue-600">x{nft.nextLevel.multiplier} Multiplier</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-full rounded-full transition-all" 
                                  style={{ width: `${Math.min(nft.progressToNext, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-slate-400">Unlock Level {nft.nextLevel.level} ({nft.nextLevel.requirement})</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No NFT multipliers active. Complete habits to unlock badges!
                  </div>
                )}
             </div>
          </section>
      </div>
    </div>
  );
};
