"use client";

import React, { useState, useEffect } from 'react';
import {
  Activity, Users, CreditCard, Home, AlertTriangle, Shield, Bus,
  UtensilsCrossed, GraduationCap, TrendingUp, RefreshCw, Clock
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function DirectorPulsePage() {
  const [pulse, setPulse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchPulse = async () => {
    try {
      const res = await apiGet('director/campus-pulse');
      if (res.success) setPulse(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLastRefresh(new Date()); }
  };

  useEffect(() => { fetchPulse(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchPulse, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Loading campus pulse...</div></div>;

  const kpis = pulse ? [
    { label: 'Attendance Today', value: `${pulse.attendance_pct}%`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Fee Collected', value: `₹${(pulse.fee_collected || 0).toLocaleString()}`, icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Fee Outstanding', value: `₹${(pulse.fee_outstanding || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Hostel Occupancy', value: `${pulse.hostel_occupancy_pct}%`, icon: Home, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Open Complaints', value: pulse.complaints_open || 0, icon: AlertTriangle, color: pulse.complaints_open > 10 ? 'text-red-400' : 'text-amber-400', bg: pulse.complaints_open > 10 ? 'bg-red-500/10' : 'bg-amber-500/10' },
    { label: 'Gate Entries', value: pulse.gate_entries_today || 0, icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Canteen Revenue', value: `₹${(pulse.canteen_revenue || 0).toLocaleString()}`, icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Active Bus Routes', value: pulse.bus_routes_active || 0, icon: Bus, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Security Incidents', value: pulse.security_incidents || 0, icon: Shield, color: pulse.security_incidents > 0 ? 'text-red-400' : 'text-emerald-400', bg: pulse.security_incidents > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
    { label: 'Students', value: (pulse.total_students || 0).toLocaleString(), icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity size={24} className="text-purple-400" />
          Campus Pulse
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} /> Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button onClick={fetchPulse}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} backdrop-blur-sm rounded-xl p-4 border border-white/5`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={18} className={kpi.color} />
              <span className="text-xs text-slate-400">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Department Breakdown */}
      {pulse?.departments && pulse.departments.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Department Attendance</h2>
          <div className="space-y-3">
            {pulse.departments.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-white w-32 truncate">{d.name}</span>
                <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    d.attendance_pct >= 75 ? 'bg-emerald-500' :
                    d.attendance_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${d.attendance_pct}%` }} />
                </div>
                <span className="text-sm font-medium text-white w-16 text-right">{d.attendance_pct}%</span>
                <span className="text-xs text-slate-400 w-16 text-right">{d.student_count} students</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee by Department */}
      {pulse?.fee_by_department && pulse.fee_by_department.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Fee Collection by Department</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-slate-400">Department</th>
                  <th className="text-right p-2 text-slate-400">Billed</th>
                  <th className="text-right p-2 text-slate-400">Collected</th>
                  <th className="text-right p-2 text-slate-400">Outstanding</th>
                  <th className="text-right p-2 text-slate-400">Rate</th>
                </tr>
              </thead>
              <tbody>
                {pulse.fee_by_department.map((d: any, i: number) => {
                  const rate = d.billed > 0 ? ((d.collected / d.billed) * 100).toFixed(1) : '0';
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-2 text-white">{d.department}</td>
                      <td className="p-2 text-right text-slate-300">₹{d.billed?.toLocaleString()}</td>
                      <td className="p-2 text-right text-emerald-400">₹{d.collected?.toLocaleString()}</td>
                      <td className="p-2 text-right text-amber-400">₹{d.outstanding?.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded ${parseFloat(rate) >= 80 ? 'bg-emerald-500/20 text-emerald-400' : parseFloat(rate) >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
