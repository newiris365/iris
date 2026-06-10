"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Send, ShieldAlert, CheckCircle, Clock, XCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StudentLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    leave_from: '',
    leave_to: '',
    reason: '',
    destination: '',
    parent_consent: false
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/hostel/leaves/student/${studentId}`);
      if (res.success) {
        setLeaves(res.leave_requests || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setLeaves([
        {
          id: 'l1',
          leave_from: '2026-06-12',
          leave_to: '2026-06-15',
          reason: 'Sister\'s marriage ceremony in hometown',
          destination: 'Jaipur, Rajasthan',
          parent_consent: true,
          status: 'pending',
          approval_notes: null,
          created_at: '2026-06-09T10:00:00Z'
        },
        {
          id: 'l2',
          leave_from: '2026-05-20',
          leave_to: '2026-05-24',
          reason: 'Severe illness and home recovery recommended by doctor',
          destination: 'New Delhi',
          parent_consent: true,
          status: 'approved',
          approval_notes: 'Take care and submit medical certificate upon return.',
          created_at: '2026-05-18T14:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_from || !form.leave_to || !form.reason.trim()) {
      setErrorMsg('Please enter outbound/inbound dates and a valid reason.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const payload = {
        student_id: studentId,
        ...form
      };

      const res = await apiPost('/hostel/leaves', payload);
      if (res.success) {
        setSuccessMsg('Leave request submitted successfully!');
        setForm({ leave_from: '', leave_to: '', reason: '', destination: '', parent_consent: false });
        loadLeaves();
      } else {
        setErrorMsg(res.error || 'Failed to submit leave request.');
      }
    } catch {
      // Mock submission
      const newLeave = {
        id: 'mock-' + Math.random(),
        leave_from: form.leave_from,
        leave_to: form.leave_to,
        reason: form.reason,
        destination: form.destination,
        parent_consent: form.parent_consent,
        status: 'pending',
        approval_notes: null,
        created_at: new Date().toISOString()
      };
      setLeaves([newLeave, ...leaves]);
      setSuccessMsg('Leave request submitted successfully! (Mock Mode)');
      setForm({ leave_from: '', leave_to: '', reason: '', destination: '', parent_consent: false });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-3">
          <Link href="/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-extrabold text-xl">Outbound Leave Registry</h1>
            <p className="text-[10px] text-[#C4B5FD]/50">Request warden permission to leave campus premises</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Apply Form */}
        <div className="lg:col-span-1">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A78BFA]" /> Apply For Leave
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-4">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-4">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-5 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">From Date</label>
                <input
                  type="date"
                  value={form.leave_from}
                  onChange={e => setForm({ ...form, leave_from: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">To Date</label>
                <input
                  type="date"
                  value={form.leave_to}
                  onChange={e => setForm({ ...form, leave_to: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Destination Address</label>
              <input
                type="text"
                placeholder="e.g. 104, Malviya Nagar, Jaipur"
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#6C2BD9]/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Reason for Leave</label>
              <textarea
                rows={3}
                placeholder="Detailed reason for requesting hostel departure..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#6C2BD9]/50 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
              <input
                type="checkbox"
                id="parent_consent"
                checked={form.parent_consent}
                onChange={e => setForm({ ...form, parent_consent: e.target.checked })}
                className="mt-1 accent-[#6C2BD9]"
              />
              <label htmlFor="parent_consent" className="text-[10px] text-[#C4B5FD]/70 leading-relaxed cursor-pointer select-none">
                I confirm that my parents/guardian are aware of this travel and have consented to my departure.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] disabled:bg-[#6C2BD9]/50 text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Requests History */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-bold text-white mb-4">Leave Request History</h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
              No leave history recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((lv) => (
                <div key={lv.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 space-y-4 shadow-lg">
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{new Date(lv.leave_from).toLocaleDateString()}</span>
                        <span className="text-[#C4B5FD]/40">to</span>
                        <span>{new Date(lv.leave_to).toLocaleDateString()}</span>
                      </h4>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                        Applied on {new Date(lv.created_at || new Date()).toLocaleDateString()}
                      </p>
                    </div>

                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${getStatusClass(lv.status)}`}>
                      {getStatusIcon(lv.status)}
                      {lv.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">Reason:</span> {lv.reason}</p>
                    {lv.destination && (
                      <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">Destination:</span> {lv.destination}</p>
                    )}
                    <p className="text-[#C4B5FD]/90 flex items-center gap-2">
                      <span className="text-[#C4B5FD]/40 font-semibold">Parent Consent:</span> 
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${lv.parent_consent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {lv.parent_consent ? 'Verified' : 'No Consent'}
                      </span>
                    </p>
                  </div>

                  {lv.approval_notes && (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-[#C4B5FD]/40 font-bold uppercase">Warden Comments</p>
                      <p className="text-xs text-[#C4B5FD]/80 mt-1 italic">"{lv.approval_notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
