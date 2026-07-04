"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Users, Clock, FileText, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    myClasses: 0,
    totalStudents: 0,
    todayAttendance: 0,
    pendingAssignments: 0,
    upcomingClasses: 0,
    leaveRequests: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const userId = profile.user_id || profile.id;

      // Fetch timetable
      const timetableRes = await apiGet('campusCore/faculty/timetable');
      if (timetableRes.success && timetableRes.timetable) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayClasses = timetableRes.timetable.filter((t: any) => t.day_of_week === today);
        setTodaySchedule(todayClasses);
        setStats(s => ({ ...s, myClasses: new Set(todayClasses.map((t: any) => t.department_name)).size, upcomingClasses: todayClasses.length }));
      }

      // Fetch pending leave applications
      const leavesRes = await apiGet('campusCore/faculty/leaves/pending');
      if (leavesRes.success && leavesRes.leaves) {
        setStats(s => ({ ...s, leaveRequests: leavesRes.leaves.length }));
      }

      // Fetch students count
      const studentsRes = await apiGet('campusCore/faculty/students');
      if (studentsRes.success && studentsRes.students) {
        setStats(s => ({ ...s, totalStudents: studentsRes.students.length }));
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutDashboard size={24} className="text-violet-400" /> Teacher Dashboard
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Welcome back! Here&apos;s your teaching overview for today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Classes', value: stats.myClasses, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400' },
          { label: 'Today\'s Periods', value: stats.upcomingClasses, icon: Clock, color: 'text-emerald-400' },
          { label: 'Pending Tasks', value: stats.leaveRequests, icon: FileText, color: 'text-amber-400' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={14} className="text-violet-400" /> Today&apos;s Schedule
          </h3>
          {todaySchedule.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="w-1 h-8 rounded-full bg-violet-400" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{s.subject} — {s.department_name}</p>
                    <p className="text-[10px] text-slate-400">{s.time_slot} · Room {s.room || '—'}</p>
                  </div>
                  <CheckCircle size={12} className="text-emerald-400/50" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Take Attendance', href: '/teacher/attendance', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { label: 'View Timetable', href: '/teacher/timetable', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { label: 'Upload Marks', href: '/teacher/results', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                { label: 'Post Assignment', href: '/teacher/assignments', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                { label: 'Apply Leave', href: '/teacher/leave', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                { label: 'Study Materials', href: '/teacher/study-materials', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className={`p-3 rounded-lg border text-xs font-medium text-center hover:brightness-110 transition-all ${a.color}`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                    <p className="text-[11px] text-slate-300">{a.text}</p>
                    <span className="text-[9px] text-slate-500">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
