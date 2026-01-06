import React, { useState } from 'react';
import { UserRole } from '@/types';
import { Icon, Button } from '@/components/UI';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/api/authService';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface AuthProps {
  onLogin: (role: UserRole, userData?: any) => void;
}

// Demo user data matching backend in-memory store
const getDemoUser = (role: UserRole) => {
  switch (role) {
    case UserRole.STAFF:
      return {
        id: 'staff-1',
        name: 'Dr. Sarah Smith',
        email: 'doctor@rdmhealth.com',
        role: UserRole.STAFF,
      };
    case UserRole.PATIENT:
      return {
        id: '83921',
        name: 'Michael Chen',
        email: 'michael.chen@rdmhealth.patient',
        role: UserRole.PATIENT,
      };
    case UserRole.ADMIN:
      return {
        id: 'admin-1',
        name: 'RDM Health Hospital Admin',
        email: 'admin@rdmhealth.com',
        role: UserRole.ADMIN,
      };
    default:
      return {
        id: '83921',
        name: 'Michael Chen',
        email: 'michael.chen@rdmhealth.patient',
        role: UserRole.PATIENT,
      };
  }
};

export const AuthScreen: React.FC<AuthProps> = ({ onLogin }) => {
  const { login: authLogin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Safety timeout - reset loading after 30 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
      setError('Request timed out. Please try again.');
    }, 30000);

    try {
      if (isLogin) {
        // Login flow
        if (!selectedRole) {
          clearTimeout(safetyTimeout);
          setError('Please select a role before logging in.');
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Starting login with:', { email, selectedRole });

        // Direct login via authService - simpler than going through AuthContext
        const response = await authService.login({ email, password });

        console.log('[Auth] Login response:', response);

        clearTimeout(safetyTimeout);

        // Check response
        if (!response || !response.user) {
          setError('Login failed: No user data received.');
          setIsLoading(false);
          return;
        }

        if (!response.user.role) {
          setError('Login failed: User role not found.');
          setIsLoading(false);
          return;
        }

        // Compare roles
        const returnedRole = String(response.user.role).toUpperCase();
        const expectedRole = String(selectedRole).toUpperCase();

        console.log('[Auth] Role comparison:', { returnedRole, expectedRole });

        if (returnedRole === expectedRole) {
          // Store userId in sessionStorage immediately for dashboards to use
          if (response.user?.id) {
            try {
              sessionStorage.setItem('userId', response.user.id);
              if (response.user.role === 'STAFF') {
                sessionStorage.setItem('providerId', response.user.id);
              }
              if (response.user.role === 'ADMIN') {
                sessionStorage.setItem('adminId', response.user.id);
              }
              console.log('[Auth] ✅ Stored userId in sessionStorage:', response.user.id, 'Role:', response.user.role);
            } catch (e) {
              console.warn('[Auth] Failed to store userId:', e);
            }
          }
          
          // Success - call onLogin BEFORE resetting loading
          // (parent component will navigate away, so loading state won't matter)
          onLogin(selectedRole, response.user);
          setIsLoading(false);
        } else {
          setError(`Role mismatch. Account is ${returnedRole}, you selected ${expectedRole}.`);
          setIsLoading(false);
        }
      } else {
        // Register flow
        if (!name.trim()) {
          clearTimeout(safetyTimeout);
          setError('Name is required');
          setIsLoading(false);
          return;
        }

        if (!selectedRole) {
          clearTimeout(safetyTimeout);
          setError('Please select a role first');
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Starting registration...', { email, name, role: selectedRole });

        const response = await authService.register({
          email,
          password,
          name,
          role: selectedRole
        });

        clearTimeout(safetyTimeout);
        console.log('[Auth] Registration response:', response);

        if (response?.user) {
          onLogin(selectedRole, response.user);
          setIsLoading(false);
        } else {
          setError('Registration succeeded but no user data received');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('[Auth] Error:', err);
      setError(err?.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const authOptions = [
    {
      id: 1,
      role: UserRole.PATIENT,
      title: "I am a Client / Beneficiary / Patient",
      description: "Access personal health records, goals, and rewards.",
      icon: "person",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      id: 2,
      role: UserRole.STAFF,
      title: "I am a Health Professional",
      description: "Physical, Nurse, Radiologist, Pathologist, others",
      icon: "stethoscope",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 3,
      role: UserRole.PATIENT, // Mapping Care Giver to Patient for demo
      title: "I am a Care Giver",
      description: "Relative, Friend, Trained professionals, others",
      icon: "volunteer_activism",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
    },
    {
      id: 4,
      role: UserRole.ADMIN, // Clinical Provider -> Admin/Command Center
      title: "I am a Clinical Care Provider",
      description: "Hospital, Clinic, Hospice, others",
      icon: "local_hospital",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      id: 5,
      role: UserRole.STAFF, // Others -> Staff
      title: "Others",
      description: "Insurer, TPA, Health Regulator, others",
      icon: "domain",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    }
  ];

  // If role is selected, show verification form
  if (selectedRole) {
    const selectedOption = authOptions.find(opt => opt.role === selectedRole);

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Decorative Background Blob */}
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#D1FBF6] rounded-full blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="w-full max-w-md z-10">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
            >
              <Icon name="arrow_back" className="text-xl" />
              <span className="font-medium">Back to role selection</span>
            </button>

            {/* Selected Role Display */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`size-16 rounded-2xl ${selectedOption?.iconBg} ${selectedOption?.iconColor} flex items-center justify-center shrink-0`}>
                <Icon name={selectedOption?.icon || 'person'} className="text-3xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Verification Required</h2>
                <p className="text-sm text-slate-500">{selectedOption?.title}</p>
              </div>
            </div>

            {/* Toggle Login/Register */}
            <div className="flex gap-2 mb-6 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${isLogin
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${!isLogin
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required={!isLogin}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Icon name="sync" className="text-lg animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <Icon name="arrow_forward" className="text-lg" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Mode (for development) */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={() => {
                  if (!selectedRole) return;
                  
                  // Create demo user matching backend data
                  const demoUser = getDemoUser(selectedRole);
                  
                  // Set user in AuthContext via queryClient
                  queryClient.setQueryData(['auth', 'me'], demoUser);
                  
                  // Store IDs in sessionStorage (matching what real login does)
                  try {
                    sessionStorage.setItem('userId', demoUser.id);
                    if (demoUser.role === 'STAFF') {
                      sessionStorage.setItem('providerId', demoUser.id);
                    }
                    if (demoUser.role === 'ADMIN') {
                      sessionStorage.setItem('adminId', demoUser.id);
                    }
                    console.log('[Auth] ✅ Demo mode: Set user', demoUser);
                  } catch (e) {
                    console.warn('[Auth] Failed to store userId:', e);
                  }
                  
                  // Call onLogin with user data
                  onLogin(selectedRole, demoUser);
                }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Continue without authentication (Demo Mode)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role Selection Screen
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* Decorative Background Blob (Top Left) */}
      <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#D1FBF6] rounded-full blur-3xl opacity-80 pointer-events-none"></div>

      {/* Decorative Blob (Bottom Right - Subtle) */}
      <div className="absolute -bottom-[10%] -right-[5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">

        {/* Left Column: Text Content */}
        <div className="flex flex-col justify-center px-4 lg:px-12 order-2 lg:order-1">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 bg-cyan-400 rounded-lg flex items-center justify-center transform rotate-45 shadow-sm">
              <div className="size-5 border-2 border-white rounded-sm"></div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">RDM Health</h1>
          </div>

          <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
            Unified Health<br />Ecosystem
          </h2>

          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
            Seamlessly connecting patients, providers, and administrators in one secure platform. Select your role to get started.
          </p>
        </div>

        {/* Right Column: Role Selection Cards */}
        <div className="flex flex-col gap-5 px-4 order-1 lg:order-2">
          {authOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleRoleSelect(option.role)}
              className="bg-white rounded-2xl p-5 flex items-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-cyan-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group text-left w-full"
            >
              {/* Icon Box */}
              <div className={`size-14 rounded-2xl ${option.iconBg} ${option.iconColor} flex items-center justify-center shrink-0`}>
                <Icon name={option.icon} className="text-2xl" />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mb-0.5">
                  {option.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {option.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="shrink-0 text-slate-300 group-hover:text-cyan-500 transition-colors">
                <Icon name="arrow_forward" className="text-2xl" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
