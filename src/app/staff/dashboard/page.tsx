"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, FileText, Award, Bell, Clock } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    leaveBalance: 0,
    pendingLeaves: 0,
    payslipsReady: 0,
    upcomingAppraisal: '—',
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [leavesRes, payslipsRes] = await Promise.all([
        apiGet('staff/leaves'),
        apiGet('staff/payslips'),
      ]);

      if (leavesRes.success && leavesRes.leaves) {
        const pending = leavesRes.leaves.filter((l: any) => l.status === 'pending');
        const approved = leavesRes.leaves.filter((l: any) => l.status === 'approved');
        setStats(s => ({
          ...s,
          pendingLeaves: pending.length,
          leaveBalance: Math.max(0, 12 - approved.length),
        }));
      }

      if (payslipsRes.success && payslipsRes.payslips) {
        setStats(s => ({ ...s, payslipsReady: payslipsRes.payslips.length }));
      }
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutDashboard size={24} className="text-amber-400" /> Staff Dashboard
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Welcome back! Manage your HR tasks here.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leave Balance', value: stats.leaveBalance, icon: Calendar, color: 'text-amber-400' },
          { label: 'Pending Leaves', value: stats.pendingLeaves, icon: Clock, color: 'text-blue-400' },
          { label: 'Payslips Ready', value: stats.payslipsReady, icon: FileText, color: 'text-emerald-400' },
          { label: 'Next Appraisal', value: stats.upcomingAppraisal, icon: Award, color: 'text-violet-400' },
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
          <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Apply Leave', href: '/staff/leave', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { label: 'View Payslips', href: '/staff/payslips', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'Appraisal Info', href: '/staff/appraisal', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
              { label: 'Notices', href: '/staff/notices', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
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
  );
}
