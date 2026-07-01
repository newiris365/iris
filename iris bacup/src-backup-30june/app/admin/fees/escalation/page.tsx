"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, Clock, FileText, RefreshCw, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface FeeDefaulter {
  student_id: string;
  student_name: string;
  roll_number: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  department_name: string;
  fee_id: string;
  fee_name: string;
  amount_due: number;
  amount_paid: number;
  amount_overdue: number;
  due_date: string;
  days_overdue: number;
  late_fee: number;
  total_due: number;
}

interface EscalationLog {
  id: string;
  run_date: string;
  fees_checked: number;
  reminders_sent: number;
  escalations_sent: number;
  notices_generated: number;
  errors: number;
  run_duration_ms: number;
  created_at: string;
}

export default function FeeEscalationPage() {
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [logs, setLogs] = useState<EscalationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'days_overdue' | 'total_due'>('days_overdue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tab, setTab] = useState<'defaulters' | 'logs'>('defaulters');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [defRes, logRes] = await Promise.all([
        apiGet('/core/fees/defaulters'),
        apiGet('/core/fees/escalation-logs'),
      ]);
      if (defRes.success) setDefaulters(defRes.defaulters || []);
      if (logRes.success) setLogs(logRes.logs || []);
    } catch (err) {
      console.error('Failed to load fee data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = defaulters
    .filter(d => {
      if (search && !d.student_name.toLowerCase().includes(search.toLowerCase()) && !d.roll_number.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]);

  const stats = {
    total: defaulters.length,
    critical: defaulters.filter(d => d.days_overdue >= 30).length,
    warning: defaulters.filter(d => d.days_overdue >= 7 && d.days_overdue < 30).length,
    upcoming: defaulters.filter(d => d.days_overdue < 7).length,
    totalOverdue: defaulters.reduce((sum, d) => sum + d.amount_overdue, 0),
  };

  const getStageLabel = (days: number) => {
    if (days >= 30) return { label: 'NOTICE', color: 'text-red-400 bg-red-500/20 border-red-500/30' };
    if (days >= 7) return { label: 'ESCALATED', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' };
    if (days >= 0) return { label: 'OVERDUE', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' };
    return { label: 'UPCOMING', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' };
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Fee Defaulter Auto-Escalation</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Multi-stage WhatsApp reminders with auto-escalation</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] text-xs font-bold flex items-center gap-1.5 transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Defaulters', value: stats.total, color: 'text-white' },
            { label: 'Critical (30+ days)', value: stats.critical, color: 'text-red-400' },
            { label: 'Escalated (7+ days)', value: stats.warning, color: 'text-orange-400' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-400' },
            { label: 'Total Overdue', value: `₹${(stats.totalOverdue / 1000).toFixed(0)}K`, color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
              <span className="text-xs text-[#C4B5FD]/60">{s.label}</span>
              <span className={`text-2xl font-heading font-extrabold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Escalation Stages */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <h3 className="font-heading font-bold text-sm mb-3">Escalation Stages</h3>
          <div className="flex items-center gap-4 text-xs">
            {[
              { day: '-7d', label: 'Reminder', color: 'bg-blue-500' },
              { day: '0', label: 'Due Today', color: 'bg-yellow-500' },
              { day: '+7d', label: 'HOD Alert', color: 'bg-orange-500' },
              { day: '+30d', label: 'Formal Notice', color: 'bg-red-500' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="w-8 h-px bg-white/20" />}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <div>
                    <div className="font-bold text-white">{s.label}</div>
                    <div className="text-[#C4B5FD]/50">Day {s.day}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['defaulters', 'logs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-[#6C2BD9]/30 border border-[#6C2BD9]/50 text-white' : 'bg-white/5 border border-white/10 text-[#C4B5FD]/60 hover:text-white'}`}>
              {t === 'defaulters' ? 'Fee Defaulters' : 'Run History'}
            </button>
          ))}
        </div>

        {tab === 'defaulters' && (
          <>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-md">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                  placeholder="Search by name or roll number..." />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
                <option value="days_overdue">Sort by Days Overdue</option>
                <option value="total_due">Sort by Amount Due</option>
              </select>
              <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#C4B5FD]">
                {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">No fee defaulters found</div>
              ) : filtered.map(d => {
                const stage = getStageLabel(d.days_overdue);
                const isExpanded = expanded === d.student_id + d.fee_id;
                return (
                  <div key={d.student_id + d.fee_id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(isExpanded ? null : d.student_id + d.fee_id)}>
                      <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                        <div>
                          <div className="text-sm font-medium">{d.student_name}</div>
                          <div className="text-[10px] text-[#C4B5FD]/50">{d.roll_number}</div>
                        </div>
                        <div className="text-xs text-[#C4B5FD]/70">{d.fee_name}</div>
                        <div className="text-xs font-bold">₹{d.amount_overdue.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-[#C4B5FD]/70">Due: {new Date(d.due_date).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs font-bold text-orange-400">{d.days_overdue > 0 ? `${d.days_overdue}d overdue` : `${Math.abs(d.days_overdue)}d left`}</div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${stage.color} w-fit`}>{stage.label}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C4B5FD]/40" /> : <ChevronDown className="w-4 h-4 text-[#C4B5FD]/40" />}
                    </div>
                    {isExpanded && (
                      <div className="border-t border-white/5 p-5 grid grid-cols-4 gap-6 text-xs">
                        <div>
                          <span className="text-[#C4B5FD]/50">Guardian</span>
                          <div className="font-medium mt-1">{d.guardian_name || 'N/A'}</div>
                          {d.guardian_phone && <div className="text-[#C4B5FD]/50 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {d.guardian_phone}</div>}
                        </div>
                        <div>
                          <span className="text-[#C4B5FD]/50">Amount Breakdown</span>
                          <div className="mt-1 space-y-1">
                            <div>Due: ₹{d.amount_due.toLocaleString('en-IN')}</div>
                            <div>Paid: ₹{d.amount_paid.toLocaleString('en-IN')}</div>
                            <div>Late Fee: ₹{d.late_fee.toLocaleString('en-IN')}</div>
                            <div className="font-bold text-white">Total: ₹{d.total_due.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <div>
                          <span className="text-[#C4B5FD]/50">Escalation Actions</span>
                          <div className="mt-1 space-y-1">
                            {d.days_overdue >= 0 && <div className="text-green-400">✓ WhatsApp to student</div>}
                            {d.days_overdue >= 0 && d.guardian_phone && <div className="text-green-400">✓ WhatsApp to parent</div>}
                            {d.days_overdue >= 7 && <div className="text-yellow-400">✓ Alert to HOD</div>}
                            {d.days_overdue >= 30 && <div className="text-red-400">✓ Director flagged</div>}
                            {d.days_overdue >= 30 && <div className="text-red-400">✓ Formal notice generated</div>}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <button className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold hover:bg-violet-600/30 transition-all">
                            Send Manual Reminder
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'logs' && (
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Run Date</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Fees Checked</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Reminders Sent</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Escalations</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Notices Generated</th>
                  <th className="p-4 text-xs font-bold text-[#C4B5FD]/60">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="p-4 text-xs">{new Date(log.created_at).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-xs">{log.fees_checked}</td>
                    <td className="p-4 text-xs text-yellow-400">{log.reminders_sent}</td>
                    <td className="p-4 text-xs text-orange-400">{log.escalations_sent}</td>
                    <td className="p-4 text-xs text-red-400">{log.notices_generated}</td>
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
