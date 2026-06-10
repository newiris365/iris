"use client";

import React, { useState, useEffect } from 'react';
import { Home, Calendar, CreditCard, Clock, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function ParentDashboardPage() {
  const [profile, setProfile] = useState<any>({ name: "Mr. S. R. Gehlot" });
  const [childStats, setChildStats] = useState({ overall: 72, total: 25, present: 18, pendingFees: 50000, walletBalance: 350 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Parent checks metrics for their student child
    apiGet('/core/attendance/student/b0000000-0000-0000-0000-000000000006').then(res => {
      if (res.success) {
        setChildStats(c => ({
          ...c,
          overall: res.stats?.overall || 72,
          total: res.stats?.total || 25,
          present: res.stats?.present || 18
        }));
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#6C2BD9]/25 bg-[#13102A]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center font-extrabold text-sm text-white">I</div>
          <span className="font-extrabold text-lg text-white">IRIS 365</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider">Parent Console</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#C4B5FD]">Logged: <strong>{profile.name}</strong></span>
          <a href="/login" className="text-xs border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">Sign Out</a>
        </div>
      </header>

      {/* Main Portals */}
      <div className="max-w-7xl mx-auto px-6 py-10 w-full grid md:grid-cols-12 gap-8 flex-1">
        
        {/* Navigation */}
        <nav className="md:col-span-3 flex flex-col gap-2.5">
          <a href="/parent/dashboard" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#6C2BD9] text-white transition-all">
            <Home className="w-5 h-5" />
            <span>Telemetry Summary</span>
          </a>
          <a href="/parent/attendance" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <Calendar className="w-5 h-5" />
            <span>Child Attendance</span>
          </a>
          <a href="/parent/fees" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <CreditCard className="w-5 h-5" />
            <span>Pay Dues Ledger</span>
          </a>
          <a href="/parent/results" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <Award className="w-5 h-5" />
            <span>Child Report Card</span>
          </a>
        </nav>

        {/* Content Portal */}
        <div className="md:col-span-9 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-8 border border-white/5">
            <h2 className="font-heading font-extrabold text-2xl text-white">Student Monitoring Dashboard</h2>
            <p className="text-xs text-[#C4B5FD] mt-1 font-light">Telemetry report summaries for your child **Khushal Gehlot** (B.Tech CSE Semester 4).</p>
            
            {/* Quick stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 relative">
                <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Class Attendance</span>
                <h3 className={`font-heading font-extrabold text-2xl mt-1 ${
                  childStats.overall >= 75 ? 'text-emerald-400' : 'text-red-400'
                }`}>{childStats.overall}%</h3>
                <span className="text-[10px] text-[#C4B5FD]/50">Status: {childStats.overall >= 75 ? "Eligible for exams" : "Attendance Deficit"}</span>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 relative">
                <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Ledger Balance Dues</span>
                <h3 className="font-heading font-extrabold text-2xl text-white mt-1">₹{childStats.pendingFees.toLocaleString()}</h3>
                <span className="text-[10px] text-[#C4B5FD]/50">Tuition fee overdue alert</span>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 relative">
                <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Canteen Wallet Balance</span>
                <h3 className="font-heading font-extrabold text-2xl text-white mt-1">₹{childStats.walletBalance.toLocaleString()}</h3>
                <span className="text-[10px] text-[#C4B5FD]/50">Prepaid school allowance</span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
