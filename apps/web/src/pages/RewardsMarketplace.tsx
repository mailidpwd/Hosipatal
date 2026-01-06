
import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/UI';
import { useRealTime } from '@/context/RealTimeContext';
import { useNavigation } from '@/context/NavigationContext';

interface RewardsMarketplaceProps {
  initialTab?: 'perks' | 'charity';
}

export const RewardsMarketplace = ({ initialTab = 'perks' }: RewardsMarketplaceProps = {}) => {
  const { navigationState, clearNavigationState } = useNavigation();
  const { walletBalance } = useRealTime();
  const [activeTab, setActiveTab] = useState<'perks' | 'charity'>(
    navigationState?.charityTab ? 'charity' : initialTab
  );

  // Update tab when navigation state changes
  useEffect(() => {
    if (navigationState?.charityTab) {
      setActiveTab('charity');
      clearNavigationState();
    }
  }, [navigationState?.charityTab, clearNavigationState]);

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-12">
      
      {/* Header & Balance */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {activeTab === 'perks' ? 'Rewards Marketplace' : 'My Impact Portfolio'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            {activeTab === 'perks' 
              ? 'Redeem your health milestones for real-world value.' 
              : 'Turn your healthy habits into life-saving care.'}
          </p>
        </div>
        
        {/* Dynamic Balance Card */}
        {activeTab === 'perks' ? (
            <div className="bg-white dark:bg-surface-dark border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm self-end md:self-auto min-w-[220px]">
                <div className="text-right flex-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVAILABLE BALANCE</span>
                    <span className="block text-xl font-bold text-amber-600 dark:text-amber-400">
                      {walletBalance !== null ? walletBalance.toLocaleString() : '--'} <span className="text-xs text-slate-500 font-bold">RDM</span>
                    </span>
                </div>
                <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Icon name="account_balance_wallet" className="text-lg" />
                </div>
            </div>
        ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm self-end md:self-auto min-w-[220px]">
                <div className="text-right flex-1">
                    <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">AVAILABLE TO DONATE</span>
                    <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {walletBalance !== null ? walletBalance.toLocaleString() : '--'} <span className="text-xs text-emerald-700/60 font-bold">RDM</span>
                    </span>
                </div>
                <div className="size-9 rounded-lg bg-white dark:bg-surface-dark flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <Icon name="savings" className="text-lg" />
                </div>
            </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 mb-6">
        <button 
            onClick={() => setActiveTab('perks')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'perks' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon name="shopping_bag" className="text-base" />
            For Me (Perks)
        </button>
        <button 
            onClick={() => setActiveTab('charity')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'charity' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon name="public" className="text-base" />
            For Others (Charity)
        </button>
      </div>

      {/* View Switcher */}
      {activeTab === 'perks' ? <PerksView /> : <CharityView walletBalance={walletBalance || 0} />}

    </div>
  );
};

const PerksView = () => {
  const { walletBalance } = useRealTime();
  const [showCommunityDonateModal, setShowCommunityDonateModal] = useState(false);
  const [communityDonateAmount, setCommunityDonateAmount] = useState(500);
  const [communityFunded, setCommunityFunded] = useState(4250); // 85% of 5000 goal
  const [communityGoal, setCommunityGoal] = useState(5000);
  const [isDonating, setIsDonating] = useState(false);

  const communityProgress = (communityFunded / communityGoal) * 100;
  const communityNeeded = Math.max(0, communityGoal - communityFunded);

  const handleCommunityDonate = async () => {
    if (communityDonateAmount > (walletBalance || 0)) {
      alert('Insufficient balance. You need more RDM to make this donation.');
      return;
    }
    
    if (communityDonateAmount <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    setIsDonating(true);
    
    // Simulate API call delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Update community funding
    setCommunityFunded(prev => Math.min(communityGoal, prev + communityDonateAmount));
    
    setIsDonating(false);
    setShowCommunityDonateModal(false);
    setCommunityDonateAmount(500);
    
    // Show success message
    setTimeout(() => {
      alert(`Thank you! You've donated ${communityDonateAmount.toLocaleString()} RDM to the Community Impact Fund. Your contribution is making a real difference!`);
    }, 100);
  };

  return (
  <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="spa" className="text-teal-500" /> Health & Wellness
            </h3>
            <button className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="w-full h-28 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center justify-center mb-4 relative">
                    <div className="size-14 bg-white dark:bg-surface-dark rounded-full shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Icon name="storefront" className="text-2xl" />
                    </div>
                    <Icon name="nutrition" className="absolute bottom-2 right-2 text-emerald-200 dark:text-emerald-900/30 text-4xl opacity-50" />
                </div>
                <div className="w-full flex justify-between items-start mb-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white text-left">Whole Foods Market</h4>
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">2,000 RDM</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-left w-full mb-5 leading-relaxed">
                    $20 Grocery Voucher for fresh produce and organic goods.
                </p>
                <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors mt-auto">
                    Redeem Voucher
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="w-full h-28 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center justify-center mb-4 relative">
                    <div className="size-14 bg-white dark:bg-surface-dark rounded-full shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Icon name="fitness_center" className="text-2xl" />
                    </div>
                    <Icon name="watch" className="absolute bottom-2 left-2 text-blue-200 dark:text-blue-900/30 text-4xl opacity-50" />
                </div>
                <div className="w-full flex justify-between items-start mb-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white text-left">Fitbit Premium</h4>
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">500 RDM</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-left w-full mb-5 leading-relaxed">
                    1 Month Subscription. Unlock advanced sleep & stress insights.
                </p>
                <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors mt-auto">
                    Redeem Offer
                </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="bg-slate-800 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-lg">
                        <Icon name="lock" className="text-xs" /> Unlocks at Level 5
                    </div>
                </div>
                <div className="w-full h-28 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 opacity-50">
                    <Icon name="directions_bike" className="text-4xl text-slate-300 dark:text-slate-600" />
                </div>
                <div className="w-full flex justify-between items-start mb-2 opacity-50">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white text-left">Peloton Gear</h4>
                    <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">5,000 RDM</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-left w-full mb-5 leading-relaxed opacity-50">
                    Exclusive cycling gear and accessories.
                </p>
                <button className="w-full py-2.5 bg-slate-200 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed mt-auto" disabled>
                    Locked
                </button>
            </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="favorite" className="text-rose-500" /> Community Impact
        </h3>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-6 flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-8">
            <div className="size-20 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center shadow-sm text-blue-600 dark:text-blue-400 shrink-0">
                <Icon name="public" className="text-3xl" />
            </div>
            <div className="flex-1 w-full">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your RDM Changes Lives</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Fund surgeries, plant trees, and support your local community using the points you earn from healthy habits.
                </p>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{width: `${Math.min(100, communityProgress)}%`}}></div>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Community Goal: {Math.round(communityProgress)}% Funded ({communityFunded.toLocaleString()} / {communityGoal.toLocaleString()} RDM)
                    </p>
                    {communityNeeded > 0 && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {communityNeeded.toLocaleString()} RDM needed
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setShowCommunityDonateModal(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                    title="Donate RDM to Community Impact Fund"
                    aria-label="Donate to Community Impact Fund"
                >
                    <Icon name="favorite" className="text-base fill-1" />
                    Fund Community Impact
                </button>
            </div>
        </div>
      </section>

      {/* Community Impact Donate Modal */}
      {showCommunityDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCommunityDonateModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fund Community Impact</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your RDM will fund surgeries, plant trees, and support communities</p>
              </div>
              <button 
                onClick={() => setShowCommunityDonateModal(false)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Close modal"
                aria-label="Close donation modal"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Current Progress */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Current Progress</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{Math.round(communityProgress)}%</p>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{width: `${Math.min(100, communityProgress)}%`}}></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">{communityFunded.toLocaleString()} RDM</span>
                  <span className="text-slate-500 dark:text-slate-400">{communityGoal.toLocaleString()} RDM Goal</span>
                </div>
                {communityNeeded > 0 && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                    {communityNeeded.toLocaleString()} RDM still needed to reach goal
                  </p>
                )}
              </div>

              {/* Available Balance */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">Available Balance</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {walletBalance !== null ? walletBalance.toLocaleString() : '--'} <span className="text-sm text-amber-700/60 dark:text-amber-300/60">RDM</span>
                    </p>
                  </div>
                  <div className="size-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Icon name="account_balance_wallet" className="text-xl" />
                  </div>
                </div>
              </div>

              {/* Donation Amount */}
              <div>
                <label htmlFor="donate-amount" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                  Donation Amount (RDM)
                </label>
                <div className="relative">
                  <input
                    id="donate-amount"
                    type="number"
                    min="1"
                    max={walletBalance || 0}
                    value={communityDonateAmount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const max = walletBalance || 0;
                      setCommunityDonateAmount(Math.min(max, Math.max(1, value)));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="500"
                    title="Enter donation amount"
                    aria-label="Donation amount in RDM"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-medium text-sm">RDM</span>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[100, 250, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        const max = walletBalance || 0;
                        setCommunityDonateAmount(Math.min(max, amount));
                      }}
                      disabled={amount > (walletBalance || 0)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        communityDonateAmount === amount
                          ? 'bg-blue-600 text-white shadow-md'
                          : amount > (walletBalance || 0)
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={`Donate ${amount} RDM`}
                      aria-label={`Quick select ${amount} RDM`}
                    >
                      {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Preview */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" className="text-emerald-500 text-sm shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">
                    <p className="font-bold mb-1">Your Impact:</p>
                    <ul className="space-y-1 text-emerald-600 dark:text-emerald-400">
                      <li>• {Math.floor(communityDonateAmount / 500)} surgery supply kit{Math.floor(communityDonateAmount / 500) !== 1 ? 's' : ''}</li>
                      <li>• {Math.floor(communityDonateAmount / 50)} tree{Math.floor(communityDonateAmount / 50) !== 1 ? 's' : ''} planted</li>
                      <li>• {Math.floor(communityDonateAmount / 100)} meal{Math.floor(communityDonateAmount / 100) !== 1 ? 's' : ''} for families in need</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Warning if insufficient balance */}
              {communityDonateAmount > (walletBalance || 0) && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2">
                  <Icon name="error" className="text-red-500 text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Insufficient balance. You need {communityDonateAmount.toLocaleString()} RDM but only have {(walletBalance || 0).toLocaleString()} RDM available.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button 
                onClick={() => {
                  setShowCommunityDonateModal(false);
                  setCommunityDonateAmount(500);
                }} 
                className="text-slate-500 font-bold text-xs hover:text-slate-700 transition-colors px-4 py-2"
                title="Cancel"
                aria-label="Cancel donation"
              >
                Cancel
              </button>
              <button 
                onClick={handleCommunityDonate}
                disabled={isDonating || communityDonateAmount <= 0 || communityDonateAmount > (walletBalance || 0) || communityFunded >= communityGoal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Confirm donation"
                aria-label="Confirm donation"
              >
                {isDonating ? (
                  <>
                    <span className="animate-spin">⏳</span> Processing...
                  </>
                ) : (
                  <>
                    <Icon name="favorite" className="text-sm fill-1" />
                    Donate {communityDonateAmount.toLocaleString()} RDM
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
  );
};

const CharityView = ({ walletBalance }: { walletBalance: number }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [donateAmount, setDonateAmount] = useState(500);
  const [totalDonated, setTotalDonated] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [surgeriesFunded, setSurgeriesFunded] = useState(0);
  
  // Campaign funding state (starting fresh)
  const [cataractFunded, setCataractFunded] = useState(4250); // 85% of 5000 (initial state)
  const [nutritionFunded, setNutritionFunded] = useState(2000); // 20% of 10000 (initial state)
  
  const handleDonate = () => {
    if (donateAmount > walletBalance) {
      alert('Insufficient balance');
      return;
    }
    
    if (donateAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Update campaign funding
    if (selectedCampaign === 'cataract') {
      setCataractFunded(prev => prev + donateAmount);
      setSurgeriesFunded(prev => prev + 1);
    } else if (selectedCampaign === 'nutrition') {
      setNutritionFunded(prev => prev + donateAmount);
    }
    
    // Update user stats
    const newTotalDonated = totalDonated + donateAmount;
    setTotalDonated(newTotalDonated);
    
    // Level calculation: Level increases every 500 RDM donated (Level 1 at start, Level 2 at 500, etc.)
    const newLevel = Math.floor(newTotalDonated / 500) + 1;
    setUserLevel(newLevel);
    
    setShowDonateModal(false);
    setSelectedCampaign(null);
    
    // Show success message
    setTimeout(() => {
      alert(`Thank you! You've donated ${donateAmount.toLocaleString()} RDM. Your donation is making a difference!`);
    }, 100);
  };
  
  const cataractStory = {
    title: "Mrs. Devi's Story",
    content: `Mrs. Devi, a 72-year-old grandmother from a rural village, has been living in darkness for the past 2 years. A simple cataract surgery could restore her vision, but she cannot afford the medical supplies needed for the procedure.

At our partner rural clinic, dedicated doctors are ready to perform the surgery at no cost, but they need funding for essential medical supplies: surgical instruments, anesthesia, eye drops, and post-operative care medications.

Your RDM contribution directly funds these critical supplies, enabling the clinic to restore Mrs. Devi's ability to see her grandchildren's faces, prepare meals for her family, and regain her independence.

Every donation brings us one step closer to giving Mrs. Devi and others like her the gift of sight. Together, we can turn your healthy habits into life-changing care.`
  };
  
  const cataractProgress = (cataractFunded / 5000) * 100;
  const cataractNeeded = Math.max(0, 5000 - cataractFunded);
  
  const nutritionProgress = (nutritionFunded / 10000) * 100;
  const nextLevelRequirement = userLevel * 500;
  const levelProgress = ((totalDonated % 500) / 500) * 100;
  const rdmToNextLevel = Math.max(0, nextLevelRequirement - totalDonated);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Featured Cause Section */}
      <div className="space-y-3">
         <div className="flex items-center gap-3">
             <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 dark:border-red-800 uppercase tracking-wider">
                URGENT
             </span>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white">Featured Cause</h3>
         </div>
         
         <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
            {/* Left Side - Visual */}
            <div className="md:w-[45%] bg-[#A7F3D0] dark:bg-teal-900/40 relative min-h-[220px] flex items-center justify-center p-6">
                {/* Silhouette Illustration */}
                <div className="opacity-20 text-teal-900 dark:text-teal-100 transform scale-[2.5]">
                    <span className="material-symbols-outlined text-8xl">elderly</span>
                </div>
                <div className="absolute bottom-4 left-6 right-6">
                    <div className="flex items-center gap-2 text-teal-900 dark:text-teal-100 font-bold text-base drop-shadow-sm">
                        <Icon name="visibility" className="text-lg" />
                        1 Donation = 1 Vision Restored
                    </div>
                </div>
            </div>
            
            {/* Right Side - Content */}
            <div className="md:w-[55%] p-5 md:p-6 flex flex-col justify-center">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                    Fund Cataract Surgery for Mrs. Devi
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 text-xs md:text-sm">
                    Mrs. Devi has been unable to see her grandchildren for 2 years. Your RDM contribution will directly fund the medical supplies needed for her procedure at our partner rural clinic.
                </p>
                
                <div className="mb-1.5 flex justify-between items-end font-bold text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs md:text-sm">{Math.round(cataractProgress)}% Funded</span>
                    <span className="text-[10px] md:text-xs text-slate-400 font-medium">Needs {cataractNeeded.toLocaleString()} RDM more</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-6">
                    <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{width: `${Math.min(100, cataractProgress)}%`}}></div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => {
                        setSelectedCampaign('cataract');
                        setShowDonateModal(true);
                      }}
                      className="flex-1 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm"
                    >
                        <Icon name="favorite" className="fill-1 text-sm" /> Donate 500 RDM
                    </button>
                    <button 
                      onClick={() => setShowStoryModal(true)}
                      className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs md:text-sm"
                    >
                        Read Story
                    </button>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ongoing Campaigns */}
          <div className="lg:col-span-2 space-y-3">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="campaign" className="text-green-500" /> Ongoing Campaigns
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Child Nutrition */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:border-orange-200 transition-colors h-full flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="size-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                                <Icon name="restaurant" className="text-lg" />
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded">Active</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Child Nutrition Fund</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mb-3">Goal: Provide vitamin supplements for 50 kids.</p>
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-slate-700 dark:text-slate-300">{Math.round(nutritionProgress)}% Funded</span>
                            <span className="text-orange-500">Goal: 10k RDM</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-3">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{width: `${Math.min(100, nutritionProgress)}%`}}></div>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSelectedCampaign('nutrition');
                            setShowDonateModal(true);
                          }}
                          className="w-full py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            [ Donate ]
                        </button>
                    </div>
                </div>

                {/* Green Energy */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group h-full flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="size-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                <Icon name="solar_power" className="text-lg" />
                            </div>
                            <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                Done <Icon name="emoji_events" className="text-[9px] fill-1" />
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Hospital Green Energy</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mb-3">Goal: Install solar panels on the West Wing.</p>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">STATUS</p>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                            <Icon name="check_circle" className="text-emerald-500 text-sm fill-1" />
                            Campaign Completed
                        </div>
                    </div>
                </div>
             </div>
          </div>

          {/* My Legacy */}
          <div className="lg:col-span-1 space-y-3">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="diversity_3" className="text-purple-500" /> My Legacy
             </h3>
             <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col items-center text-center h-full">
                <div className="relative size-24 mb-3">
                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="5" className="dark:stroke-slate-800" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${283 * (levelProgress / 100)} 283`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                        <Icon name="public" className="text-4xl" />
                    </div>
                </div>
                
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">Philanthropist Lvl {userLevel}</h4>
                <p className="text-[10px] text-slate-500 font-medium mb-5">
                  {rdmToNextLevel > 0 ? `Next Level: ${rdmToNextLevel} RDM to go` : 'Max Level Reached!'}
                </p>
                
                <div className="w-full space-y-2 mb-5">
                    <div className="flex items-center gap-3 text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="size-8 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Icon name="medical_services" className="text-sm" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{surgeriesFunded}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Surgeries Funded</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="size-8 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <Icon name="eco" className="text-sm" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{totalDonated.toLocaleString()}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">RDM Donated</p>
                        </div>
                    </div>
                </div>
                
                <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs transition-colors mt-auto">
                    View Full Impact Report
                </button>
             </div>
          </div>
      </div>

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDonateModal(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Make a Donation</h3>
              <button 
                onClick={() => setShowDonateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1"
                title="Close modal"
                aria-label="Close modal"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="donate-amount" className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Amount (RDM)</label>
                <input
                  id="donate-amount"
                  type="number"
                  min="1"
                  max={walletBalance}
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-rose-500"
                  aria-label="Donation amount in RDM"
                />
                <p className="text-xs text-slate-500 mt-1">Available: {walletBalance.toLocaleString()} RDM</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Your Balance</span>
                  <span className="font-bold text-slate-900 dark:text-white">{walletBalance.toLocaleString()} RDM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">After Donation</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{(walletBalance - donateAmount).toLocaleString()} RDM</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDonateModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDonate}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Icon name="favorite" className="text-sm fill-1" />
                Donate {donateAmount.toLocaleString()} RDM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStoryModal(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cataractStory.title}</h3>
              <button 
                onClick={() => setShowStoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1"
                title="Close modal"
                aria-label="Close modal"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {cataractStory.content}
              </p>
            </div>
            
            <button
              onClick={() => setShowStoryModal(false)}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
