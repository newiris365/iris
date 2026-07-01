"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CalendarDays, ClipboardList, FileText, Users,
  AlertTriangle, Clock, BookOpen, TrendingUp, Award, Bell
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function FacultyDashboardPage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('iris_user_profile');
    if (saved) { try { setProfile(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      try {
        const [ttRes, leavesRes] = await Promise.all([
          apiGet('campusCore/faculty/timetable'),
          apiGet('campusCore/faculty/leaves/pending'),
        ]);
        if (ttRes.success) setTimetable(ttRes.timetable || []);
        if (leavesRes.success) setPendingLeaves(leavesRes.leaves || []);
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setTodaySessions((ttRes.timetable || []).filter((t: any) => t.day_of_week === dayName));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-400 animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    { label: 'Today\'s Classes', value: todaySessions.length, icon: CalendarDays, color: 'text-blue-400' },
    { label: 'Pending Leaves', value: pendingLeaves.length, icon: FileText, color: 'text-amber-400' },
    { label: 'Weekly Classes', value: timetable.length, icon: ClipboardList, color: 'text-violet-400' },
    { label: 'Quick Links', value: '→', icon: Users, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Faculty Dashboard</h1>
        <span className="text-sm text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
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
        {/* Today's Schedule */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-400" />
            Today&apos;s Schedule
          </h2>
          {todaySessions.length === 0 ? (
            <p className="text-slate-400 text-sm">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-slate-400">Slot</p>
                    <p className="text-sm font-mono text-white">{s.time_slot}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{s.subject}</p>
                    <p className="text-xs text-slate-400">{s.department_name || 'General'} {s.semester ? `— Sem ${s.semester}` : ''}</p>
                  </div>
                  <div className="text-xs text-slate-400">{s.room || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Leave Applications */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            Pending Leave Applications
            {pendingLeaves.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                {pendingLeaves.length}
              </span>
            )}
          </h2>
          {pendingLeaves.length === 0 ? (
            <p className="text-slate-400 text-sm">No pending leave applications.</p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((leave: any) => (
                <div key={leave.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {leave.student_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{leave.student_name}</p>
                    <p className="text-xs text-slate-400">{leave.leave_type} — {leave.start_date} to {leave.end_date}</p>
                  </div>
                  <a href="/faculty/leaves" className="text-xs text-violet-400 hover:text-violet-300 underline">
                    Review
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Start Attendance', href: '/faculty/attendance', icon: CalendarDays, color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
              { label: 'Enter CIA Marks', href: '/faculty/cia', icon: FileText, color: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' },
              { label: 'Review Leaves', href: '/faculty/leaves', icon: Award, color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' },
              { label: 'View Timetable', href: '/faculty/timetable', icon: ClipboardList, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 transition-colors ${action.color}`}
              >
                <action.icon size={24} />
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
