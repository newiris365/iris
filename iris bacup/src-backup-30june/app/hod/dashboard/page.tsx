"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, GraduationCap, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function HodDashboard() {
  const [stats, setStats] = useState({ students: 0, faculty: 0, attendance: 0, complaints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pulseRes, studentsRes] = await Promise.all([
          apiGet('director/campus-pulse'),
          apiGet('campusCore/faculty/students'),
        ]);
        if (pulseRes.success) {
          setStats(s => ({
            ...s,
            attendance: pulseRes.attendance_pct || 0,
            complaints: pulseRes.complaints_open || 0,
          }));
        }
        if (studentsRes.success) {
          setStats(s => ({ ...s, students: studentsRes.students?.length || 0 }));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyan-400 animate-pulse">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <LayoutDashboard size={24} className="text-cyan-400" />
        HOD Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Students', value: stats.students, icon: Users, color: 'text-blue-400' },
          { label: 'Department Attendance', value: `${stats.attendance}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Open Complaints', value: stats.complaints, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'OBE Programs', value: 3, icon: GraduationCap, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
          <div className="space-y-2">
            {[
              { label: 'OBE Programs', href: '/hod/obe/programs', color: 'bg-violet-500/20 text-violet-400' },
              { label: 'CO-PO Attainment', href: '/hod/obe/po-attainment', color: 'bg-blue-500/20 text-blue-400' },
              { label: 'Gap Analysis', href: '/hod/obe/gap-analysis', color: 'bg-amber-500/20 text-amber-400' },
              { label: 'Student Attendance', href: '/faculty/attendance', color: 'bg-emerald-500/20 text-emerald-400' },
              { label: 'Leave Approvals', href: '/faculty/leaves', color: 'bg-red-500/20 text-red-400' },
            ].map(a => (
              <a key={a.label} href={a.href}
                className={`block p-3 rounded-lg ${a.color} hover:opacity-80 transition-all text-sm font-medium`}>
                {a.label}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Department Overview</h2>
          <p className="text-slate-400 text-sm">View your department&apos;s attendance, fee collection, and student performance metrics.</p>
          <div className="mt-4 space-y-2">
            <a href="/director/attendance-trends" className="block p-3 bg-white/5 rounded-lg text-sm text-slate-300 hover:bg-white/10">
              View Attendance Trends →
            </a>
            <a href="/director/fee-recovery" className="block p-3 bg-white/5 rounded-lg text-sm text-slate-300 hover:bg-white/10">
              View Fee Recovery →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
