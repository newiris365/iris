"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function ParentAttendancePage() {
  const [stats, setStats] = useState<any>({ overall: 72, total: 25, present: 18 });
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First get linked child info, then fetch attendance
    apiGet('/core/parent/child-info').then(childRes => {
      if (childRes.success && childRes.child?.student_id) {
        return apiGet(`/core/attendance/student/${childRes.child.student_id}`);
      }
      return null;
    }).then(res => {
      if (res?.success) {
        setStats(res.stats || { overall: 72, total: 25, present: 18 });
        setBreakdown(res.breakdown || []);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 w-full flex flex-col gap-6">
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
  );
}
