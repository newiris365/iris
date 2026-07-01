"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Clock, CheckCircle2, XCircle, Home, AlertOctagon
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function DirectorComplaintSLAPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('director/complaint-sla');
        if (res.success) setData(res);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Loading SLA data...</div></div>;
  if (!data) return <div className="text-center py-12 text-slate-400">No data available.</div>;

  const s = data.summary || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <AlertTriangle size={24} className="text-amber-400" />
        Complaint SLA Monitoring
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: s.open || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Resolution', value: `${s.avg_resolution_hours || 0}h`, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Overdue (>3d)', value: s.overdue_3days || 0, icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Overdue (>7d)', value: s.overdue_7days || 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-white/5`}>
            <div className="flex items-center gap-2">
              <c.icon size={18} className={c.color} />
              <span className="text-xs text-slate-400">{c.label}</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">By Category</h2>
          <div className="space-y-3">
            {(data.by_category || []).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-white">{c.category || 'Uncategorized'}</p>
                  <p className="text-xs text-slate-400">{c.total} total · {c.pending} pending</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Avg: {c.avg_resolution_hours || '—'}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Block */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Home size={18} className="text-violet-400" /> By Block
          </h2>
          <div className="space-y-3">
            {(data.by_block || []).map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-white">{b.block_name}</p>
                  <p className="text-xs text-slate-400">{b.total} total · {b.pending} pending</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Avg: {b.avg_resolution_hours || '—'}h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SLA Breaches */}
      {data.sla_breaches && data.sla_breaches.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-400" /> SLA Breaches
          </h2>
          <div className="space-y-2">
            {data.sla_breaches.map((b: any) => (
              <div key={b.id} className={`flex items-center justify-between rounded-lg p-3 ${
                b.sla_status === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${b.sla_status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {b.sla_status}
                    </span>
                    <span className="text-xs text-slate-400">{b.category}</span>
                  </div>
                  <p className="text-xs text-white mt-1">{b.description?.slice(0, 100)}</p>
                </div>
                <span className="text-sm font-bold text-red-400">{Math.round(b.hours_open)}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repeat Complaint Rooms */}
      {data.repeat_rooms && data.repeat_rooms.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Repeat Complaint Rooms (3+ complaints)</h2>
          <div className="space-y-2">
            {data.repeat_rooms.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-white">{r.block_name} - Room {r.room_number}</p>
                  <p className="text-xs text-slate-400">Last: {new Date(r.last_complaint).toLocaleDateString()}</p>
                </div>
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">{r.complaint_count} complaints</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
