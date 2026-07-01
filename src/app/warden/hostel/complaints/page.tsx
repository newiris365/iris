"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';
import Link from 'next/link';

export default function WardenComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Assign modal state
  const [assigningComp, setAssigningComp] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  
  // Resolve modal state
  const [resolvingComp, setResolvingComp] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mock staff list for assignment
  const staffMembers = [];

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const res = await apiGet(`/hostel/complaints?t=${Date.now()}`);
      if (res.success) {
        setComplaints(res.complaints || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComp || !selectedStaff) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPut(`/hostel/complaints/${assigningComp.id}/assign`, {
        staff_id: selectedStaff
      });
      if (res.success) {
        setSuccessMsg('Complaint assigned successfully.');
        setAssigningComp(null);
        setSelectedStaff('');
        loadComplaints();
      } else {
        setErrorMsg(res.error || 'Failed to assign complaint.');
      }
    } catch {
      // Mock Assign
      setComplaints(
        complaints.map(c =>
          c.id === assigningComp.id ? { ...c, status: 'assigned', assigned_to: selectedStaff } : c
        )
      );
      setSuccessMsg('Complaint assigned successfully! (Mock)');
      setAssigningComp(null);
      setSelectedStaff('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComp) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPut(`/hostel/complaints/${resolvingComp.id}/status`, {
        status: 'resolved',
        resolution_notes: resolutionNotes || 'Resolved'
      });
      if (res.success) {
        setSuccessMsg('Complaint resolved successfully.');
        setResolvingComp(null);
        setResolutionNotes('');
        loadComplaints();
      } else {
        setErrorMsg(res.error || 'Failed to resolve complaint.');
      }
    } catch {
      // Mock Resolve
      setComplaints(
        complaints.map(c =>
          c.id === resolvingComp.id
            ? { ...c, status: 'resolved', resolution_notes: resolutionNotes || 'Resolved', resolved_at: new Date().toISOString() }
            : c
        )
      );
      setSuccessMsg('Complaint resolved successfully! (Mock)');
      setResolvingComp(null);
      setResolutionNotes('');
    } finally {
      setSubmitting(false);
    }
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
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'assigned':
      case 'in progress':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#A78BFA]" />;
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'open') return c.status === 'open';
    if (filter === 'in_progress') return c.status === 'in_progress' || c.status === 'assigned';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/warden/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Warden Complaints Queue</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Oversee maintenance complaints, delegate services, and track issues</p>
            </div>
          </div>
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

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === f.key
                  ? 'bg-[#6C2BD9] text-white shadow-md'
                  : 'bg-white/5 text-[#C4B5FD]/60 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Assign Modal */}
        {assigningComp && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAssign} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#A78BFA]" /> Assign Service Staff
              </h3>

              <p className="text-xs text-[#C4B5FD]/70">
                Delegate the complaint <span className="font-bold text-white">"{assigningComp.title}"</span>.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Select Staff / Vendor</label>
                <select
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                  required
                >
                  <option value="">Choose Staff...</option>
                  {staffMembers.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningComp(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md"
                >
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resolve Modal */}
        {resolvingComp && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleResolve} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Resolve Complaint
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2 font-sans">Resolution Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about the work done..."
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingComp(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition-all shadow-md"
                >
                  {submitting ? 'Resolving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No complaints in this queue.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(comp => (
              <div key={comp.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 space-y-4 shadow-lg">
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{comp.title}</h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1 flex flex-wrap items-center gap-1.5">
                      <span>Room: <span className="font-semibold text-white">{comp.hostel_rooms?.room_number || 'N/A'}</span></span>
                      <span>•</span>
                      <span>By: <span className="font-semibold text-[#A78BFA]">{comp.students?.name} ({comp.students?.roll_number})</span></span>
                      <span>•</span>
                      <span>Raised {new Date(comp.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${getPriorityColor(comp.priority)}`}>
                      {comp.priority}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-semibold capitalize">
                      {getStatusIcon(comp.status)}
                      {comp.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">
                  {comp.description}
                </p>

                {(comp.status === 'open' || (comp.status === 'in_progress' && !comp.assigned_to)) && (
                  <div className="pt-3 border-t border-white/5 flex gap-2 justify-end">
                    <button
                      onClick={() => setAssigningComp(comp)}
                      className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Assign Staff
                    </button>
                  </div>
                )}

                {(comp.status === 'assigned' || comp.status === 'in_progress') && (
                  <div className="pt-3 border-t border-white/5 flex gap-2 justify-end">
                    {!comp.assigned_to && (
                      <button
                        onClick={() => setAssigningComp(comp)}
                        className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Assign Staff
                      </button>
                    )}
                    <button
                      onClick={() => setResolvingComp(comp)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark as Resolved
                    </button>
                  </div>
                )}

                {comp.status === 'resolved' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Resolution Remarks</p>
                    <p className="text-xs text-[#C4B5FD]/80 italic">"{comp.resolution_notes || 'No remarks provided.'}"</p>
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
