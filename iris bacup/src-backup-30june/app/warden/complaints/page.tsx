"use client";

import React, { useState, useEffect } from 'react';
import {
  Bell, Clock, CheckCircle2, XCircle, Wrench, AlertTriangle,
  User, MapPin, Tag, Loader2, RefreshCw, Filter, MessageSquare,
  Star, Wifi, Droplets, Zap, Shield, Utensils, Users, HelpCircle
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

const CATEGORY_ICONS: Record<string, any> = {
  maintenance: Wrench,
  cleanliness: AlertTriangle,
  electrical: Zap,
  plumbing: Droplets,
  internet: Wifi,
  security: Shield,
  food: Utensils,
  roommate: Users,
  other: HelpCircle,
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function WardenComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [modalAction, setModalAction] = useState<'in_progress' | 'resolved' | 'closed'>('in_progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/hostel/complaints');
      if (res.success) {
        setComplaints(res.complaints || []);
      } else {
        throw new Error(res.error || 'Failed to load');
      }
    } catch (err: any) {
      setToast({ msg: err.message || 'Failed to load complaints from server.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (complaint: any, action: 'in_progress' | 'resolved' | 'closed') => {
    setSelectedComplaint(complaint);
    setModalAction(action);
    setModalError('');
    setResolutionNotes(
      action === 'in_progress' ? 'Issue acknowledged. Team dispatched to investigate.' :
      action === 'resolved' ? 'Issue has been resolved. Please verify and rate the resolution.' :
      'Complaint closed after review.'
    );
  };

  const closeModal = () => {
    setSelectedComplaint(null);
    setModalError('');
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    setModalError('');

    try {
      const res = await apiPut(`/hostel/complaints/${selectedComplaint.id}/status`, {
        status: modalAction,
        resolution_notes: resolutionNotes
      });

      if (res.success) {
        setComplaints(prev => prev.map(c =>
          c.id === selectedComplaint.id
            ? { ...c, status: modalAction, resolution_notes: resolutionNotes, resolved_at: modalAction === 'resolved' ? new Date().toISOString() : c.resolved_at }
            : c
        ));
        showToast(`Complaint marked as "${modalAction.replace('_', ' ')}" successfully!`);
        closeModal();
      } else {
        setModalError(res.error || 'Failed to update complaint status. Please try again.');
      }
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while updating the complaint status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter(c =>
    statusFilter === 'all' || c.status === statusFilter
  );

  const counts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    closed: complaints.filter(c => c.status === 'closed').length,
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'in_progress': return 'Mark In Progress';
      case 'resolved': return 'Mark Resolved';
      case 'closed': return 'Close Complaint';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitAction} className="rounded-3xl border border-white/10 bg-[#0F0D1F] p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {modalAction === 'resolved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : modalAction === 'in_progress' ? (
                  <Wrench className="w-5 h-5 text-blue-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400" />
                )}
                {getActionLabel(modalAction)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Complaint by <span className="font-semibold text-white">{selectedComplaint.students?.name || 'Student'}</span>
                {selectedComplaint.hostel_rooms?.room_number && (
                  <span> • Room {selectedComplaint.hostel_rooms.room_number}</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs font-semibold text-white">{selectedComplaint.title}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {modalAction === 'resolved' ? 'Resolution Notes (Required)' : 'Action Notes'}
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                required={modalAction === 'resolved'}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none resize-none transition-all"
                placeholder="Describe the action taken or resolution provided..."
              />
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                ⚠️ {modalError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  modalAction === 'resolved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/50'
                    : modalAction === 'in_progress'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  getActionLabel(modalAction)
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={24} className="text-orange-400" />
            Hostel Complaints
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review, assign, and resolve student maintenance issues</p>
        </div>
        <button
          onClick={loadComplaints}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'Total', color: 'text-white', bg: 'bg-white/5' },
          { key: 'open', label: 'Open', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { key: 'in_progress', label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { key: 'resolved', label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { key: 'closed', label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-500/10' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setStatusFilter(stat.key)}
            className={`${stat.bg} rounded-xl p-3 border text-left transition-all ${
              statusFilter === stat.key ? 'border-white/20 shadow-md' : 'border-white/5 hover:border-white/10'
            }`}
          >
            <p className={`text-xl font-bold ${stat.color}`}>{counts[stat.key as keyof typeof counts]}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 items-center">
        <Filter size={14} className="text-slate-500" />
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              statusFilter === f ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-orange-400" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 font-medium">No {statusFilter !== 'all' ? statusFilter.replace('_', ' ') : ''} complaints</p>
          <p className="text-slate-600 text-xs mt-1">Student maintenance requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map(c => {
            const CatIcon = CATEGORY_ICONS[c.category] || Wrench;
            const priStyle = PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.medium;
            const statStyle = STATUS_STYLES[c.status] || STATUS_STYLES.open;
            const isActive = c.status === 'open' || c.status === 'assigned' || c.status === 'in_progress';

            return (
              <div key={c.id} className={`rounded-2xl border transition-all bg-[#0F0D1F]/80 ${isActive ? 'border-orange-500/20' : 'border-white/5'}`}>
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <CatIcon size={18} className="text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{c.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">
                          {c.category} • {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${priStyle}`}>
                        {c.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${statStyle}`}>
                        {c.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Student & Room */}
                  <div className="flex flex-wrap gap-4 mb-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User size={12} /> {c.students?.name || 'Student'} ({c.students?.roll_number || '—'})
                    </span>
                    {c.hostel_rooms?.room_number && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} /> Room {c.hostel_rooms.room_number}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{c.description}</p>

                  {/* Resolution notes if any */}
                  {c.resolution_notes && (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-4">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Resolution Notes</p>
                      <p className="text-xs text-slate-300 italic">"{c.resolution_notes}"</p>
                      {c.resolved_at && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Resolved on {new Date(c.resolved_at).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Student rating */}
                  {c.student_rating && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[10px] text-slate-500">Student Rating:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            className={idx < c.student_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isActive && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                      {(c.status === 'open' || c.status === 'assigned') && (
                        <button
                          onClick={() => openModal(c, 'in_progress')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 font-bold text-xs transition-all"
                        >
                          <Wrench size={12} /> Work On It
                        </button>
                      )}
                      <button
                        onClick={() => openModal(c, 'resolved')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 font-bold text-xs transition-all"
                      >
                        <CheckCircle2 size={12} /> Mark Resolved
                      </button>
                      <button
                        onClick={() => openModal(c, 'closed')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/40 text-slate-400 font-bold text-xs transition-all"
                      >
                        <XCircle size={12} /> Close
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
