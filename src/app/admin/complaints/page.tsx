"use client";

import React, { useState, useEffect } from 'react';
import {
  Bell, Clock, CheckCircle2, XCircle, Wrench, AlertTriangle,
  User, Tag, Loader2, RefreshCw, Filter, ShieldAlert,
  Star, Wifi, Droplets, Zap, Shield, Utensils, Users, HelpCircle,
  GraduationCap, Bus, BookOpen, AlertCircle
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

const CATEGORY_ICONS: Record<string, any> = {
  academic: GraduationCap,
  harassment: ShieldAlert,
  infrastructure: Wrench,
  examination: AlertCircle,
  library: BookOpen,
  canteen: Utensils,
  hostel: Shield,
  transport: Bus,
  administration: Users,
  discrimination: ShieldAlert,
  other: HelpCircle,
};

const CATEGORY_LABELS: Record<string, string> = {
  academic: 'Academics',
  harassment: 'Harassment',
  infrastructure: 'Infrastructure',
  examination: 'Examinations',
  library: 'Library',
  canteen: 'Canteen & Mess',
  hostel: 'Hostel Curfew & Rooms',
  transport: 'Transport & Transit',
  administration: 'Administration',
  discrimination: 'Discrimination',
  other: 'General / Other',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  normal: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse',
};

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  acknowledged: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  under_investigation: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  resolution_proposed: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  appealed: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function AdminGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [modalAction, setModalAction] = useState<'acknowledged' | 'under_investigation' | 'resolution_proposed' | 'resolved' | 'closed'>('acknowledged');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    loadGrievances();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadGrievances = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/grievances/all');
      if (res.success) {
        setGrievances(res.grievances || []);
        setIsSandboxMode(false);
      } else {
        throw new Error(res.error || 'Failed to load');
      }
    } catch (err: any) {
      console.warn('Backend grievances fetch failed, loading high-fidelity sandbox fallback data:', err);
      // Sandbox fallback data of complaints across all modules
      setGrievances([
        {
          id: 'g1',
          category: 'hostel',
          subject: 'Broken fan regulator in Block A room 102',
          description: 'The fan speed regulator is completely broken and is running only at full speed. It is impossible to sleep at night.',
          status: 'under_investigation',
          priority: 'high',
          is_anonymous: false,
          submitted_by_name: 'Khushal Gehlot (23CSE051)',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          resolution_notes: 'Technician assigned to inspect regulator.'
        },
        {
          id: 'g2',
          category: 'canteen',
          subject: 'Cold food served at canteen counters',
          description: 'The dinner served in the main mess yesterday was completely cold by 8:30 PM. The warmer system seems to be switched off early.',
          status: 'submitted',
          priority: 'normal',
          is_anonymous: true,
          submitted_by_name: 'Anonymous Student',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'g3',
          category: 'academic',
          subject: 'Physics Lab equipment digital scale error',
          description: 'The digital weighing scales in Physics Lab 2 show fluctuating values and need recalibration. This is causing errors in students practical readings.',
          status: 'resolution_proposed',
          priority: 'normal',
          is_anonymous: false,
          submitted_by_name: 'Aishwarya Patil (22PHY012)',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          resolution_notes: 'Lab assistant has contacted the service agency for recalibration by this Saturday.'
        },
        {
          id: 'g4',
          category: 'transport',
          subject: 'Bus Route 4 repeatedly delayed',
          description: 'Bus Route 4 has been late by over 20 minutes for the past 3 days. Students are missing the morning 9 AM attendance session.',
          status: 'resolved',
          priority: 'high',
          is_anonymous: false,
          submitted_by_name: 'Rahul Sen (23ECE044)',
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          resolution_notes: 'Driver was notified to alter route bypass due to local traffic construction. Time tables normalized.'
        },
        {
          id: 'g5',
          category: 'library',
          subject: 'Air conditioning noise in reading room',
          description: 'The central AC unit in Reading Room C makes a loud buzzing sound. It is very difficult to concentrate on studying.',
          status: 'closed',
          priority: 'low',
          is_anonymous: false,
          submitted_by_name: 'Jaswant Singh (Faculty)',
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          resolution_notes: 'Maintenance service cleaned the filter and tightened the loose bracket. AC noise resolved.'
        }
      ]);
      setIsSandboxMode(true);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (g: any, action: typeof modalAction) => {
    setSelectedGrievance(g);
    setModalAction(action);
    setModalError('');
    setResolutionNotes(
      action === 'acknowledged' ? 'Grievance acknowledged. Concern department has been notified.' :
      action === 'under_investigation' ? 'Matter is under active investigation. We are verifying the details.' :
      action === 'resolution_proposed' ? 'Resolution proposed. Waiting for student confirmation.' :
      action === 'resolved' ? 'Grievance has been resolved. Action taken successfully.' :
      'Grievance closed after review.'
    );
  };

  const closeModal = () => {
    setSelectedGrievance(null);
    setModalError('');
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    setSubmitting(true);
    setModalError('');

    if (isSandboxMode) {
      // Simulate state updates locally
      setGrievances(prev => prev.map(g =>
        g.id === selectedGrievance.id
          ? { ...g, status: modalAction, resolution_notes: resolutionNotes, resolved_at: modalAction === 'resolved' ? new Date().toISOString() : g.resolved_at }
          : g
      ));
      showToast(`Complaint status updated to "${modalAction.replace('_', ' ')}"!`);
      setSubmitting(false);
      closeModal();
      return;
    }

    try {
      const res = await apiPut(`/grievances/${selectedGrievance.id}/status`, {
        status: modalAction,
        resolution_notes: resolutionNotes
      });

      if (res.success || res.old_status) { // support direct return payload
        setGrievances(prev => prev.map(g =>
          g.id === selectedGrievance.id
            ? { ...g, status: modalAction, resolution_notes: resolutionNotes, resolved_at: modalAction === 'resolved' ? new Date().toISOString() : g.resolved_at }
            : g
        ));
        showToast(`Complaint status updated successfully!`);
        closeModal();
      } else {
        setModalError(res.error || 'Failed to update complaint status.');
      }
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while updating status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGrievances = grievances.filter(g =>
    (statusFilter === 'all' || g.status === statusFilter) &&
    (categoryFilter === 'all' || g.category === categoryFilter)
  );

  const counts = {
    all: grievances.length,
    pending: grievances.filter(g => ['submitted', 'acknowledged', 'under_investigation', 'appealed'].includes(g.status)).length,
    resolved: grievances.filter(g => g.status === 'resolved' || g.status === 'resolution_proposed').length,
    closed: grievances.filter(g => g.status === 'closed').length,
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'acknowledged': return 'Acknowledge';
      case 'under_investigation': return 'Start Investigation';
      case 'resolution_proposed': return 'Propose Resolution';
      case 'resolved': return 'Mark Resolved';
      case 'closed': return 'Close Grievance';
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
      {selectedGrievance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitAction} className="rounded-3xl border border-white/10 bg-[#0F0D1F] p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                {getActionLabel(modalAction)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Submitted by <span className="font-semibold text-white">{selectedGrievance.submitted_by_name || 'Anonymous'}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs font-semibold text-white">{selectedGrievance.subject}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{selectedGrievance.description}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Action / Resolution Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                required
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none resize-none transition-all"
                placeholder="Describe the action taken or proposed resolution details..."
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
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 shadow-lg shadow-purple-900/50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Submit Action</span>
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
            Central Grievances Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review and resolve institutional complaints across all academic and infrastructure modules</p>
        </div>
        <button
          onClick={loadGrievances}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isSandboxMode && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>Note: Running in sandbox simulation mode. Live database table `grievances` remains uncreated. Configure database to enable permanent state storage.</span>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Total Claims', value: counts.all, color: 'text-white', bg: 'bg-white/5' },
          { key: 'pending', label: 'Pending / Active', value: counts.pending, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { key: 'resolved', label: 'Resolved / Proposed', value: counts.resolved, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { key: 'closed', label: 'Closed', value: counts.closed, color: 'text-slate-400', bg: 'bg-slate-500/10' },
        ].map(stat => (
          <div
            key={stat.key}
            className={`${stat.bg} rounded-xl p-3 border text-left border-white/5`}
          >
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <Filter size={13} className="text-slate-500" />
          <span className="text-xs text-slate-400">Status:</span>
          {['all', 'submitted', 'under_investigation', 'resolved', 'closed'].map(f => (
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

        <div className="h-4 w-px bg-white/10 hidden md:block" />

        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#13102A] border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grievances List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#6C2BD9]" />
        </div>
      ) : filteredGrievances.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 font-medium">No complaints found</p>
          <p className="text-slate-600 text-xs mt-1">Student grievances or institutional complaints will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrievances.map(g => {
            const CatIcon = CATEGORY_ICONS[g.category] || HelpCircle;
            const priStyle = PRIORITY_STYLES[g.priority] || PRIORITY_STYLES.normal;
            const statStyle = STATUS_STYLES[g.status] || STATUS_STYLES.submitted;
            const isPending = ['submitted', 'acknowledged', 'under_investigation', 'appealed'].includes(g.status);

            return (
              <div key={g.id} className={`rounded-2xl border transition-all bg-[#0F0D1F]/80 ${isPending ? 'border-orange-500/20' : 'border-white/5'}`}>
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <CatIcon size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{g.subject}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">
                          {CATEGORY_LABELS[g.category] || g.category} • {new Date(g.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${priStyle}`}>
                        {g.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold capitalize ${statStyle}`}>
                        {g.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Student Submission */}
                  <div className="flex flex-wrap gap-4 mb-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User size={12} /> Filed by: <span className="font-semibold text-white">{g.submitted_by_name || (g.is_anonymous ? 'Anonymous' : 'Student')}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{g.description}</p>

                  {/* Resolution notes if any */}
                  {g.resolution_notes && (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-4">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Resolution / Action Notes</p>
                      <p className="text-xs text-slate-300 italic">"{g.resolution_notes}"</p>
                      {g.resolved_at && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Resolved on {new Date(g.resolved_at).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isPending && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                      {g.status === 'submitted' && (
                        <button
                          onClick={() => openModal(g, 'acknowledged')}
                          className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40 text-blue-400 font-bold text-xs transition-all"
                        >
                          Acknowledge
                        </button>
                      )}
                      {(g.status === 'submitted' || g.status === 'acknowledged') && (
                        <button
                          onClick={() => openModal(g, 'under_investigation')}
                          className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/40 text-purple-400 font-bold text-xs transition-all"
                        >
                          Investigate
                        </button>
                      )}
                      <button
                        onClick={() => openModal(g, 'resolution_proposed')}
                        className="px-3 py-2 rounded-xl bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/30 border border-[#6C2BD9]/40 text-[#A78BFA] font-bold text-xs transition-all"
                      >
                        Propose Resolution
                      </button>
                      <button
                        onClick={() => openModal(g, 'resolved')}
                        className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 font-bold text-xs transition-all"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => openModal(g, 'closed')}
                        className="px-3 py-2 rounded-xl bg-slate-600/20 hover:bg-slate-600/30 border border-slate-600/40 text-slate-400 font-bold text-xs transition-all"
                      >
                        Close
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
