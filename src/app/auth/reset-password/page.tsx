"use client";

import React, { useState } from 'react';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw new Error(error.message);
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Link may be expired.');
    } finally {
      setIsLoading(false);
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
          <h1 className="font-heading font-extrabold text-2xl text-white tracking-tight">Reset Your Password</h1>
          <p className="text-xs text-[#C4B5FD] mt-1 font-light font-sans">Enter your new security credentials below.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            Password updated successfully! Redirecting to login page...
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#C4B5FD] uppercase tracking-wider">New Password</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-[#C4B5FD]/70"><Lock className="w-4.5 h-4.5" /></span>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#C4B5FD] uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-[#C4B5FD]/70"><Lock className="w-4.5 h-4.5" /></span>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-[#6C2BD9]/30 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
