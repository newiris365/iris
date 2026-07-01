"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Download, Filter, TrendingDown, Users, Search,
  ArrowLeft, BarChart3
} from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

interface Defaulter {
  student_id: string;
  student_name: string;
  roll_number: string;
  department_name: string;
  attendance_pct: number;
  attendance_status: string;
  total_fee_due: number;
  total_paid: number;
  overdue_amount: number;
  days_overdue: number;
  risk_level: string;
  combined_score: number;
}

const RISK_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NONE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function DefaulterReportPage() {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attThreshold, setAttThreshold] = useState(75);
  const [feeDays, setFeeDays] = useState(30);
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDefaulters = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/reports/defaulters', {
        threshold: String(attThreshold),
        overdueDays: String(feeDays),
      });
      if (res.success) setDefaulters(res.defaulters || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDefaulters(); }, [attThreshold, feeDays]);

  const filtered = defaulters.filter(d =>
    (riskFilter === 'all' || d.risk_level === riskFilter) &&
    (!searchQuery || d.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     d.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const riskCounts = {
    HIGH: defaulters.filter(d => d.risk_level === 'HIGH').length,
    MEDIUM: defaulters.filter(d => d.risk_level === 'MEDIUM').length,
    LOW: defaulters.filter(d => d.risk_level === 'LOW').length,
  };

  const exportCsv = () => {
    const headers = ['Name', 'Roll', 'Department', 'Attendance %', 'Fee Due', 'Overdue', 'Days Overdue', 'Risk Level'];
    const rows = filtered.map(d => [
      d.student_name, d.roll_number, d.department_name,
      d.attendance_pct, d.total_fee_due, d.overdue_amount, d.days_overdue, d.risk_level,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'defaulter_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={24} className="text-red-400" />
            Consolidated Defaulter Report
          </h1>
        </div>
        <button onClick={exportCsv}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'HIGH Risk', count: riskCounts.HIGH, color: 'text-red-400' },
          { label: 'MEDIUM Risk', count: riskCounts.MEDIUM, color: 'text-amber-400' },
          { label: 'LOW Risk', count: riskCounts.LOW, color: 'text-blue-400' },
        ].map(r => (
          <div key={r.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className={`text-3xl font-bold ${r.color}`}>{r.count}</p>
            <p className="text-xs text-slate-400">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or roll..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm" />
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
          <option value="all">All Risk Levels</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
        <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
          <span className="text-xs text-slate-400">Attendance &lt;</span>
          <input type="number" value={attThreshold} onChange={e => setAttThreshold(parseInt(e.target.value) || 75)}
            className="w-16 bg-transparent text-white text-sm text-center border-none" min="0" max="100" />
          <span className="text-xs text-slate-400">%</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2 border border-slate-600">
          <span className="text-xs text-slate-400">Fee overdue &gt;</span>
          <input type="number" value={feeDays} onChange={e => setFeeDays(parseInt(e.target.value) || 30)}
            className="w-16 bg-transparent text-white text-sm text-center border-none" min="0" />
          <span className="text-xs text-slate-400">days</span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 opacity-50 text-emerald-400" />
          <p>No defaulters found with current thresholds. Great job!</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10 bg-white/5">
                  <th className="p-3">Student</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">Attendance</th>
                  <th className="p-3 text-right">Fee Due</th>
                  <th className="p-3 text-right">Overdue</th>
                  <th className="p-3 text-center">Days</th>
                  <th className="p-3 text-center">Risk</th>
                  <th className="p-3 text-center">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.student_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <p className="text-sm font-medium text-white">{d.student_name}</p>
                      <p className="text-xs text-slate-400">{d.roll_number}</p>
                    </td>
                    <td className="p-3 text-sm text-slate-300">{d.department_name || '—'}</td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${
                        d.attendance_pct < 60 ? 'text-red-400' :
                        d.attendance_pct < 75 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {d.attendance_pct}%
                      </span>
                    </td>
                    <td className="p-3 text-right text-sm text-slate-300">₹{d.total_fee_due?.toLocaleString()}</td>
                    <td className="p-3 text-right text-sm text-red-400 font-medium">₹{d.overdue_amount?.toLocaleString()}</td>
                    <td className="p-3 text-center text-sm text-slate-300">{d.days_overdue}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_COLORS[d.risk_level]}`}>
                        {d.risk_level}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-16 bg-slate-700 rounded-full h-2 mx-auto">
                        <div className={`h-2 rounded-full ${
                          d.risk_level === 'HIGH' ? 'bg-red-500' :
                          d.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} style={{ width: `${Math.min(d.combined_score * 10, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
