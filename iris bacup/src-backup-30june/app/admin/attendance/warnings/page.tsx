"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, XCircle, Search, RefreshCw, Download, Phone, Mail } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface AttendanceWarning {
  student_id: string;
  student_name: string;
  roll_number: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  department_name: string;
  total_classes: number;
  attended_classes: number;
  attendance_pct: number;
}

interface WarningLog {
  id: string;
  run_date: string;
  students_checked: number;
  warnings_sent: number;
  critical_sent: number;
  errors: number;
  run_duration_ms: number;
  created_at: string;
}

export default function AttendanceWarningsPage() {
  const [warnings, setWarnings] = useState<AttendanceWarning[]>([]);
  const [logs, setLogs] = useState<WarningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'students' | 'logs'>('students');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [warningsRes, logsRes] = await Promise.all([
        apiGet('/core/attendance/warnings'),
        apiGet('/core/attendance/warning-logs'),
      ]);
      if (warningsRes.success) setWarnings(warningsRes.warnings || []);
      if (logsRes.success) setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load warnings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = warnings.filter(w => {
    if (filter === 'critical' && w.attendance_pct >= 75) return false;
    if (filter === 'warning' && (w.attendance_pct < 75 || w.attendance_pct >= 80)) return false;
    if (search && !w.student_name.toLowerCase().includes(search.toLowerCase()) && !w.roll_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getLevel = (pct: number) => {
    if (pct < 60) return { label: 'FINAL', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: XCircle };
    if (pct < 75) return { label: 'CRITICAL', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30', icon: AlertTriangle };
    return { label: 'WARNING', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: ShieldAlert };
  };

  const stats = {
    total: warnings.length,
    critical: warnings.filter(w => w.attendance_pct < 75).length,
    warning: warnings.filter(w => w.attendance_pct >= 75 && w.attendance_pct < 80).length,
    final: warnings.filter(w => w.attendance_pct < 60).length,
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Attendance Shortage Warnings</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Automatic WhatsApp alerts for students below threshold</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] text-xs font-bold flex items-center gap-1.5 transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total At-Risk', value: stats.total, color: 'text-white' },
            { label: 'Final Notice (<60%)', value: stats.final, color: 'text-red-400' },
            { label: 'Critical (<75%)', value: stats.critical, color: 'text-orange-400' },
            { label: 'Warning (<80%)', value: stats.warning, color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
              <span className="text-xs text-[#C4B5FD]/60">{s.label}</span>
              <span className={`text-3xl font-heading font-extrabold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['students', 'logs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-[#6C2BD9]/30 border border-[#6C2BD9]/50 text-white' : 'bg-white/5 border border-white/10 text-[#C4B5FD]/60 hover:text-white'}`}>
              {t === 'students' ? 'At-Risk Students' : 'Run History'}
            </button>
          ))}
        </div>

        {tab === 'students' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                  placeholder="Search by name or roll number..." />
              </div>
              <div className="flex gap-2">
                {(['all', 'critical', 'warning'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-[#6C2BD9]/30 border border-[#6C2BD9]/50 text-white' : 'bg-white/5 border border-white/10 text-[#C4B5FD]/60'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Student</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Roll No</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Department</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Attended</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Attendance %</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Level</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Guardian</th>
                    <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-[#C4B5FD]/40 text-xs">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-[#C4B5FD]/40 text-xs">No at-risk students found</td></tr>
                  ) : filtered.map(w => {
                    const level = getLevel(w.attendance_pct);
                    const LevelIcon = level.icon;
                    return (
                      <tr key={w.student_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 text-sm font-medium">{w.student_name}</td>
                        <td className="p-4 text-xs text-[#C4B5FD]/70">{w.roll_number}</td>
                        <td className="p-4 text-xs text-[#C4B5FD]/70">{w.department_name || '-'}</td>
                        <td className="p-4 text-xs text-[#C4B5FD]/70">{w.attended_classes}/{w.total_classes}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${w.attendance_pct < 60 ? 'bg-red-500' : w.attendance_pct < 75 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min(w.attendance_pct, 100)}%` }} />
                            </div>
                            <span className="text-xs font-bold">{w.attendance_pct}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${level.color} flex items-center gap-1 w-fit`}>
                            <LevelIcon className="w-3 h-3" /> {level.label}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-[#C4B5FD]/70">
                          {w.guardian_name ? (
                            <div className="flex flex-col">
                              <span>{w.guardian_name}</span>
                              {w.guardian_phone && <span className="text-[10px] text-[#C4B5FD]/50">{w.guardian_phone}</span>}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {w.guardian_phone && <Phone className="w-3.5 h-3.5 text-green-400" />}
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'logs' && (
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Run Date</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Students Checked</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Warnings Sent</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Critical Sent</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Errors</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="p-4 text-xs">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-xs">{log.students_checked}</td>
                    <td className="p-4 text-xs text-yellow-400">{log.warnings_sent}</td>
                    <td className="p-4 text-xs text-orange-400">{log.critical_sent}</td>
                    <td className="p-4 text-xs text-red-400">{log.errors}</td>
                    <td className="p-4 text-xs text-[#C4B5FD]/70">{(log.run_duration_ms / 1000).toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
