import React, { useState } from 'react';
import { Page, UserRole, type NavItem } from '@/types';
import { Icon } from '@/components/UI';

// Shared Navigation Configuration
const patientNav: NavItem[] = [
  { label: 'Dashboard', mobileLabel: 'Home', icon: 'dashboard', page: Page.P_DASHBOARD },
  { label: 'My Care Team', mobileLabel: 'Team', icon: 'groups', page: Page.P_CARE_TEAM },
  { label: 'Rewards Marketplace', mobileLabel: 'Rewards', icon: 'storefront', page: Page.P_MARKETPLACE },
  { label: 'Vitals & Reports', mobileLabel: 'Vitals', icon: 'ssid_chart', page: Page.P_VITALS },
  { label: 'Prescriptions', mobileLabel: 'Meds', icon: 'pill', page: Page.P_MEDS },
  { label: 'Set Goals', mobileLabel: 'Goals', icon: 'flag', page: Page.P_GOALS },
  { label: 'My Routine', mobileLabel: 'Routine', icon: 'checklist', page: Page.P_ROUTINE },
  { label: 'Earn RDM', mobileLabel: 'Earn', icon: 'school', page: Page.P_EARN },
];

const staffNav: NavItem[] = [
  { label: 'Dashboard', mobileLabel: 'Home', icon: 'dashboard', page: Page.S_DASHBOARD },
  { label: 'My Patients', mobileLabel: 'Patients', icon: 'group', page: Page.S_PATIENTS },
  { label: 'Rewards Marketplace', mobileLabel: 'Rewards', icon: 'storefront', page: Page.S_MARKETPLACE },
  { label: 'NLP Engine', mobileLabel: 'NLP', icon: 'prescriptions', page: Page.S_CLAIMS_NLP },
  { label: 'Earnings', mobileLabel: 'Earn', icon: 'payments', page: Page.S_EARNINGS },
  { label: 'Settings', mobileLabel: 'Settings', icon: 'settings', page: Page.S_SETTINGS },
];

const adminNav: NavItem[] = [
  { label: 'Executive Board', mobileLabel: 'Board', icon: 'grid_view', page: Page.S_COMMAND_CENTER },
  { label: 'Verifications', mobileLabel: 'Verify', icon: 'assignment_ind', page: Page.A_VERIFICATIONS, badge: '12' },
  { label: 'Staff Leaderboard', mobileLabel: 'Leaders', icon: 'trophy', page: Page.A_LEADERBOARD },
  { label: 'Token Economy', mobileLabel: 'Tokens', icon: 'monetization_on', page: Page.A_TOKEN_ECONOMY },
  { label: 'RDM Budget Utilization', mobileLabel: 'Budget', icon: 'analytics', page: Page.A_DEPT_ANALYTICS },
  { label: 'Settings', mobileLabel: 'Settings', icon: 'settings', page: Page.A_SETTINGS },
];

interface SidebarProps {
  role: UserRole;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, currentPage, onNavigate, onLogout }) => {
  const navItems = role === UserRole.PATIENT ? patientNav : role === UserRole.ADMIN ? adminNav : staffNav;
  
  const userImg = role === UserRole.PATIENT 
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhqlx4DFL-LqAxS5DmVpNRY3SMp9e7T1rygJ_Pw9Sz65xhi7tLtWZKt9_sTaviLL4EHAFcbkjVIK5vi-DDk5Ds5H3roB9lpYKn-DMIyjUuKRW8tKS6cLgX6YhjbRaQdONxXYaO_1ab5I0uFMQi4hsMNDpxEW-Xy6F4XBnaTvvmItd3LdsSSEXmSk86ttvzjHaot-6WdaaMRcS6NyO5Pw8jpm0iZ2v5h4KLjm5rpICqinprZDiyYN-wM8OUgAesC2jcY3NYw6Rujfma'
    : role === UserRole.ADMIN
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBORfUfDE9SLibixm90dj7RdkXwuPgYFuO4Bay4WwouR-YMuNTENIiDD1tIFtujGy05H7VHTMxcrgzrGMlBvzRdVRdR7L8n39a8HyCC_pgK-F4VWIeT7VLdH7zfqj9nayARegrXSl9wn1Cx7IV5DVMdrl0cLmFV7-MUTubtFlBnQIq39XwVX8yEDUV-UbcPYWNPIr9yO3_BziLfe6J3jy-ZJElkCiKYbAJPuIR2B5j6c-mbfqNRo6WUBRgSIxP5yLSqDvVUK5KFzHv7'
    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrmOqFjKUO4FY7_pEHrGX7I7Oha9c6NH8C2KaMWM1FPGVP4CjFB1nUuErLcxV7jdP6n-L3eZ8duSf9hLU5F8jmULlL2N6-srZejNgf3mJ96NrnLOdYibXWywxUMuCzUeUC1Nr8D1EiIv6yNOwzxiQCIoZeMzXa7roCIem9f8nYYi7P3RJs-eiWFodcZz_gboTxcV93YSehvQTXwlu7S0Rr7DgAN3ZiFG_VMmhZDJTg_OX1JxX1NWQn2lVOUwx3JjF9chnIvs8cf3rk';

  const userName = role === UserRole.PATIENT ? 'Michael' : role === UserRole.ADMIN ? 'Dr. Chief Admin' : 'Dr. Sarah Smith';
  const subText = role === UserRole.PATIENT ? 'ID #8492' : role === UserRole.ADMIN ? 'Super Admin' : 'Cardiology Dept.';

  return (
    <aside className="w-64 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-[#2a3e3d] flex flex-col h-full z-30 hidden lg:flex shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 relative">
          <Icon name="local_hospital" className="text-[28px]" />
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-surface-dark"></span>
          </div>
        </div>
        <div>
            <h1 className="text-lg font-bold leading-tight text-text-main dark:text-white flex items-center gap-1.5">
                RDM Health
                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Live</span>
            </h1>
            <p className="text-text-secondary text-xs font-medium">{role === UserRole.ADMIN ? 'Command Center' : 'Portal'}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2 custom-scrollbar">
        {navItems.slice(0, role === UserRole.PATIENT ? 8 : undefined).map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all group ${
              currentPage === item.page
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-bold shadow-sm ring-1 ring-teal-100 dark:ring-teal-800'
                : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 hover:text-text-main dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
                <Icon name={item.icon} className={`text-xl shrink-0 ${currentPage === item.page ? "font-bold" : "group-hover:text-teal-600 transition-colors"}`} />
                <span className="text-left leading-tight text-sm">{item.label}</span>
            </div>
            {item.badge && (
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-[#2a3e3d]">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group relative">
          <div className="size-10 rounded-full bg-cover bg-center border border-teal-600/30 group-hover:border-teal-600 transition-colors" style={{ backgroundImage: `url('${userImg}')` }}></div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-main dark:text-white truncate">{userName}</p>
            <p className="text-xs text-text-secondary truncate">{subText}</p>
          </div>
          <button onClick={onLogout} className="absolute right-2 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors" title="Logout">
            <Icon name="logout" className="text-lg" />
          </button>
        </div>
      </div>
    </aside>
  );
};

const MobileBottomNav = ({ role, currentPage, onNavigate }: { role: UserRole, currentPage: Page, onNavigate: (page: Page) => void }) => {
    // Specifically defined nav items for Mobile Patient view to match requirements
    const patientMobileItems = [
        patientNav.find(i => i.page === Page.P_DASHBOARD)!,
        patientNav.find(i => i.page === Page.P_CARE_TEAM)!,
        patientNav.find(i => i.page === Page.P_MARKETPLACE)!,
        patientNav.find(i => i.page === Page.P_VITALS)!,
        patientNav.find(i => i.page === Page.P_MEDS)!,
        patientNav.find(i => i.page === Page.P_EARN)!
    ];

    const navItems = role === UserRole.PATIENT ? patientMobileItems : role === UserRole.ADMIN ? adminNav.slice(0,5) : staffNav.slice(0,5);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            {/* Quick Action FAB & Menu - ONLY SHOW ON MOBILE (lg:hidden) */}
            {role === UserRole.PATIENT && (
                <div className="lg:hidden pointer-events-none fixed inset-0 z-50 overflow-hidden">
                    {/* Menu Overlay - only blocks clicks when menu is open */}
                    <div 
                        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setIsMenuOpen(false)}
                    />
                    
                    {/* Menu Items */}
                    <div className={`absolute bottom-[90px] right-4 flex flex-col gap-4 items-end transition-all duration-300 ${isMenuOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                        <button 
                            onClick={() => { onNavigate(Page.P_GOALS); setIsMenuOpen(false); }}
                            className="flex items-center gap-3 group"
                        >
                            <span className="bg-white dark:bg-surface-dark px-4 py-2 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">Set Goals</span>
                            <div className="size-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/40 ring-4 ring-white dark:ring-surface-dark">
                                <Icon name="flag" className="text-2xl" />
                            </div>
                        </button>
                        <button 
                            onClick={() => { onNavigate(Page.P_ROUTINE); setIsMenuOpen(false); }}
                            className="flex items-center gap-3 group"
                        >
                            <span className="bg-white dark:bg-surface-dark px-4 py-2 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">My Routine</span>
                            <div className="size-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 ring-4 ring-white dark:ring-surface-dark">
                                <Icon name="checklist" className="text-2xl" />
                            </div>
                        </button>
                    </div>

                    {/* FAB Trigger - Positioned fixed to screen, above bottom bar */}
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`absolute bottom-24 right-4 size-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl shadow-slate-900/40 dark:shadow-white/20 flex items-center justify-center pointer-events-auto transition-all duration-300 ${isMenuOpen ? 'rotate-45 bg-slate-800' : 'active:scale-95 hover:scale-105'}`}
                        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
                    >
                        <Icon name="add" className="text-3xl" />
                    </button>
                </div>
            )}

            {/* Bottom Bar - Mobile Only */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-gray-200 dark:border-[#2a3e3d] flex justify-between items-end px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,20px)+8px)] z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] transition-all overflow-x-auto no-scrollbar">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => onNavigate(item.page)}
                        className={`flex flex-col items-center justify-center min-w-[64px] flex-1 transition-all duration-200 group active:scale-95 ${
                            currentPage === item.page
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        <div className={`p-1 rounded-xl mb-0.5 transition-all ${currentPage === item.page ? '-translate-y-1' : ''}`}>
                            <Icon name={item.icon} className={`text-[24px] ${currentPage === item.page ? 'fill-1' : ''}`} />
                        </div>
                        <span className={`text-[10px] font-bold truncate max-w-[64px] tracking-tight ${currentPage === item.page ? 'opacity-100' : 'opacity-80'}`}>{item.mobileLabel || item.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
}

export const Layout = ({ children, role, currentPage, onNavigate, onLogout }: any) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-background-dark font-sans text-text-main">
      <Sidebar role={role} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <main className="flex-1 overflow-y-auto scroll-smooth pb-32 lg:pb-0 relative">
            <div className="w-full h-full">
                {children}
            </div>
        </main>
        <MobileBottomNav role={role} currentPage={currentPage} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

