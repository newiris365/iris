"use client";

import React, { useState, useEffect } from 'react';
import {
  CreditCard, TrendingUp, TrendingDown, IndianRupee, Users, Download, Filter
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function DirectorFeeRecoveryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (semester) params.semester = semester;
      const res = await apiGet('director/fee-recovery', params);
      if (res.success) setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [semester]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Loading fee recovery data...</div></div>;
  if (!data) return <div className="text-center py-12 text-slate-400">No data available.</div>;

  const s = data.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={24} className="text-emerald-400" />
          Fee Recovery Tracking
        </h1>
        <div className="flex items-center gap-3">
          <select value={semester} onChange={e => setSemester(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Billed', value: `₹${(s.total_billed || 0).toLocaleString()}`, color: 'text-blue-400' },
          { label: 'Collected', value: `₹${(s.total_collected || 0).toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Outstanding', value: `₹${(s.total_outstanding || 0).toLocaleString()}`, color: 'text-amber-400' },
          { label: 'Collection Rate', value: `${s.collection_rate || 0}%`, color: 'text-violet-400' },
          { label: 'Fully Paid', value: s.fully_paid_count || 0, color: 'text-emerald-400' },
          { label: 'Unpaid', value: s.unpaid_count || 0, color: 'text-red-400' },
        ].map(c => (
          <div key={c.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Department */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">By Department</h2>
          <div className="space-y-3">
            {(data.by_department || []).map((d: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white">{d.department_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${d.collection_rate >= 80 ? 'bg-emerald-500/20 text-emerald-400' : d.collection_rate >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                    {d.collection_rate}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Billed: ₹{d.billed?.toLocaleString()}</span>
                  <span>Collected: ₹{d.collected?.toLocaleString()}</span>
                  <span className="text-amber-400">Due: ₹{d.outstanding?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Fee Type */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">By Fee Type</h2>
          <div className="space-y-3">
            {(data.by_fee_type || []).map((ft: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white">{ft.fee_name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Billed: ₹{ft.billed?.toLocaleString()}</span>
                  <span>Collected: ₹{ft.collected?.toLocaleString()}</span>
                  <span className="text-amber-400">Due: ₹{ft.outstanding?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Defaulters */}
      {data.top_defaulters && data.top_defaulters.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={18} className="text-red-400" />
            Top Defaulters
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-slate-400">Student</th>
                  <th className="text-left p-2 text-slate-400">Roll No</th>
                  <th className="text-left p-2 text-slate-400">Department</th>
                  <th className="text-right p-2 text-slate-400">Due</th>
                  <th className="text-left p-2 text-slate-400">Guardian</th>
                </tr>
              </thead>
              <tbody>
                {data.top_defaulters.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 text-white font-medium">{d.student_name}</td>
                    <td className="p-2 text-slate-300">{d.roll_number}</td>
                    <td className="p-2 text-slate-300">{d.department_name}</td>
                    <td className="p-2 text-right text-red-400 font-bold">₹{d.overdue_amount?.toLocaleString()}</td>
                    <td className="p-2 text-slate-300">{d.guardian_name} ({d.guardian_phone})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {data.monthly_trend && data.monthly_trend.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Collection Trend</h2>
          <div className="flex items-end gap-2 h-40">
            {data.monthly_trend.map((m: any, i: number) => {
              const maxVal = Math.max(...data.monthly_trend.map((x: any) => x.collected), 1);
              const height = (m.collected / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">₹{(m.collected / 1000).toFixed(0)}k</span>
                  <div className="w-full bg-emerald-500/40 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-xs text-slate-500">{new Date(m.month).toLocaleDateString('en', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
