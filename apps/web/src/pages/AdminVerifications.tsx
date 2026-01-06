
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon, Badge, Button, Card } from '@/components/UI';
import { adminService } from '@/services/api/adminService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

export const AdminVerifications = () => {
  const { user } = useAuth();
  const adminId = user?.role === 'ADMIN' ? user.id : undefined;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'claims' | 'staff' | 'iot' | 'onboarding' | 'patients'>('patients');

  // Fetch pending verifications
  const { data: pendingVerifications, isLoading: verificationsLoading, refetch } = useQuery({
    queryKey: ['admin', 'pendingVerifications', adminId],
    queryFn: () => adminService.getPendingVerifications(adminId!),
    enabled: !!adminId && activeTab === 'patients',
    refetchInterval: 30000,
  });

  // Verify patient mutation
  const verifyPatientMutation = useMutation({
    mutationFn: async ({ patientId, action }: { patientId: string; action: 'approve' | 'reject' }) => {
      return await adminService.verifyPatient(adminId!, patientId, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'patients'] });
      refetch();
    },
    onError: (error: any) => {
      console.error('Error verifying patient:', error);
      alert(`Failed to verify patient: ${error?.message || 'Please try again.'}`);
    },
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] pb-24">
      {/* Global Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Verification & Integrity Hub</h2>
             {activeTab === 'iot' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">v4.2.0</span>}
             {activeTab === 'onboarding' && <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">v4.3.1</span>}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {activeTab === 'claims' && "Manage escalations, audit non-clinical claims, and approve high-value security checks."}
            {activeTab === 'staff' && "Quality control center & validation gate for the RDM Health ecosystem."}
            {activeTab === 'iot' && "Automated infrastructure monitoring and compliance verification stream."}
            {activeTab === 'onboarding' && "Staff Access Control, Identity Verification & Role Provisioning."}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap">
            <Icon name="download" className="text-lg" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-lg transition-colors whitespace-nowrap">
            <Icon name="tune" className="text-lg" />
            AI Sensitivity
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 overflow-x-auto no-scrollbar">
        <button 
            onClick={() => setActiveTab('claims')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'claims' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon name="warning" className={activeTab === 'claims' ? 'fill-1' : ''} />
            Escalations & Audits (Active)
        </button>
        <button 
            onClick={() => setActiveTab('staff')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'staff' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon name="medical_services" className={activeTab === 'staff' ? 'fill-1' : ''} />
            Staff Protocols
        </button>
        <button 
            onClick={() => setActiveTab('iot')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'iot' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon name="router" className={activeTab === 'iot' ? 'fill-1' : ''} />
            IoT Logs
        </button>
        <button 
            onClick={() => setActiveTab('onboarding')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 ${activeTab === 'onboarding' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon name="person_add" className={activeTab === 'onboarding' ? 'fill-1' : ''} />
            Staff Onboarding (Active)
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">3</span>
        </button>
      </div>

      {/* VIEW 1: CLAIMS & ESCALATIONS */}
      {activeTab === 'claims' && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700">All Escalations</button>
                <button className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold whitespace-nowrap border border-red-100 dark:border-red-900/30 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-red-500"></span> Fraud Flags <span className="bg-red-200 dark:bg-red-900/50 px-1.5 rounded text-[10px] ml-1">1</span>
                </button>
                <button className="px-3 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold whitespace-nowrap hover:border-slate-300 dark:hover:border-slate-600 flex items-center gap-1">
                    <Icon name="chat" className="text-sm" /> Disputes
                </button>
                <button className="px-3 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold whitespace-nowrap hover:border-slate-300 dark:hover:border-slate-600 flex items-center gap-1">
                    <Icon name="shield" className="text-sm" /> Security Checks
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 flex flex-col gap-4">
                    <div className="relative">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search claims or IDs..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Item 1: Fraud Flag */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border-l-4 border-l-red-500 border-y border-r border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="size-12 rounded-full bg-slate-200 bg-cover shrink-0" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKkhNIqeeHW70Q0t6UHskp7UiayZlaa05-Oilr4Z2Smtb0AkiNPgh7N3TLqQeThSRMT4-4TUB2J_aTjWIYI-dAafJgcxYDM6y_g1SWFRKINlvYoIyxO7DKdNXXTZ7TNpX_crOeXdb2-9oQVqzCpggoV4voc4msHMJoV_lm2WJjDJqVHQKxrOc0yRuSYNmtVcdYQRsKvRADgnNZ8ptCBfCOhkF3IfE0-hrSAf2b3dCXAzOC0SIL-eA0HaN4uWrZpXNUfFmNLNagAedv")'}}></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">John Doe</h4>
                                    <p className="text-xs text-slate-500 font-mono">ID: #P-4522</p>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Gym Membership Reimbursement</h5>
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Non-Clinical</span>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
                                    <Icon name="warning" className="text-sm" />
                                    AI Alert: Potential Duplicate Receipt
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto justify-end">
                                <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                    <Icon name="search" className="text-sm" /> Audit Account
                                </button>
                                <button className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/30 font-bold text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <Icon name="block" className="text-sm" /> Ban Claim
                                </button>
                            </div>
                        </div>

                        {/* Item 2: Appeal */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative">
                                    <div className="size-12 rounded-full bg-slate-200 bg-cover shrink-0" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH")'}}></div>
                                    <div className="absolute -bottom-1 -right-1 bg-blue-100 text-blue-600 p-0.5 rounded-full border border-white"><Icon name="group" className="text-[10px]" /></div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Sarah Lee</h4>
                                    <p className="text-xs text-slate-500 font-mono">ID: #P-9921</p>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Appeal: Rejection of Vaccination Record</h5>
                                <p className="text-xs text-slate-500 mb-2">Doctor's Note: <span className="italic">"Image was too dark."</span></p>
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold text-green-700 dark:text-green-400">
                                    <Icon name="attach_file" className="text-sm" />
                                    New Evidence: "Re-uploaded clear photo."
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex justify-end">
                                <button className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                                    <Icon name="check_circle" className="text-base" /> Overrule & Approve
                                </button>
                            </div>
                        </div>

                        {/* Item 3: Gold Tier */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative">
                                    <div className="size-12 rounded-full bg-slate-200 bg-cover shrink-0" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBIRqf1C3W41bQ_OyYVAvYrNB1nxLeTpHLj9lVvJTV2cLA50I7ZcqqPsHgi_a7d72pwjd6e6MqQ9gHv-hNvH7A_r8EE3UPcQsPliBXk4QqXsCxuyJjO6-LbsDSkaMqFQAPIw2oDkYGDJgR6SC4FH849l2xaT1ALDbO6wjZW6rC3GYfXtL-oepz4bz9ufOZ7o8s6k4Sv_QIIwLcR1ks9oQjjc2CyxsxaT7lbxUBGmmPEVLlvesO1jqVNpCpnImHPlHaWqPH8OdvG8694")'}}></div>
                                    <div className="absolute -bottom-1 -right-1 bg-amber-100 text-amber-600 p-0.5 rounded-full border border-white"><Icon name="shield" className="text-[10px]" /></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Michael Chen</h4>
                                        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Gold Tier</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono">ID: #P-8820</p>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Gold Tier Milestone Reached</h5>
                                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                        💰 Payout: 5,000 RDM
                                    </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-500">
                                    <Icon name="lock" className="text-sm" />
                                    Status: Held for Final Admin Security Check
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex justify-end">
                                <button className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-amber-500/20">
                                    <Icon name="payments" className="text-base" /> Release Funds
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    {/* System Health */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <Icon name="monitor_heart" className="text-indigo-500" /> System Health
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-600 dark:text-slate-400">Doctor Approval Rate</span>
                                    <span className="text-green-500">98% (Healthy)</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: '98%'}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-600 dark:text-slate-400">Auto-Verification Rate (IoT)</span>
                                    <span className="text-blue-500">65%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '65%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fraud Stats */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                            <Icon name="shield" /> Fraud Attempts Blocked:
                        </div>
                        <span className="font-black text-red-800 dark:text-red-300">12 today</span>
                    </div>

                    {/* Performance */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">TODAY'S PERFORMANCE</p>
                        <div className="flex items-end gap-2 mb-4">
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">450</h3>
                            <span className="text-sm font-medium text-slate-500 mb-1">RDM Distributed</span>
                            <span className="ml-auto bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">+12%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-4">
                            <div className="bg-teal-500 h-1.5 rounded-full w-[70%]"></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span>Avg. Review Time</span>
                            <span className="text-slate-900 dark:text-white font-bold">1.2 hours</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 2: STAFF PROTOCOLS */}
      {activeTab === 'staff' && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute right-2 top-2 opacity-10"><Icon name="pending_actions" className="text-4xl" /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PENDING REVIEW</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">142 <span className="text-sm font-medium text-slate-400">Items</span></p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute right-2 top-2 opacity-10"><Icon name="timer" className="text-4xl text-teal-500" /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AVG. TURNAROUND</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black text-slate-900 dark:text-white">1.2h</p>
                        <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-1.5 py-0.5 rounded">⚡ Target &lt;2h</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute right-2 top-2 opacity-10"><Icon name="smart_toy" className="text-4xl text-indigo-500" /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AUTO-VERIFICATION</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">65%</p>
                        <span className="text-xs font-medium text-slate-500">System Efficiency</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
                    <div className="absolute right-2 top-2 opacity-10"><Icon name="block" className="text-4xl text-red-500" /></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">REJECTION RATE</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black text-red-600 dark:text-red-400">4.2%</p>
                        <span className="text-xs font-medium text-slate-500">Quality Control</span>
                    </div>
                </div>
            </div>

            {/* Sub-navigation & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1">
                <div className="flex gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="person" /> Patient Claims
                    </button>
                    <button className="pb-3 text-sm font-bold text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 flex items-center gap-2 whitespace-nowrap">
                        <Icon name="badge" className="fill-1" /> Staff Protocols (Hygiene/Safety)
                    </button>
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="router" /> IoT/Device Logs
                    </button>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by Name, ID, or RDM Category" className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-teal-500" />
                    </div>
                    <select className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-2 outline-none font-medium">
                        <option>Status: Pending</option>
                        <option>Status: Approved</option>
                        <option>Status: Flagged</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    {/* List Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="col-span-4 lg:col-span-4">Staff & Protocol</div>
                        <div className="col-span-2 lg:col-span-2">RDM Impact</div>
                        <div className="col-span-3 lg:col-span-3">Evidence & Status</div>
                        <div className="col-span-3 lg:col-span-3 text-right">Action / Reward</div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Item 1 */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-200 bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuASAnY87FJ5OkyNB5WG4FKNYFJ883CuUQ22G2YHq91lDtv8vYETphUQUHuQc-HDuR651yMslSiRyt-dPUVof1lBJKmFKN0iJQNX5Nk_cGr88XPMAP3L58u19c57TE9XHMtYbPoiYZVcrPIL9hk5MhT2Qkzsq1BdvWNlToQva6bw_dZZ5-mJ_2D7VlSzgG9RYv_VubmD-1TNs_iLLzsY1j1SvO0F6Klf0tiAqn_AuzpQJjhTuGoIEenEgNQj0xthNRANtj8QqvPsOXPH")'}}></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nurse Alisha</h4>
                                    <p className="text-xs text-slate-500">Pediatrics</p>
                                    <div className="flex items-center gap-1 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                                        <Icon name="checklist" className="text-xs text-slate-500" />
                                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Ward Hygiene Checklist</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 inline-flex flex-col">
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Safety Score Impact</span>
                                    <div className="flex gap-0.5 mt-0.5">
                                        <Icon name="thumb_up" className="text-xs text-blue-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 underline decoration-dotted decoration-slate-400">
                                        <Icon name="image" className="text-slate-400" /> Photo Verified
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded w-fit border border-green-100 dark:border-green-800">
                                        <span className="size-1.5 rounded-full bg-green-500"></span> AI: 98% Confidence
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-3 text-right flex flex-col items-end justify-center gap-1">
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+50 Tokens</span>
                                <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                                    <Icon name="check_circle" className="text-sm" /> Auto-Approve
                                </button>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="bg-red-50/30 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-200 bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKkhNIqeeHW70Q0t6UHskp7UiayZlaa05-Oilr4Z2Smtb0AkiNPgh7N3TLqQeThSRMT4-4TUB2J_aTjWIYI-dAafJgcxYDM6y_g1SWFRKINlvYoIyxO7DKdNXXTZ7TNpX_crOeXdb2-9oQVqzCpggoV4voc4msHMJoV_lm2WJjDJqVHQKxrOc0yRuSYNmtVcdYQRsKvRADgnNZ8ptCBfCOhkF3IfE0-hrSAf2b3dCXAzOC0SIL-eA0HaN4uWrZpXNUfFmNLNagAedv")'}}></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Technician Ben</h4>
                                    <p className="text-xs text-slate-500">Radiology</p>
                                    <div className="flex items-center gap-1 mt-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-0.5 rounded w-fit text-[10px] font-bold border border-red-200 dark:border-red-800">
                                        <Icon name="warning" className="text-xs" />
                                        MRI Equipment Sterilization
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 inline-flex flex-col">
                                    <span className="text-[10px] font-bold text-red-700 dark:text-red-300">Safety Risk Detected</span>
                                    <Icon name="security" className="text-xs text-red-500 mt-0.5" />
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                                        <Icon name="sensors_off" className="text-sm" /> IoT Sensor: Cycle Incomplete
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded w-fit border border-red-200 dark:border-red-800">
                                        <Icon name="flag" className="text-[10px]" /> Flagged for Correction
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-3 text-right flex flex-col items-end justify-center gap-1">
                                <span className="text-sm font-bold text-red-600 dark:text-red-400">-50 Remorse</span>
                                <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 whitespace-nowrap">
                                    <Icon name="school" className="text-sm" /> Assign 'Sterilization SOP'
                                </button>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-200 bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrmOqFjKUO4FY7_pEHrGX7I7Oha9c6NH8C2KaMWM1FPGVP4CjFB1nUuErLcxV7jdP6n-L3eZ8duSf9hLU5F8jmULlL2N6-srZejNgf3mJ96NrnLOdYibXWywxUMuCzUeUC1Nr8D1EiIv6yNOwzxiQCIoZeMzXa7roCIem9f8nYYi7P3RJs-eiWFodcZz_gboTxcV93YSehvQTXwlu7S0Rr7DgAN3ZiFG_VMmhZDJTg_OX1JxX1NWQn2lVOUwx3JjF9chnIvs8cf3rk")'}}></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dr. Alan Grant</h4>
                                    <p className="text-xs text-slate-500">Cardiology</p>
                                    <div className="flex items-center gap-1 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">
                                        <Icon name="assignment" className="text-xs text-slate-500" />
                                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Patient Handover Log</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 inline-flex flex-col">
                                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Efficiency Score</span>
                                    <Icon name="bolt" className="text-xs text-indigo-500 mt-0.5" />
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 underline decoration-dotted decoration-slate-400">
                                        <Icon name="fact_check" className="text-slate-400" /> Supervisor Audit
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded w-fit border border-green-100 dark:border-green-800">
                                        <Icon name="check" className="text-[10px]" /> Passed
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-3 text-right flex flex-col items-end justify-center gap-1">
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+20 Tokens</span>
                                <button className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                                    <Icon name="check" className="text-sm" /> Approve
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
                        <span>Showing <strong>1-3</strong> of <strong>142</strong> pending items</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Previous</button>
                            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <Icon name="report_problem" className="text-red-500" /> Violation Insights
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Learning Loop: Analyzing flagged events to prevent future risks.</p>
                        
                        <div className="flex gap-4 text-xs font-bold border-b border-slate-100 dark:border-slate-700 mb-4">
                            <span className="pb-2 border-b-2 border-slate-900 dark:border-white">Incomplete Sterilization Cycles</span>
                            <span className="pb-2 text-slate-400">Most Common</span>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-4">3 Staff members flagged this week.</p>

                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl mb-4">
                            <div className="flex items-start gap-2 mb-1">
                                <Icon name="lightbulb" className="text-amber-500 text-sm mt-0.5" />
                                <span className="text-sm font-bold text-amber-800 dark:text-amber-200">Recommendation</span>
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                3 Staff members flagged this week. Recommend Booking <span className="font-bold">'Safety Refresh' Workshop</span>.
                            </p>
                        </div>

                        <button className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 mb-3">
                            <Icon name="event" /> Book Workshop
                        </button>
                        <button className="w-full py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-bold shadow-sm">
                            View Full Risk Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 3: IOT LOGS */}
      {activeTab === 'iot' && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ACTIVE SENSORS <span className="size-2 rounded-full bg-green-500 inline-block ml-1"></span></p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900 dark:text-white">1,240</p>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded">Online</span>
                        </div>
                    </div>
                    <Icon name="sensors" className="text-4xl text-slate-100 dark:text-slate-700" />
                </div>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">DATA VELOCITY</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900 dark:text-white">450</p>
                            <span className="text-xs font-medium text-slate-500">Verifications/min</span>
                        </div>
                    </div>
                    <Icon name="speed" className="text-4xl text-slate-100 dark:text-slate-700" />
                </div>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AUTO-TRUST SCORE</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">100%</p>
                            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Icon name="smart_toy" className="text-[10px]" /> Machines don't lie</span>
                        </div>
                    </div>
                    <Icon name="verified_user" className="text-4xl text-slate-100 dark:text-slate-700" />
                </div>
            </div>

            {/* Sub-navigation & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1">
                <div className="flex gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="person" /> Patient Claims
                    </button>
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="badge" /> Staff Protocols
                    </button>
                    <button className="pb-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 flex items-center gap-2 whitespace-nowrap">
                        <Icon name="router" className="fill-1" /> IoT/Device Logs
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 bg-white dark:bg-surface-dark p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Filter Stream:
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 w-full">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 whitespace-nowrap">
                        <Icon name="soap" className="text-sm" /> Hygiene Sensors
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap">
                        <Icon name="ac_unit" className="text-sm" /> Cold Chain (Meds)
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap">
                        <Icon name="bolt" className="text-sm" /> Energy/ESG
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap">
                        <Icon name="watch" className="text-sm" /> Wearables
                    </button>
                </div>
                <div className="relative w-full md:w-64 shrink-0">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search Device ID..." className="w-full pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="col-span-4">Device / Source</div>
                        <div className="col-span-3">Detected Event</div>
                        <div className="col-span-3">Context & Integrity</div>
                        <div className="col-span-2 text-right">Auto-Action</div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Item 1 */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30">
                                    <Icon name="soap" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dispenser #402</h4>
                                    <p className="text-xs text-slate-500">ICU Entrance • <span className="text-green-500 font-bold text-[10px]">● SYNC</span></p>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Hand Sanitize Action</h5>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">EVT_ID: 99482103</p>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon name="badge" className="text-slate-400 text-xs" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Nurse Alisha</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500">Badge Proximity <span className="text-green-600 dark:text-green-400 font-bold">(Verified)</span></span>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-2 text-right flex flex-col items-end gap-1">
                                <div className="bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded border border-teal-100 dark:border-teal-900/30 flex items-center gap-1">
                                    <Icon name="check_circle" className="text-teal-600 dark:text-teal-400 text-xs" />
                                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 whitespace-nowrap">Auto-Verify: +5 Tokens</span>
                                </div>
                                <span className="text-[9px] text-slate-400">Hygiene Protocol</span>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                    <Icon name="kitchen" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Pharma Fridge B</h4>
                                    <p className="text-xs text-slate-500">Insulin Storage • <span className="text-green-500 font-bold text-[10px]">● STABLE</span></p>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Temp &lt; 4°C Maintained</h5>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">DURATION: 24h 00m</p>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Zero Waste Target</span>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <Icon name="sensors" className="text-xs" /> Sensor Integrity: 100%
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-2 text-right flex flex-col items-end gap-1">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1">
                                    <Icon name="check_circle" className="text-emerald-600 dark:text-emerald-400 text-xs" />
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">+100 Tokens to Dept</span>
                                </div>
                                <span className="text-[9px] text-slate-400">Efficiency Bonus</span>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30">
                                    <Icon name="lightbulb" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Smart Lighting</h4>
                                    <p className="text-xs text-slate-500">Ward C Hallway • <span className="text-green-500 font-bold text-[10px]">● ACTIVE</span></p>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Auto-Dim Action</h5>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">TIME: 02:00:15 AM</p>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <Icon name="grid_view" className="text-xs" /> Low Activity
                                    </div>
                                    <span className="text-[10px] text-slate-500">Motion Sensors: None</span>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-2 text-right flex flex-col items-end gap-1">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-1">
                                    <Icon name="volunteer_activism" className="text-indigo-600 dark:text-indigo-400 text-xs" />
                                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">+50 Tokens Donated</span>
                                </div>
                                <span className="text-[9px] text-slate-400">Charity Pool (ESG)</span>
                            </div>
                        </div>

                        {/* Item 4 */}
                        <div className="bg-red-50/30 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 rounded-xl p-4 grid grid-cols-12 gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30">
                                    <Icon name="bed" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Smart Bed #12</h4>
                                    <p className="text-xs text-slate-500">Room 304 • <span className="text-red-500 font-bold text-[10px]">● CONFLICT</span></p>
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <h5 className="font-bold text-red-700 dark:text-red-300 text-sm flex items-center gap-1">
                                    <Icon name="warning" className="text-xs" /> Patient Weight Present
                                </h5>
                                <p className="text-[10px] text-red-400 font-mono mt-0.5">LOAD: 78.5 KG</p>
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <Icon name="cancel" className="text-xs text-slate-400" /> System: 'Discharged'
                                    </div>
                                    <span className="text-[10px] text-red-500 font-bold">Data Mismatch</span>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-2 text-right flex flex-col items-end gap-1">
                                <div className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-red-200 dark:border-red-800 flex items-center gap-1">
                                    <Icon name="flag" className="text-red-500 text-xs" />
                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 whitespace-nowrap">Flagged for Admin</span>
                                </div>
                                <span className="text-[9px] text-slate-400">Review Required</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400">
                        <div className="flex gap-2 items-center">
                            <span>Streaming live data...</span>
                            <span className="font-mono">LAST_UPDATE: 2s ago</span>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Pause Stream</button>
                            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800">Load History</button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Icon name="hub" className="text-slate-500" /> Infrastructure
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE
                            </div>
                        </div>
                        
                        <div className="bg-slate-900 rounded-xl h-48 w-full relative mb-4 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                            
                            {/* Mock Map Dots */}
                            <div className="absolute top-1/4 left-1/4 size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                            <div className="absolute top-1/2 left-1/2 size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                            <div className="absolute bottom-1/3 right-1/4 size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                            <div className="absolute top-1/3 right-1/3 size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                            <div className="absolute top-1/2 right-10 size-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] animate-ping"></div>
                            
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
                                Floor 3 - West Wing
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-4 flex items-start gap-3">
                            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg text-red-500">
                                <Icon name="sensors_off" className="text-lg" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-700 dark:text-red-300">Sensor #405 Offline</h4>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-tight">No tokens generating for West Wing entrance. Check connectivity.</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between">
                                <span>Network Uptime</span>
                                <span className="text-green-600 dark:text-green-400 font-bold">99.98%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Token Gen. Rate</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">~420/hr</span>
                            </div>
                        </div>

                        <button className="w-full mt-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            View Full Diagnostic Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 4: STAFF ONBOARDING */}
      {activeTab === 'onboarding' && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PENDING VERIFICATION</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900 dark:text-white">3</p>
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">New Staff</span>
                        </div>
                    </div>
                    <Icon name="person_add" className="text-4xl text-slate-100 dark:text-slate-700" />
                </div>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL ACTIVE USERS</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-slate-900 dark:text-white">452</p>
                            <span className="text-xs font-medium text-slate-500">Staff</span>
                        </div>
                    </div>
                    <Icon name="groups" className="text-4xl text-slate-100 dark:text-slate-700" />
                </div>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">SECURITY LEVEL</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">High</p>
                            <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-100 dark:border-emerald-900/30"><Icon name="badge" className="text-[10px]" /> ID Proof Required</span>
                        </div>
                    </div>
                    <Icon name="security" className="text-4xl text-slate-100 dark:text-slate-700" />
                </div>
            </div>

            {/* Sub-navigation & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-1">
                <div className="flex gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="person" /> Patient Claims
                    </button>
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="badge" /> Staff Protocols
                    </button>
                    <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors flex items-center gap-2 whitespace-nowrap">
                        <Icon name="router" /> IoT Logs
                    </button>
                    <button className="pb-3 text-sm font-bold text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 flex items-center gap-2 whitespace-nowrap">
                        <Icon name="person_add" className="fill-1" /> Staff Onboarding (Active) <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Pending Access Requests */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Access Requests</h3>
                            <p className="text-xs text-slate-500">Self-signup attempts requiring admin approval.</p>
                        </div>
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800">
                            <Icon name="hourglass_empty" className="text-xs mr-1 align-text-bottom" /> 3 Pending
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">NAME</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ROLE CLAIMED</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID PROOF</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">DEPT ASSIGNMENT</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-300 dark:border-slate-600">ES</div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dr. Emily Stone</h4>
                                                <p className="text-xs text-slate-500">Requested 2h ago</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1 w-fit">
                                            <Icon name="cardiology" className="text-xs" /> Cardiologist
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-lg w-fit">
                                                <Icon name="description" className="text-emerald-600 dark:text-emerald-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">View Medical License</span>
                                                </div>
                                                <Icon name="check_circle" className="text-emerald-500 ml-1 text-sm" />
                                            </div>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-1">Verified by System</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative w-40">
                                            <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-teal-500">
                                                <option>Cardiology</option>
                                                <option>Pediatrics</option>
                                                <option>Emergency</option>
                                            </select>
                                            <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 ml-auto transition-colors">
                                            <Icon name="verified" className="text-sm" /> Approve & Mint
                                        </button>
                                    </td>
                                </tr>

                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-400 text-sm border border-slate-300 dark:border-slate-600">
                                                <Icon name="person" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Unknown User</h4>
                                                <p className="text-xs text-slate-500">ID: JohnD_99</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1 w-fit">
                                            <Icon name="admin_panel_settings" className="text-xs" /> Admin
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-3 py-1.5 rounded-lg w-fit">
                                                <Icon name="broken_image" className="text-red-500" />
                                                <span className="text-xs font-bold text-red-700 dark:text-red-300">Blurry / Missing</span>
                                            </div>
                                            <span className="text-[10px] text-red-500 font-medium ml-1">Auto-Flagged</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-9 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 opacity-50"></div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="bg-white dark:bg-surface-dark border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 ml-auto transition-colors">
                                            <Icon name="block" className="text-sm" /> Deny & Block
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Manual Provision Card */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30">
                            <Icon name="person_add_alt" className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manually Provision New Staff</h3>
                            <p className="text-sm text-slate-500">Create an account and generate an invite code for immediate onboarding.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                                <input type="text" defaultValue="Nurse Jessica" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-shadow" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Employee ID</label>
                                <input type="text" defaultValue="#8829" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-shadow" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role & Permissions</label>
                                <div className="relative">
                                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer">
                                        <option>Nurse</option>
                                        <option>Doctor</option>
                                        <option>Technician</option>
                                        <option>Admin</option>
                                    </select>
                                    <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1.5 font-medium ml-1">Sets RDM Earning Rates</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department</label>
                                <div className="relative">
                                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer">
                                        <option>Pediatrics</option>
                                        <option>Cardiology</option>
                                        <option>Emergency</option>
                                        <option>Radiology</option>
                                    </select>
                                    <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button className="bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                                <Icon name="vpn_key" className="text-lg" />
                                Create Account & Generate Invite Code
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 5: PATIENT VERIFICATIONS */}
      {activeTab === 'patients' && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          {verificationsLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : pendingVerifications && pendingVerifications.length > 0 ? (
            <div className="space-y-4">
              {pendingVerifications.map((patient) => (
                <Card key={patient.id} className="p-6 border-l-4 border-l-amber-500">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {patient.avatar ? (
                        <img
                          src={patient.avatar}
                          alt={patient.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                          <Icon name="person" className="text-3xl text-teal-600 dark:text-teal-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {patient.name}
                          </h3>
                          <Badge variant="warning" className="text-xs">Pending</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Patient ID</p>
                            <p className="font-bold text-slate-900 dark:text-white">{patient.patientId}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Age</p>
                            <p className="font-bold text-slate-900 dark:text-white">{patient.age}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Diagnosis</p>
                            <p className="font-bold text-slate-900 dark:text-white">{patient.diagnosis}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Created By</p>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {patient.createdByStaff?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        {patient.createdByStaff && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Created by: {patient.createdByStaff.name} ({patient.createdByStaff.email})
                            </p>
                            {patient.createdAt && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Created: {new Date(patient.createdAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          if (confirm(`Approve verification for ${patient.name}?`)) {
                            verifyPatientMutation.mutate({ patientId: patient.id, action: 'approve' });
                          }
                        }}
                        disabled={verifyPatientMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Icon name="check" className="text-lg" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm(`Reject verification for ${patient.name}?`)) {
                            verifyPatientMutation.mutate({ patientId: patient.id, action: 'reject' });
                          }
                        }}
                        disabled={verifyPatientMutation.isPending}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Icon name="close" className="text-lg" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Icon name="verified_user" className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                No pending verifications
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
