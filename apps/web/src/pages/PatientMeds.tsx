
import React, { useState, useEffect } from 'react';
import { Card, Icon, Button, Badge, ProgressBar, Modal, CircularProgress } from '@/components/UI';

export const PatientMeds = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [assetType, setAssetType] = useState<'prescribed' | 'supplement'>('prescribed');
    
    // Date state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    
    // Medication taken state (resets on refresh, session-only)
    const [medicationsTaken, setMedicationsTaken] = useState<Record<string, boolean>>({});
    
    // Precision window timer state
    const [precisionWindowTime, setPrecisionWindowTime] = useState(0);
    const [isPrecisionWindowOpen, setIsPrecisionWindowOpen] = useState(false);

    // Format date for display
    const formatDate = (date: Date) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = days[date.getDay()];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const isToday = date.toDateString() === new Date().toDateString();
        return {
            dayName,
            display: isToday ? `Today, ${month} ${day}` : `${dayName}, ${month} ${day}`,
            isToday
        };
    };

    // Navigate dates
    const navigateDate = (direction: 'prev' | 'next') => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    // Handle medication taken
    const handleTakeMedication = (medId: string) => {
        setMedicationsTaken(prev => ({
            ...prev,
            [medId]: true
        }));
    };

    // Precision window timer (updates every second)
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const currentHour = now.getHours();
            
            // Check if within any medication window (morning 6-10, evening 18-22)
            const isMorningWindow = currentHour >= 6 && currentHour < 10;
            const isEveningWindow = currentHour >= 18 && currentHour < 22;
            
            if (isMorningWindow || isEveningWindow) {
                setIsPrecisionWindowOpen(true);
                let windowEnd: Date;
                
                if (isMorningWindow) {
                    windowEnd = new Date(now);
                    windowEnd.setHours(10, 0, 0, 0);
                } else {
                    windowEnd = new Date(now);
                    windowEnd.setHours(22, 0, 0, 0);
                }
                
                const diff = Math.floor((windowEnd.getTime() - now.getTime()) / 1000);
                setPrecisionWindowTime(Math.max(0, diff));
            } else {
                setIsPrecisionWindowOpen(false);
                setPrecisionWindowTime(0);
            }
        };

        updateTimer(); // Initial update
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    // Format timer display
    const formatTimer = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const dateInfo = formatDate(selectedDate);
    const dateKey = selectedDate.toDateString();
    const lisinoprilTaken = medicationsTaken[`lisinopril-${dateKey}`];

    // Calendar picker component
    const CalendarPicker = () => {
        const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
        
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        const days: (Date | null)[] = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const navigateMonth = (direction: 'prev' | 'next') => {
            setCurrentMonth(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                return newDate;
            });
        };

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCalendar(false)}></div>
                <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button 
                            onClick={() => navigateMonth('prev')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            aria-label="Previous month"
                        >
                            <Icon name="chevron_left" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <button 
                            onClick={() => navigateMonth('next')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            aria-label="Next month"
                        >
                            <Icon name="chevron_right" />
                        </button>
                    </div>
                    
                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="text-center text-xs font-bold text-slate-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, i) => {
                            if (!date) {
                                return <div key={i} className="p-2"></div>;
                            }
                            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            const isToday = date.toDateString() === new Date().toDateString();
                            
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (isCurrentMonth) {
                                            setSelectedDate(date);
                                            setShowCalendar(false);
                                        }
                                    }}
                                    disabled={!isCurrentMonth}
                                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                        !isCurrentMonth
                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-cyan-500 text-white'
                                            : isToday
                                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button
                        onClick={() => setShowCalendar(false)}
                        className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col relative h-full pb-24 md:pb-12">
            {/* Header */}
            <header className="w-full pb-6 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Medication Schedule</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base mt-1">Track adherence, request refills, and earn RDM.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl font-bold text-xs md:text-sm transition-colors group shadow-sm"
                    >
                        <Icon name="add_a_photo" className="group-hover:scale-110 transition-transform text-lg" />
                        Add New
                    </button>
                     <button 
                        className="relative size-10 md:size-12 flex items-center justify-center bg-white dark:bg-surface-dark rounded-full shadow-sm text-slate-400 hover:text-cyan-600 transition-colors border border-slate-200 dark:border-slate-700"
                        title="Notifications"
                        aria-label="View notifications"
                    >
                        <Icon name="notifications" className="text-xl" />
                        <span className="absolute top-2.5 right-3 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
                {/* Left Column: Timeline */}
                <div className="xl:col-span-2 flex flex-col gap-6 order-2 xl:order-1">
                    <div className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col min-h-[500px]">
                        
                        {/* Calendar & Precision Window */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => navigateDate('prev')}
                                    className="size-9 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors"
                                    title="Previous day"
                                    aria-label="Go to previous day"
                                >
                                    <Icon name="chevron_left" />
                                </button>
                                <button 
                                    onClick={() => setShowCalendar(true)}
                                    className="px-4 text-center min-w-[140px] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                >
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">{dateInfo.dayName}</span>
                                    <span className="text-base font-bold text-slate-900 dark:text-white">{dateInfo.display}</span>
                                </button>
                                <button 
                                    onClick={() => navigateDate('next')}
                                    className="size-9 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors"
                                    title="Next day"
                                    aria-label="Go to next day"
                                >
                                    <Icon name="chevron_right" />
                                </button>
                            </div>
                            
                            {isPrecisionWindowOpen && (
                                <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-50/50 to-white dark:from-yellow-900/10 dark:to-surface-dark px-5 py-3 rounded-2xl border border-yellow-400/30 shadow-sm relative overflow-hidden group min-w-[280px]">
                                    <div className="relative flex h-3 w-3 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400 shadow-lg shadow-yellow-400/50"></span>
                                    </div>
                                    <div className="z-10 flex flex-col items-start w-full">
                                        <div className="flex justify-between w-full items-center mb-0.5">
                                            <p className="text-[9px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                                                Precision Window Open
                                            </p>
                                        </div>
                                        <div className="text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-white leading-none tracking-tight tabular-nums mb-0.5">
                                            {formatTimer(precisionWindowTime)}
                                        </div>
                                        <p className="text-[10px] font-medium text-yellow-600 dark:text-yellow-500 w-full">+2 RDM Speed Bonus applied.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 relative pl-2 lg:pl-0">
                            <div className="absolute left-[88px] top-3 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>
                            <div className="space-y-8">
                                
                                {/* Morning */}
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 relative group">
                                    <div className="w-auto sm:w-24 pt-1.5 sm:text-right shrink-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Morning</p>
                                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">06:00 - 10:00</p>
                                    </div>
                                    <div className="absolute left-[88px] top-2 -ml-[6px] z-10 hidden sm:block">
                                        <div className="size-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-surface-dark"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white dark:bg-surface-dark border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-emerald-300 transition-colors">
                                            <div className="size-14 rounded-xl bg-slate-50 dark:bg-white/5 overflow-hidden p-0.5 shrink-0 border border-slate-100 dark:border-white/10">
                                                <img alt="Metformin" className="w-full h-full object-cover rounded-lg mix-blend-multiply dark:mix-blend-normal opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjSgo7rooARB9TGrfFucEcxupEy-xA9MoS8mkAPuKBuzij94mRr043sRhFtmCM5kURJnEUZWQ-5iLLhjwzP9V0eoKQR1dfbmH6Tyxgj4WwQzAjqI690-PcGsRw82rqwW5c8LJ4Og9qQjsXejOicckwYWE5-XY8SpL2tLF0_ZogHPV-ybbhh3KiQoVvyVRlgvK_nNfnkucHimdU3K-9rxA7_hEhXT2UnUV85k0656IVw3i-klphrhVJ46S6wR_MxJ_Q3ZlLuAk_XNX-"/>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Metformin <span className="text-slate-500 font-medium text-xs ml-1">500mg</span></h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Icon name="rice_bowl" className="text-emerald-600 dark:text-emerald-400 text-sm" />
                                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">With Food</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                                                <div className="flex items-center gap-1">
                                                    <Icon name="check_circle" className="text-emerald-600 dark:text-emerald-400 text-base" />
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">+7 RDM</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Afternoon */}
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 relative group">
                                    <div className="w-auto sm:w-24 pt-1.5 sm:text-right shrink-0">
                                        <p className="text-sm font-bold text-slate-400">Afternoon</p>
                                        <p className="text-[10px] text-slate-400/60 font-medium tracking-wide">12:00 - 16:00</p>
                                    </div>
                                    <div className="absolute left-[88px] top-2 -ml-[6px] z-10 hidden sm:block">
                                        <div className="size-3.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-surface-dark"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-center min-h-[70px]">
                                            <p className="text-xs text-slate-400 font-medium">No medications scheduled.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Evening */}
                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 relative group">
                                    <div className="w-auto sm:w-24 pt-1.5 sm:text-right shrink-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Evening</p>
                                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">18:00 - 22:00</p>
                                    </div>
                                    <div className="absolute left-[88px] top-2 -ml-[6px] z-10 hidden sm:block">
                                        <div className="size-3.5 rounded-full bg-orange-500 ring-4 ring-white dark:ring-surface-dark shadow-[0_0_10px_rgba(249,115,22,0.4)]"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white dark:bg-surface-dark border border-orange-200 dark:border-orange-900/40 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden transition-transform hover:scale-[1.01] duration-300">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
                                            <div className="size-14 rounded-xl bg-slate-50 dark:bg-white/5 overflow-hidden p-0.5 shrink-0 ml-1 border border-slate-100 dark:border-white/10">
                                                <img alt="Lisinopril" className="w-full h-full object-cover rounded-lg mix-blend-multiply dark:mix-blend-normal opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3A51MpNnAQDrCLUjNPPyh9A58ybC4jVU5NOgOTMR2bRL6ufP0ENDRSezjmjeEzMwJ6-i1iPxggW9PhOUx-amarS_jgfb1vvxQFd1fk-QHy9pgefFaIvYY2XCNd5wKt43hAJwl5E3It021HW8GZKzIAoSf2hXlVUg7ScC1UllQI_6NCvN4cUrUO09UPOK8x8EMSm9T9FkqCMIbYwZJpWoAwsLTEcGsjC87eHibxhCubadtjns4Ar1DIFfD7THTGhePFFZJ-n9Xw2ge"/>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Lisinopril <span className="text-slate-500 font-medium text-xs ml-1">10mg</span></h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Icon name="no_food" className="text-orange-600 dark:text-orange-400 text-sm" />
                                                    <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase">Empty Stomach</span>
                                                </div>
                                            </div>
                                            {lisinoprilTaken ? (
                                                <div className="flex flex-col items-end gap-0.5 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                                                    <div className="flex items-center gap-1">
                                                        <Icon name="check_circle" className="text-emerald-600 dark:text-emerald-400 text-base" />
                                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">+5 RDM</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleTakeMedication(`lisinopril-${dateKey}`)}
                                                    className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-900 px-5 py-2.5 rounded-xl shadow-md shadow-cyan-400/20 transition-all hover:shadow-cyan-400/30 active:scale-95 group/btn border border-cyan-500/20"
                                                >
                                                    <Icon name="check" className="text-lg group-hover/btn:animate-pulse" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Take (+5 RDM)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Adherence & Meds */}
                <div className="xl:col-span-1 flex flex-col gap-6 order-1 xl:order-2">
                    {/* Adherence Engine */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adherence Engine</h3>
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">Gold Tier</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-4 relative">
                            <div className="relative size-40 rounded-full flex items-center justify-center bg-[conic-gradient(#0df2df_0%,#0df2df_92%,#e2e8f0_92%,#e2e8f0_100%)] shadow-[0_0_20px_rgba(13,242,223,0.15)]">
                                <div className="absolute inset-3 bg-white dark:bg-surface-dark rounded-full flex flex-col items-center justify-center z-10">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">92%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adherence</span>
                                </div>
                            </div>
                            <div className="mt-6 w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mb-3 text-center">
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400 block mb-0.5">x1.5 Multiplier Active</span>
                                <p className="text-[10px] text-slate-500 leading-tight">Earning 50% more RDM per pill.</p>
                            </div>
                            <div className="flex w-full gap-3">
                                <div className="flex-1 flex items-center justify-center gap-2 bg-orange-50 dark:bg-orange-900/10 px-3 py-2 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                    <span className="text-lg">🔥</span>
                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Streak: 12</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center gap-2 bg-cyan-50/50 border border-cyan-100 rounded-xl px-3 py-2">
                                    <div className="size-5 rounded-full bg-cyan-400 flex items-center justify-center text-white text-[10px]">
                                        <Icon name="token" className="text-xs" />
                                    </div>
                                    <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400">+200 RDM</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Medications List */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 flex-1">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Current Medications</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Med 1 */}
                            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-cyan-400 transition-all group shadow-sm">
                                <div className="flex gap-4">
                                    <div className="size-14 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                                        <img alt="White Oval Pill" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjSgo7rooARB9TGrfFucEcxupEy-xA9MoS8mkAPuKBuzij94mRr043sRhFtmCM5kURJnEUZWQ-5iLLhjwzP9V0eoKQR1dfbmH6Tyxgj4WwQzAjqI690-PcGsRw82rqwW5c8LJ4Og9qQjsXejOicckwYWE5-XY8SpL2tLF0_ZogHPV-ybbhh3KiQoVvyVRlgvK_nNfnkucHimdU3K-9rxA7_hEhXT2UnUV85k0656IVw3i-klphrhVJ46S6wR_MxJ_Q3ZlLuAk_XNX-"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Metformin</h4>
                                        <p className="text-xs text-slate-500 mb-1">500mg • Oval, White</p>
                                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                            <Icon name="restaurant" className="text-xs text-slate-400" />
                                            Take with dinner
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                        2 Refills
                                    </span>
                                    <button className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline">View Details</button>
                                </div>
                            </div>

                            {/* Med 2 */}
                            <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300 transition-all group shadow-sm relative">
                                <div className="flex gap-4 mb-3">
                                    <div className="size-14 shrink-0 rounded-xl overflow-hidden border border-red-100 dark:border-red-900/30">
                                        <img alt="Peach Round Pill" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3A51MpNnAQDrCLUjNPPyh9A58ybC4jVU5NOgOTMR2bRL6ufP0ENDRSezjmjeEzMwJ6-i1iPxggW9PhOUx-amarS_jgfb1vvxQFd1fk-QHy9pgefFaIvYY2XCNd5wKt43hAJwl5E3It021HW8GZKzIAoSf2hXlVUg7ScC1UllQI_6NCvN4cUrUO09UPOK8x8EMSm9T9FkqCMIbYwZJpWoAwsLTEcGsjC87eHibxhCubadtjns4Ar1DIFfD7THTGhePFFZJ-n9Xw2ge"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Lisinopril</h4>
                                        <p className="text-xs text-slate-500 mb-1">10mg • Round, Peach</p>
                                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                            <Icon name="wb_sunny" className="text-xs text-slate-400" />
                                            Take in morning
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                                    <Icon name="bolt" className="text-sm" />
                                    0 Refills - Request Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Picker Modal */}
            {showCalendar && <CalendarPicker />}

            {/* Register New Medication Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark rounded-[20px] shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark z-10 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Register New Medication</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-sm mt-0.5">Valid prescriptions earn 5x more RDM than supplements.</p>
                            </div>
                            <button 
                                onClick={() => setShowAddModal(false)} 
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                                title="Close modal"
                                aria-label="Close registration modal"
                            >
                                <Icon name="close" className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 space-y-8">
                            {/* Step 1 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">1</span>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">SELECT ASSET CLASS</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => setAssetType('prescribed')}
                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${assetType === 'prescribed' ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <Icon name="prescriptions" className="text-2xl text-purple-600 dark:text-purple-400" />
                                            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${assetType === 'prescribed' ? 'border-cyan-500' : 'border-slate-300'}`}>
                                                {assetType === 'prescribed' && <div className="size-2.5 rounded-full bg-cyan-500"></div>}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Prescribed Medication</h4>
                                        <span className="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-200 dark:border-yellow-800 mb-2">
                                            🏆 YIELD: 5 RDM/DOSE
                                        </span>
                                        <p className="text-[10px] text-slate-500">Requirement: Requires Photo Proof.</p>
                                    </div>

                                    <div 
                                        onClick={() => setAssetType('supplement')}
                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${assetType === 'supplement' ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <Icon name="spa" className="text-2xl text-green-600 dark:text-green-400" />
                                            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${assetType === 'supplement' ? 'border-cyan-500' : 'border-slate-300'}`}>
                                                {assetType === 'supplement' && <div className="size-2.5 rounded-full bg-cyan-500"></div>}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Supplement / OTC</h4>
                                        <span className="inline-block bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded mb-2">
                                            🕸️ YIELD: 1 RDM/DOSE
                                        </span>
                                        <p className="text-[10px] text-slate-500">Requirement: Self-Reported.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Step 2 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">2</span>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">INPUT & VERIFICATION</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <Icon name="center_focus_weak" className="text-3xl mb-2 group-hover:text-cyan-500 transition-colors" />
                                        <span className="text-sm font-bold group-hover:text-cyan-600">Scan Bottle Label (Auto-Fill)</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Drug Name</label>
                                            <input type="text" placeholder="e.g. Lipitor" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:border-cyan-500" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Dosage</label>
                                            <input type="text" placeholder="e.g. 500 mg" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:border-cyan-500" />
                                        </div>
                                    </div>

                                    {/* Upload Progress */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Upload Prescription / Bottle Label</p>
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                <Icon name="description" className="text-base" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                    <span>rx_photo_scan.jpg</span>
                                                    <span>100%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-400 w-full"></div>
                                                </div>
                                            </div>
                                            <div className="size-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                                <Icon name="check" className="text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-3 rounded-lg flex items-center gap-2">
                                        <Icon name="hourglass_empty" className="text-orange-500 text-sm" />
                                        <span className="text-xs font-bold text-orange-700 dark:text-orange-400">Status: Pending Verification by Dr. Smith</span>
                                    </div>
                                </div>
                            </section>

                            {/* Step 3 */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="size-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">3</span>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">SCHEDULE & INVENTORY</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="med-frequency" className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Frequency</label>
                                        <div className="relative">
                                            <select 
                                                id="med-frequency"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-sm font-medium outline-none focus:border-cyan-500 appearance-none"
                                                aria-label="Medication frequency"
                                            >
                                                <option>1x Daily</option>
                                                <option>2x Daily</option>
                                            </select>
                                            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="med-inventory" className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Inventory Tracking</label>
                                        <div className="relative">
                                            <select 
                                                id="med-inventory"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2.5 text-sm font-medium outline-none focus:border-cyan-500 appearance-none"
                                                aria-label="Inventory tracking preference"
                                            >
                                                <option>Track Refills</option>
                                                <option>Don't Track</option>
                                            </select>
                                            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark mt-auto shrink-0">
                            <button className="w-full py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-500 hover:to-emerald-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-2">
                                <Icon name="verified" className="text-xl" />
                                Submit for Verification & Start Earning
                            </button>
                            <p className="text-center text-[10px] font-medium text-slate-400">Medication will be marked 'Pending' until verified.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

