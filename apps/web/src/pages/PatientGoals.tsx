import React, { useState, useEffect, useRef } from 'react';
import { Icon, Badge, ProgressBar, CircularProgress } from '@/components/UI';
import { useNavigation } from '@/context/NavigationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService, type Goal, type PendingReward } from '@/services/api/goalsService';
import { healthService } from '@/services/api/healthService';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type TabType = 'active' | 'history' | 'pending';

// Live BP Display Component
const LiveBPDisplay = () => {
  const [liveBP, setLiveBP] = useState({ systolic: 145, diastolic: 90 });
  const [bpDirection, setBpDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveBP(prev => {
        const newSystolic = prev.systolic + (bpDirection === 'down' ? -Math.random() * 0.5 : Math.random() * 0.5);
        const newDiastolic = prev.diastolic + (bpDirection === 'down' ? -Math.random() * 0.3 : Math.random() * 0.3);
        
        const clampedSystolic = Math.max(110, Math.min(160, newSystolic));
        const clampedDiastolic = Math.max(70, Math.min(100, newDiastolic));
        
        if (Math.random() < 0.1) {
          setBpDirection(prev => prev === 'down' ? 'up' : 'down');
        }
        
        return {
          systolic: Math.round(clampedSystolic * 10) / 10,
          diastolic: Math.round(clampedDiastolic * 10) / 10
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [bpDirection]);

  return (
    <>
      {Math.round(liveBP.systolic)}/{Math.round(liveBP.diastolic)}
    </>
  );
};

export const PatientGoals = () => {
  const { navigationState, clearNavigationState } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('weight');
  const [difficulty, setDifficulty] = useState(50);
  const [rewardAmount, setRewardAmount] = useState(1000);
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState({
    weight: { current: '80', target: '75', unit: 'kg' },
    activity: { current: '5000', target: '10000', unit: 'steps' },
    hydration: { current: '1500', target: '2500', unit: 'ml' },
    sleep: { current: '6', target: '8', unit: 'hours' }
  });
  const [highlightedChallenge, setHighlightedChallenge] = useState<string | null>(null);
  const challengeRef = useRef<HTMLDivElement>(null);
  const [showBPModal, setShowBPModal] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [submittingBP, setSubmittingBP] = useState(false);
  
  // Log Progress Modal State
  const [showLogProgressModal, setShowLogProgressModal] = useState(false);
  const [selectedGoalForLogging, setSelectedGoalForLogging] = useState<Goal | null>(null);
  const [logProgressValue, setLogProgressValue] = useState('');
  const [logProgressSystolic, setLogProgressSystolic] = useState('');
  const [logProgressDiastolic, setLogProgressDiastolic] = useState('');
  const [logProgressWeight, setLogProgressWeight] = useState('');
  const [logProgressHeartbeat, setLogProgressHeartbeat] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const queryClient = useQueryClient();

  // Mutation for creating goals
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
      return await goalsService.createGoal(goalData);
    },
    onSuccess: async () => {
      // Refetch active goals to show the new challenge
      await queryClient.invalidateQueries({ queryKey: ['goals', 'active'] });
      await refetchActive(); // Explicitly refetch to ensure immediate update
      // Close modal and reset form
      setShowModal(false);
      setSelectedCategory('weight');
      setDifficulty(50);
      setRewardAmount(1000);
      setIsEditingReward(false);
      setCategoryDetails({
        weight: { current: '80', target: '75', unit: 'kg' },
        activity: { current: '5000', target: '10000', unit: 'steps' },
        hydration: { current: '1500', target: '2500', unit: 'ml' },
        sleep: { current: '6', target: '8', unit: 'hours' }
      });
    },
    onError: (error) => {
      console.error('Failed to create goal:', error);
    }
  });

  // Handler function for creating challenge
  const handleCreateChallenge = async () => {
    const categoryLabels: Record<string, string> = {
      weight: 'Weight Loss',
      activity: 'Activity & Steps',
      hydration: 'Hydration',
      sleep: 'Sleep Quality'
    };

    const currentDetails = categoryDetails[selectedCategory as keyof typeof categoryDetails];
    const goalTitle = `${categoryLabels[selectedCategory]} Challenge`;
    const goalDescription = `Reach ${currentDetails.target} ${currentDetails.unit} from current ${currentDetails.current} ${currentDetails.unit}`;

    const newGoal: Omit<Goal, 'id' | 'createdAt'> = {
      title: goalTitle,
      description: goalDescription,
      category: selectedCategory as Goal['category'],
      target: `${currentDetails.target} ${currentDetails.unit}`,
      current: `${currentDetails.current} ${currentDetails.unit}`,
      reward: rewardAmount,
      status: 'active',
      assignedByRole: 'self',
      startDate: new Date().toISOString(),
      progress: 0,
    };

    console.log('[Frontend] Creating challenge:', newGoal);
    try {
      await createGoalMutation.mutateAsync(newGoal);
      console.log('[Frontend] ✅ Challenge created successfully');
    } catch (error) {
      console.error('[Frontend] ❌ Failed to create challenge:', error);
    }
  };

  // Mutation for logging progress
  const logProgressMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: string; currentValue: string }) => {
      return await goalsService.updateGoal(goalId, { current: currentValue });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals', 'active'] });
      await refetchActive();
      setShowLogProgressModal(false);
      setSelectedGoalForLogging(null);
      setLogProgressValue('');
      setLogProgressSystolic('');
      setLogProgressDiastolic('');
      setLogProgressWeight('');
      setLogProgressHeartbeat('');
    },
    onError: (error) => {
      console.error('Failed to log progress:', error);
      alert('Failed to log progress. Please try again.');
    }
  });

  // Detect challenge type from goal title/category
  const detectChallengeType = (goal: Goal): 'steps' | 'weight' | 'bp' | 'heartbeat' | 'hydration' | 'sleep' | 'other' => {
    const title = goal.title.toLowerCase();
    const category = goal.category?.toLowerCase() || '';
    
    if (title.includes('step') || title.includes('activity') || title.includes('walk') || category === 'activity') {
      return 'steps';
    }
    if (title.includes('weight') || title.includes('kg') || title.includes('lb') || category === 'weight') {
      return 'weight';
    }
    if (title.includes('blood pressure') || title.includes('bp') || title.includes('pressure') || category === 'bp') {
      return 'bp';
    }
    if (title.includes('heart') || title.includes('heartbeat') || title.includes('bpm') || title.includes('pulse')) {
      return 'heartbeat';
    }
    if (title.includes('water') || title.includes('hydration') || title.includes('ml') || category === 'hydration') {
      return 'hydration';
    }
    if (title.includes('sleep') || category === 'sleep') {
      return 'sleep';
    }
    return 'other';
  };

  // Get unit for challenge type
  const getChallengeUnit = (goal: Goal): string => {
    const type = detectChallengeType(goal);
    const description = goal.description.toLowerCase();
    
    switch (type) {
      case 'steps':
        return 'steps';
      case 'weight':
        if (description.includes('kg')) return 'kg';
        if (description.includes('lb')) return 'lbs';
        return 'kg';
      case 'bp':
        return 'mmHg';
      case 'heartbeat':
        return 'bpm';
      case 'hydration':
        return 'ml';
      case 'sleep':
        return 'hours';
      default:
        // Try to extract unit from description
        const unitMatch = goal.description.match(/(\w+)$/);
        return unitMatch ? unitMatch[1] : '';
    }
  };

  // Handle log progress button click
  const handleLogProgressClick = (goal: Goal) => {
    setSelectedGoalForLogging(goal);
    setLogProgressValue(goal.current || '');
    setShowLogProgressModal(true);
  };

  // Handle submit progress
  const handleSubmitProgress = async () => {
    if (!selectedGoalForLogging) return;
    
    const challengeType = detectChallengeType(selectedGoalForLogging);
    let currentValue = '';
    
    switch (challengeType) {
      case 'steps':
        currentValue = logProgressValue || '0';
        break;
      case 'weight':
        currentValue = logProgressWeight || logProgressValue || selectedGoalForLogging.current || '0';
        break;
      case 'bp':
        if (!logProgressSystolic || !logProgressDiastolic) {
          alert('Please enter both systolic and diastolic values');
          return;
        }
        currentValue = `${logProgressSystolic}/${logProgressDiastolic}`;
        break;
      case 'heartbeat':
        currentValue = logProgressHeartbeat || logProgressValue || '0';
        break;
      case 'hydration':
        currentValue = logProgressValue || '0';
        break;
      case 'sleep':
        currentValue = logProgressValue || '0';
        break;
      default:
        currentValue = logProgressValue || selectedGoalForLogging.current || '0';
    }
    
    setSubmittingProgress(true);
    try {
      await logProgressMutation.mutateAsync({
        goalId: selectedGoalForLogging.id,
        currentValue: currentValue
      });
      alert('Progress logged successfully!');
    } catch (error) {
      console.error('Error logging progress:', error);
    } finally {
      setSubmittingProgress(false);
    }
  };

  // Mutation for submitting BP reading
  const submitBPReadingMutation = useMutation({
    mutationFn: async ({ systolic, diastolic, goalId }: { systolic: number; diastolic: number; goalId: string }) => {
      console.log('[Frontend] Submitting BP reading mutation:', { systolic, diastolic, goalId });
      
      // Update vitals
      try {
        await healthService.updateVitals({
          bloodPressure: `${systolic}/${diastolic}`,
          timestamp: new Date(),
        });
        console.log('[Frontend] ✅ Vitals updated');
      } catch (error) {
        console.error('[Frontend] ❌ Failed to update vitals:', error);
      }
      
      // Update goal progress
      // First, try to get the goal from activeGoals, or fetch it
      let bpGoal = activeGoals.find(g => g.id === goalId);
      
      // If not found, try to get all goals and find it
      if (!bpGoal) {
        try {
          const allGoals = await goalsService.getGoals({ status: 'active' });
          bpGoal = allGoals.find(g => g.id === goalId);
          console.log('[Frontend] Fetched goals to find BP goal:', bpGoal ? 'Found' : 'Not found');
        } catch (error) {
          console.error('[Frontend] Failed to fetch goals:', error);
        }
      }
      
      if (bpGoal) {
        const newCurrent = `${systolic}/${diastolic}`;
        const targetBP = bpGoal.target.split('/'); // e.g., "120/80"
        const targetSystolic = parseInt(targetBP[0]);
        const targetDiastolic = parseInt(targetBP[1]);
        
        // Calculate progress: if reading is at or below target, goal is complete
        const isComplete = systolic <= targetSystolic && diastolic <= targetDiastolic;
        const progress = isComplete ? 100 : Math.min(95, Math.max(0, 
          ((targetSystolic - systolic) / targetSystolic) * 50 + 
          ((targetDiastolic - diastolic) / targetDiastolic) * 50
        ));
        
        console.log('[Frontend] Updating goal:', { goalId, newCurrent, progress, isComplete });
        
        // Update goal
        try {
          await goalsService.updateGoal(goalId, {
            current: newCurrent,
            progress: progress,
            status: isComplete ? 'completed' : 'active',
            completedDate: isComplete ? new Date().toISOString() : undefined,
          });
          console.log('[Frontend] ✅ Goal updated');
        } catch (error) {
          console.error('[Frontend] ❌ Failed to update goal:', error);
          throw error;
        }
      } else {
        console.warn('[Frontend] BP goal not found, but continuing...');
      }
      
      return { success: true, systolic, diastolic };
    },
    onSuccess: async () => {
      // Refetch goals and vitals
      await queryClient.invalidateQueries({ queryKey: ['goals', 'active'] });
      await queryClient.invalidateQueries({ queryKey: ['health', 'vitals'] });
      await refetchActive();
      setShowBPModal(false);
      setSystolic('');
      setDiastolic('');
    },
    onError: (error) => {
      console.error('Failed to submit BP reading:', error);
    }
  });

  // Handler for submitting BP reading
  const handleSubmitBPReading = async () => {
    const sys = parseInt(systolic);
    const dias = parseInt(diastolic);
    
    // Validation
    if (!systolic || !diastolic || isNaN(sys) || isNaN(dias)) {
      alert('Please enter valid blood pressure values');
      return;
    }
    
    if (sys < 50 || sys > 250 || dias < 30 || dias > 150) {
      alert('Please enter realistic blood pressure values (Systolic: 50-250, Diastolic: 30-150)');
      return;
    }
    
    // Find the BP goal (assigned by doctor) or use default
    let bpGoal = activeGoals.find(g => g.category === 'bp' && g.assignedByRole === 'doctor');
    
    // If goal doesn't exist, use default BP goal ID
    if (!bpGoal) {
      console.warn('[Frontend] BP goal not found in activeGoals, using default goal ID: bp-goal');
      bpGoal = {
        id: 'bp-goal',
        category: 'bp',
        assignedByRole: 'doctor',
        target: '120/80',
      } as Goal;
    }
    
    console.log('[Frontend] Submitting BP reading for goal:', bpGoal.id);
    
    setSubmittingBP(true);
    try {
      await submitBPReadingMutation.mutateAsync({
        systolic: sys,
        diastolic: dias,
        goalId: bpGoal.id,
      });
    } catch (error) {
      console.error('Error submitting BP reading:', error);
      alert('Failed to submit reading. Please try again.');
    } finally {
      setSubmittingBP(false);
    }
  };

  // Fetch active goals
  const { data: activeGoals = [], isLoading: activeLoading, refetch: refetchActive } = useQuery({
    queryKey: ['goals', 'active'],
    queryFn: async () => {
      try {
        const goals = await goalsService.getGoals({ status: 'active' });
        console.log('[Frontend] Fetched active goals:', goals.length, goals.map(g => ({ id: g.id, title: g.title })));
        return goals;
      } catch (error) {
        console.error('[Frontend] Error fetching goals:', error);
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // Fetch goal history
  const { data: goalHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['goals', 'history'],
    queryFn: async () => {
      try {
        return await goalsService.getHistory(50, 0);
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
    enabled: activeTab === 'history',
  });

  // Fetch pending rewards
  const { data: pendingRewards = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['goals', 'pending-rewards'],
    queryFn: async () => {
      try {
        return await goalsService.getPendingRewards();
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
    enabled: activeTab === 'pending',
  });

  // Check for challenge context from navigation
  useEffect(() => {
    if (navigationState.selectedChallenge) {
      const challenge = navigationState.selectedChallenge;
      setHighlightedChallenge(challenge.challengeId);
      setActiveTab('active'); // Switch to active tab
      
      // Scroll to the challenge after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (challengeRef.current) {
          challengeRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Remove highlight after 5 seconds and clear navigation state
          setTimeout(() => {
            setHighlightedChallenge(null);
            clearNavigationState();
          }, 5000);
        } else {
          // If ref not found, clear after a delay anyway
          setTimeout(() => {
            setHighlightedChallenge(null);
            clearNavigationState();
          }, 5000);
        }
      }, 300);
    }
  }, [navigationState.selectedChallenge, clearNavigationState]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderActiveGoals = () => {
    if (activeLoading) {
  return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      );
    }

    // Use existing hardcoded content for now, but structure it to work with real data
    return (
      <>
          {/* Assigned by Care Team Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="medical_services" className="text-blue-500 text-xl" />
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Assigned by Care Team</h3>
            </div>
            
            {/* Blood Pressure Card */}
            <div 
              ref={highlightedChallenge === 'critical-recovery-pledge' ? challengeRef : null}
              className={`bg-white dark:bg-surface-dark rounded-2xl border shadow-sm flex flex-col md:flex-row overflow-hidden group relative transition-all duration-500 ${
                highlightedChallenge === 'critical-recovery-pledge' 
                  ? 'border-2 border-primary shadow-lg shadow-primary/20 scale-[1.02] ring-2 ring-primary/30' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Highlight indicator */}
              {highlightedChallenge === 'critical-recovery-pledge' && (
                <div className="absolute top-4 right-4 bg-primary text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 z-20 shadow-lg">
                  <Icon name="check_circle" className="text-sm" />
                  New Challenge from Dr. Smith
                </div>
              )}
                {/* Left Side: Clinical Data */}
                <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wide mb-3 border border-cyan-100 dark:border-cyan-800">
                            <Icon name="verified_user" className="text-xs" />
                            Assigned by Dr. Smith
                        </div>
                        <h4 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">Lower Blood Pressure</h4>
                        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Target: <span className="text-slate-900 dark:text-white font-bold">120/80</span></p>
                    </div>

                    <div className="mt-6 flex items-end gap-6 md:gap-8">
                        {/* SVG Gauge */}
                        <div className="relative w-32 md:w-40 h-16 md:h-20">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" aria-hidden="true">
                                {/* Track */}
                                <path d="M 10,50 A 40,40 0 0 1 90,50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" className="dark:stroke-slate-800" />
                                {/* Red Progress (High BP) */}
                                <path d="M 10,50 A 40,40 0 0 1 90,50" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="100" />
                            </svg>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-center">
                            <div className="bg-red-500 size-1.5 md:size-2 rounded-full mx-auto mb-0.5 animate-pulse"></div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
                            <p className="text-xl md:text-2xl font-black text-red-500 leading-none tracking-tighter">
                              <LiveBPDisplay />
                            </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5 pb-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Last Reading:</p>
                            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">Today, 9:00 AM</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Reward Vault */}
                <div className="bg-[#fffbf0] dark:bg-amber-950/20 border-t md:border-t-0 md:border-l border-amber-100 dark:border-amber-900/30 p-5 md:p-6 md:w-72 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-amber-200 dark:text-amber-900/40 opacity-50 -rotate-12 pointer-events-none">
                            <Icon name="lock_open" className="text-6xl" />
                    </div>
                    
                    <div className="size-12 rounded-full bg-white dark:bg-surface-dark shadow-sm border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-400 mb-3 relative z-10">
                        <Icon name="lock" className="text-2xl" />
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight relative z-10">1,000 RDM</h3>
                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 uppercase tracking-widest mb-4 relative z-10">Locked in Vault</span>

                    <div className="flex items-start gap-1.5 text-left relative z-10 justify-center">
                        <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight max-w-[160px]">
                            Unlocks upon verified reading &lt; 120/80.
                        </p>
                    </div>
                    
                    <p className="text-[10px] font-bold text-red-500 mt-2 relative z-10">Expiring in 5 Days.</p>
                </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span className="flex items-center gap-1.5"><Icon name="info" className="text-sm" /> Verify your progress to unlock funds.</span>
              <button 
                onClick={() => {
                  const bpGoal = activeGoals.find(g => g.category === 'bp' && g.assignedByRole === 'doctor');
                  console.log('[Frontend] Submit Reading clicked. BP Goal found:', bpGoal);
                  console.log('[Frontend] Active goals:', activeGoals.map(g => ({ id: g.id, category: g.category, assignedByRole: g.assignedByRole })));
                  if (bpGoal) {
                    setShowBPModal(true);
                  } else {
                    console.warn('[Frontend] No BP goal found in activeGoals. Opening modal anyway with default goal.');
                    // Open modal anyway - we'll use a default goal ID
                    setShowBPModal(true);
                  }
                }}
                className="font-bold text-primary-dark dark:text-primary uppercase tracking-wide flex items-center gap-1 hover:underline"
                title="Submit blood pressure reading"
                aria-label="Submit blood pressure reading"
              >
                    Submit Reading <Icon name="arrow_forward" className="text-sm" />
                </button>
            </div>
          </section>

          {/* Personal Challenges Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="emoji_events" className="text-primary text-xl" />
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Personal Challenges</h3>
            </div>

          {(() => {
            const personalGoals = activeGoals.filter(goal => goal.assignedByRole !== 'doctor');
            console.log('[Frontend] Personal challenges count:', personalGoals.length, personalGoals.map(g => ({ id: g.id, title: g.title })));
            return personalGoals.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800">
              <Icon name="emoji_events" className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No personal challenges yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals
                .filter(goal => goal.assignedByRole !== 'doctor')
                .map((goal) => {
                  const getCategoryIcon = (category: string) => {
                    const icons: Record<string, string> = {
                      weight: 'monitor_weight',
                      activity: 'directions_run',
                      hydration: 'water_drop',
                      sleep: 'bedtime',
                      bp: 'monitor_heart',
                      other: 'flag'
                    };
                    return icons[category] || 'flag';
                  };

                  const getCategoryColor = (category: string) => {
                    const colors: Record<string, { bg: string; text: string; border: string }> = {
                      weight: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-500', border: 'border-purple-200 dark:border-purple-800' },
                      activity: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500', border: 'border-blue-200 dark:border-blue-800' },
                      hydration: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-500', border: 'border-cyan-200 dark:border-cyan-800' },
                      sleep: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
                      bp: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500', border: 'border-rose-200 dark:border-rose-800' },
                    };
                    return colors[category] || { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500', border: 'border-slate-200 dark:border-slate-800' };
                  };

                  const categoryColor = getCategoryColor(goal.category);
                  const progress = goal.progress || 0;
                  const challengeId = `#${goal.id.slice(-8).toUpperCase()}`;

                  return (
                    <div key={goal.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                          <div className={`size-12 md:size-14 rounded-xl ${categoryColor.bg} flex items-center justify-center ${categoryColor.text} shrink-0`}>
                            <Icon name={getCategoryIcon(goal.category)} className="text-2xl md:text-3xl" />
                          </div>
                          <div>
                            <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{goal.title}</h4>
                            <p className="text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Challenge ID: {challengeId}</p>
                          </div>
                      </div>
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg">Active Challenge</span>
                  </div>

                      {/* Progress Bar */}
                      {progress > 0 && (
                        <div className="mb-4">
                          <ProgressBar progress={progress} colorClass="bg-blue-500" />
                          <p className="text-xs text-slate-400 mt-1">{Math.round(progress)}% complete</p>
                      </div>
                      )}

                      {/* Challenge Details */}
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Current:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{goal.current}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Target:</span>
                          <span className="font-bold text-primary">{goal.target}</span>
                      </div>
                  </div>

                      {/* Reward Box */}
                      <div className={`${categoryColor.bg} border ${categoryColor.border} rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4`}>
                      <div className="flex items-start gap-3">
                          <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <Icon name="stars" className="text-sm" />
                          </div>
                          <div>
                              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">
                              Reward: <span className="text-primary">{goal.reward.toLocaleString()} RDM</span>
                              </p>
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{goal.description}</p>
                          </div>
                      </div>
                        <button 
                          onClick={() => handleLogProgressClick(goal)}
                          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap w-full sm:w-auto"
                          title="Log your progress"
                          aria-label="Log your progress"
                        >
                          Log Progress
                      </button>
                  </div>
               </div>
                  );
                })}
            </div>
          );
          })()}
        </section>
      </>
    );
  };

  const renderGoalHistory = () => {
    if (historyLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
                      </div>
      );
    }

    if (goalHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon name="history" className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No completed goals yet. Complete a goal to see it here!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {goalHistory.map((goal) => (
          <div key={goal.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                  goal.status === 'completed' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Icon name={goal.status === 'completed' ? 'check_circle' : 'cancel'} className="text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{goal.title}</h4>
                    {goal.status === 'completed' && (
                      <Badge color="green">Completed</Badge>
                    )}
                    {goal.status === 'expired' && (
                      <Badge color="red">Expired</Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-2">{goal.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>Target: <span className="font-bold text-slate-600 dark:text-slate-300">{goal.target}</span></span>
                    {goal.completedDate && (
                      <span>Completed: <span className="font-bold text-slate-600 dark:text-slate-300">{formatDate(goal.completedDate)}</span></span>
                    )}
                    {goal.assignedBy && (
                      <span>Assigned by: <span className="font-bold text-slate-600 dark:text-slate-300">{goal.assignedBy}</span></span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase mb-1">Reward</p>
                  <p className={`text-lg font-black ${goal.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {goal.reward.toLocaleString()} RDM
                  </p>
                </div>
                {goal.status === 'completed' && (
                  <Badge color="green">
                    <Icon name="check" className="text-xs" /> Earned
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPendingWealth = () => {
    if (pendingLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      );
    }

    if (pendingRewards.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon name="lock" className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No pending rewards. Complete goals to unlock rewards!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pendingRewards.map((reward) => (
          <div key={reward.id} className="bg-white dark:bg-surface-dark rounded-2xl border-2 border-amber-200 dark:border-amber-800 p-5 md:p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-2 right-2 text-amber-200 dark:text-amber-900/40 opacity-50 -rotate-12 pointer-events-none">
              <Icon name="lock_open" className="text-6xl" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Icon name="lock" className="text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{reward.goalTitle}</h4>
                    {reward.status === 'ready_to_claim' && (
                      <Badge color="green">Ready to Claim</Badge>
                    )}
                    {reward.status === 'pending_verification' && (
                      <Badge color="orange">Pending Verification</Badge>
                    )}
                    {reward.status === 'locked' && (
                      <Badge color="red">Locked</Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-2">{reward.unlockCondition}</p>
                  {reward.daysRemaining !== undefined && reward.daysRemaining > 0 && (
                    <p className="text-[10px] font-bold text-red-500">
                      Expiring in {reward.daysRemaining} {reward.daysRemaining === 1 ? 'Day' : 'Days'}.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase mb-1">Locked Reward</p>
                  <p className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">
                    {reward.reward.toLocaleString()} RDM
                  </p>
                </div>
                {reward.status === 'ready_to_claim' && (
                  <button 
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                    title="Claim your reward"
                    aria-label="Claim your reward"
                  >
                    Claim Now
                  </button>
                )}
                {reward.status === 'pending_verification' && (
                  <button 
                    className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold cursor-not-allowed"
                    title="Reward is awaiting verification"
                    aria-label="Reward is awaiting verification"
                    disabled
                  >
                    Awaiting Verification
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
            <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Health Targets</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base mt-1">Hit targets to unlock rewards entrusted by your Care Team.</p>
                      </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary-dark text-slate-900 px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 uppercase tracking-wide"
          >
            <Icon name="add" className="font-bold text-base md:text-lg" />
            Create New Goal
          </button>
          <button 
            className="relative p-2.5 bg-white dark:bg-surface-dark rounded-full shadow-sm text-slate-400 hover:text-primary transition-colors border border-slate-100 dark:border-slate-800"
            title="Notifications"
            aria-label="View notifications"
          >
            <Icon name="notifications" className="text-xl" />
            <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-surface-dark animate-pulse"></span>
          </button>
                  </div>
               </div>

      {/* Tabs */}
      <div className="flex gap-6 md:gap-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-3 border-b-2 font-bold text-xs md:text-sm uppercase tracking-wide whitespace-nowrap transition-colors ${
            activeTab === 'active'
              ? 'border-primary text-slate-900 dark:text-white'
              : 'border-transparent font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Active Goals
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 font-bold text-xs md:text-sm uppercase tracking-wide whitespace-nowrap transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-slate-900 dark:text-white'
              : 'border-transparent font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Goal History
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 border-b-2 font-bold text-xs md:text-sm uppercase tracking-wide whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'border-primary text-slate-900 dark:text-white'
              : 'border-transparent font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Icon name="lock" className="text-sm mb-0.5" />
          Pending Wealth ({pendingRewards.length} Items)
        </button>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {activeTab === 'active' && renderActiveGoals()}
          {activeTab === 'history' && renderGoalHistory()}
          {activeTab === 'pending' && renderPendingWealth()}
        </div>

        {/* Sidebar Area - Only show for active tab */}
        {activeTab === 'active' && (
        <div className="lg:col-span-4 flex flex-col gap-6">
           {/* Performance Card (The Multiplier Engine) */}
           <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col relative border-2 border-blue-50 dark:border-blue-900/20">
              <div className="bg-slate-900 p-4 flex items-center justify-center gap-2 shrink-0">
                  <span className="text-base">🚀</span>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">THE "MULTIPLIER" ENGINE</span>
              </div>
              
              <div className="p-6 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                      {/* Custom SVG Circle for Gold Tier */}
                      <div className="relative size-32">
                          <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="6" className="dark:stroke-slate-800" />
                              <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" strokeDasharray="283" strokeDashoffset="40" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Icon name="emoji_events" className="text-3xl text-amber-400 mb-1" />
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">GOLD TIER</span>
                          </div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700 whitespace-nowrap z-10">
                              Top 15%
                          </div>
                      </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Success Rate: 85%</h3>

                  <div className="w-full bg-[#fffbf0] dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 flex items-center justify-center gap-2">
                      <Icon name="bolt" className="text-amber-500 text-base" />
                      <span className="text-sm font-black text-amber-700 dark:text-amber-400">x1.2 Multiplier Active</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed px-4">
                      You are earning <span className="font-bold text-emerald-600 dark:text-emerald-400">20% more RDM</span> on all habits because your consistency is high.
                  </p>

                  <div className="w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3 mb-4 flex items-start gap-2 text-left">
                      <Icon name="warning" className="text-red-500 text-sm shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium text-red-600 dark:text-red-300 leading-tight">
                          Drop below 80% success rate to lose this bonus.
                      </p>
                  </div>

                  <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95">
                      View Tier Rules
                  </button>
              </div>
           </div>

           {/* Daily Tip Card */}
           <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 relative overflow-hidden group shadow-lg border border-slate-700">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
              
              <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 backdrop-blur-sm">
                          <Icon name="psychology" className="text-lg" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-600 px-1.5 py-0.5 rounded">Daily Tip</span>
                  </div>
                  
                  <p className="text-white text-sm font-semibold italic leading-relaxed font-serif">
                    "Consistency is what transforms average into excellence."
                  </p>
              </div>
           </div>
        </div>
        )}
      </div>

      {/* Set a New Challenge Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set a New Challenge</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Choose a target. Commit to it. Earn Rewards.</p>
                </div>
                <button 
                    onClick={() => setShowModal(false)} 
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="Close modal"
                    aria-label="Close challenge modal"
                >
                    <Icon name="close" />
                </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Step 1 */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="size-5 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold">1</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">CHOOSE CATEGORY</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: 'weight', label: 'Weight Loss', icon: 'monitor_weight' },
                            { id: 'activity', label: 'Activity & Steps', icon: 'directions_run' },
                            { id: 'hydration', label: 'Hydration', icon: 'water_drop' },
                            { id: 'sleep', label: 'Sleep Quality', icon: 'bedtime' }
                        ].map(cat => (
                            <div 
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center gap-2 border transition-all relative ${
                                    selectedCategory === cat.id 
                                    ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' 
                                    : 'border-slate-100 dark:border-slate-700 hover:border-cyan-200'
                                }`}
                            >
                                {selectedCategory === cat.id && (
                                    <div className="absolute top-1 right-1 text-cyan-500">
                                        <Icon name="check_circle" className="text-sm fill-1" />
                                    </div>
                                )}
                                <div className={`size-10 rounded-full flex items-center justify-center ${
                                    selectedCategory === cat.id ? 'bg-white text-cyan-500' : 'bg-slate-50 text-slate-400'
                                }`}>
                                    <Icon name={cat.icon} className="text-xl" />
                                </div>
                                <span className={`text-[10px] font-bold ${
                                    selectedCategory === cat.id ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-500'
                                }`}>{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Step 2 */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="size-5 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold">2</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">DEFINE THE DETAILS</h3>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-4">
                        {selectedCategory === 'weight' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                    <label htmlFor="current-weight" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">CURRENT WEIGHT</label>
                                <div className="relative">
                                        <input 
                                            id="current-weight"
                                            type="text" 
                                            value={categoryDetails.weight.current}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, weight: { ...prev.weight, current: e.target.value } }))}
                                            className="w-full bg-slate-200 dark:bg-slate-700 border-none rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none" 
                                            aria-label="Current weight in kilograms"
                                            placeholder="80"
                                            title="Enter your current weight in kilograms"
                                        />
                                    <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">kg</span>
                                </div>
                            </div>
                            <div>
                                    <label htmlFor="target-weight" className="text-[10px] font-bold text-slate-900 dark:text-white uppercase mb-1 block">TARGET WEIGHT</label>
                                <div className="relative">
                                        <input 
                                            id="target-weight"
                                            type="text" 
                                            value={categoryDetails.weight.target}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, weight: { ...prev.weight, target: e.target.value } }))}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:border-cyan-400 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none transition-colors" 
                                            aria-label="Target weight in kilograms"
                                            placeholder="75"
                                            title="Enter your target weight in kilograms"
                                        />
                                    <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">kg</span>
                                </div>
                            </div>
                        </div>
                        )}

                        {selectedCategory === 'activity' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="current-steps" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">CURRENT STEPS</label>
                                    <div className="relative">
                                        <input 
                                            id="current-steps"
                                            type="text" 
                                            value={categoryDetails.activity.current}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, activity: { ...prev.activity, current: e.target.value } }))}
                                            className="w-full bg-slate-200 dark:bg-slate-700 border-none rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none" 
                                            aria-label="Current daily steps"
                                            placeholder="5000"
                                            title="Enter your current daily steps"
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">steps</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="target-steps" className="text-[10px] font-bold text-slate-900 dark:text-white uppercase mb-1 block">TARGET STEPS</label>
                                    <div className="relative">
                                        <input 
                                            id="target-steps"
                                            type="text" 
                                            value={categoryDetails.activity.target}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, activity: { ...prev.activity, target: e.target.value } }))}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:border-cyan-400 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none transition-colors" 
                                            aria-label="Target daily steps"
                                            placeholder="10000"
                                            title="Enter your target daily steps"
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">steps</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'hydration' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="current-water" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">CURRENT WATER INTAKE</label>
                                    <div className="relative">
                                        <input 
                                            id="current-water"
                                            type="text" 
                                            value={categoryDetails.hydration.current}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, hydration: { ...prev.hydration, current: e.target.value } }))}
                                            className="w-full bg-slate-200 dark:bg-slate-700 border-none rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none" 
                                            aria-label="Current daily water intake in milliliters"
                                            placeholder="1500"
                                            title="Enter your current daily water intake"
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">ml</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="target-water" className="text-[10px] font-bold text-slate-900 dark:text-white uppercase mb-1 block">TARGET WATER INTAKE</label>
                                    <div className="relative">
                                        <input 
                                            id="target-water"
                                            type="text" 
                                            value={categoryDetails.hydration.target}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, hydration: { ...prev.hydration, target: e.target.value } }))}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:border-cyan-400 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none transition-colors" 
                                            aria-label="Target daily water intake in milliliters"
                                            placeholder="2500"
                                            title="Enter your target daily water intake"
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">ml</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'sleep' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="current-sleep" className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">CURRENT SLEEP HOURS</label>
                                    <div className="relative">
                                        <input 
                                            id="current-sleep"
                                            type="text" 
                                            value={categoryDetails.sleep.current}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, sleep: { ...prev.sleep, current: e.target.value } }))}
                                            className="w-full bg-slate-200 dark:bg-slate-700 border-none rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none" 
                                            aria-label="Current average sleep hours per night"
                                            placeholder="6"
                                            title="Enter your current average sleep hours"
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">hours</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="target-sleep" className="text-[10px] font-bold text-slate-900 dark:text-white uppercase mb-1 block">TARGET SLEEP HOURS</label>
                                    <div className="relative">
                                        <input 
                                            id="target-sleep"
                                            type="text" 
                                            value={categoryDetails.sleep.target}
                                            onChange={(e) => setCategoryDetails(prev => ({ ...prev, sleep: { ...prev.sleep, target: e.target.value } }))}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 focus:border-cyan-400 rounded-lg py-2.5 px-3 text-sm text-slate-900 dark:text-white font-bold outline-none transition-colors" 
                                            aria-label="Target sleep hours per night"
                                            placeholder="8"
                                            title="Enter your target sleep hours"
                                        />
                                        <span className="absolute right-3 top-2.5 text-slate-500 font-medium text-xs">hours</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Difficulty Meter - shown for all categories */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label htmlFor="difficulty-meter" className="text-[10px] font-bold text-slate-900 dark:text-white uppercase block">DIFFICULTY METER</label>
                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded border border-orange-200">
                                    {difficulty < 30 ? 'Easy Challenge' : difficulty < 70 ? 'Moderate Challenge' : 'Hard Challenge'}
                                </span>
                            </div>
                            <input 
                                id="difficulty-meter"
                                type="range" 
                                min="0" 
                                max="100" 
                                value={difficulty} 
                                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
                                aria-label="Challenge difficulty level"
                                title="Adjust challenge difficulty level"
                            />
                        </div>
                    </div>
                </section>

                {/* Step 3 */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                        <span className="size-5 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold">3</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">THE REWARD CONTRACT</h3>
                        </div>
                        {!isEditingReward && (
                            <button
                                onClick={() => setIsEditingReward(true)}
                                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-bold flex items-center gap-1 transition-colors"
                                title="Edit reward amount"
                                aria-label="Edit reward amount"
                            >
                                <Icon name="edit" className="text-sm" />
                                Edit
                            </button>
                        )}
                    </div>
                    
                    <div className="relative border-2 border-dashed border-cyan-300 dark:border-cyan-700 bg-cyan-50/50 dark:bg-cyan-900/10 rounded-xl p-6 text-center overflow-hidden">
                        {isEditingReward ? (
                            <div className="space-y-4">
                        <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">UPON VERIFIED COMPLETION, YOU WILL EARN:</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-4xl">💰</span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={rewardAmount}
                                            onChange={(e) => setRewardAmount(parseInt(e.target.value) || 0)}
                                            className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter bg-transparent border-b-2 border-cyan-400 focus:border-cyan-500 outline-none text-center w-32"
                                            min="0"
                                            step="100"
                                            title="Enter reward amount in RDM"
                                            aria-label="Reward amount in RDM"
                                        />
                                        <span className="absolute right-0 top-0 text-lg font-bold text-slate-400 ml-2">RDM</span>
                        </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => setIsEditingReward(false)}
                                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-xs transition-colors"
                                        title="Save reward amount"
                                        aria-label="Save reward amount"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRewardAmount(1000);
                                            setIsEditingReward(false);
                                        }}
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs transition-colors"
                                        title="Cancel editing"
                                        aria-label="Cancel editing"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">UPON VERIFIED COMPLETION, YOU WILL EARN:</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl">💰</span>
                                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{rewardAmount.toLocaleString()}</span>
                                    <span className="text-lg font-bold text-slate-400 ml-2">RDM</span>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark rounded-b-2xl">
                <button onClick={() => setShowModal(false)} className="text-slate-500 font-bold text-xs hover:text-slate-700 transition-colors px-4 py-2">
                    Cancel
                </button>
                <button 
                  onClick={handleCreateChallenge}
                  disabled={createGoalMutation.isPending}
                  className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Create and start this challenge"
                  aria-label="Create and start this challenge"
                >
                  {createGoalMutation.isPending ? 'Creating...' : 'Accept Challenge & Start'} 
                  <Icon name="arrow_forward" />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Log Progress Modal */}
      {showLogProgressModal && selectedGoalForLogging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLogProgressModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Log Progress</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{selectedGoalForLogging.title}</p>
              </div>
              <button 
                onClick={() => setShowLogProgressModal(false)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Close modal"
                aria-label="Close log progress modal"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Challenge Info */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Target</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Current</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-black text-slate-900 dark:text-white">{selectedGoalForLogging.target} {getChallengeUnit(selectedGoalForLogging)}</p>
                  <p className="text-lg font-black text-blue-500">{selectedGoalForLogging.current} {getChallengeUnit(selectedGoalForLogging)}</p>
                </div>
              </div>

              {/* Dynamic Input Fields Based on Challenge Type */}
              {(() => {
                const challengeType = detectChallengeType(selectedGoalForLogging);
                const unit = getChallengeUnit(selectedGoalForLogging);
                
                switch (challengeType) {
                  case 'steps':
                    return (
                      <div>
                        <label htmlFor="log-steps" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Current Steps
                        </label>
                        <div className="relative">
                          <input
                            id="log-steps"
                            type="number"
                            min="0"
                            max="100000"
                            value={logProgressValue}
                            onChange={(e) => setLogProgressValue(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            placeholder={selectedGoalForLogging.current || "0"}
                            title="Enter your current step count"
                            aria-label="Current steps"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">{unit}</span>
                        </div>
                      </div>
                    );
                  
                  case 'weight':
                    return (
                      <div>
                        <label htmlFor="log-weight" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Current Weight
                        </label>
                        <div className="relative">
                          <input
                            id="log-weight"
                            type="number"
                            min="0"
                            max="500"
                            step="0.1"
                            value={logProgressWeight || logProgressValue}
                            onChange={(e) => {
                              setLogProgressWeight(e.target.value);
                              setLogProgressValue(e.target.value);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            placeholder={selectedGoalForLogging.current || "0"}
                            title="Enter your current weight"
                            aria-label="Current weight"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">{unit}</span>
                        </div>
                      </div>
                    );
                  
                  case 'bp':
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="log-systolic" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                            Systolic
                          </label>
                          <div className="relative">
                            <input
                              id="log-systolic"
                              type="number"
                              min="50"
                              max="250"
                              value={logProgressSystolic}
                              onChange={(e) => setLogProgressSystolic(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                              placeholder="120"
                              title="Enter systolic blood pressure"
                              aria-label="Systolic blood pressure"
                            />
                            <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">mmHg</span>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="log-diastolic" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                            Diastolic
                          </label>
                          <div className="relative">
                            <input
                              id="log-diastolic"
                              type="number"
                              min="30"
                              max="150"
                              value={logProgressDiastolic}
                              onChange={(e) => setLogProgressDiastolic(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                              placeholder="80"
                              title="Enter diastolic blood pressure"
                              aria-label="Diastolic blood pressure"
                            />
                            <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">mmHg</span>
                          </div>
                        </div>
                      </div>
                    );
                  
                  case 'heartbeat':
                    return (
                      <div>
                        <label htmlFor="log-heartbeat" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Current Heart Rate
                        </label>
                        <div className="relative">
                          <input
                            id="log-heartbeat"
                            type="number"
                            min="30"
                            max="220"
                            value={logProgressHeartbeat || logProgressValue}
                            onChange={(e) => {
                              setLogProgressHeartbeat(e.target.value);
                              setLogProgressValue(e.target.value);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            placeholder={selectedGoalForLogging.current || "0"}
                            title="Enter your current heart rate"
                            aria-label="Current heart rate"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">{unit}</span>
                        </div>
                      </div>
                    );
                  
                  case 'hydration':
                    return (
                      <div>
                        <label htmlFor="log-hydration" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Water Intake
                        </label>
                        <div className="relative">
                          <input
                            id="log-hydration"
                            type="number"
                            min="0"
                            max="10000"
                            value={logProgressValue}
                            onChange={(e) => setLogProgressValue(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            placeholder={selectedGoalForLogging.current || "0"}
                            title="Enter your current water intake"
                            aria-label="Current water intake"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">{unit}</span>
                        </div>
                      </div>
                    );
                  
                  case 'sleep':
                    return (
                      <div>
                        <label htmlFor="log-sleep" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Hours Slept
                        </label>
                        <div className="relative">
                          <input
                            id="log-sleep"
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={logProgressValue}
                            onChange={(e) => setLogProgressValue(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            placeholder={selectedGoalForLogging.current || "0"}
                            title="Enter hours slept"
                            aria-label="Hours slept"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">{unit}</span>
                        </div>
                      </div>
                    );
                  
                  default:
                    return (
                      <div>
                        <label htmlFor="log-other" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Current Value
                        </label>
                        <div className="relative">
                          <input
                            id="log-other"
                            type="text"
                            value={logProgressValue}
                            onChange={(e) => setLogProgressValue(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            placeholder={selectedGoalForLogging.current || "Enter value"}
                            title="Enter your current progress"
                            aria-label="Current progress"
                          />
                          {unit && (
                            <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">{unit}</span>
                          )}
                        </div>
                      </div>
                    );
                }
              })()}

              {/* Info Message */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                <Icon name="info" className="text-amber-500 text-sm shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Your progress will be saved and tracked. Keep logging to reach your target!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button 
                onClick={() => {
                  setShowLogProgressModal(false);
                  setSelectedGoalForLogging(null);
                  setLogProgressValue('');
                  setLogProgressSystolic('');
                  setLogProgressDiastolic('');
                  setLogProgressWeight('');
                  setLogProgressHeartbeat('');
                }} 
                className="text-slate-500 font-bold text-xs hover:text-slate-700 transition-colors px-4 py-2"
                title="Cancel"
                aria-label="Cancel logging progress"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitProgress}
                disabled={submittingProgress || (() => {
                  const challengeType = detectChallengeType(selectedGoalForLogging);
                  if (challengeType === 'bp') {
                    return !logProgressSystolic || !logProgressDiastolic;
                  }
                  if (challengeType === 'weight') {
                    return !logProgressWeight && !logProgressValue;
                  }
                  if (challengeType === 'heartbeat') {
                    return !logProgressHeartbeat && !logProgressValue;
                  }
                  return !logProgressValue;
                })()}
                className="bg-primary hover:bg-primary-dark text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Submit progress"
                aria-label="Submit progress"
              >
                {submittingProgress ? 'Logging...' : 'Log Progress'} 
                <Icon name="check" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blood Pressure Reading Modal */}
      {showBPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowBPModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit Blood Pressure Reading</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enter your current BP reading to track progress</p>
              </div>
              <button 
                onClick={() => setShowBPModal(false)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Close modal"
                aria-label="Close BP reading modal"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Target Display */}
              {(() => {
                const bpGoal = activeGoals.find(g => g.category === 'bp' && g.assignedByRole === 'doctor');
                const targetBP = bpGoal?.target || '120/80';
                const currentBP = bpGoal?.current || '145/90';
                return (
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Target</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{targetBP}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Current</p>
                        <p className="text-lg font-black text-red-500">{currentBP}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Input Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="systolic" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    Systolic (Top Number)
                  </label>
                  <div className="relative">
                    <input
                      id="systolic"
                      type="number"
                      min="50"
                      max="250"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                      placeholder="120"
                      title="Enter systolic blood pressure (top number)"
                      aria-label="Systolic blood pressure"
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">mmHg</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="diastolic" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                    Diastolic (Bottom Number)
                  </label>
                  <div className="relative">
                    <input
                      id="diastolic"
                      type="number"
                      min="30"
                      max="150"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                      placeholder="80"
                      title="Enter diastolic blood pressure (bottom number)"
                      aria-label="Diastolic blood pressure"
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">mmHg</span>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                <Icon name="info" className="text-amber-500 text-sm shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Your reading will be verified. If it meets the target (≤120/80), the reward will be unlocked.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowBPModal(false)} 
                className="text-slate-500 font-bold text-xs hover:text-slate-700 transition-colors px-4 py-2"
                title="Cancel"
                aria-label="Cancel BP reading submission"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitBPReading}
                disabled={submittingBP || !systolic || !diastolic}
                className="bg-primary hover:bg-primary-dark text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Submit blood pressure reading"
                aria-label="Submit blood pressure reading"
              >
                {submittingBP ? 'Submitting...' : 'Submit Reading'} 
                <Icon name="arrow_forward" />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

