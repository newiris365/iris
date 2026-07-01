"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, ShieldAlert, Phone, Clock, FileText, CheckCircle, Plus, Sparkles, UserCheck } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StudentVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pass Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    visitor_name: '',
    visitor_phone: '',
    visitor_id_type: 'Aadhaar',
    visitor_id_number: '',
    purpose: 'Meet Parent / Family visit',
    relation: 'Father'
  });

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 'c0000000-0000-0000-0000-000000000006';

      const res = await apiGet(`/hostel/visitors?studentId=${studentId}`);
      if (res.success) {
        setVisitors(res.visitors || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setVisitors([
        {
          id: 'v1',
          visitor_name: 'Rajesh Mehta',
          visitor_phone: '+91 98765 43210',
          visitor_id_type: 'Aadhaar',
          visitor_id_number: 'XXXX XXXX 1234',
          relation: 'Father',
          purpose: 'Delivering winter clothing and home food',
          gate_pass_id: 'GP-VIS826X',
          in_time: new Date().toISOString(),
          status: 'inside',
          is_approved: true
        },
        {
          id: 'v2',
          visitor_name: 'Amit Sharma',
          visitor_phone: '+91 91111 22222',
          visitor_id_type: 'Driving License',
          visitor_id_number: 'DL-XXXXXX992',
          relation: 'Friend',
          purpose: 'Group study reference textbook delivery',
          gate_pass_id: 'GP-VIS103Q',
          in_time: '2026-06-08T15:00:00Z',
          out_time: '2026-06-08T16:30:00Z',
          status: 'checked_out',
          is_approved: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (visitorId: string, approve: boolean) => {
    try {
      const res = await apiPost(`/hostel/visitors/${visitorId}/approve`, { approve });
      if (res.success) {
        showToast(approve ? 'Guest entry approved.' : 'Guest entry rejected.');
        loadVisitors();
      } else {
        setErrorMsg(res.error || 'Failed to submit decision.');
      }
    } catch {
      setVisitors(
        visitors.map(v =>
          v.id === visitorId ? { ...v, is_approved: approve, status: approve ? 'inside' : 'rejected' } : v
        )
      );
      showToast(approve ? 'Guest entry approved! (Mock)' : 'Guest entry rejected! (Mock)');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name || !form.visitor_id_number) {
      setErrorMsg('Please enter Guest Name and ID proof number.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 'c0000000-0000-0000-0000-000000000006';

      const res = await apiPost('/hostel/visitors', {
        ...form,
        student_id: studentId
      });
      if (res.success) {
        showToast('Visitor pass requested successfully. Awaiting Warden approval.');
        setShowRequestModal(false);
        setForm({
          visitor_name: '',
          visitor_phone: '',
          visitor_id_type: 'Aadhaar',
          visitor_id_number: '',
          purpose: 'Meet Parent / Family visit',
          relation: 'Father'
        });
        loadVisitors();
      } else {
        setErrorMsg(res.error || 'Failed to submit request.');
      }
    } catch {
      // Mock Pass Request
      const newMockPass = {
        id: 'mock-pass-' + Math.random(),
        visitor_name: form.visitor_name,
        visitor_phone: form.visitor_phone,
        visitor_id_type: form.visitor_id_type,
        visitor_id_number: form.visitor_id_number,
        relation: form.relation,
        purpose: form.purpose,
        gate_pass_id: 'GP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        in_time: null,
        status: 'pending',
        is_approved: false
      };
      setVisitors([newMockPass, ...visitors]);
      showToast('Visitor pass requested successfully! (Mock)');
      setShowRequestModal(false);
      setForm({
        visitor_name: '',
        visitor_phone: '',
        visitor_id_type: 'Aadhaar',
        visitor_id_number: '',
        purpose: 'Meet Parent / Family visit',
        relation: 'Father'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getPriorityColor = (prio: string) => {
    const colors: Record<string, string> = {
      low: 'bg-white/5 text-[#C4B5FD]/50 border-white/5',
      medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      urgent: 'bg-red-500/15 text-red-400 border-red-500/20 animate-pulse'
    };
    return colors[prio] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inside':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'checked_out':
        return <CheckCircle className="w-3.5 h-3.5 text-slate-400" />;
      case 'approved':
        return <CheckCircle className="w-3.5 h-3.5 text-[#A78BFA]" />;
      case 'rejected':
        return <X className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inside': return 'Inside Campus';
      case 'checked_out': return 'Checked Out';
      case 'approved': return 'Pre-Approved';
      case 'rejected': return 'Rejected';
      default: return 'Awaiting Warden Approval';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inside':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'checked_out':
        return 'bg-white/5 text-[#C4B5FD]/40 border-white/5';
      case 'approved':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Visitor Access Registry</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Authorize safety logs, gatepasses, and guest entries</p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Request Visitor Pass
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {errorMsg}
          </div>
        )}

        {/* Request Pass Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmitRequest} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#A78BFA]" /> Request Visitor Pass
              </h3>

              <p className="text-xs text-[#C4B5FD]/60">
                Pre-register your parent or guest. The Warden will review and approve the pass.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Guest Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={form.visitor_name}
                      onChange={e => setForm({ ...form, visitor_name: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Relation</label>
                    <select
                      value={form.relation}
                      onChange={e => setForm({ ...form, relation: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Guest Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9999999999"
                    value={form.visitor_phone}
                    onChange={e => setForm({ ...form, visitor_phone: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">ID Proof Type</label>
                    <select
                      value={form.visitor_id_type}
                      onChange={e => setForm({ ...form, visitor_id_type: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    >
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="Driving License">Driving License</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">ID Number</label>
                    <input
                      type="text"
                      placeholder="e.g. XXXX-XXXX-1234"
                      value={form.visitor_id_number}
                      onChange={e => setForm({ ...form, visitor_id_number: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Purpose of Visit</label>
                  <input
                    type="text"
                    placeholder="e.g. Delivering luggage, meeting parents"
                    value={form.purpose}
                    onChange={e => setForm({ ...form, purpose: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Current & Previous Visitors</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No visitor logs recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {visitors.map((vis) => (
              <div key={vis.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 space-y-4 shadow-lg">
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{vis.visitor_name}</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-[#C4B5FD]/50 font-mono">
                        {vis.relation || 'Guest'}
                      </span>
                    </h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-[#C4B5FD]/40" /> {vis.visitor_phone || 'No Phone'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50 bg-[#6C2BD9]/20 px-2 py-0.5 rounded font-bold font-mono border border-[#6C2BD9]/30">
                      {vis.gate_pass_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(vis.status)}`}>
                      {getStatusIcon(vis.status)}
                      {getStatusLabel(vis.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">Purpose:</span> {vis.purpose}</p>
                    <p className="text-[#C4B5FD]/90 font-mono"><span className="text-[#C4B5FD]/40 font-sans font-semibold">ID Proof:</span> {vis.visitor_id_type} • {vis.visitor_id_number}</p>
                  </div>

                  <div className="space-y-1.5 md:text-right">
                    {vis.in_time ? (
                      <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">In Time:</span> {new Date(vis.in_time).toLocaleString()}</p>
                    ) : (
                      <p className="text-[#C4B5FD]/50 italic">Not checked in yet</p>
                    )}
                    {vis.out_time && (
                      <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">Out Time:</span> {new Date(vis.out_time).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {vis.status === 'inside' && !vis.is_approved && (
                  <div className="pt-3 border-t border-white/5 flex gap-3 justify-end">
                    <button
                      onClick={() => handleDecision(vis.id, false)}
                      className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Deny Access
                    </button>
                    <button
                      onClick={() => handleDecision(vis.id, true)}
                      className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Entry
                    </button>
                  </div>
                )}

                {(vis.is_approved || vis.status === 'approved') && (
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-emerald-400">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Pass Approved & Ready</span>
                    <a
                      href={`/api/v1/hostel/visitors/${vis.id}/gatepass`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4B5FD]/80 hover:text-white transition-all font-bold flex items-center gap-1 border border-white/5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Get PDF Pass
                    </a>
                  </div>
                )}

                {vis.status === 'pending' && (
                  <div className="pt-3 border-t border-white/5 text-[10px] text-amber-400 italic">
                    Waiting for Warden approval. You'll receive the gatepass PDF once approved.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
