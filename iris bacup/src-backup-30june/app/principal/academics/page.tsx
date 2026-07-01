"use client";

import React, { useState, useEffect } from 'react';
import { GraduationCap, Calendar, BookOpen, Users, TrendingUp } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function PrincipalAcademicsPage() {
  const [stats, setStats] = useState({ totalStudents: 0, departments: 0, avgAttendance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/attendance/institution-summary');
        if (res.success) {
          setStats({
            totalStudents: res.total_students || 0,
            departments: res.departments?.length || 0,
            avgAttendance: res.avg_attendance_pct || 0,
          });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <GraduationCap size={24} className="text-purple-400" />
        Academics Overview
      </h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400' },
              { label: 'Departments', value: stats.departments, icon: BookOpen, color: 'text-emerald-400' },
              { label: 'Avg Attendance', value: `${stats.avgAttendance}%`, icon: TrendingUp, color: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
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

          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Fee Escalation', href: '/admin/fees/escalation', color: 'bg-red-500/20 text-red-400' },
                { label: 'Defaulter Report', href: '/admin/reports/defaulters', color: 'bg-amber-500/20 text-amber-400' },
                { label: 'Exam Seating', href: '/admin/exam/seating', color: 'bg-blue-500/20 text-blue-400' },
                { label: 'Academic Calendar', href: '/admin/calendar', color: 'bg-emerald-500/20 text-emerald-400' },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className={`flex items-center gap-2 p-4 rounded-xl border border-white/5 ${a.color} hover:opacity-80 transition-all`}>
                  <span className="text-sm font-medium">{a.label}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
