"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Key, User, ShieldAlert, Sparkles } from 'lucide-react';

export default function CompanyHRLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate successful partner login check
    setTimeout(() => {
      setLoading(false);
      router.push('/company/drives');
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#6C2BD9]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[#13102A]/85 border border-[#6C2BD9]/20 shadow-2xl backdrop-blur-xl flex flex-col gap-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-white">HR Recruiter Console</h1>
            <p className="text-xs text-[#C4B5FD]/50 mt-1">Partners placement portal login gateway.</p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#A78BFA]" /> Registered HR Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. hr@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-white placeholder:text-[#C4B5FD]/20 outline-none focus:border-[#6C2BD9]/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#A78BFA]" /> TPO Partner Passkey
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={accessKey}
              onChange={e => setAccessKey(e.target.value)}
              className="px-4 py-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-white placeholder:text-[#C4B5FD]/20 outline-none focus:border-[#6C2BD9]/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white shadow-lg shadow-[#6C2BD9]/20 hover:shadow-[#6C2BD9]/35 transition-all flex items-center justify-center gap-1 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In partner'}
          </button>
        </form>

        {/* Footer info */}
        <div className="p-3.5 rounded-xl bg-[#6C2BD9]/5 border border-[#6C2BD9]/25 flex items-start gap-2 text-[10px] text-[#C4B5FD]/70 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
          <span>If you are a new recruiter partner, contact training placement cell coordinators to request access key registries.</span>
        </div>

      </div>
    </main>
  );
}
