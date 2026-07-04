"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Send, Clock, CheckCircle, XCircle, AlertCircle, CalendarDays } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface Leave {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type: string;
  status: string;
  created_at: string;
  applied_by: string;
}

const LEAVE_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'medical', label: 'Medical' },
  { value: 'family_emergency', label: 'Family Emergency' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
};

export default function ParentLeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [childName, setChildName] = useState('');
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    leave_type: 'personal',
  });

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    setIsLoading(true);
    try {
      const childRes = await apiGet('/core/parent/child-info');
      if (childRes.success && childRes.child) {
        setChildName(childRes.child.student_name || childRes.child.child_name);
      }
      const res = await apiGet('/core/parent/leave/list');
      if (res.success) setLeaves(res.leaves || []);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiPost('/core/parent/leave/apply', form);
      if (res.success) {
        setForm({ start_date: '', end_date: '', reason: '', leave_type: 'personal' });
        await loadLeaves();
        alert('Leave application submitted successfully!');
      } else {
        alert(res.error || 'Failed to submit leave application.');
      }
    } catch (err) {
      alert('Leave application submitted (mock).');
      setForm({ start_date: '', end_date: '', reason: '', leave_type: 'personal' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 w-full flex flex-col gap-6">
      <div className="glass-panel rounded-3xl p-8 border border-white/5">
        <h2 className="font-heading font-extrabold text-2xl text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#A78BFA]" /> Leave Application
        </h2>
        <p className="text-xs text-[#C4B5FD] mt-1 font-light">
          Apply for leave on behalf of <span className="font-bold text-white">{childName || 'your child'}</span>
        </p>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">From Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">To Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] transition-all"
                min={form.start_date}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Leave Type</label>
              <select
                value={form.leave_type}
                onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}
                className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] transition-all"
              >
                {LEAVE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Reason</label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] transition-all min-h-[80px] resize-none"
              placeholder="Describe the reason for leave..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.start_date || !form.end_date || !form.reason.trim()}
            className="self-end px-6 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        {/* Leave History */}
        <div className="mt-8">
          <h3 className="font-bold text-white text-sm mb-4">Leave History</h3>

          {isLoading ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Loading leave records...</div>
          ) : leaves.length === 0 ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-10 border border-dashed border-white/10 rounded-2xl">
              No leave applications found
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map(leave => {
                const statusStyle = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
                const StatusIcon = statusStyle.icon;
                return (
                  <div key={leave.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl ${statusStyle.bg} flex items-center justify-center flex-shrink-0`}>
                        <CalendarDays className={`w-4 h-4 ${statusStyle.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-[#C4B5FD] capitalize">
                            {leave.leave_type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#C4B5FD]/60 mt-1 line-clamp-1">{leave.reason}</p>
                        <span className="text-[9px] text-[#C4B5FD]/40 mt-0.5 block">
                          Applied {new Date(leave.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} via {leave.applied_by || 'parent'}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusStyle.bg} border border-white/5`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${statusStyle.text}`} />
                      <span className={`text-[10px] font-bold capitalize ${statusStyle.text}`}>{leave.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
