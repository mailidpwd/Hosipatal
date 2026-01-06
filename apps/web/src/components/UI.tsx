import React, { useEffect, useState } from 'react';

// Fixed: Using React.FC to allow standard props like 'key' when the component is used in a list/map
export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className} select-none`}>{name}</span>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = "", 
  onClick,
  type = 'button'
}: { 
  children?: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'; 
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) => {
  const baseStyle = "px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary hover:bg-white hover:text-text-main text-text-main shadow-lg shadow-primary/20",
    secondary: "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5",
    outline: "border-2 border-primary text-primary hover:bg-primary/10",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
  };

  return (
    <button type={type} className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-[#2a3e3d] p-6 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'blue', className = "" }: { children?: React.ReactNode; color?: string; className?: string }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-red-700 border-red-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    primary: "bg-primary/10 text-primary-dark border-primary/20"
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[color] || colors.blue} ${className}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-surface-dark rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out] border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-text-main dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ProgressBar = ({ progress, className = "", colorClass = "bg-primary" }: { progress: number; className?: string; colorClass?: string }) => (
  <div className={`h-2.5 w-full bg-gray-100 rounded-full overflow-hidden ${className}`}>
    <div className={`h-full ${colorClass} rounded-full transition-all duration-500 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}></div>
  </div>
);

export const CircularProgress = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 10, 
  color = "#0df2df",
  children 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string;
  children?: React.ReactNode;
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="dark:stroke-slate-700" 
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {children ? children : (
                    <>
                        <span className="text-3xl font-black text-text-main dark:text-white">{percentage}%</span>
                        <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Adherence</span>
                    </>
                )}
            </div>
        </div>
    );
};

export const Toast = ({ 
  message, 
  type = 'info', 
  onClose 
}: { 
  message: string, 
  type: 'success' | 'info' | 'warning' | 'error',
  onClose: () => void 
}) => {
    const bgColors = {
        success: 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-white',
        info: 'bg-blue-50 dark:bg-blue-900/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-white',
        warning: 'bg-amber-50 dark:bg-amber-900/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-white',
        error: 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-800 dark:text-white',
    };
    const icons = {
        success: 'check_circle',
        info: 'info',
        warning: 'warning',
        error: 'error'
    };

    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm min-w-[300px] animate-[slideInRight_0.3s_ease-out] ${bgColors[type]}`}>
            <Icon name={icons[type]} className="text-xl" />
            <span className="text-sm font-bold flex-1">{message}</span>
            <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
                <Icon name="close" className="text-sm" />
            </button>
        </div>
    );
};

export const ToastContainer = ({ notifications, onDismiss }: { notifications: any[], onDismiss: (id: string) => void }) => {
    // Notifications completely disabled - never render anything
    return null;
    // if (notifications.length === 0) return null;
    // return (
    //     <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    //         {notifications.map((n) => (
    //             <div key={n.id} className="pointer-events-auto">
    //                 <Toast message={n.message} type={n.type} onClose={() => onDismiss(n.id)} />
    //             </div>
    //         ))}
    //     </div>
    // );
};

