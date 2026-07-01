"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, Clock, CheckCircle2, XCircle, 
  User, MapPin, MessageSquare, Loader2, RefreshCw,
  AlertTriangle, Filter
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

export default function WardenLeaveRequestsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadLeaves();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/hostel/leaves');
      if (res.success) {
        setLeaves(res.leave_requests || []);
      } else {
        throw new Error(res.error || 'Failed to fetch');
      }
    } catch (err: any) {
      console.error('Failed to load leave requests:', err);
      // Fallback to mock data
      setLeaves([
        {
          id: 'mock-l1',
          student_id: 'c0000000-0000-0000-0000-000000000006',
          leave_from: '2026-06-25',
          leave_to: '2026-06-28',
          reason: 'Medical checkup and follow-up treatment at AIIMS hospital. Doctor has recommended rest.',
          destination: 'New Delhi, AIIMS Hospital',
          parent_consent: true,
          status: 'pending',
          approval_notes: null,
          created_at: new Date().toISOString(),
          students: { name: 'Khushal Gehlot', roll_number: '23CSE051' }
        },
        {
          id: 'mock-l2',
          student_id: 'c0000000-0000-0000-0000-000000000007',
          leave_from: '2026-06-22',
          leave_to: '2026-06-24',
          reason: "Sister's wedding ceremony at home.",
          destination: 'Jodhpur, Rajasthan',
          parent_consent: true,
          status: 'approved',
          approval_notes: 'Approved. Please return by 10 PM on 24th.',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          students: { name: 'Aarav Mehta', roll_number: '23CSE052' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    const notes = decision === 'approved'
      ? prompt('Approval notes (optional):', 'Leave approved. Please return on time.')
      : prompt('Rejection reason (required):', 'Request rejected. Insufficient reason provided.');

    if (notes === null) return; // User cancelled

    setProcessingId(id);
    try {
      const res = await apiPut(`/hostel/leaves/${id}/approve`, {
        status: decision,
        approval_notes: notes || (decision === 'approved' ? 'Approved.' : 'Rejected.')
      });
      if (res.success) {
        setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: decision, approval_notes: notes } : l));
        showToast(`Leave request ${decision} successfully!`, 'success');
      } else {
        showToast(res.error || 'Failed to update.', 'error');
      }
    } catch (err) {
      // Mock fallback
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: decision, approval_notes: notes } : l));
      showToast(`Leave ${decision}! (Mock Mode)`, 'success');
    } finally {
      setProcessingId(null);
    }
  };

  const leaveTypeColors: Record<string, string> = {
    medical: 'bg-red-500/15 text-red-400 border-red-500/30',
    personal: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    family_emergency: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    academic: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const filtered = leaves.filter(l => statusFilter === 'all' || l.status === statusFilter);

  const counts = {
    all: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  const statusConfig = {
    pending: { color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: <Clock size={12} /> },
    approved: { color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: <CheckCircle2 size={12} /> },
    rejected: { color: 'text-red-400 bg-red-500/15 border-red-500/30', icon: <XCircle size={12} /> },
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg border transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck size={24} className="text-emerald-400" />
            Leave Requests
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review and manage student outbound leave applications</p>
        </div>
        <button
          onClick={loadLeaves}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Total', color: 'text-white', bg: 'bg-white/5' },
          { key: 'pending', label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { key: 'approved', label: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { key: 'rejected', label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setStatusFilter(stat.key)}
            className={`${stat.bg} rounded-xl p-4 border transition-all text-left ${
              statusFilter === stat.key ? 'border-white/20 shadow-md' : 'border-white/5 hover:border-white/10'
            }`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{counts[stat.key as keyof typeof counts]}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Filter size={14} className="text-slate-500 mt-2" />
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              statusFilter === f ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {f}
            {f !== 'all' && counts[f as keyof typeof counts] > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                {counts[f as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarCheck size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 font-medium">No {statusFilter !== 'all' ? statusFilter : ''} leave requests</p>
          <p className="text-slate-600 text-xs mt-1">Student leave applications will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(leave => {
            const cfg = statusConfig[leave.status as keyof typeof statusConfig] || statusConfig.pending;
            const isProcessing = processingId === leave.id;
            const fromDate = new Date(leave.leave_from);
            const toDate = new Date(leave.leave_to);
            const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            return (
              <div key={leave.id} className={`bg-white/5 rounded-2xl border transition-all ${
                leave.status === 'pending' ? 'border-amber-500/20' : 'border-white/10'
              }`}>
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">
                            {leave.students?.name || 'Student'}
                          </h3>
                          {leave.leave_type && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${leaveTypeColors[leave.leave_type] || leaveTypeColors.other}`}>
                              {leave.leave_type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Roll: {leave.students?.roll_number || '—'} • Applied: {new Date(leave.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold capitalize ${cfg.color}`}>
                      {cfg.icon} {leave.status}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">From</p>
                      <p className="text-sm font-bold text-white">{fromDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">To</p>
                      <p className="text-sm font-bold text-white">{toDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Duration</p>
                      <p className="text-sm font-bold text-white">{days} day{days !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-xs">
                      <MessageSquare size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500 font-semibold">Reason: </span>
                        <span className="text-slate-300">{leave.reason}</span>
                      </div>
                    </div>
                    {leave.destination && (
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-slate-500 font-semibold">Destination: </span>
                          <span className="text-slate-300">{leave.destination}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <AlertTriangle size={12} className={leave.parent_consent ? 'text-emerald-400' : 'text-red-400'} />
                      <span className={`font-semibold ${leave.parent_consent ? 'text-emerald-400' : 'text-red-400'}`}>
                        Parent Consent: {leave.parent_consent ? 'Confirmed' : 'Not Provided'}
                      </span>
                    </div>
                  </div>

                  {/* Approval Notes */}
                  {leave.approval_notes && (
                    <div className="bg-white/5 rounded-xl p-3 mb-4 border-l-2 border-emerald-500/50">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Warden Notes</p>
                      <p className="text-xs text-slate-300 italic">"{leave.approval_notes}"</p>
                    </div>
                  )}

                  {/* Actions (only for pending) */}
                  {leave.status === 'pending' && (
                    <div className="flex gap-3 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleDecision(leave.id, 'approved')}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Approve Leave
                      </button>
                      <button
                        onClick={() => handleDecision(leave.id, 'rejected')}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject Leave
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
