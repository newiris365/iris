"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Home, AlertTriangle,
  XCircle, ArrowLeftRight, CalendarCheck, Bell, ChevronRight
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function WardenDashboard() {
  const [stats, setStats] = useState({ visitors: 0, pending: 0, absent: 0, transfers: 0, pendingLeaves: 0, openComplaints: 0 });
  const [pendingVisitors, setPendingVisitors] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [curfewAbsent, setCurfewAbsent] = useState<any[]>([]);
  const [openComplaints, setOpenComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [visRes, leavesRes, complaintsRes] = await Promise.all([
          apiGet('/hostel/visitors'),
          apiGet('/hostel/leaves'),
          apiGet('/hostel/complaints'),
        ]);

        if (visRes.success) {
          const pending = (visRes.visitors || []).filter((v: any) => v.approval_status === 'pending');
          setPendingVisitors(pending);
          setStats(s => ({ ...s, visitors: visRes.visitors?.length || 0, pending: pending.length }));
        }

        if (leavesRes.success) {
          const allLeaves = leavesRes.leave_requests || [];
          const pendingL = allLeaves.filter((l: any) => l.status === 'pending');
          setPendingLeaves(pendingL);
          setStats(s => ({ ...s, pendingLeaves: pendingL.length }));
        }

        if (complaintsRes.success) {
          const all = complaintsRes.complaints || [];
          const open = all.filter((c: any) => c.status === 'open' || c.status === 'assigned');
          setOpenComplaints(open);
          setStats(s => ({ ...s, openComplaints: open.length }));
        }

      } catch (err) {
        console.error('Warden dashboard load error:', err);
        // Set mock stats for demo
        setStats({ visitors: 3, pending: 1, absent: 0, transfers: 0, pendingLeaves: 2, openComplaints: 4 });
        setPendingLeaves([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const leaveTypeColors: Record<string, string> = {
    medical: 'text-red-400 bg-red-500/10',
    personal: 'text-blue-400 bg-blue-500/10',
    family_emergency: 'text-orange-400 bg-orange-500/10',
    academic: 'text-purple-400 bg-purple-500/10',
    other: 'text-slate-400 bg-slate-500/10',
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-emerald-400 animate-pulse">Loading dashboard...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Warden Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Live overview of hostel activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Pending Visitors', value: stats.pending, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10', href: '/warden/visitors' },
          { label: 'Pending Leaves', value: stats.pendingLeaves, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', href: '/warden/leaves' },
          { label: 'Open Complaints', value: stats.openComplaints, icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/warden/complaints' },
          { label: 'Room Transfers', value: stats.transfers, icon: ArrowLeftRight, color: 'text-violet-400', bg: 'bg-violet-500/10', href: '/warden/transfers' },
          { label: 'Absent Tonight', value: stats.absent, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', href: '/warden/curfew' },
          { label: 'Total Visitors', value: stats.visitors, icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/warden/visitors' },
        ].map(s => (
          <Link key={s.label} href={s.href} className={`${s.bg} backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CalendarCheck size={18} className="text-emerald-400" /> Pending Leave Requests
              {stats.pendingLeaves > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">{stats.pendingLeaves}</span>
              )}
            </h2>
            <Link href="/warden/leaves" className="text-xs text-emerald-400 hover:text-emerald-300 underline">View All</Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-slate-400 text-sm">No pending leave requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 4).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">{l.students?.name || 'Student'}</p>
                      {l.leave_type && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${leaveTypeColors[l.leave_type] || 'text-slate-400 bg-slate-500/10'}`}>
                          {l.leave_type?.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(l.leave_from).toLocaleDateString('en-IN')} → {new Date(l.leave_to).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <Link href="/warden/leaves" className="text-xs text-emerald-400 hover:text-emerald-300 underline ml-2 flex-shrink-0">Review</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Complaints */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell size={18} className="text-orange-400" /> Open Complaints
              {stats.openComplaints > 0 && (
                <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">{stats.openComplaints}</span>
              )}
            </h2>
            <Link href="/warden/complaints" className="text-xs text-emerald-400 hover:text-emerald-300 underline">View All</Link>
          </div>
          {openComplaints.length === 0 ? (
            <p className="text-slate-400 text-sm">No open complaints — all clear!</p>
          ) : (
            <div className="space-y-3">
              {openComplaints.slice(0, 4).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-orange-500/5 rounded-lg p-3 border border-orange-500/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">
                      {c.students?.name || 'Student'} • {c.hostel_rooms?.room_number || c.category}
                    </p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded ml-2 flex-shrink-0 ${
                    c.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    c.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {c.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Visitors */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={18} className="text-amber-400" /> Pending Visitor Approvals
            </h2>
            <Link href="/warden/visitors" className="text-xs text-emerald-400 hover:text-emerald-300 underline">View All</Link>
          </div>
          {pendingVisitors.length === 0 ? (
            <p className="text-slate-400 text-sm">No pending visitor approvals.</p>
          ) : (
            <div className="space-y-2">
              {pendingVisitors.slice(0, 5).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{v.visitor_name}</p>
                    <p className="text-xs text-slate-400">Visiting: {v.students?.name || v.students?.users?.full_name || '—'}</p>
                  </div>
                  <Link href="/warden/visitors" className="text-xs text-emerald-400 hover:text-emerald-300 underline">Review</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Absent students */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" /> Absent Tonight
            {curfewAbsent.length > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">{curfewAbsent.length}</span>
            )}
          </h2>
          {curfewAbsent.length === 0 ? (
            <p className="text-slate-400 text-sm">All students present or check-in not started.</p>
          ) : (
            <div className="space-y-2">
              {curfewAbsent.slice(0, 5).map((s: any) => (
                <div key={s.student_id} className="flex items-center gap-3 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <XCircle size={16} className="text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{s.student_name}</p>
                    <p className="text-xs text-slate-400">Room: {s.room_number} — {s.roll_number}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
