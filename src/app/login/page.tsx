"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, Mail, Loader2, Sparkles, Terminal } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Input Zod validator schema matching backend checks
const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'SuperAdmin': return '/admin/global';
    case 'Admin': return '/admin/dashboard';
    case 'Student': return '/student/dashboard';
    case 'Warden': return '/warden/hostel';
    case 'Security': return '/gate';
    case 'Driver': return '/transit';
    case 'Librarian': return '/librarian/library';
    case 'Director': return '/director';
    case 'Parent': return '/parent/dashboard';
    case 'Teacher': return '/teacher/timetable';
    case 'HOD': return '/hod/dashboard';
    case 'Vendor': return '/vendor/dashboard';
    default: return '/dashboard';
  }
};

const getMockProfile = (email: string, role: string) => {
  switch (role) {
    case 'Student':
      return {
        id: 'b0000000-0000-0000-0000-000000000006',
        student_id: 'c0000000-0000-0000-0000-000000000006',
        room_id: 'e4000000-0000-0000-0000-000000000001',
        name: 'Khushal Gehlot (Sandbox)',
        email: email,
        role: 'Student',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Admin':
      return {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'Dr. K. R. Sharma (Sandbox)',
        email: email,
        role: 'Admin',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Warden':
      return {
        id: 'b0000000-0000-0000-0000-000000000012',
        name: 'Jaswant Singh (Sandbox)',
        email: email,
        role: 'Warden',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Security':
      return {
        id: 'b0000000-0000-0000-0000-000000000015',
        name: 'Guard Sher Singh (Sandbox)',
        email: email,
        role: 'Security',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Driver':
      return {
        id: 'b0000000-0000-0000-0000-000000000013',
        name: 'Rajesh Kumar (Sandbox)',
        email: email,
        role: 'Driver',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Staff':
      return {
        id: 'b0000000-0000-0000-0000-000000000003',
        name: 'Prof. Alok Vyas (Sandbox)',
        email: email,
        role: 'Staff',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Parent':
      return {
        id: 'b0000000-0000-0000-0000-000000000011',
        name: 'Mr. Madanlal Gehlot (Sandbox)',
        email: email,
        role: 'Parent',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Vendor':
      return {
        id: 'b0000000-0000-0000-0000-000000000014',
        name: 'Ramesh Canteen Wale (Sandbox)',
        email: email,
        role: 'Vendor',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Teacher':
      return {
        id: 'b0000000-0000-0000-0000-000000000016',
        name: 'Prof. Neha Gupta (Sandbox)',
        email: email,
        role: 'Teacher',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'HOD':
      return {
        id: 'b0000000-0000-0000-0000-000000000017',
        name: 'Dr. Vikram Mehta (Sandbox)',
        email: email,
        role: 'HOD',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Librarian':
      return {
        id: 'b0000000-0000-0000-0000-000000000018',
        name: 'Sunita Devi (Sandbox)',
        email: email,
        role: 'Librarian',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'Director':
      return {
        id: 'b0000000-0000-0000-0000-000000000019',
        name: 'Dr. K. R. Sharma (Sandbox)',
        email: email,
        role: 'Director',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
    case 'SuperAdmin':
      return {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Siddharth Singh (Sandbox)',
        email: email,
        role: 'SuperAdmin',
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'Enterprise',
        institute_type: 'college'
      };
    default:
      return {
        id: 'b0000000-0000-0000-0000-000000009999',
        name: 'External Guest (Sandbox)',
        email: email,
        role: role,
        institution_id: 'a0000000-0000-0000-0000-000000000001',
        institution_name: 'SIN Institute of Engineering & Technology (SIET)',
        plan_tier: 'University',
        institute_type: 'college'
      };
  }
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [useOfflineBypass, setUseOfflineBypass] = useState(true);

  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const handleForgotPasswordSubmit = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError('Please enter a valid institutional email address');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) {
        throw new Error(error.message);
      }
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('iris_client_device_id') || '' : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?device_id=${encodeURIComponent(deviceId)}`
        }
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred initiating Google sign-in.';
      setSubmitError(errorMessage);
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setIsCheckingSession(false);
    }, 2000);

    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('iris_client_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('iris_client_device_id', id);
      }

      // Parse URL parameters to check for OAuth callback errors
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'user_not_found') {
        setSubmitError('User not found. Contact your administrator.');
      } else if (err) {
        setSubmitError(decodeURIComponent(err));
      }

      // Check if a session already exists to auto-redirect
      const token = localStorage.getItem('iris_jwt_token');
      const savedProfile = localStorage.getItem('iris_user_profile');
      if (token && savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed && parsed.role) {
            window.location.href = getRedirectPath(parsed.role);
            return;
          }
        } catch (e) {
          console.error('Error parsing session on mount:', e);
        }
      }
    }

    if (active) setIsCheckingSession(false);
    clearTimeout(timeout);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  if (isCheckingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0D0A1A]">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
          <p className="text-slate-400 text-sm">Loading session...</p>
        </div>
      </main>
    );
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('iris_client_device_id') : '';
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(deviceId ? { 'X-Client-Device-ID': deviceId } : {})
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid credentials or login failed');
      }

      // Store jwt and profile
      localStorage.setItem('iris_jwt_token', result.token);
      localStorage.setItem('iris_user_profile', JSON.stringify(result.profile));

      // Redirect client dashboard based on claims role
      window.location.href = getRedirectPath(result.profile.role);

    } catch (err: any) {
      console.warn('Backend login request failed. Checking local sandbox credentials fallback...');
      
      // Automatic client-side bypass for sandbox testing profiles on connection failure
      const sandboxEmails = [
        'siddharth@sin.education',
        'khushal@gmail.com',
        'director@siet.edu.in',
        'admin@siet.edu.in',
        'warden@siet.edu.in',
        'security@siet.edu.in',
        'rajesh.driver@siet.edu.in',
        'alok.vyas@siet.edu.in',
        'madanlal@gmail.com',
        'canteen@siet.edu.in',
        'hod@sin.education',
        'teacher@sin.education',
        'librarian@sin.education'
      ];
      if (sandboxEmails.includes(data.email)) {
        let role = 'Student';
        if (data.email === 'siddharth@sin.education') role = 'SuperAdmin';
        else if (data.email === 'director@siet.edu.in' || data.email === 'admin@siet.edu.in') role = 'Admin';
        else if (data.email === 'warden@siet.edu.in') role = 'Warden';
        else if (data.email === 'security@siet.edu.in') role = 'Security';
        else if (data.email === 'rajesh.driver@siet.edu.in') role = 'Driver';
        else if (data.email === 'alok.vyas@siet.edu.in') role = 'Staff';
        else if (data.email === 'madanlal@gmail.com') role = 'Parent';
        else if (data.email === 'canteen@siet.edu.in') role = 'Vendor';
        else if (data.email === 'hod@sin.education') role = 'HOD';
        else if (data.email === 'teacher@sin.education') role = 'Teacher';
        else if (data.email === 'librarian@sin.education') role = 'Librarian';

        const mockProfile = getMockProfile(data.email, role);
        const mockPayload = btoa(unescape(encodeURIComponent(JSON.stringify(mockProfile))));
        const mockToken = `mock-sandbox-jwt-token-value.${mockPayload}.signature`;

        localStorage.setItem('iris_jwt_token', mockToken);
        localStorage.setItem('iris_user_profile', JSON.stringify(mockProfile));

        window.location.href = getRedirectPath(mockProfile.role);
        return;
      }

      setSubmitError(err.message || 'An unexpected error occurred during sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, role: string) => {
    setIsLoading(true);
    setSubmitError(null);

    // Populate inputs visually
    setValue('email', email);
    setValue('password', 'password123');

    if (useOfflineBypass) {
      // Direct client bypass
      setTimeout(() => {
        const mockProfile = getMockProfile(email, role);
        const mockPayload = btoa(unescape(encodeURIComponent(JSON.stringify(mockProfile))));
        const mockToken = `mock-sandbox-jwt-token-value.${mockPayload}.signature`;

        localStorage.setItem('iris_jwt_token', mockToken);
        localStorage.setItem('iris_user_profile', JSON.stringify(mockProfile));

        setIsLoading(false);
        window.location.href = getRedirectPath(mockProfile.role);
      }, 600);
      return;
    }

    // Attempt backend login, with fallback
    try {
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('iris_client_device_id') : '';
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(deviceId ? { 'X-Client-Device-ID': deviceId } : {})
        },
        body: JSON.stringify({ email, password: 'password123' })
      });

      const result = await response.json();

        if (response.ok && result.success) {
          localStorage.setItem('iris_jwt_token', result.token);
          localStorage.setItem('iris_user_profile', JSON.stringify(result.profile));
          
          window.location.href = getRedirectPath(result.profile.role);
        } else {
        throw new Error(result.error || 'Quick login backend auth failed');
      }
    } catch (err: any) {
      console.warn('Quick login backend failed. Activating instant client fallback:', err);
      const mockProfile = getMockProfile(email, role);
      const mockPayload = btoa(unescape(encodeURIComponent(JSON.stringify(mockProfile))));
      const mockToken = `mock-sandbox-jwt-token-value.${mockPayload}.signature`;

      localStorage.setItem('iris_jwt_token', mockToken);
      localStorage.setItem('iris_user_profile', JSON.stringify(mockProfile));

      setIsLoading(false);
      window.location.href = getRedirectPath(mockProfile.role);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0D0A1A]">
      {/* Background radial layers */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#6C2BD9]/10 blur-3xl -top-20 -left-20 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/15 blur-3xl -bottom-20 -right-20 pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/20 mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-white tracking-tight">Access IRIS 365</h1>
          <p className="text-xs text-[#C4B5FD] mt-1 font-light">Campus Intelligence, Reimagined.</p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#C4B5FD] uppercase tracking-wider">Institutional Email</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-[#C4B5FD]/70"><Mail className="w-4.5 h-4.5" /></span>
              <input 
                type="email"
                required
                className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                placeholder="registrar@college.edu.in"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-red-400 font-medium mt-1">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#C4B5FD] uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-[#C4B5FD]/70"><Lock className="w-4.5 h-4.5" /></span>
              <input 
                type="password"
                required
                className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-red-400 font-medium mt-1">{errors.password.message}</span>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-heading font-bold text-sm shadow-lg shadow-[#6C2BD9]/20 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating User...</span>
              </>
            ) : (
              <span>Sign In to Dashboard →</span>
            )}
          </button>
        </form>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-3 bg-[#0D0A1A] text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">or</span>
        </div>

        <button 
          type="button" 
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 rounded-xl bg-white text-gray-900 font-heading font-bold text-sm shadow-lg hover:bg-gray-100 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Instant Login - All Roles */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" /> Instant Login
            </span>
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" 
                id="offline-bypass" 
                checked={useOfflineBypass}
                onChange={(e) => setUseOfflineBypass(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-white/5 border-[#6C2BD9]/30 text-[#6C2BD9] focus:ring-[#8B5CF6] cursor-pointer"
              />
              <label htmlFor="offline-bypass" className="text-[9px] text-[#C4B5FD]/60 select-none cursor-pointer hover:text-[#C4B5FD] transition-colors">
                Force Offline
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { email: 'siddharth@sin.education', role: 'SuperAdmin', label: 'SuperAdmin', bg: 'bg-violet-500/10', border: 'border-violet-500/25', hoverBorder: 'hover:border-violet-500', hoverBg: 'hover:bg-violet-500/20', text: 'text-violet-400', hoverText: 'hover:text-violet-300' },
              { email: 'director@siet.edu.in', role: 'Admin', label: 'Admin', bg: 'bg-blue-500/10', border: 'border-blue-500/25', hoverBorder: 'hover:border-blue-500', hoverBg: 'hover:bg-blue-500/20', text: 'text-blue-400', hoverText: 'hover:text-blue-300' },
              { email: 'khushal@gmail.com', role: 'Student', label: 'Student', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', hoverBorder: 'hover:border-emerald-500', hoverBg: 'hover:bg-emerald-500/20', text: 'text-emerald-400', hoverText: 'hover:text-emerald-300' },
              { email: 'hod@sin.education', role: 'HOD', label: 'HOD', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', hoverBorder: 'hover:border-cyan-500', hoverBg: 'hover:bg-cyan-500/20', text: 'text-cyan-400', hoverText: 'hover:text-cyan-300' },
              { email: 'teacher@sin.education', role: 'Teacher', label: 'Teacher', bg: 'bg-purple-500/10', border: 'border-purple-500/25', hoverBorder: 'hover:border-purple-500', hoverBg: 'hover:bg-purple-500/20', text: 'text-purple-400', hoverText: 'hover:text-purple-300' },
              { email: 'warden@siet.edu.in', role: 'Warden', label: 'Warden', bg: 'bg-amber-500/10', border: 'border-amber-500/25', hoverBorder: 'hover:border-amber-500', hoverBg: 'hover:bg-amber-500/20', text: 'text-amber-400', hoverText: 'hover:text-amber-300' },
              { email: 'security@siet.edu.in', role: 'Security', label: 'Security', bg: 'bg-red-500/10', border: 'border-red-500/25', hoverBorder: 'hover:border-red-500', hoverBg: 'hover:bg-red-500/20', text: 'text-red-400', hoverText: 'hover:text-red-300' },
              { email: 'librarian@sin.education', role: 'Librarian', label: 'Librarian', bg: 'bg-teal-500/10', border: 'border-teal-500/25', hoverBorder: 'hover:border-teal-500', hoverBg: 'hover:bg-teal-500/20', text: 'text-teal-400', hoverText: 'hover:text-teal-300' },
              { email: 'madanlal@gmail.com', role: 'Parent', label: 'Parent', bg: 'bg-pink-500/10', border: 'border-pink-500/25', hoverBorder: 'hover:border-pink-500', hoverBg: 'hover:bg-pink-500/20', text: 'text-pink-400', hoverText: 'hover:text-pink-300' },
              { email: 'rajesh.driver@siet.edu.in', role: 'Driver', label: 'Driver', bg: 'bg-orange-500/10', border: 'border-orange-500/25', hoverBorder: 'hover:border-orange-500', hoverBg: 'hover:bg-orange-500/20', text: 'text-orange-400', hoverText: 'hover:text-orange-300' },
              { email: 'canteen@siet.edu.in', role: 'Vendor', label: 'Vendor', bg: 'bg-lime-500/10', border: 'border-lime-500/25', hoverBorder: 'hover:border-lime-500', hoverBg: 'hover:bg-lime-500/20', text: 'text-lime-400', hoverText: 'hover:text-lime-300' },
              { email: 'alok.vyas@siet.edu.in', role: 'Staff', label: 'Staff', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', hoverBorder: 'hover:border-indigo-500', hoverBg: 'hover:bg-indigo-500/20', text: 'text-indigo-400', hoverText: 'hover:text-indigo-300' },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => {
                  const mockProfile = getMockProfile(item.email, item.role);
                  const mockPayload = btoa(unescape(encodeURIComponent(JSON.stringify(mockProfile))));
                  const mockToken = `mock-sandbox-jwt-token-value.${mockPayload}.signature`;
                  localStorage.setItem('iris_jwt_token', mockToken);
                  localStorage.setItem('iris_user_profile', JSON.stringify(mockProfile));
                  window.location.href = getRedirectPath(mockProfile.role);
                }}
                className={`p-2 rounded-xl ${item.bg} border ${item.border} ${item.hoverBorder} ${item.hoverBg} transition-all text-left flex flex-col group`}
              >
                <span className={`text-[10px] font-bold ${item.text} ${item.hoverText} transition-colors`}>
                  {item.label}
                </span>
                <span className="text-[7px] text-[#C4B5FD]/50 font-mono truncate w-full mt-0.5">
                  {item.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action links */}
        <div className="flex items-center justify-between mt-5 text-[10px] text-[#C4B5FD]/50 font-medium">
          <button 
            type="button" 
            onClick={() => setShowForgotModal(true)} 
            className="hover:text-white transition-colors underline decoration-[#6C2BD9] underline-offset-4"
          >
            Forgot Password?
          </button>
          <button 
            type="button" 
            onClick={() => setShowRegisterModal(true)} 
            className="hover:text-white transition-colors underline decoration-[#6C2BD9] underline-offset-4"
          >
            Request Enrollment
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-[#C4B5FD]/50 font-light">&copy; 2026 SIN Education and Technology Pvt. Ltd.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-base text-white mb-2">Reset Password</h3>
            <p className="text-xs text-[#C4B5FD]/70 leading-relaxed mb-4">
              Enter your institutional email address to receive a secure password reset link.
            </p>
            
            {resetSuccess ? (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                Password reset link sent to your email.
              </div>
            ) : (
              <>
                {resetError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                    {resetError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5 mb-5">
                  <label className="text-[10px] font-semibold text-[#C4B5FD] uppercase tracking-wider">Institutional Email</label>
                  <input 
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                    placeholder="name@institution.edu"
                    disabled={resetLoading}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetEmail('');
                  setResetSuccess(false);
                  setResetError(null);
                }} 
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold transition-all hover:bg-white/5"
              >
                Close
              </button>
              {!resetSuccess && (
                <button 
                  type="button"
                  disabled={resetLoading}
                  onClick={handleForgotPasswordSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-[#6C2BD9]/20 flex items-center justify-center gap-1.5"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Link</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Enrollment Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-heading font-bold text-base text-white mb-2">Access & Enrollment Request</h3>
            <p className="text-xs text-[#C4B5FD]/70 leading-relaxed mb-5">
              IRIS 365 is a closed, multi-tenant administrative network. Accounts are pre-provisioned by your institution. If you are a new student or professor, please contact the **Academic Registrar's Office** to fetch your access token.
            </p>
            <button 
              type="button"
              onClick={() => setShowRegisterModal(false)} 
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-[#6C2BD9]/20"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

