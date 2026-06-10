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
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/hostel/complaints?studentId=${studentId}`);
      if (res.success) {
        setComplaints(res.complaints || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setComplaints([
        {
          id: 'c1',
          title: 'Wi-Fi connection drops repeatedly',
          category: 'internet',
          description: 'The Wi-Fi router in the lobby keeps turning off. The signal inside B-304 is extremely weak.',
          priority: 'high',
          status: 'assigned',
          created_at: '2026-06-08T09:30:00Z',
          resolution_notes: null,
          student_rating: null,
          hostel_rooms: { room_number: 'B-304' }
        },
        {
          id: 'c2',
          title: 'Bathroom tap leakage',
          category: 'plumbing',
          description: 'The bathroom basin tap is dripping constantly, causing water wastage.',
          priority: 'medium',
          status: 'resolved',
          created_at: '2026-06-05T14:20:00Z',
          resolved_at: '2026-06-07T11:00:00Z',
          resolution_notes: 'Replaced washers in tap valve assembly.',
          student_rating: 4,
          hostel_rooms: { room_number: 'B-304' }
        }
      ]);
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
      // Mock rating
      setComplaints(complaints.map(c => c.id === complaintId ? { ...c, student_rating: rating } : c));
      showToast('Rating submitted! (Mock)');
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
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
