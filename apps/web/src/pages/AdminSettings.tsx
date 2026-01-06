
import React, { useState } from 'react';
import { Icon, Button } from '@/components/UI';

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'rules' | 'permissions' | 'integrations' | 'logs'>('profile');
  
  // Rules State
  const [rewardValue, setRewardValue] = useState(10);
  const [penaltyValue, setPenaltyValue] = useState(5);
  const [confidence, setConfidence] = useState(95);

  const menuItems = [
    { id: 'profile', label: 'General Profile', icon: 'domain' },
    { id: 'rules', label: 'RDM Rules Engine', icon: 'tune' },
    { id: 'permissions', label: 'Role Permissions', icon: 'lock' },
    { id: 'integrations', label: 'Integrations', icon: 'hub' },
    { id: 'logs', label: 'Audit Logs', icon: 'verified_user' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out] h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 shrink-0 gap-4">
            <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                    {activeTab === 'logs' ? 'Settings & Logs' : 'Settings & Configuration'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {activeTab === 'logs' 
                        ? 'Audit system actions, configure rules, and manage permissions.' 
                        : 'Manage Hospital Command Center rules, alerts, and role permissions.'}
                </p>
            </div>
            {activeTab !== 'logs' && (
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Icon name="help" className="text-lg" />
                    Help & Support
                </button>
            )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 shrink-0 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 h-fit shadow-sm overflow-hidden">
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex items-center gap-3 px-6 py-4 text-sm font-bold border-l-4 transition-all whitespace-nowrap lg:whitespace-normal ${
                                activeTab === item.id
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            <Icon name={item.icon} className="text-lg" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 overflow-y-auto pb-20 lg:pb-0 custom-scrollbar pr-2">
                
                {/* 1. GENERAL PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 max-w-5xl">
                        {/* Hospital Identity */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Hospital Identity</h3>
                            <p className="text-xs text-slate-500 mb-6">Configure your organization's core details.</p>

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="size-32 rounded-full border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-400 relative group cursor-pointer hover:bg-blue-100 transition-colors">
                                        <Icon name="add_photo_alternate" className="text-3xl" />
                                        <div className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500">
                                            <Icon name="edit" className="text-xs" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">General Hospital (Main)</span>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">CURRENCY NAME</label>
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
                                            <Icon name="payments" className="text-slate-400 mr-2" />
                                            <input type="text" defaultValue="RDM Tokens" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">FISCAL YEAR START</label>
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
                                            <Icon name="calendar_today" className="text-slate-400 mr-2" />
                                            <input type="text" defaultValue="Jan 1st" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Regional & SLA Config */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Regional & SLA Configuration</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">TIME ZONE</label>
                                    <div className="relative">
                                        <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-8 py-3 text-sm font-bold text-slate-900 dark:text-white appearance-none outline-none cursor-pointer">
                                            <option>(GMT-05:00) Eastern Time</option>
                                            <option>(GMT-08:00) Pacific Time</option>
                                            <option>(GMT+00:00) UTC</option>
                                        </select>
                                        <Icon name="schedule" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">HOSPITAL TYPE</label>
                                    <div className="relative">
                                        <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-8 py-3 text-sm font-bold text-slate-900 dark:text-white appearance-none outline-none cursor-pointer">
                                            <option>Level 1 Trauma Center</option>
                                            <option>Community Hospital</option>
                                            <option>Clinic / Outpatient</option>
                                        </select>
                                        <Icon name="local_hospital" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Icon name="info" className="text-blue-500" />
                                <span>Automatically loads 'High Acuity' RDM templates based on selection.</span>
                            </div>
                        </div>

                        {/* Public Transparency Page */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Icon name="public" className="text-green-600 text-xl" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Public Transparency Page (ESG Link)</h3>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Enable Public ESG Dashboard</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Allows patients/donors to view the 'Charity Impact' stats publicly.</p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">PUBLIC URL</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
                                        <Icon name="link" className="text-slate-400 mr-2" />
                                        <input type="text" defaultValue="rdm.health/general-hospital/impact" className="bg-transparent w-full text-sm font-mono text-slate-600 dark:text-slate-300 outline-none" />
                                    </div>
                                    <button className="text-blue-600 dark:text-blue-400 font-bold text-sm px-4 hover:underline whitespace-nowrap">Preview Page</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                <Icon name="save" /> Save Profile
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. RULES ENGINE TAB (Preserved from previous logic) */}
                {activeTab === 'rules' && (
                    <div className="space-y-6 max-w-5xl">
                        {/* Clinical Protocol Config */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinical Protocol Configuration</h3>
                                    <p className="text-xs text-slate-500 mt-1">Define actions for the "Commit" phase of the RDM loop.</p>
                                </div>
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded border border-green-200 uppercase tracking-wide">Active</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">RULE NAME</label>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                                        <Icon name="medical_services" className="text-slate-400 mr-2" />
                                        <input type="text" defaultValue="Ward Vitals Check" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">TARGET SLA</label>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                                        <Icon name="timer" className="text-slate-400 mr-2" />
                                        <input type="text" defaultValue="Every 4 Hours" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Reward Slider */}
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">REWARD (INCENTIVE)</span>
                                        <span className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-black px-2 py-1 rounded shadow-sm">+{rewardValue} Tokens</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="50" value={rewardValue} 
                                        onChange={(e) => setRewardValue(parseInt(e.target.value))}
                                        className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                    />
                                    <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-3 font-medium">Issued upon successful verification.</p>
                                </div>

                                {/* Penalty Slider */}
                                <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-bold text-red-700 dark:text-red-300">REMORSE (PENALTY)</span>
                                        <span className="bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 text-xs font-black px-2 py-1 rounded shadow-sm">-{penaltyValue} Tokens</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="50" value={penaltyValue} 
                                        onChange={(e) => setPenaltyValue(parseInt(e.target.value))}
                                        className="w-full h-2 bg-red-200 dark:bg-red-900 rounded-lg appearance-none cursor-pointer accent-red-500" 
                                    />
                                    <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-3 font-medium">Deducted if SLA is missed.</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col md:flex-row items-end justify-between gap-6">
                                <div className="w-full md:w-1/2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">VERIFICATION METHOD</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-8 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-slate-200">
                                            <option>AI Photo Scan</option>
                                            <option>IoT Sensor Stream</option>
                                            <option>Supervisor Sign-off</option>
                                        </select>
                                        <Icon name="verified" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <button className="w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                                    <Icon name="save" className="text-lg" />
                                    Save Rule Configuration
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Thresholds & Alerts */}
                            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <Icon name="warning" className="text-orange-500" /> Thresholds & Alerts
                                </h3>
                                
                                <p className="text-xs text-slate-500 mb-4">Define conditions that trigger "Red" status in the Command Center.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">SAFETY SCORE ALERT</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 w-32">
                                                <Icon name="shield" className="text-slate-400 text-xs mr-2" />
                                                <input type="number" defaultValue="85" className="w-full bg-transparent text-sm font-bold outline-none" />
                                                <span className="text-xs text-slate-400 font-bold">%</span>
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Hygiene Compliance</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">DISCHARGE BOTTLENECK</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 w-32">
                                                <Icon name="hourglass_empty" className="text-slate-400 text-xs mr-2" />
                                                <input type="number" defaultValue="2" className="w-full bg-transparent text-sm font-bold outline-none" />
                                                <span className="text-xs text-slate-400 font-bold ml-1">Hours</span>
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Avg Discharge Time</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Sensitivity */}
                            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <Icon name="psychology" className="text-purple-500" /> AI Auto-Verify Sensitivity
                                </h3>

                                <div className="flex justify-between items-center mb-2 mt-8">
                                    <span className="text-xs font-bold text-slate-500 uppercase">CONFIDENCE THRESHOLD</span>
                                    <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{confidence}%</span>
                                </div>
                                <input 
                                    type="range" min="50" max="100" value={confidence} 
                                    onChange={(e) => setConfidence(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 mb-1" 
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-8">
                                    <span>Low Trust</span>
                                    <span>Strict</span>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl p-3 flex items-start gap-3">
                                    <Icon name="info" className="text-purple-600 dark:text-purple-400 text-base mt-0.5" />
                                    <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed font-medium">
                                        Claims with AI confidence above <span className="font-bold">{confidence}%</span> will be Auto-Approved. Everything else requires human review.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. ROLE PERMISSIONS TAB */}
                {activeTab === 'permissions' && (
                    <div className="space-y-6 max-w-5xl">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Control & Approval Limits</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define operational boundaries for staff roles.</p>
                            </div>
                        </div>

                        {/* Medical Directors (Level 1) */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <Icon name="local_hospital" className="text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Medical Directors</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">HIGH LEVEL ACCESS</p>
                                    </div>
                                </div>
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">Level 1</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">BUDGET APPROVAL LIMIT</label>
                                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
                                        <input type="text" defaultValue="10,000" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                        <span className="text-xs font-bold text-slate-400">RDM</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Can Freeze Budgets</span>
                                        <span className="text-[10px] text-slate-500">Emergency stop for spending</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Override AI Rejections</span>
                                        <span className="text-[10px] text-slate-500">Manual approval authority</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department Heads (Level 2) */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                        <Icon name="supervisor_account" className="text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Department Heads</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">MID LEVEL ACCESS</p>
                                    </div>
                                </div>
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">Level 2</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">BUDGET APPROVAL LIMIT</label>
                                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
                                        <input type="text" defaultValue="1,000" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                        <span className="text-xs font-bold text-slate-400">RDM</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Can Assign Training</span>
                                        <span className="text-[10px] text-slate-500">Manage staff curriculum</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Can View Audit Logs</span>
                                        <span className="text-[10px] text-slate-500">Access system security history</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Staff Nurses (Level 3) */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                        <Icon name="medication" className="text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Staff Nurses</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">STANDARD ACCESS</p>
                                    </div>
                                </div>
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-200 dark:border-green-800">Level 3</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">BUDGET APPROVAL LIMIT</label>
                                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
                                        <input type="text" defaultValue="0" className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white outline-none" />
                                        <span className="text-xs font-bold text-slate-400">RDM</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Can Submit Claims</span>
                                        <span className="text-[10px] text-slate-500">Request RDM for completed tasks</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Verify Peer Hygiene</span>
                                        <span className="text-[10px] text-slate-500">Participate in peer-review</span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Banner */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#fff7ed] dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <Icon name="lock_clock" className="text-xl" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Require 2FA for Large Payouts</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Adds an extra layer of security for large token releases. Any transaction over <span className="font-bold">500 RDM</span> will require a second factor authentication.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Active</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-transform active:scale-95 flex items-center gap-2">
                                    <Icon name="save_as" />
                                    Update Permissions
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. INTEGRATIONS TAB */}
                {activeTab === 'integrations' && (
                    <div className="space-y-8 max-w-5xl">
                        {/* Clinical Systems */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <Icon name="dns" className="text-blue-500" />
                                Clinical Systems (EMR/EHR)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Epic */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                                                <Icon name="monitor_heart" className="text-red-600 text-2xl" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Epic EMR</h4>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-100 dark:border-green-800 uppercase tracking-wide mt-1">
                                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span> Connected
                                                </span>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-600"><Icon name="more_vert" /></button>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700 mb-6">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DATA SYNC</p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Patient Discharge, Lab Results</p>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-400 flex items-center gap-1"><Icon name="sync" className="text-xs" /> Last Sync: 2 mins ago</span>
                                        <button className="text-blue-600 hover:underline">Configure</button>
                                    </div>
                                </div>

                                {/* Cerner */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            <Icon name="dataset" className="text-slate-500 text-2xl" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Cerner</h4>
                                            <p className="text-xs text-slate-500">Electronic Health Record</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                        <Icon name="link_off" />
                                        Connect
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* IoT & Infrastructure */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Icon name="sensors" className="text-purple-500" />
                                    IoT & Infrastructure
                                </h3>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-2 py-1 rounded">The "Verify" Sensors</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Smart Hygiene */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                            <Icon name="soap" />
                                        </div>
                                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 uppercase">● Active</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Smart Hand Hygiene</h4>
                                    <p className="text-xs text-slate-500 mb-4">Honeywell • 124 Devices</p>
                                    <button className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Calibrate Sensitivity</button>
                                </div>

                                {/* Cold Chain */}
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="size-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600">
                                            <Icon name="kitchen" />
                                        </div>
                                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 uppercase">● Active</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Cold Chain Fridges</h4>
                                    <p className="text-xs text-slate-500 mb-4">Infrastructure • 12 Units</p>
                                    <button className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Manage Units</button>
                                </div>

                                {/* Wearables */}
                                <div className="bg-white dark:bg-surface-dark border-2 border-yellow-100 dark:border-yellow-900/30 rounded-2xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                            <Icon name="watch" />
                                        </div>
                                        <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-100 uppercase">● Partial Outage</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Wearables</h4>
                                    <p className="text-xs text-slate-500 mb-4">Fitbit / Garmin</p>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-2 flex items-center gap-2 text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                                        <Icon name="warning" className="text-sm" /> API Update needed
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Gateway */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <Icon name="payments" className="text-green-600" />
                                Financial Gateway
                            </h3>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 border border-green-100 dark:border-green-900/30">
                                                <Icon name="currency_exchange" className="text-2xl" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Charity Payment Gateway</h4>
                                                <p className="text-xs text-slate-500">Stripe / Crypto</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 uppercase tracking-wide">● Connected</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        For converting RDM donations into fiat currency for charity payout distribution.
                                    </div>
                                </div>
                                <div className="flex items-center justify-center flex-1">
                                    <button className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-transform active:scale-95">
                                        <Icon name="add_link" />
                                        Add New Integration
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. AUDIT LOGS TAB (Preserved) */}
                {activeTab === 'logs' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="relative w-full xl:w-96">
                                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Search by user, event, or IP..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            
                            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button className="px-3 py-1.5 bg-white dark:bg-surface-dark shadow-sm rounded-md text-xs font-bold text-slate-900 dark:text-white">Last 24 Hours</button>
                                    <button className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">7 Days</button>
                                    <button className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">30 Days</button>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg text-orange-700 dark:text-orange-400 text-xs font-bold">
                                    <Icon name="warning" className="text-sm" /> Security
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg text-green-700 dark:text-green-400 text-xs font-bold">
                                    <Icon name="payments" className="text-sm" /> Financial
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-lg text-purple-700 dark:text-purple-400 text-xs font-bold">
                                    <Icon name="psychology" className="text-sm" /> AI Decision
                                </button>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px]">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">TIMESTAMP</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">EVENT TYPE</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">ACTOR / USER</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">EVENT DETAILS</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">METADATA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {/* Row 1 */}
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">10:42 AM</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
                                                    <Icon name="shield" className="text-xs" /> Security
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">A</div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Admin_01</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Modified Permission: Nurse Approval Limit</span>
                                                    <span className="text-xs text-slate-500">Changed from <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">0 to 50 RDM</span></span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700">192.168.1.42</span>
                                            </td>
                                        </tr>

                                        {/* Row 2 */}
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">10:38 AM</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/50">
                                                    <Icon name="payments" className="text-xs" /> Financial
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">S</div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">System_Auto_Mint</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Minted <span className="text-green-600">+500 Tokens</span></span>
                                                    <span className="text-xs text-slate-500">Trigger: Michael Chen Pledge Unlock</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 w-fit ml-auto">
                                                    <Icon name="smart_toy" className="text-xs" /> #8f2a
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Row 3 */}
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">09:15 AM</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                                    <Icon name="psychology" className="text-xs" /> AI Decision
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">AI</div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">AI_Bot_V2</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Deducted <span className="text-red-600">-50 Tokens (Remorse)</span></span>
                                                    <span className="text-xs text-slate-500">Reason: MRI Safety Protocol Violation</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-mono px-2 py-1 rounded border border-red-100 dark:border-red-900">Term: High</span>
                                            </td>
                                        </tr>

                                        {/* Row 4 */}
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">08:55 AM</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    <Icon name="login" className="text-xs" /> Access
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">D</div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Dr. Sarah L.</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">System Login via Biometric Scan</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700">192.168.1.12</span>
                                            </td>
                                        </tr>

                                        {/* Row 5 */}
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">08:42 AM</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/50">
                                                    <Icon name="payments" className="text-xs" /> Financial
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">S</div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">System_Auto_Mint</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Batch Disbursal: Night Shift Incentive</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700">#9a2b</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 flex justify-between items-center">
                                <span>Showing 5 of 1,248 Records</span>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-surface-dark hover:bg-slate-50">Prev</button>
                                    <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-surface-dark hover:bg-slate-50">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
