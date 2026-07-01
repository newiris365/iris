"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, GraduationCap, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function PrincipalDashboard() {
  const [stats, setStats] = useState({ students: 0, faculty: 0, attendance: 0, passRate: 0 });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, noticesRes] = await Promise.all([
          apiGet('campusCore/attendance/institution-summary'),
          apiGet('campusCore/notices'),
        ]);
        if (summaryRes.success) {
          setStats(s => ({
            ...s,
            attendance: summaryRes.total_students || 0,
            students: summaryRes.total_students || 0,
          }));
        }
        if (noticesRes.success) setRecentNotices((noticesRes.notices || []).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <LayoutDashboard size={24} className="text-purple-400" />
        Principal Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.students, icon: GraduationCap, color: 'text-blue-400' },
          { label: 'Faculty', value: stats.faculty, icon: Users, color: 'text-emerald-400' },
          { label: 'Avg Attendance', value: `${stats.attendance}%`, icon: TrendingUp, color: 'text-violet-400' },
          { label: 'Pass Rate', value: `${stats.passRate}%`, icon: AlertTriangle, color: 'text-amber-400' },
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

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Notices</h2>
        {recentNotices.length === 0 ? (
          <p className="text-slate-400 text-sm">No recent notices.</p>
        ) : (
          <div className="space-y-2">
            {recentNotices.map((n: any) => (
              <div key={n.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.priority} · {new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
