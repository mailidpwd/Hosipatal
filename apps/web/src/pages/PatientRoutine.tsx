import React, { useState } from 'react';
import { Card, Icon, Button, Badge, Modal } from '@/components/UI';

interface Habit {
  id: string;
  section: 'morning' | 'afternoon' | 'evening';
  title: string;
  subtitle: string;
  timeText: string;
  status: 'completed' | 'pending' | 'missed';
  type: 'standard' | 'medication' | 'sync';
  successMessage: string;
  reward?: string;
  pot?: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  habitTitle: string;
  status: 'completed' | 'missed';
  reward?: string;
  timeText: string;
  section: 'morning' | 'afternoon' | 'evening';
}

const CelebrationModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center transform transition-all animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)] border border-gray-100 dark:border-gray-800">
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-20 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full border-4 border-white dark:border-surface-dark flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-4xl text-white drop-shadow-md">emoji_events</span>
             </div>
             <div className="mt-8">
                 <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-primary mb-1">Fantastic!</h3>
                 <p className="text-text-main dark:text-white font-medium text-sm leading-relaxed">{message}</p>
             </div>
             <button onClick={onClose} className="mt-6 w-full py-3 bg-text-main text-white dark:bg-white dark:text-black rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all text-sm shadow-lg">
                Keep Going
             </button>
        </div>
    </div>
);

const RecoveryModal = ({ onClose, onRecover }: { onClose: () => void; onRecover: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="relative bg-white dark:bg-surface-dark rounded-[24px] shadow-2xl w-full max-w-md transform transition-all animate-[fadeIn_0.3s_ease-out] overflow-hidden">
             {/* Close Button */}
             <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-10">
                <Icon name="close" className="text-xl" />
             </button>

             <div className="p-8 flex flex-col items-center text-center">
                 {/* Icon */}
                 <div className="size-20 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping opacity-20"></div>
                    <Icon name="lightbulb" className="text-4xl text-cyan-500 fill-1" />
                 </div>

                 {/* Content */}
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Don't break the chain!</h3>
                 <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                    Read this 1-min tip on <span className="text-slate-900 dark:text-white font-bold">'Stress Reduction'</span> to recover <span className="text-cyan-600 dark:text-cyan-400 font-bold">50% of your points</span>.
                 </p>

                 {/* Action Button */}
                 <button 
                    onClick={() => {
                        onRecover();
                        onClose();
                    }} 
                    className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-500 text-slate-900 rounded-xl font-black text-sm shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                    <Icon name="menu_book" className="text-lg" />
                    [ Read & Recover ]
                 </button>

                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">RECOVERY MECHANISM ACTIVE</p>
             </div>
        </div>
    </div>
);

export const PatientRoutine = () => {
    const [habits, setHabits] = useState<Habit[]>([
        { id: 'm1', section: 'morning', title: 'Drink Water (500ml)', subtitle: 'Start hydration immediately after waking up.', timeText: '7:15 AM', status: 'completed', type: 'standard', successMessage: 'Great start! Hydration fuels your brain for the day.', reward: '+2 RDM Earned' },
        { id: 'm2', section: 'morning', title: 'Take Vitamin D', subtitle: 'Take with food for better absorption.', timeText: '08:00 AM', status: 'pending', type: 'medication', successMessage: 'Vital nutrients secured! Your bones thank you.', pot: 'Pot: 5 RDM' },
        { id: 'm3', section: 'morning', title: 'Morning Walk', subtitle: 'Target: 30 minutes, Zone 2 Heart Rate.', timeText: '09:00 AM', status: 'pending', type: 'sync', successMessage: 'Steps logged! Movement is the best medicine.' },
        { id: 'a1', section: 'afternoon', title: 'Drink Water (500ml)', subtitle: 'Stay hydrated throughout the afternoon to maintain energy levels.', timeText: '14:00 PM', status: 'pending', type: 'standard', successMessage: 'Excellent! Staying hydrated keeps you focused and energized.', reward: '+2 RDM Earned', pot: 'Pot: 2 RDM' },
        { id: 'a2', section: 'afternoon', title: 'Healthy Lunch (High Protein)', subtitle: 'Chicken breast or Tofu with greens.', timeText: '13:00 PM', status: 'pending', type: 'standard', successMessage: 'Fueled up! Healthy food leads to a healthy mind.', pot: 'Pot: 2 RDM' },
        { id: 'a3', section: 'afternoon', title: '5-min Meditation', subtitle: 'Use the calm app or silent sitting.', timeText: 'Missed (Yesterday)', status: 'missed', type: 'standard', successMessage: 'Zen mode activated. Enjoy the clarity.', reward: '+2 RDM Earned' },
        { id: 'e1', section: 'evening', title: 'Drink Water (500ml)', subtitle: 'Evening hydration helps with recovery and prepares your body for rest.', timeText: '19:00 PM', status: 'pending', type: 'standard', successMessage: 'Perfect! Evening hydration supports your body\'s recovery process.', reward: '+2 RDM Earned', pot: 'Pot: 2 RDM' },
        { id: 'e2', section: 'evening', title: 'Read 10 Pages', subtitle: 'Current book: "Atomic Habits"', timeText: 'Due 21:00 PM', status: 'pending', type: 'standard', successMessage: 'Knowledge gained! 1% better every day.' },
        { id: 'e3', section: 'evening', title: 'Magnesium Supplement', subtitle: 'Helps with sleep quality.', timeText: 'Due 22:00 PM', status: 'pending', type: 'medication', successMessage: 'Sleep well! Recovery starts now.' },
        { id: 'e4', section: 'evening', title: 'Drink Water (250ml)', subtitle: 'Light hydration before bed. Avoid too much to prevent nighttime disruptions.', timeText: '22:30 PM', status: 'pending', type: 'standard', successMessage: 'Good! Light hydration before bed supports quality sleep.', reward: '+1 RDM Earned', pot: 'Pot: 1 RDM' },
    ]);

    const [modalInfo, setModalInfo] = useState<{show: boolean, message: string} | null>(null);
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [habitToRecover, setHabitToRecover] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'timeline' | 'history'>('timeline');
    
    // New Habit Form State
    const [verificationType, setVerificationType] = useState<'device' | 'honesty'>('device');
    const [habitName, setHabitName] = useState('Morning Run');
    const [timing, setTiming] = useState('07:00');
    const [frequency, setFrequency] = useState('Daily');
    const [source, setSource] = useState('Apple Health > Steps');

    // Sample history data (in real app, this would come from backend)
    const [historyData] = useState<HistoryEntry[]>([
        // Today
        { id: 'h1', date: new Date().toISOString().split('T')[0], habitTitle: 'Drink Water (500ml)', status: 'completed', reward: '+2 RDM', timeText: '7:15 AM', section: 'morning' },
        // Yesterday
        { id: 'h2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], habitTitle: 'Drink Water (500ml)', status: 'completed', reward: '+2 RDM', timeText: '7:20 AM', section: 'morning' },
        { id: 'h3', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], habitTitle: 'Take Vitamin D', status: 'completed', reward: '+5 RDM', timeText: '8:00 AM', section: 'morning' },
        { id: 'h4', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], habitTitle: 'Morning Walk', status: 'completed', reward: '+10 RDM', timeText: '9:00 AM', section: 'morning' },
        { id: 'h5', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], habitTitle: 'Healthy Lunch (High Protein)', status: 'completed', reward: '+2 RDM', timeText: '1:00 PM', section: 'afternoon' },
        { id: 'h6', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], habitTitle: '5-min Meditation', status: 'missed', timeText: '3:00 PM', section: 'afternoon' },
        // 2 days ago
        { id: 'h7', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], habitTitle: 'Drink Water (500ml)', status: 'completed', reward: '+2 RDM', timeText: '7:10 AM', section: 'morning' },
        { id: 'h8', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], habitTitle: 'Take Vitamin D', status: 'completed', reward: '+5 RDM', timeText: '8:00 AM', section: 'morning' },
        { id: 'h9', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], habitTitle: 'Morning Walk', status: 'completed', reward: '+10 RDM', timeText: '9:15 AM', section: 'morning' },
        { id: 'h10', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], habitTitle: 'Read 10 Pages', status: 'completed', reward: '+2 RDM', timeText: '9:00 PM', section: 'evening' },
        // 3 days ago
        { id: 'h11', date: new Date(Date.now() - 259200000).toISOString().split('T')[0], habitTitle: 'Drink Water (500ml)', status: 'completed', reward: '+2 RDM', timeText: '7:05 AM', section: 'morning' },
        { id: 'h12', date: new Date(Date.now() - 259200000).toISOString().split('T')[0], habitTitle: 'Take Vitamin D', status: 'missed', timeText: '8:00 AM', section: 'morning' },
    ]);

    // Helper function to format time (HH:MM) to display format
    const formatTime = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const min = minutes || '00';
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${min} ${period}`;
    };

    // Helper function to determine section based on time
    const getSectionFromTime = (timeStr: string): 'morning' | 'afternoon' | 'evening' => {
        const [hours] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    };

    // Calculate statistics
    const stats = {
        totalCompleted: historyData.filter(h => h.status === 'completed').length,
        totalMissed: historyData.filter(h => h.status === 'missed').length,
        totalRDM: historyData
            .filter(h => h.status === 'completed' && h.reward)
            .reduce((sum, h) => {
                const rdm = parseInt(h.reward?.match(/\d+/)?.[0] || '0');
                return sum + rdm;
            }, 0),
        currentStreak: 12,
        longestStreak: 18,
        completionRate: Math.round((historyData.filter(h => h.status === 'completed').length / historyData.length) * 100)
    };

    // Group history by date
    const historyByDate = historyData.reduce((acc, entry) => {
        const date = entry.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, HistoryEntry[]>);

    // Format date for display
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }
    };

    // Handler to activate mining protocol
    const handleActivateMining = () => {
        const section = getSectionFromTime(timing);
        const formattedTime = formatTime(timing);
        const baseRDM = verificationType === 'device' ? 10 : 2;
        const nftBonus = 2; // Gold Tier Multiplier
        const totalRDM = baseRDM + nftBonus;
        
        const newHabit: Habit = {
            id: `habit_${Date.now()}`,
            section,
            title: habitName,
            subtitle: verificationType === 'device' 
                ? `Synced with ${source}. Auto-verified tracking.`
                : 'Manual check-in required. Stay honest!',
            timeText: formattedTime,
            status: 'pending',
            type: verificationType === 'device' ? 'sync' : 'standard',
            successMessage: `Excellent! ${habitName} completed. Keep building that streak!`,
            pot: `Pot: ${totalRDM} RDM`
        };

        setHabits(prev => [...prev, newHabit]);
        setShowCreateModal(false);
        
        // Reset form
        setHabitName('Morning Run');
        setTiming('07:00');
        setFrequency('Daily');
        setSource('Apple Health > Steps');
        setVerificationType('device');
    };

    const toggleHabit = (id: string) => {
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                if (h.status === 'missed') {
                    // Do nothing on direct click if missed, button handles it
                    return h;
                }
                const newStatus = h.status === 'completed' ? 'pending' : 'completed';
                if (newStatus === 'completed') {
                    setModalInfo({ show: true, message: h.successMessage });
                }
                return { ...h, status: newStatus };
            }
            return h;
        }));
    };

    const recoverHabit = () => {
        if (!habitToRecover) return;
        
        setHabits(prev => prev.map(h => {
            if (h.id === habitToRecover && h.status === 'missed') {
                // Recover the habit - mark as completed with 50% reward
                const recoveredReward = h.reward ? h.reward.replace(/\d+/, (match) => Math.floor(parseInt(match) * 0.5).toString()) : '+1 RDM Earned';
                setModalInfo({ 
                    show: true, 
                    message: `Streak recovered! ${h.successMessage} ${recoveredReward}` 
                });
                return { 
                    ...h, 
                    status: 'completed' as const,
                    reward: recoveredReward,
                    timeText: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                };
            }
            return h;
        }));
        
        setHabitToRecover(null);
    };

    const renderSection = (section: string, title: string, icon: string, iconColor: string, timeRange: string) => {
        const sectionHabits = habits.filter(h => h.section === section);
        return (
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name={icon} className={`${iconColor} text-xl`} />
                  <h3 className="text-lg md:text-xl font-bold text-text-main dark:text-white">{title}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-secondary dark:text-gray-400">{timeRange}</span>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-[#2a3e3d] overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {sectionHabits.map((habit) => (
                        <div 
                            key={habit.id} 
                            className={`flex items-start gap-3 md:gap-4 p-4 md:p-5 transition-colors relative ${
                                habit.status === 'completed'
                                ? 'bg-green-50/30 dark:bg-green-900/10' 
                                : habit.status === 'missed'
                                ? 'bg-red-50/30 dark:bg-red-900/5'
                                : 'hover:bg-gray-50 dark:hover:bg-white/5'
                            } ${habit.type === 'medication' ? 'border-l-4 border-l-purple-500 pl-4' : ''}`}
                        >
                            {/* Checkbox / Status Icon */}
                            <div className="relative flex items-center mt-0.5">
                                {habit.status === 'completed' ? (
                                    <div className="size-5 md:size-6 rounded-full bg-green-500 flex items-center justify-center text-white cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                                        <Icon name="check" className="text-sm md:text-base" />
                                    </div>
                                ) : habit.status === 'missed' ? (
                                    <div className="size-5 md:size-6 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 cursor-default">
                                        <Icon name="close" className="text-sm md:text-base font-bold" />
                                    </div>
                                ) : (
                                    <input 
                                        type="checkbox" 
                                        checked={false}
                                        onChange={() => toggleHabit(habit.id)}
                                        className="peer size-5 md:size-6 rounded border-2 border-gray-300 dark:border-gray-600 text-primary focus:ring-primary/50 cursor-pointer transition-all checked:bg-primary checked:border-primary" 
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-bold text-sm md:text-base transition-colors ${
                                            habit.status === 'completed' ? 'text-text-main dark:text-white opacity-70 line-through' : 
                                            habit.status === 'missed' ? 'text-slate-500 dark:text-slate-400' : 
                                            'text-text-main dark:text-white'
                                        }`}>
                                            {habit.title}
                                        </span>
                                        {habit.type === 'medication' && habit.status !== 'completed' && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 uppercase tracking-wide">Medication</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                        {habit.status === 'completed' && habit.reward && (
                                            <span className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded">
                                                <Icon name="monetization_on" className="text-xs" /> {habit.reward}
                                            </span>
                                        )}
                                        {habit.status === 'pending' && habit.pot && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-100 dark:border-amber-800/30">
                                                🏆 {habit.pot}
                                            </span>
                                        )}
                                        {habit.status === 'missed' ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                                    ● {habit.timeText}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        setHabitToRecover(habit.id);
                                                        setShowRecoveryModal(true);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-sm"
                                                >
                                                    <Icon name="restart_alt" className="text-xs" />
                                                    [ Recover Streak ]
                                                </button>
                                            </div>
                                        ) : habit.type === 'sync' && habit.status === 'pending' ? (
                                            <div className="flex items-center gap-1 text-primary-dark dark:text-primary text-[10px] font-bold whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded">
                                                <Icon name="sync" className="text-xs animate-spin" /> Verifying Steps...
                                            </div>
                                        ) : (
                                            <span className={`text-[10px] font-semibold ${habit.status === 'completed' ? 'text-secondary opacity-70' : 'text-secondary dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded'}`}>
                                                {habit.status === 'completed' ? habit.timeText : habit.timeText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[11px] md:text-xs text-text-secondary mt-0.5 md:mt-1 pr-10 md:pr-0 leading-tight">{habit.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    // Render History & Streaks view
    const renderHistoryView = () => {
        const sortedDates = Object.keys(historyByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="check_circle" className="text-green-500 text-xl" />
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase">Completed</span>
                        </div>
                        <p className="text-2xl font-black text-green-700 dark:text-green-300">{stats.totalCompleted}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="close" className="text-red-500 text-xl" />
                            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">Missed</span>
                        </div>
                        <p className="text-2xl font-black text-red-700 dark:text-red-300">{stats.totalMissed}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="monetization_on" className="text-amber-500 text-xl" />
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Total RDM</span>
                        </div>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.totalRDM}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="local_fire_department" className="text-orange-500 text-xl" />
                            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase">Streak</span>
                        </div>
                        <p className="text-2xl font-black text-orange-700 dark:text-orange-300">{stats.currentStreak}</p>
                    </div>
                </div>

                {/* Streak Information */}
                <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800/30 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl text-white shadow-lg shadow-orange-500/40 shrink-0">
                                <Icon name="local_fire_department" className="text-3xl" />
                            </div>
                            <div>
                                <p className="text-[10px] text-orange-800 dark:text-orange-200 font-bold uppercase tracking-wide opacity-80 mb-0.5">Streak Performance</p>
                                <h3 className="text-xl md:text-2xl font-black text-text-main dark:text-white flex items-center gap-2 leading-none">
                                    Current: <span className="text-orange-600 dark:text-orange-400">{stats.currentStreak} Days</span>
                                </h3>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                    Longest Streak: <span className="font-bold">{stats.longestStreak} Days</span> • Completion Rate: <span className="font-bold">{stats.completionRate}%</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1 items-end">
                            {[...Array(7)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 rounded-full ${
                                        i < 5 
                                            ? 'h-8 bg-orange-400' 
                                            : 'h-6 bg-orange-200 dark:bg-orange-800'
                                    }`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* History Timeline */}
                <div className="space-y-6">
                    <h3 className="text-lg md:text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                        <Icon name="history" className="text-xl" />
                        Activity History
                    </h3>
                    
                    {sortedDates.map((date) => (
                        <div key={date} className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-[#2a3e3d] overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-text-main dark:text-white">{formatDate(date)}</h4>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {historyByDate[date].map((entry) => (
                                    <div 
                                        key={entry.id}
                                        className={`flex items-start gap-3 md:gap-4 p-4 md:p-5 transition-colors ${
                                            entry.status === 'completed'
                                                ? 'bg-green-50/30 dark:bg-green-900/10' 
                                                : 'bg-red-50/30 dark:bg-red-900/5'
                                        }`}
                                    >
                                        {/* Status Icon */}
                                        <div className="relative flex items-center mt-0.5">
                                            {entry.status === 'completed' ? (
                                                <div className="size-5 md:size-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                                                    <Icon name="check" className="text-sm md:text-base" />
                                                </div>
                                            ) : (
                                                <div className="size-5 md:size-6 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                                                    <Icon name="close" className="text-sm md:text-base font-bold" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`font-bold text-sm md:text-base ${
                                                        entry.status === 'completed' 
                                                            ? 'text-text-main dark:text-white' 
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        {entry.habitTitle}
                                                    </span>
                                                    <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-secondary dark:text-gray-400">
                                                        {entry.section === 'morning' ? '🌅 Morning' : entry.section === 'afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {entry.status === 'completed' && entry.reward && (
                                                        <span className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded">
                                                            <Icon name="monetization_on" className="text-xs" /> {entry.reward}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-semibold ${
                                                        entry.status === 'completed' 
                                                            ? 'text-secondary opacity-70' 
                                                            : 'text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded'
                                                    }`}>
                                                        {entry.timeText}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
      <div className="animate-[fadeIn_0.5s_ease-out] relative h-full flex flex-col w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="w-full bg-background-light dark:bg-background-dark z-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold text-text-main dark:text-white">My Routine</h2>
                    <p className="text-text-secondary dark:text-gray-400 text-xs md:text-base mt-0.5">Gamify your health: Complete habits to earn RDM tokens.</p>
                </div>
                <div className="flex items-center gap-4">
                     <button className="relative size-10 md:size-12 flex items-center justify-center bg-white dark:bg-surface-dark rounded-full shadow-sm text-text-secondary hover:text-primary transition-colors border border-gray-100 dark:border-[#2a3e3d]">
                        <Icon name="notifications" className="text-lg md:text-xl" />
                        <span className="absolute top-2.5 right-3 size-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
                    </button>
                </div>
            </div>
            
            <div className="flex gap-6 border-b border-gray-200 dark:border-[#2a3e3d] mb-6 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('timeline')}
                    className={`pb-3 border-b-2 transition-colors font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'timeline'
                            ? 'border-primary text-text-main dark:text-white font-bold'
                            : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">view_timeline</span>
                    Today's Timeline
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 border-b-2 transition-colors font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'history'
                            ? 'border-primary text-text-main dark:text-white font-bold'
                            : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">history</span>
                    History & Streaks
                </button>
            </div>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 pb-24 relative">
            {activeTab === 'timeline' ? (
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Consistency Card */}
                    <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl text-white shadow-lg shadow-orange-500/40 shrink-0">
                                <Icon name="local_fire_department" className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-[10px] text-orange-800 dark:text-orange-200 font-bold uppercase tracking-wide opacity-80 mb-0.5">Consistency</p>
                                <h3 className="text-lg md:text-xl font-black text-text-main dark:text-white flex items-center gap-2 leading-none">
                                    Current Streak: <span className="text-orange-600 dark:text-orange-400">12 Days</span>
                                </h3>
                                <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300 mt-1">Keep it up! You are 2 days away from your <span className="font-bold text-orange-800 dark:text-orange-200">+50 RDM Weekly Bonus</span>.</p>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto text-right flex sm:block justify-end">
                            <div className="flex gap-1 justify-end opacity-50">
                                {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-4 bg-orange-400 rounded-full"></div>)}
                                <div className="w-1.5 h-6 bg-orange-200 dark:bg-orange-800 rounded-full"></div>
                                <div className="w-1.5 h-6 bg-orange-200 dark:bg-orange-800 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {renderSection('morning', 'Morning Routine', 'wb_sunny', 'text-yellow-500', '06:00 - 12:00')}
                    {renderSection('afternoon', 'Afternoon Routine', 'wb_twilight', 'text-orange-400', '12:00 - 18:00')}
                    {renderSection('evening', 'Evening Routine', 'dark_mode', 'text-indigo-400', '18:00 - 23:00')}
                    
                    <div className="h-20"></div> 
                </div>
            ) : (
                renderHistoryView()
            )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-36 lg:bottom-8 right-8 z-[50] flex flex-col items-end gap-2 group pointer-events-auto">
            <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center bg-primary hover:bg-primary-dark text-text-main font-bold py-3.5 px-6 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
                <span className="material-symbols-outlined text-2xl mr-2 group-hover:rotate-90 transition-transform">add</span>
                <span className="text-sm font-bold">[ + Build New Habit ]</span>
            </button>
        </div>

        {/* Modals */}
        {modalInfo?.show && <CelebrationModal message={modalInfo.message} onClose={() => setModalInfo(null)} />}
        {showRecoveryModal && (
            <RecoveryModal 
                onClose={() => {
                    setShowRecoveryModal(false);
                    setHabitToRecover(null);
                }} 
                onRecover={recoverHabit}
            />
        )}
        
        {/* Initialize New Habit Protocol Modal */}
        {showCreateModal && (
            <div aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out] overflow-hidden">
                    
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-500 animate-pulse">
                                    <Icon name="add_circle" className="text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Initialize New Habit Protocol</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Select habit type. Verified data streams earn <span className="text-cyan-500 font-bold">double RDM</span>.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <Icon name="close" className="text-2xl" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto p-8 space-y-8 bg-white dark:bg-surface-dark">
                        {/* Step 1 */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="size-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">1</span>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">DEFINE HABIT & VERIFICATION</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Habit Name</label>
                                    <input 
                                        type="text" 
                                        value={habitName}
                                        onChange={(e) => setHabitName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-colors" 
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Device Verified Card */}
                                    <div 
                                        onClick={() => setVerificationType('device')}
                                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${verificationType === 'device' ? 'border-cyan-400 bg-cyan-50/30 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300'}`}
                                    >
                                        {verificationType === 'device' && <div className="absolute top-3 right-3 text-cyan-500"><Icon name="check_circle" className="text-xl" /></div>}
                                        <div className={`flex items-center gap-2 mb-3 font-bold ${verificationType === 'device' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            <Icon name="watch" /> Device Verified
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-cyan-100 dark:border-cyan-800/50 mb-3">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Yield:</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white ml-1">10 RDM/Day</span>
                                            <span className="inline-block size-2 rounded-full bg-green-500 ml-2"></span>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">SOURCE</label>
                                            <div className="relative">
                                                <select 
                                                    value={source}
                                                    onChange={(e) => setSource(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-6 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 appearance-none outline-none"
                                                    disabled={verificationType !== 'device'}
                                                >
                                                    <option>Apple Health &gt; Steps</option>
                                                    <option>Fitbit &gt; Active Minutes</option>
                                                    <option>Google Fit &gt; Steps</option>
                                                </select>
                                                <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Honesty Pledge Card */}
                                    <div 
                                        onClick={() => setVerificationType('honesty')}
                                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all group ${verificationType === 'honesty' ? 'border-cyan-400 bg-cyan-50/30 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'}`}
                                    >
                                        {verificationType === 'honesty' && <div className="absolute top-3 right-3 text-cyan-500"><Icon name="check_circle" className="text-xl" /></div>}
                                        <div className={`flex items-center gap-2 mb-3 font-bold ${verificationType === 'honesty' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            <Icon name="back_hand" /> Honesty Pledge
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700 mb-3">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Yield:</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white ml-1">2 RDM/Day</span>
                                            <span className="inline-block size-2 rounded-full bg-yellow-400 ml-2"></span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic mt-4">Note: Requires manual check-in.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Step 2 */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold">2</span>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">SCHEDULE & TRIGGERS</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Timing</label>
                                        <div className="relative">
                                            <input 
                                                type="time" 
                                                value={timing}
                                                onChange={(e) => setTiming(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500" 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Frequency</label>
                                        <div className="relative">
                                            <select 
                                                value={frequency}
                                                onChange={(e) => setFrequency(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500 appearance-none"
                                            >
                                                <option>Daily</option>
                                                <option>Weekdays</option>
                                                <option>Weekends</option>
                                            </select>
                                            <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon name="layers" className="text-slate-400 text-sm" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">The "Stack" Feature</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reminder: After</span>
                                        <div className="relative flex-1">
                                            <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-cyan-500 appearance-none cursor-pointer">
                                                <option>Drinking Coffee</option>
                                                <option>Brushing Teeth</option>
                                                <option>Lunch</option>
                                            </select>
                                            <Icon name="coffee" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                                            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Step 3 */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold">3</span>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">NFT SYNERGY</h3>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Icon name="diamond" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Gold Tier Multiplier</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Your "Gold" status adds <span className="font-bold">+2 RDM</span> to this habit.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">SUMMARY</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Daily Earning Potential:</span>
                                <span className="text-xl font-black text-cyan-500">
                                    +{verificationType === 'device' ? 12 : 4} RDM
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handleActivateMining}
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Icon name="rocket_launch" className="text-lg" />
                            Activate Mining Protocol
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

