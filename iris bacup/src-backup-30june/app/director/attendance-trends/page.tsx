"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Filter } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function DirectorAttendanceTrendsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('director/attendance-trends', { period });
      if (res.success) setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [period]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Loading attendance trends...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={24} className="text-emerald-400" />
          Attendance Trends
        </h1>
        <div className="flex gap-2">
          {['weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {p === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="text-center py-12 text-slate-400">No data available.</div>
      ) : (
        <>
          {/* Declining Departments Alert */}
          {data.declining_departments && data.declining_departments.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                <AlertTriangle size={16} /> Declining Attendance Alert
              </h3>
              <div className="space-y-2">
                {data.declining_departments.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-red-500/5 rounded-lg p-2">
                    <span className="text-sm text-white">{d.department_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">Last 2 weeks: {d.recent_pct}%</span>
                      <span className="text-xs text-slate-400">Prev 2 weeks: {d.older_pct}%</span>
                      <span className="text-xs font-bold text-red-400">{d.change_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Trend Chart */}
          {data.overall_trend && data.overall_trend.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Overall Trend</h2>
              <div className="flex items-end gap-1 h-48">
                {data.overall_trend.map((t: any, i: number) => {
                  const pct = t.attendance_pct || 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400">{pct}%</span>
                      <div className={`w-full rounded-t transition-all ${
                        pct >= 75 ? 'bg-emerald-500/40' : pct >= 50 ? 'bg-amber-500/40' : 'bg-red-500/40'
                      }`} style={{ height: `${Math.max(pct, 4)}%` }} />
                      <span className="text-[10px] text-slate-500 truncate max-w-full">
                        {new Date(t.period_start).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center">
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-3 h-3 rounded bg-emerald-500/40" /> &ge;75%</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-3 h-3 rounded bg-amber-500/40" /> 50-75%</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-3 h-3 rounded bg-red-500/40" /> &lt;50%</span>
              </div>
            </div>
          )}

          {/* Department Summary */}
          {data.department_summary && data.department_summary.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Department Summary</h2>
              <div className="space-y-3">
                {data.department_summary.map((d: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{d.department_name}</span>
                      <span className={`text-sm font-bold ${d.overall_pct >= 75 ? 'text-emerald-400' : d.overall_pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {d.overall_pct}%
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>{d.student_count} students</span>
                      <span>Last 7d: <span className={d.last_7d_pct >= 75 ? 'text-emerald-400' : 'text-amber-400'}>{d.last_7d_pct}%</span></span>
                      <span>Last 30d: <span className={d.last_30d_pct >= 75 ? 'text-emerald-400' : 'text-amber-400'}>{d.last_30d_pct}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
