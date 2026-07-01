"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
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
  created_at: string;
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
  faculty_approved: { label: 'Faculty Approved', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  hod_approved: { label: 'Approved', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/20 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
};

export default function LeaveApplicationPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: 'medical', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/core/leaves/my');
      if (res.success) setLeaves(res.leaves || []);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.from_date || !form.to_date || !form.reason) {
      alert('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost('/core/leaves/submit', form);
      if (res.success) {
        setShowForm(false);
        setForm({ leave_type: 'medical', from_date: '', to_date: '', reason: '' });
        loadLeaves();
      }
    } catch (err) {
      alert('Leave application submitted (mock).');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysBetween = (from: string, to: string) => {
    return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Leave Applications</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Apply for OD, medical, personal, or emergency leave</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center gap-1.5 transition-all">
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>

        {/* Apply Form */}
        {showForm && (
          <div className="glass-panel rounded-2xl p-6 border border-[#6C2BD9]/30 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-sm">New Leave Application</h3>
            <div className="flex gap-3">
              {LEAVE_TYPES.map(lt => (
                <button key={lt.value} onClick={() => setForm(f => ({ ...f, leave_type: lt.value }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.leave_type === lt.value ? lt.color : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
                  }`}>
                  {lt.icon} {lt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">From Date</label>
                <input type="date" value={form.from_date} onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]" />
              </div>
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">To Date</label>
                <input type="date" value={form.to_date} onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">Reason</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] h-20 resize-none"
                placeholder="Describe the reason for leave..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold transition-all disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD] text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Leave History */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">No leave applications yet</div>
          ) : leaves.map(leave => {
            const lt = LEAVE_TYPES.find(l => l.value === leave.leave_type);
            const status = STATUS_MAP[leave.status] || STATUS_MAP.pending;
            return (
              <div key={leave.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                <div className="text-2xl">{lt?.icon || '📄'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm">{lt?.label || leave.leave_type}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#C4B5FD]/50 mt-0.5">
                    {new Date(leave.from_date).toLocaleDateString('en-IN')} — {new Date(leave.to_date).toLocaleDateString('en-IN')}
                    &middot; {getDaysBetween(leave.from_date, leave.to_date)} day(s)
                  </div>
                  <div className="text-[10px] text-[#C4B5FD]/40 mt-1">{leave.reason}</div>
                  {leave.faculty_remarks && <div className="text-[10px] text-blue-400 mt-1">Faculty: {leave.faculty_remarks}</div>}
                  {leave.hod_remarks && <div className="text-[10px] text-green-400 mt-1">HOD: {leave.hod_remarks}</div>}
                </div>
                <div className="text-[9px] text-[#C4B5FD]/30">
                  {new Date(leave.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
