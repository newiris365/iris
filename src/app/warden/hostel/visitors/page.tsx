"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Phone, CheckCircle, ShieldCheck, Clock, FileText, Send, UserCheck, LogOut, Check, X, ShieldAlert } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function WardenVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    visitor_name: '',
    visitor_phone: '',
    visitor_id_type: 'Aadhaar',
    visitor_id_number: '',
    purpose: '',
    relation: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const res = await apiGet('/hostel/visitors');
      if (res.success) {
        setVisitors(res.visitors || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.visitor_name || !form.visitor_id_number) {
      setErrorMsg('Please enter Student ID, Guest Name, and ID proof number.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPost('/hostel/visitors', form);
      if (res.success) {
        setSuccessMsg('Visitor logged in successfully at main gate.');
        setShowRegisterForm(false);
        setForm({
          student_id: '',
          visitor_name: '',
          visitor_phone: '',
          visitor_id_type: 'Aadhaar',
          visitor_id_number: '',
          purpose: '',
          relation: ''
        });
        loadVisitors();
      } else {
        setErrorMsg(res.error || 'Failed to register visitor.');
      }
    } catch {
      // Mock log
      const newVis = {
        id: 'mock-vis-' + Math.random(),
        visitor_name: form.visitor_name,
        visitor_phone: form.visitor_phone,
        visitor_id_type: form.visitor_id_type,
        visitor_id_number: form.visitor_id_number,
        relation: form.relation,
        purpose: form.purpose,
        gate_pass_id: 'GP-VIS' + Math.floor(Math.random() * 900 + 100) + 'X',
        in_time: new Date().toISOString(),
        status: 'inside',
        is_approved: true,
        students: { name: 'Direct Registered Student', roll_number: 'CS24B1001' }
      };
      setVisitors([newVis, ...visitors]);
      setSuccessMsg('Visitor logged in successfully at main gate. (Mock)');
      setShowRegisterForm(false);
      setForm({
        student_id: '',
        visitor_name: '',
        visitor_phone: '',
        visitor_id_type: 'Aadhaar',
        visitor_id_number: '',
        purpose: '',
        relation: ''
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (visitorId: string, approve: boolean) => {
    try {
      const res = await apiPost(`/hostel/visitors/${visitorId}/approve`, { approve });
      if (res.success) {
        setSuccessMsg(approve ? 'Visitor pass approved successfully.' : 'Visitor pass rejected.');
        loadVisitors();
      } else {
        setErrorMsg(res.error || 'Failed to update pass.');
      }
    } catch {
      setVisitors(
        visitors.map(v =>
          v.id === visitorId ? { ...v, is_approved: approve, status: approve ? 'approved' : 'rejected' } : v
        )
      );
      setSuccessMsg(approve ? 'Visitor pass approved! (Mock)' : 'Visitor pass rejected! (Mock)');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleCheckin = async (visitorId: string) => {
    try {
      const res = await apiPost(`/hostel/visitors/${visitorId}/checkin`, {});
      if (res.success) {
        setSuccessMsg('Visitor checked in successfully.');
        loadVisitors();
      } else {
        setErrorMsg(res.error || 'Failed to check in.');
      }
    } catch {
      setVisitors(
        visitors.map(v =>
          v.id === visitorId ? { ...v, status: 'inside', in_time: new Date().toISOString() } : v
        )
      );
      setSuccessMsg('Visitor checked in successfully! (Mock)');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleCheckout = async (visitorId: string) => {
    try {
      const res = await apiPost(`/hostel/visitors/${visitorId}/checkout`, {});
      if (res.success) {
        setSuccessMsg('Visitor checked out successfully.');
        loadVisitors();
      }
    } catch {
      setVisitors(
        visitors.map(v =>
          v.id === visitorId ? { ...v, status: 'checked_out', out_time: new Date().toISOString() } : v
        )
      );
      setSuccessMsg('Visitor checked out successfully! (Mock)');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/warden/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Warden Visitor Logs</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Check real-time gate passes, register visitors, and close logs on checkout</p>
            </div>
          </div>

          <button
            onClick={() => setShowRegisterForm(true)}
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Register Visitor
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
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

        {/* Register Visitor Overlay */}
        {showRegisterForm && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#A78BFA]" /> Register Visitor Arriving
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Student ID (UUID)</label>
                  <input
                    type="text"
                    placeholder="e.g. s0000000-0000-0000-0000-000000000001"
                    value={form.student_id}
                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Guest Name</label>
                    <input
                      type="text"
                      placeholder=""
                      value={form.visitor_name}
                      onChange={e => setForm({ ...form, visitor_name: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Guest Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9999999999"
                      value={form.visitor_phone}
                      onChange={e => setForm({ ...form, visitor_phone: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">ID Proof Type</label>
                    <select
                      value={form.visitor_id_type}
                      onChange={e => setForm({ ...form, visitor_id_type: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="Driving License">Driving License</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="College ID">College ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">ID Number</label>
                    <input
                      type="text"
                      placeholder="e.g. XXXX-XXXX-1234"
                      value={form.visitor_id_number}
                      onChange={e => setForm({ ...form, visitor_id_number: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Relation</label>
                    <input
                      type="text"
                      placeholder="e.g. Father / Cousin"
                      value={form.relation}
                      onChange={e => setForm({ ...form, relation: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Purpose</label>
                    <input
                      type="text"
                      placeholder="e.g. Leave materials"
                      value={form.purpose}
                      onChange={e => setForm({ ...form, purpose: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Visitors Listing */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No visitor logs recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {visitors.map((vis) => (
              <div key={vis.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{vis.visitor_name}</h3>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-[#C4B5FD]/50 font-mono">
                      {vis.relation || 'Guest'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(vis.status)}`}>
                      {getStatusIcon(vis.status)}
                      {getStatusLabel(vis.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/50">
                    Host Student: <span className="font-semibold text-[#A78BFA]">{vis.students?.name || 'Sandbox Student'} ({vis.students?.roll_number || 'Sandbox Roll'})</span>
                  </p>
                  <p className="text-[10px] text-[#C4B5FD]/50">
                    Purpose: {vis.purpose} • ID: {vis.visitor_id_type} ({vis.visitor_id_number})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-xs">
                    <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">Gate Pass</p>
                    <p className="font-bold text-white mt-0.5 font-mono">{vis.gate_pass_id}</p>
                  </div>

                  <div className="text-xs">
                    <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">In / Out Time</p>
                    {vis.in_time ? (
                      <p className="text-[10px] text-white mt-0.5 font-mono">In: {new Date(vis.in_time).toLocaleTimeString()}</p>
                    ) : (
                      <p className="text-[10px] text-[#C4B5FD]/40 mt-0.5 font-mono italic">Not Checked In</p>
                    )}
                    {vis.out_time && (
                      <p className="text-[10px] text-[#C4B5FD]/60 font-mono">Out: {new Date(vis.out_time).toLocaleTimeString()}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(vis.status === 'approved' || vis.status === 'inside' || vis.status === 'checked_out') && (
                      <a
                        href={`/api/v1/hostel/visitors/${vis.id}/gatepass`}
                        target="_blank"
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD]/80 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                        title="Download PDF Pass"
                      >
                        <FileText className="w-4 h-4" /> PDF Pass
                      </a>
                    )}

                    {vis.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(vis.id, false)}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(vis.id, true)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    )}

                    {vis.status === 'approved' && (
                      <button
                        onClick={() => handleCheckin(vis.id)}
                        className="px-3 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all flex items-center gap-1 shadow-md shadow-[#6C2BD9]/20"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Check In
                      </button>
                    )}

                    {vis.status === 'inside' && (
                      <button
                        onClick={() => handleCheckout(vis.id)}
                        className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Checkout
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
