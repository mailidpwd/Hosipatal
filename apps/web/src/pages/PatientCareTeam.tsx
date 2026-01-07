
import React, { useState } from 'react';
import { Icon } from '@/components/UI';
import { userService } from '@/services/api/userService';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
// import { toast } from 'sonner';
// Notifications disabled - create a no-op toast function
const toast = {
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  loading: () => ({ dismiss: () => {} }),
  dismiss: () => {},
} as any;

const StarRating = ({ value, onChange, size = "text-lg", readonly = false }: { value: number, onChange?: (v: number) => void, size?: string, readonly?: boolean }) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star} 
                    onClick={() => !readonly && onChange && onChange(star)} 
                    className={`${size} ${star <= value ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'} ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'} transition-transform`}
                    disabled={readonly}
                >
                    <Icon name="star" className="fill-1" />
                </button>
            ))}
        </div>
    );
};

interface AppreciationModalData {
  type: 'appreciation' | 'thankYou';
  name: string;
  amount: number;
}

const AppreciationRewardModal = ({ data, onClose }: { data: AppreciationModalData | null, onClose: () => void }) => {
  const [selectedAmount, setSelectedAmount] = useState(data?.amount || 10);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get userId from sessionStorage as fallback
  const getUserId = () => {
    if (user?.id) return user.id;
    try {
      return sessionStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  };

  const userId = getUserId();

  if (!data) return null;

  const presetAmounts = data.type === 'appreciation' ? [5, 10, 20, 50] : [25, 50, 100, 200];
  const title = data.type === 'appreciation' ? 'Show Appreciation' : 'Send Thank You';
  const iconName = data.type === 'appreciation' ? 'favorite' : 'favorite';

  const handleSubmit = async (e?: React.MouseEvent) => {
    // Prevent any event bubbling
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('[AppreciationModal] handleSubmit called', {
      userId: userId,
      userFromAuth: user?.id,
      selectedAmount,
      isSubmitting,
      message: message.trim(),
    });

    if (!userId) {
      console.error('[AppreciationModal] ❌ No userId available');
      // toast.error('Please log in to send a tip');
      return;
    }

    if (selectedAmount <= 0) {
      // toast.error('Please select an amount greater than 0');
      return;
    }

    if (isSubmitting) {
      console.log('[AppreciationModal] Already submitting, ignoring click');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[AppreciationModal] 🚀 Sending tip...', {
        patientId: userId,
        amount: selectedAmount,
        message: message.trim() || undefined,
        recipient: data.name,
      });

      const result = await userService.sendTip(userId, selectedAmount, {
        message: message.trim() || undefined,
        type: 'tip',
      });

      console.log('[AppreciationModal] ✅ Tip sent successfully:', result);

      // Store tip in sessionStorage/localStorage for demo mode persistence
      try {
        const storedS = sessionStorage.getItem('demo_tips');
        const storedL = localStorage.getItem('demo_tips');
        const sTips = storedS ? JSON.parse(storedS) : [];
        const lTips = storedL ? JSON.parse(storedL) : [];
        
        // Add the new tip
        const newTip = {
          ...result,
          recipientName: data.name,
        };
        sTips.push(newTip);
        lTips.push(newTip);
        
        sessionStorage.setItem('demo_tips', JSON.stringify(sTips));
        localStorage.setItem('demo_tips', JSON.stringify(lTips));
        
        console.log('[AppreciationModal] ✅ Stored tip in sessionStorage/localStorage for demo mode');
      } catch (e) {
        console.warn('[AppreciationModal] Failed to store tip in storage:', e);
      }

      // Invalidate provider queries to refresh the dashboard
      // CRITICAL: Invalidate with providerId to ensure it refreshes for Dr. Sarah Smith (staff-1)
      queryClient.invalidateQueries({ queryKey: ['provider', 'recentTips'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'recentTips', 'staff-1'] }); // Dr. Sarah Smith's ID
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard', 'staff-1'] });
      // Refresh sent tips list
      queryClient.invalidateQueries({ queryKey: ['patient', 'sentTips', userId] });
      
      console.log('[AppreciationModal] ✅ Invalidated provider queries for staff-1 (Dr. Sarah Smith)');

      // toast.success(`Thank you message sent! ${selectedAmount} RDM sent to ${data.name}`);
      
      // Reset form
      setMessage('');
      setSelectedAmount(data?.amount || 10);
      
      // Close modal immediately to show it worked
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 300);
    } catch (error: any) {
      console.error('[AppreciationModal] ❌ Error sending tip:', error);
      console.error('[AppreciationModal] Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
      });
      // toast.error(error?.message || 'Failed to send tip. Please try again.');
      setIsSubmitting(false); // Reset submitting state on error
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">To {data.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
            title="Close modal"
            aria-label="Close modal"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* RDM Amount Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 block">Select Amount (RDM)</label>
            <div className="grid grid-cols-4 gap-3">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    selectedAmount === amount
                      ? 'bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-400/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label htmlFor="custom-amount" className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Or Enter Custom Amount</label>
            <div className="relative">
              <input
                id="custom-amount"
                type="number"
                min="1"
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-500"
                aria-label="Custom RDM amount"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">RDM</span>
            </div>
          </div>

          {/* Message (Optional) */}
          <div>
            <label htmlFor="appreciation-message" className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              {data.type === 'appreciation' ? 'Message (Optional)' : 'Thank You Note'}
            </label>
            <textarea
              id="appreciation-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={data.type === 'appreciation' ? 'Add a personal message...' : 'Express your gratitude...'}
              className="w-full h-24 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none focus:border-cyan-500 resize-none placeholder:text-slate-400"
              aria-label={data.type === 'appreciation' ? 'Appreciation message' : 'Thank you message'}
            />
          </div>

          {/* Wallet Balance Display */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Your Balance</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">1,250 <span className="text-xs font-bold text-slate-400">RDM</span></span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">After Transaction</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {1,250 - selectedAmount} <span className="text-xs font-bold text-slate-400">RDM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark mt-auto shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }}
            disabled={isSubmitting || selectedAmount <= 0 || !userId}
            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-500 hover:to-emerald-600 text-slate-900 font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Icon name="sync" className="text-xl animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Icon name={iconName} className="text-xl" />
                Confirm {title} ({selectedAmount} RDM)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExperienceRatingModal = ({ onClose }: { onClose: () => void }) => {
  const [ratings, setRatings] = useState({
      clinical: 5,
      empathy: 4,
      timeliness: 2,
      hygiene: 5,
      docs: 3,
      registration: 5,
      consultation: 5,
      diagnostics: 2,
      treatment: 5,
      discharge: 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRate = (key: keyof typeof ratings, value: number) => {
      setRatings(prev => ({...prev, [key]: value}));
  }

  const handleSubmitRating = async () => {
    if (!userId) {
      console.error('[RatingModal] ❌ No userId available');
      // toast.error('Please log in to submit a rating');
      return;
    }

    // Calculate average rating
    const ratingValues = Object.values(ratings);
    const averageRating = Math.round(ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length);
    const rdmAmount = averageRating === 5 ? 10 : averageRating === 4 ? 5 : 0;

    setIsSubmitting(true);
    try {
      console.log('[RatingModal] 🚀 Sending rating tip...', {
        patientId: userId,
        amount: rdmAmount,
        rating: averageRating,
      });

      const result = await userService.sendTip(userId, rdmAmount, {
        type: 'rating',
        rating: averageRating,
      });

      // Store tip in sessionStorage/localStorage for demo mode persistence
      try {
        const storedS = sessionStorage.getItem('demo_tips');
        const storedL = localStorage.getItem('demo_tips');
        const sTips = storedS ? JSON.parse(storedS) : [];
        const lTips = storedL ? JSON.parse(storedL) : [];
        
        // Add the new tip
        const newTip = {
          ...result,
          recipientName: 'Dr. Sarah Smith',
        };
        sTips.push(newTip);
        lTips.push(newTip);
        
        sessionStorage.setItem('demo_tips', JSON.stringify(sTips));
        localStorage.setItem('demo_tips', JSON.stringify(lTips));
        
        console.log('[RatingModal] ✅ Stored tip in sessionStorage/localStorage for demo mode');
      } catch (e) {
        console.warn('[RatingModal] Failed to store tip in storage:', e);
      }

      // Invalidate provider queries to refresh the dashboard
      // CRITICAL: Invalidate with providerId to ensure it refreshes for Dr. Sarah Smith (staff-1)
      queryClient.invalidateQueries({ queryKey: ['provider', 'recentTips'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'recentTips', 'staff-1'] }); // Dr. Sarah Smith's ID
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['provider', 'dashboard', 'staff-1'] });
      // Refresh sent tips list
      queryClient.invalidateQueries({ queryKey: ['patient', 'sentTips', userId] });
      
      console.log('[RatingModal] ✅ Invalidated provider queries for staff-1 (Dr. Sarah Smith)');

      // toast.success(`Rating submitted! ${rdmAmount > 0 ? `${rdmAmount} RDM earned.` : 'Thank you for your feedback.'}`);
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      // toast.error(error?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#f8fafc] dark:bg-background-dark rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] animate-[scaleIn_0.2s_ease-out] overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-8 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 z-10 gap-4 shrink-0">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Comprehensive Experience Rating</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Provide detailed feedback on your complete care journey.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                    <Icon name="account_balance_wallet" className="text-amber-500 text-xl" />
                    <span className="font-bold text-slate-900 dark:text-white text-lg">1,250 <span className="text-xs font-bold text-slate-400 uppercase">RDM</span></span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <Icon name="close" className="text-2xl" />
                </button>
            </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#f8fafc] dark:bg-background-dark">
            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Select Facility */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">SELECT FACILITY</label>
                        <div className="relative">
                            <select className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-11 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-shadow cursor-pointer hover:border-primary/30">
                                <option>City General Hospital (Visit: Oct 24)</option>
                                <option>Downtown Clinic (Visit: Sep 12)</option>
                            </select>
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400">
                                <Icon name="local_hospital" className="text-lg" />
                            </div>
                            <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-slate-400 ml-1">Rating this specific visit.</p>
                    </div>
                </div>

                {/* SECTION 1: Care Quality Scorecard */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Care Quality Scorecard</h3>
                    <p className="text-xs text-slate-500 mb-4">Rate the quality of clinical care provided across key dimensions.</p>
                    
                    <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Clinical Accuracy */}
                        <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                                    <Icon name="verified_user" className="text-xl" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Clinical Accuracy</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-3">
                                    <StarRating value={ratings.clinical} onChange={(v) => handleRate('clinical', v)} />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white w-8 text-right">({ratings.clinical}/5)</span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 italic">Diagnosis was clear.</span>
                            </div>
                        </div>

                        {/* Patient Empathy */}
                        <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/30">
                                    <Icon name="diversity_1" className="text-xl" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Patient Empathy</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-3">
                                    <StarRating value={ratings.empathy} onChange={(v) => handleRate('empathy', v)} />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white w-8 text-right">({ratings.empathy}/5)</span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 italic">Staff listened well.</span>
                            </div>
                        </div>

                        {/* Timeliness (Low Rating Example) */}
                        <div className="p-5 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-800">
                                    <Icon name="schedule" className="text-xl" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Timeliness</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-3">
                                    <StarRating value={ratings.timeliness} onChange={(v) => handleRate('timeliness', v)} />
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 w-8 text-right">({ratings.timeliness}/5)</span>
                                </div>
                                <span className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-bold">Wait times were high.</span>
                            </div>
                        </div>

                        {/* Hygiene & Safety */}
                        <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/30">
                                    <Icon name="soap" className="text-xl" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Hygiene & Safety</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-3">
                                    <StarRating value={ratings.hygiene} onChange={(v) => handleRate('hygiene', v)} />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white w-8 text-right">({ratings.hygiene}/5)</span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 italic">Facility was clean.</span>
                            </div>
                        </div>

                        {/* Documentation */}
                        <div className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                                    <Icon name="description" className="text-xl" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Documentation</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-3">
                                    <StarRating value={ratings.docs} onChange={(v) => handleRate('docs', v)} />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white w-8 text-right">({ratings.docs}/5)</span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 italic">Discharge papers were delayed.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Visit Journey Heatmap */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Visit Journey Heatmap</h3>
                    <p className="text-xs text-slate-500 mb-4">Timeline analysis of your patient experience.</p>

                    <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                        <div className="relative space-y-8">
                            {/* Vertical Line */}
                            <div className="absolute top-2 bottom-2 left-[21px] w-0.5 bg-slate-100 dark:bg-slate-700"></div>

                            {/* Step 1: Registration */}
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative z-10 size-11 rounded-full border-4 border-white dark:border-surface-dark bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                        <Icon name="app_registration" className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Registration</h4>
                                            <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">● Excellent</span>
                                        </div>
                                    </div>
                                </div>
                                <StarRating value={ratings.registration} onChange={(v) => handleRate('registration', v)} size="text-sm" />
                            </div>

                            {/* Step 2: Consultation */}
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative z-10 size-11 rounded-full border-4 border-white dark:border-surface-dark bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                        <Icon name="stethoscope" className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Consultation</h4>
                                            <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">● Excellent</span>
                                        </div>
                                    </div>
                                </div>
                                <StarRating value={ratings.consultation} onChange={(v) => handleRate('consultation', v)} size="text-sm" />
                            </div>

                            {/* Step 3: Diagnostics (Problem) */}
                            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-4 flex-1">
                                    <div className="relative z-10 size-11 rounded-full border-4 border-white dark:border-surface-dark bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shadow-sm">
                                        <Icon name="radiology" className="text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Diagnostics</h4>
                                            <span className="text-[9px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">● Needs Imp.</span>
                                        </div>
                                        {/* Alert Box */}
                                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                                            <Icon name="warning" className="text-red-500 text-xs" />
                                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Alert: Wait time &gt; 1 hour.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pl-14 sm:pl-0">
                                    <StarRating value={ratings.diagnostics} onChange={(v) => handleRate('diagnostics', v)} size="text-sm" />
                                </div>
                            </div>

                            {/* Step 4: Treatment */}
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative z-10 size-11 rounded-full border-4 border-white dark:border-surface-dark bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                        <Icon name="medical_services" className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Treatment</h4>
                                            <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">● Excellent</span>
                                        </div>
                                    </div>
                                </div>
                                <StarRating value={ratings.treatment} onChange={(v) => handleRate('treatment', v)} size="text-sm" />
                            </div>

                            {/* Step 5: Discharge */}
                            <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative z-10 size-11 rounded-full border-4 border-white dark:border-surface-dark bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shadow-sm">
                                        <Icon name="logout" className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Discharge</h4>
                                            <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">● Acceptable</span>
                                        </div>
                                    </div>
                                </div>
                                <StarRating value={ratings.discharge} onChange={(v) => handleRate('discharge', v)} size="text-sm" />
                            </div>

                            {/* Step 6: Follow-up */}
                            <div className="relative flex items-center justify-between gap-4 opacity-60">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative z-10 size-11 rounded-full border-4 border-white dark:border-surface-dark bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center border-dashed">
                                        <Icon name="call" className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Follow-up</h4>
                                            <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">● Pending</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Comments (Renamed) */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-cyan-600 border border-cyan-100 dark:border-cyan-800">
                            <Icon name="edit_note" className="text-lg" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Tell the Hospital Director</h3>
                    </div>
                    <textarea 
                        className="w-full h-24 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-slate-400 transition-all focus:bg-white dark:focus:bg-black"
                        placeholder="Share any specific details about your experience to help us improve..."
                    ></textarea>
                </div>
                
                {/* Bottom spacer for footer */}
                <div className="h-24"></div>
            </div>
        </div>

        {/* Footer Action */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 flex justify-end z-20 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 rounded-b-[32px]">
            <button 
              onClick={handleSubmitRating}
              disabled={isSubmitting}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icon name="sync" className="text-xl animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Icon name="rocket_launch" className="text-xl group-hover:-translate-y-0.5 transition-transform" />
                  Submit Comprehensive Review
                  <span className="bg-amber-400 text-slate-900 text-xs font-black px-2 py-0.5 rounded ml-2 shadow-sm border border-amber-300">+10 RDM</span>
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export const PatientCareTeam = () => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [appreciationModalData, setAppreciationModalData] = useState<AppreciationModalData | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get userId from sessionStorage as fallback
  const getUserId = () => {
    if (user?.id) return user.id;
    try {
      return sessionStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  };

  const userId = getUserId();

  // Fetch sent tips history
  const { data: sentTips = [], isLoading: sentTipsLoading, refetch: refetchSentTips } = useQuery({
    queryKey: ['patient', 'sentTips', userId],
    queryFn: () => userService.getMySentTips(userId),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  // Calculate total sent
  const totalSent = sentTips.reduce((sum, tip) => sum + tip.amount, 0);

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-24 md:pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Care Team</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base mt-2 font-medium">Recognize the people keeping you healthy.</p>
        </div>
        
        {/* Wallet & Notifications */}
        <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 md:px-4 flex items-center gap-3 shadow-sm">
                <div className="size-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Icon name="account_balance_wallet" className="text-lg" />
                </div>
                <div>
                    <span className="block text-base md:text-lg font-black text-slate-900 dark:text-white leading-none">1,250 <span className="text-xs font-bold text-slate-400">RDM</span></span>
                    <span className="block text-[10px] font-bold text-emerald-500">▲ +120 this week</span>
                </div>
            </div>
            <button className="relative size-12 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shadow-sm">
                <Icon name="notifications" className="text-xl" />
                <span className="absolute top-3 right-3.5 size-2 bg-red-500 rounded-full border border-white dark:border-surface-dark"></span>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        
        {/* Primary Care Card */}
        <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50/50 dark:bg-teal-900/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="relative shrink-0 group">
                <div className="size-24 md:size-32 rounded-full border-4 border-white dark:border-surface-dark shadow-xl overflow-hidden relative z-10">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrmOqFjKUO4FY7_pEHrGX7I7Oha9c6NH8C2KaMWM1FPGVP4CjFB1nUuErLcxV7jdP6n-L3eZ8duSf9hLU5F8jmULlL2N6-srZejNgf3mJ96NrnLOdYibXWywxUMuCzUeUC1Nr8D1EiIv6yNOwzxiQCIoZeMzXa7roCIem9f8nYYi7P3RJs-eiWFodcZz_gboTxcV93YSehvQTXwlu7S0Rr7DgAN3ZiFG_VMmhZDJTg_OX1JxX1NWQn2lVOUwx3JjF9chnIvs8cf3rk" alt="Dr. Sarah Smith" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-2 right-0 bg-teal-500 text-white p-1.5 rounded-full border-4 border-white dark:border-surface-dark shadow-md z-20">
                    <Icon name="verified" className="text-lg block" />
                </div>
            </div>

            <div className="flex-1 text-center md:text-left z-10 w-full">
                <div className="inline-block px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase tracking-widest mb-3 border border-teal-100 dark:border-teal-900/30">
                    Primary Care
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1">Dr. Sarah Smith</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Cardiologist</p>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 w-fit mx-auto md:mx-0">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                        <Icon name="lock" className="text-sm" /> Status: Active Pledge
                    </div>
                    <div className="w-px h-4 bg-amber-200 dark:bg-amber-800 hidden sm:block"></div>
                    <div className="text-xs font-medium text-amber-600 dark:text-amber-500">
                        500 RDM Locked
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 z-10 w-full md:w-auto">
                <button 
                    onClick={() => setAppreciationModalData({ type: 'thankYou', name: 'Dr. Sarah Smith', amount: 50 })}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-8 py-4 rounded-2xl transition-all active:scale-95 group"
                >
                    <Icon name="favorite" className="text-2xl group-hover:scale-110 transition-transform fill-1" />
                    <span className="font-bold text-base">Send "Thank You"</span>
                </button>
            </div>
        </div>

        {/* Recent Interactions */}
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Recent Interactions</h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg">Past 7 Days</span>
            </div>

            <div className="space-y-4">
                {/* Interaction 1 */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="size-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 shrink-0">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH" alt="Nurse Alisha" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Nurse Alisha</h4>
                            <span className="hidden md:inline text-slate-300">•</span>
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">PEDIATRICS</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                            <Icon name="vaccines" className="text-slate-400 text-sm" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Event: Administered Flu Shot (Yesterday)</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setAppreciationModalData({ type: 'appreciation', name: 'Nurse Alisha', amount: 20 })}
                        className="w-full md:w-auto bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Icon name="favorite" className="text-lg" />
                        Show Appreciation
                    </button>
                </div>

                {/* Interaction 2 */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="size-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 shrink-0">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcw1RKMIjeFMU2lhzxnpt_1JLdguZreG31lzNj7NJ32SHcWztK4Dxp8S-k_kiDJu1qa9U9HjLu1PRamVTrle0xDCN4zJvODm3oe1CfDEzC09zkqXQ7TLAchqVNcnUa19bCiVTX40oH-scfzEG9sOzPGmnFf8XS0VMxllyjjk0FSFGy5uKOoUI9dmkZsR6QNQ42DcMRcvFRUfMliY1qT0RXFPu_8rfHr8x9uRDJybIK2ufalUeYGsW537pIphyeGwF9ArZL7IpU2Q4" alt="Technician Ben" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Technician Ben</h4>
                            <span className="hidden md:inline text-slate-300">•</span>
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">RADIOLOGY</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                            <Icon name="radiology" className="text-slate-400 text-sm" />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Event: MRI Scan Safety Check</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setAppreciationModalData({ type: 'appreciation', name: 'Technician Ben', amount: 10 })}
                        className="w-full md:w-auto bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Icon name="favorite" className="text-lg" />
                        Show Appreciation
                    </button>
                </div>
            </div>
        </div>

        {/* Sent Tips History */}
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">My Sent Appreciation</h3>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg border border-rose-200 dark:border-rose-800">
                        Total Sent: {totalSent} RDM
                    </span>
                </div>
            </div>

            {sentTipsLoading ? (
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                    <div className="inline-block animate-spin">
                        <Icon name="sync" className="text-2xl text-slate-400" />
                    </div>
                </div>
            ) : sentTips.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                    <Icon name="favorite" className="text-4xl text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No appreciation sent yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Send a thank you message to your care team to see it here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sentTips.map((tip) => {
                        const tipDate = new Date(tip.timestamp);
                        const hoursAgo = Math.floor((Date.now() - tipDate.getTime()) / (1000 * 60 * 60));
                        const daysAgo = Math.floor(hoursAgo / 24);
                        const timeDisplay = daysAgo > 0 ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago` : hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';

                        return (
                            <div key={tip.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                        <Icon name="favorite" className="text-rose-500 dark:text-rose-400 fill-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">To {(tip as any).recipientName || 'Dr. Sarah Smith'}</span>
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                                -{tip.amount} RDM
                                            </span>
                                        </div>
                                        {tip.message && (
                                            <p className="text-xs text-slate-600 dark:text-slate-300 italic truncate">"{tip.message}"</p>
                                        )}
                                        {tip.type === 'rating' && tip.rating && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Icon name="star" className="text-xs text-amber-400 fill-1" />
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Rated {tip.rating} stars</span>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeDisplay}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Hospital Rating Section (Prominent Button) */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                        <Icon name="rate_review" className="text-3xl" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-1">Rate Your Hospital Visit</h3>
                        <p className="text-blue-100 font-medium max-w-md">Your feedback drives better care. Complete the survey to earn <span className="text-amber-300 font-bold">50 RDM</span>.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowRatingModal(true)}
                    className="w-full md:w-auto px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <Icon name="star" className="text-xl fill-1 text-amber-400" />
                    Hospital Rating
                </button>
            </div>
        </div>

      </div>

      {/* Experience Rating Modal */}
      {showRatingModal && <ExperienceRatingModal onClose={() => setShowRatingModal(false)} />}

      {/* Appreciation/Reward Modal */}
      <AppreciationRewardModal data={appreciationModalData} onClose={() => setAppreciationModalData(null)} />
    </div>
  );
};
