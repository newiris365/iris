"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, ArrowLeft, Plus, Star, MapPin } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      // Force demo student ID so the seeded data always shows up for testing
      const studentId = 'c0000000-0000-0000-0000-000000000006';

      const res = await apiGet(`/hostel/complaints?studentId=${studentId}&t=${Date.now()}`);
      if (res.success) {
        setComplaints(res.complaints || []);
      } else {
        throw new Error('API Error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load complaints from server');
    } finally {
      setLoading(false);
    }
  };

  const handleRateResolution = async (complaintId: string, rating: number) => {
    try {
      const res = await apiPost(`/hostel/complaints/${complaintId}/rate`, { rating });
      if (res.success) {
        setComplaints(complaints.map(c => c.id === complaintId ? { ...c, student_rating: rating } : c));
        showToast('Rating submitted successfully!');
      }
    } catch {
      showToast('Failed to submit rating to server');
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
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'in progress':
      case 'assigned':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#A78BFA]" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'Resolved';
      case 'assigned': return 'Assigned';
      case 'in_progress':
      case 'in progress': return 'In Progress';
      default: return 'Open';
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'open') return c.status !== 'resolved';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

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
              <h1 className="font-extrabold text-xl">My Maintenance Complaints</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Report repairs and track issues</p>
            </div>
          </div>
          <Link
            href="/hostel/complaints/new"
            className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Complaint
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'open', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-[#6C2BD9] text-white shadow-md'
                  : 'bg-white/5 text-[#C4B5FD]/60 hover:bg-white/10'
              }`}
            >
              {f === 'open' ? 'Active' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-24 text-[#C4B5FD]/30 text-xs">
            No complaints found in this category.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(comp => (
              <div key={comp.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 space-y-4 shadow-lg">
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{comp.title}</h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1 flex items-center gap-1.5">
                      <span className="capitalize">{comp.category}</span>
                      <span>•</span>
                      <span>Raised on {new Date(comp.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${getPriorityColor(comp.priority)}`}>
                      {comp.priority}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-semibold">
                      {getStatusIcon(comp.status)}
                      {getStatusLabel(comp.status)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">
                  {comp.description}
                </p>

                {/* Status Progress Tracker for active complaints */}
                {(comp.status === 'assigned' || comp.status === 'in_progress') && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <p className="text-[10px] text-amber-400 font-bold uppercase">
                        {comp.status === 'assigned' ? 'Staff Assigned — Work Pending' : 'Work In Progress'}
                      </p>
                    </div>
                    {/* Progress Steps */}
                    <div className="flex items-center gap-1 ml-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                      <div className="flex-1 h-0.5 bg-emerald-400" />
                      <div className={`w-2.5 h-2.5 rounded-full ring-2 ${comp.status === 'in_progress' ? 'bg-amber-400 ring-amber-400/30' : 'bg-white/10 ring-white/5'}`} />
                      <div className={`flex-1 h-0.5 ${comp.status === 'in_progress' ? 'bg-amber-400' : 'bg-white/10'}`} />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10 ring-2 ring-white/5" />
                    </div>
                    <div className="flex justify-between text-[8px] text-[#C4B5FD]/40 font-semibold uppercase">
                      <span className="text-emerald-400">Reported</span>
                      <span className={comp.status === 'in_progress' ? 'text-amber-400' : ''}>
                        {comp.status === 'assigned' ? 'Assigned' : 'In Progress'}
                      </span>
                      <span>Resolved</span>
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/60 mt-1">
                      Your complaint is being handled by the hostel maintenance team. You&apos;ll be notified when it&apos;s resolved.
                    </p>
                  </div>
                )}

                {comp.status === 'resolved' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">Resolution Remarks</p>
                      <p className="text-xs text-[#C4B5FD]/80 mt-1 italic">"{comp.resolution_notes || 'No remarks provided.'}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-[#C4B5FD]/40">How was your resolution experience?</span>
                      <div className="flex gap-1 items-center">
                        {comp.student_rating ? (
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < comp.student_rating ? 'fill-amber-400 text-amber-400' : 'text-white/15'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => handleRateResolution(comp.id, star)}
                                className="p-0.5 text-white/30 hover:text-amber-400 transition-colors"
                              >
                                <Star className="w-3.5 h-3.5 hover:fill-amber-400" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
