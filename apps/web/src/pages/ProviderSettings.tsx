import React from 'react';
import { Icon } from '@/components/UI';

export const ProviderSettings = () => {
  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
        {/* Header Profile Section */}
        <div className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 px-6 py-8 sm:px-8 mb-8 -mx-6 sm:-mx-8 -mt-8">
            <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-700 shadow-md" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrmOqFjKUO4FY7_pEHrGX7I7Oha9c6NH8C2KaMWM1FPGVP4CjFB1nUuErLcxV7jdP6n-L3eZ8duSf9hLU5F8jmULlL2N6-srZejNgf3mJ96NrnLOdYibXWywxUMuCzUeUC1Nr8D1EiIv6yNOwzxiQCIoZeMzXa7roCIem9f8nYYi7P3RJs-eiWFodcZz_gboTxcV93YSehvQTXwlu7S0Rr7DgAN3ZiFG_VMmhZDJTg_OX1JxX1NWQn2lVOUwx3JjF9chnIvs8cf3rk")'}}></div>
                    <button className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm hover:text-primary transition-colors group-hover:scale-105">
                        <Icon name="photo_camera" className="text-lg" />
                    </button>
                </div>
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 gap-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
                    <p className="text-text-secondary dark:text-slate-400 font-medium">Manage your personal information and preferences</p>
                    <button className="text-primary-dark dark:text-primary text-sm font-bold mt-1 hover:underline">[ Change Photo ]</button>
                </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto w-full pb-20 px-6 lg:px-0">
            <form className="flex flex-col gap-8">
                {/* Core Identity */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <Icon name="badge" className="text-text-secondary dark:text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Core Identity</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm border border-blue-100 dark:border-blue-800/30">
                            <Icon name="info" className="text-blue-600 dark:text-blue-400 text-lg mt-0.5" />
                            <p>These fields are managed by Hospital Admin. Contact HR to request changes.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Staff ID</label>
                                <div className="relative">
                                    <input className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed select-none" disabled type="text" defaultValue="DOC-8821"/>
                                    <Icon name="lock" className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Role</label>
                                <div className="relative">
                                    <input className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed select-none" disabled type="text" defaultValue="Senior Cardiologist"/>
                                    <Icon name="lock" className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Department</label>
                                <div className="relative">
                                    <input className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed select-none" disabled type="text" defaultValue="Cardiology"/>
                                    <Icon name="lock" className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Details */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <Icon name="edit_square" className="text-text-secondary dark:text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editable Details</h3>
                    </div>
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                                <input className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400" type="text" defaultValue="Dr. Sarah Smith"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <input className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400" type="email" defaultValue="s.smith@rdmhealth.com"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                                <input className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400" type="tel" defaultValue="+1 555-0199"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <Icon name="notifications_active" className="text-text-secondary dark:text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                    </div>
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-0 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                        <div className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex flex-col gap-1 pr-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Receive Critical Patient Alerts via SMS</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Immediate notifications for High Risk status changes</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input defaultChecked className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex flex-col gap-1 pr-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Daily RDM Earning Report</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Receive a daily summary email of RDM accumulated</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input className="sr-only peer" type="checkbox" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
                    <button className="text-slate-500 hover:text-red-600 text-sm font-semibold transition-colors flex items-center gap-2 px-4 py-2">
                        <Icon name="lock_reset" className="text-lg" />
                        Reset Password
                    </button>
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-8 bg-primary hover:bg-primary-dark dark:hover:bg-primary/90 text-slate-900 text-sm font-bold rounded-lg shadow-sm shadow-primary/20 transition-all active:scale-95" type="button">
                        <Icon name="save" className="text-lg" />
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};