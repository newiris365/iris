"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Home, CreditCard, Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function ParentAttendancePage() {
  const [stats, setStats] = useState<any>({ overall: 72, total: 25, present: 18 });
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sandbox student profile ID
    apiGet('/core/attendance/student/b0000000-0000-0000-0000-000000000006').then(res => {
      if (res.success) {
        setStats(res.stats || { overall: 72, total: 25, present: 18 });
        setBreakdown(res.breakdown || [
          { subject: 'Compiler Design', percentage: 76, total: 10, present: 8 },
          { subject: 'Database Systems', percentage: 70, total: 10, present: 7 },
          { subject: 'Computer Networks', percentage: 60, total: 5, present: 3 }
        ]);
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
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-[#C4B5FD]">Logged: <strong>Mr. S. R. Gehlot</strong></span>
        </div>
      </header>

      {/* Main Portals */}
      <div className="max-w-7xl mx-auto px-6 py-10 w-full grid md:grid-cols-12 gap-8 flex-1">
        
        {/* Navigation */}
        <nav className="md:col-span-3 flex flex-col gap-2.5">
          <a href="/parent/dashboard" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <Home className="w-5 h-5" />
            <span>Telemetry Summary</span>
          </a>
          <a href="/parent/attendance" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#6C2BD9] text-white transition-all">
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
            <h2 className="font-heading font-extrabold text-2xl text-white">Class Check-ins Ledger</h2>
            <p className="text-xs text-[#C4B5FD] mt-1 font-light">Audit your child's daily class checkin statuses and thresholds.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              
              {/* Circular Gauge */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Attendance Gauge</span>
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="#6C2BD9" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * stats.overall) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <strong className="font-heading font-extrabold text-3xl text-white">{stats.overall}%</strong>
                    <span className="text-[9px] text-[#C4B5FD]/70 mt-0.5">Threshold: 75%</span>
                  </div>
                </div>

                {stats.overall < 75 && (
                  <div className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Below criteria. Overdue alert sent.
                  </div>
                )}
              </div>

              {/* Subject lists */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                <h3 className="font-bold text-white text-sm">Subject Breakdown</h3>
                <div className="space-y-4">
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">{item.subject}</span>
                        <strong className="text-[#A78BFA]">{item.percentage}% ({item.present}/{item.total})</strong>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1 border border-white/5">
                        <div 
                          className={`h-1 rounded-full ${item.percentage >= 75 ? 'bg-[#6C2BD9]' : 'bg-red-500'}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
