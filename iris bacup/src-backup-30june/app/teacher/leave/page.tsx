"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertTriangle, FileText, ChevronRight, Filter } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface LeaveApplication {
  id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  faculty_remarks: string;
  hod_remarks: string;
  admin_remarks: string;
  created_at: string;
}

interface LeaveBalance {
  casual: { total: number; used: number; remaining: number };
  medical: { total: number; used: number; remaining: number };
  earned: { total: number; used: number; remaining: number };
}

const LEAVE_TYPES = [
  { value: 'medical', label: 'Medical Leave', icon: '🏥', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
  { value: 'od', label: 'On-Duty (OD)', icon: '🏆', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  { value: 'personal', label: 'Personal Leave', icon: '🏠', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  { value: 'half_day', label: 'Half Day', icon: '⏰', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  { value: 'emergency', label: 'Emergency', icon: '🚨', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
};

const MOCK_LEAVES: LeaveApplication[] = [
  {
    id: '1',
    leave_type: 'medical',
    from_date: '2026-06-01',
    to_date: '2026-06-03',
    reason: 'Fever and cold - visiting family doctor for treatment.',
    status: 'approved',
    faculty_remarks: '',
    hod_remarks: 'Approved. Take care.',
    admin_remarks: '',
    created_at: '2026-05-29',
  },
  {
    id: '2',
    leave_type: 'od',
    from_date: '2026-06-10',
    to_date: '2026-06-10',
    reason: 'Attending national-level faculty development workshop at IIT Delhi.',
    status: 'approved',
    faculty_remarks: '',
    hod_remarks: 'Approved. Share the workshop report upon return.',
    admin_remarks: '',
    created_at: '2026-06-05',
  },
  {
    id: '3',
    leave_type: 'personal',
    from_date: '2026-06-15',
    to_date: '2026-06-16',
    reason: 'Family function - sister\'s wedding.',
    status: 'pending',
    faculty_remarks: '',
    hod_remarks: '',
    admin_remarks: '',
    created_at: '2026-06-10',
  },
  {
    id: '4',
    leave_type: 'emergency',
    from_date: '2026-06-08',
    to_date: '2026-06-08',
    reason: 'Medical emergency in family - rushed to hospital.',
    status: 'rejected',
    faculty_remarks: '',
    hod_remarks: 'Rejected due to insufficient documentation. Please reapply with medical certificate.',
    admin_remarks: '',
    created_at: '2026-06-08',
  },
  {
    id: '5',
    leave_type: 'half_day',
    from_date: '2026-06-12',
    to_date: '2026-06-12',
    reason: 'Bank work - need to visit branch for account-related formalities.',
    status: 'approved',
    faculty_remarks: '',
    hod_remarks: 'Approved. Adjust your remaining lectures.',
    admin_remarks: '',
    created_at: '2026-06-11',
  },
];

const MOCK_BALANCE: LeaveBalance = {
  casual: { total: 12, used: 4, remaining: 8 },
  medical: { total: 10, used: 3, remaining: 7 },
  earned: { total: 15, used: 6, remaining: 9 },
};

const DAYS_IN_MONTH = 30;

export default function TeacherLeavePage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>(MOCK_BALANCE);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState({ leave_type: 'personal', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadLeaves();
    loadBalance();
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/core/leaves/my');
      if (res.success && res.leaves?.length > 0) {
        setLeaves(res.leaves);
      } else {
        setLeaves(MOCK_LEAVES);
      }
    } catch {
      setLeaves(MOCK_LEAVES);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const res = await apiGet('/core/leaves/balance');
      if (res.success && res.balance) {
        setBalance(res.balance);
      }
    } catch {
      setBalance(MOCK_BALANCE);
    }
  };

  const handleSubmit = async () => {
    if (!form.from_date || !form.to_date || !form.reason) {
      alert('Please fill in all fields');
      return;
    }
    if (new Date(form.to_date) < new Date(form.from_date)) {
      alert('To date cannot be before from date');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost('/core/leaves/submit', form);
      if (res.success) {
        setShowForm(false);
        setForm({ leave_type: 'personal', from_date: '', to_date: '', reason: '' });
        loadLeaves();
        loadBalance();
      }
    } catch {
      const newLeave: LeaveApplication = {
        id: String(Date.now()),
        leave_type: form.leave_type,
        from_date: form.from_date,
        to_date: form.to_date,
        reason: form.reason,
        status: 'pending',
        faculty_remarks: '',
        hod_remarks: '',
        admin_remarks: '',
        created_at: new Date().toISOString().split('T')[0],
      };
      setLeaves(prev => [newLeave, ...prev]);
      setShowForm(false);
      setForm({ leave_type: 'personal', from_date: '', to_date: '', reason: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysBetween = (from: string, to: string) => {
    return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
  };

  const approvedDates = new Set<string>();
  leaves.forEach(leave => {
    if (leave.status === 'approved') {
      const start = new Date(leave.from_date);
      const end = new Date(leave.to_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        approvedDates.add(d.toISOString().split('T')[0]);
      }
    }
  });

  const filteredLeaves = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  const totalLeavesTaken = balance.casual.used + balance.medical.used + balance.earned.used;
  const totalLeavesAvailable = balance.casual.remaining + balance.medical.remaining + balance.earned.remaining;

  const today = new Date();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const monthLabel = currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Leave Management</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Apply and track your leave applications</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>

        {/* Leave Balance Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'casual', label: 'Casual Leave', color: 'border-blue-500/30' },
            { key: 'medical', label: 'Medical Leave', color: 'border-red-500/30' },
            { key: 'earned', label: 'Earned Leave', color: 'border-green-500/30' },
          ].map(item => {
            const b = balance[item.key as keyof LeaveBalance];
            const pct = Math.round((b.used / b.total) * 100);
            return (
              <div key={item.key} className={`glass-panel rounded-2xl p-5 border ${item.color}`}>
                <div className="text-[10px] text-[#C4B5FD]/50 mb-1">{item.label}</div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-extrabold">{b.remaining}</span>
                  <span className="text-[10px] text-[#C4B5FD]/40">of {b.total} remaining</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-[#8B5CF6]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[9px] text-[#C4B5FD]/30 mt-1">{b.used} used of {b.total}</div>
              </div>
            );
          })}
        </div>

        {/* Summary bar */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-xs text-[#C4B5FD]/60">
              <span className="font-bold text-white">{totalLeavesTaken}</span> leaves taken this year
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="text-xs text-[#C4B5FD]/60">
              <span className="font-bold text-white">{totalLeavesAvailable}</span> leaves remaining
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#C4B5FD]/40">
            <FileText className="w-3 h-3" /> Academic Year 2025–2026
          </div>
        </div>

        {/* Apply Form */}
        {showForm && (
          <div className="glass-panel rounded-2xl p-6 border border-[#6C2BD9]/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">New Leave Application</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#C4B5FD]/40 hover:text-white text-xs transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              {LEAVE_TYPES.map(lt => (
                <button
                  key={lt.value}
                  onClick={() => setForm(f => ({ ...f, leave_type: lt.value }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.leave_type === lt.value ? lt.color : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
                  }`}
                >
                  {lt.icon} {lt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">From Date</label>
                <input
                  type="date"
                  value={form.from_date}
                  onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">To Date</label>
                <input
                  type="date"
                  value={form.to_date}
                  onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">Reason</label>
              <textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] h-20 resize-none"
                placeholder="Describe the reason for your leave..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD] text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="col-span-1 glass-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-sm">Leave Calendar</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="w-6 h-6 rounded bg-white/5 text-[#C4B5FD]/50 text-xs flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="w-6 h-6 rounded bg-white/5 text-[#C4B5FD]/50 text-xs flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="text-xs text-[#C4B5FD]/60 mb-3 text-center">{monthLabel}</div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[9px] text-[#C4B5FD]/30 font-bold py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isApproved = approvedDates.has(dateStr);
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === currentMonth.getMonth() &&
                  today.getFullYear() === currentMonth.getFullYear();
                return (
                  <div
                    key={idx}
                    className={`text-center text-[10px] py-1.5 rounded-lg transition-all ${
                      isApproved
                        ? 'bg-[#6C2BD9]/30 text-[#A78BFA] font-bold'
                        : isToday
                        ? 'bg-[#8B5CF6]/20 text-[#A78BFA] font-bold border border-[#6C2BD9]/30'
                        : 'text-[#C4B5FD]/40'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[9px] text-[#C4B5FD]/30">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-[#6C2BD9]/30" /> Approved Leave
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-[#8B5CF6]/20 border border-[#6C2BD9]/30" /> Today
              </div>
            </div>
          </div>

          {/* Leave History */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">Leave History</h3>
              <div className="flex gap-1.5">
                {['all', 'pending', 'approved', 'rejected'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      filter === s
                        ? 'bg-[#6C2BD9] text-white'
                        : 'bg-white/5 text-[#C4B5FD]/40 hover:bg-white/10'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">
                <Clock className="w-5 h-5 mx-auto mb-2 animate-spin" /> Loading leaves...
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">
                No leave applications found.
              </div>
            ) : (
              filteredLeaves.map(leave => {
                const lt = LEAVE_TYPES.find(l => l.value === leave.leave_type);
                const status = STATUS_MAP[leave.status] || STATUS_MAP.pending;
                return (
                  <div
                    key={leave.id}
                    className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4 hover:border-[#6C2BD9]/20 transition-all"
                  >
                    <div className="text-2xl">{lt?.icon || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-bold text-sm">{lt?.label || leave.leave_type}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${status.color}`}
                        >
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#C4B5FD]/50 mb-1">
                        {new Date(leave.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                        —{' '}
                        {new Date(leave.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="ml-1 text-[#C4B5FD]/30">
                          &middot; {getDaysBetween(leave.from_date, leave.to_date)} day(s)
                        </span>
                      </div>
                      <div className="text-[10px] text-[#C4B5FD]/40 truncate">{leave.reason}</div>
                      {(leave.hod_remarks || leave.admin_remarks) && (
                        <div className="mt-2 flex flex-col gap-1">
                          {leave.hod_remarks && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-[#8B5CF6]" />
                              <span className="text-[#8B5CF6] font-medium">HOD:</span>{' '}
                              <span className="text-[#C4B5FD]/50">{leave.hod_remarks}</span>
                            </div>
                          )}
                          {leave.admin_remarks && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 font-medium">Admin:</span>{' '}
                              <span className="text-[#C4B5FD]/50">{leave.admin_remarks}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-[9px] text-[#C4B5FD]/30">
                        {new Date(leave.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C4B5FD]/20" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
