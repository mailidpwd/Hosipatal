import React from 'react';
import { Card, Icon, Button, Badge } from '@/components/UI';

export const PatientVitals = () => {
  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Health Assets</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base mt-2 font-medium">Manage your medical records and earn from your data.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-surface-dark px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-md">
            <Icon name="favorite" className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Synced & Mining
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">+5 RDM/Day</div>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        
        {/* Real-Time Maintenance Section */}
        <section>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Icon name="monitor_heart" className="text-primary text-xl" />
            Real-Time Maintenance
          </h3>
          <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row overflow-hidden relative min-h-[280px]">
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl text-cyan-600 dark:text-cyan-400">
                    <Icon name="favorite" className="text-2xl" />
                  </div>
                  <div>
                    <span className="font-bold text-lg md:text-xl text-slate-900 dark:text-white block">Blood Pressure</span>
                    <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Daily Monitoring</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:border-cyan-200 text-xs font-bold transition-all bg-transparent hover:bg-cyan-50 dark:hover:bg-cyan-900/20 w-fit">
                  <Icon name="history" className="text-sm" />
                  View History
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-end gap-8 mt-auto">
                <div>
                  <div className="flex items-baseline gap-2">
                    {/* Adjusted text size for responsiveness: smaller on mobile, larger on big screens */}
                    <h4 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">118/78</h4>
                    <span className="text-sm md:text-lg font-bold text-slate-400">mmHg</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">Below</span>
                    <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Icon name="check_circle" className="text-xs" /> Normal
                    </span>
                    <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">Above Critical</span>
                  </div>
                </div>
                
                <div className="h-20 md:h-24 w-full sm:max-w-[300px] ml-auto opacity-80 flex-1">
                  <svg className="w-full h-full text-cyan-400" fill="none" preserveAspectRatio="none" stroke="currentColor" viewBox="0 0 100 40">
                    <path d="M0 25 Q 15 20, 30 22 T 60 18 T 100 25" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    <path d="M0 25 Q 15 20, 30 22 T 60 18 T 100 25 V 40 H 0 Z" fill="url(#gradient-bp-new)" stroke="none"></path>
                    <defs>
                      <linearGradient id="gradient-bp-new" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col justify-center min-w-[260px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-600 dark:text-emerald-400">
                    <Icon name="trending_up" className="text-xl" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consistency Streak</p>
                </div>
                <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">25 Days</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-surface-dark px-3 py-2 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <p className="text-[10px] md:text-xs font-bold text-amber-600 dark:text-amber-400">
                    +50 RDM Pending
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Missing Records Section */}
        <section>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Icon name="warning" className="text-amber-500 text-xl" />
            Missing Records (Upload to Earn)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between group hover:border-amber-200 transition-all relative overflow-hidden min-h-[220px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                    <Icon name="vaccines" className="text-2xl" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800 shadow-sm">
                    💰 Bounty: 150 RDM
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Immunization History</h4>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Missing records from 2015-2020.</p>
              </div>
              <div className="mt-6">
                <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-4 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
                  <Icon name="upload_file" className="text-lg" />
                  Upload Proof Document
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Record Status & Payouts Section */}
        <section>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Icon name="verified_user" className="text-primary text-xl" />
            Record Status & Payouts
          </h3>
          <div className="bg-white dark:bg-surface-dark rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Item 1: In Review */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="min-w-[100px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">DATE</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Dec 18, 2025</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-1">Type 2 Diabetes (Self-Reported)</h4>
                  <div className="flex items-center gap-2">
                    <Icon name="description" className="text-slate-400 text-sm" />
                    <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 underline decoration-dotted cursor-pointer hover:text-primary font-medium">Lab_Results_2020.pdf</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 w-full lg:w-auto">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold border border-orange-200 dark:border-orange-800 w-fit">
                    <Icon name="hourglass_empty" className="text-sm" />
                    In Review
                  </span>
                  <div className="text-right min-w-[140px]">
                    <div className="flex items-center justify-end gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-sm">
                      <Icon name="lock" className="text-sm" />
                      100 RDM Locked
                    </div>
                    <div className="text-[9px] md:text-[10px] text-slate-400 italic mt-1 font-medium">
                      Unlocks upon Dr. Smith's approval.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2: Verified */}
            <div className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="min-w-[100px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">DATE</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Aug 12, 2018</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-1">Appendectomy</h4>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Icon name="verified" className="text-teal-500" />
                    Verified By: Dr. Williams (Surgery Dept)
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 w-full lg:w-auto">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 w-fit">
                    <Icon name="check_circle" className="text-sm" />
                    Verified
                  </span>
                  <div className="text-right min-w-[140px]">
                    <div className="flex items-center justify-end gap-1.5 text-amber-500 font-black text-base">
                      +500 RDM Paid
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

