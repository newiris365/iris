"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, RefreshCw } from 'lucide-react';

interface PendingLeave {
  id: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
}

export default function HodLeaveApprovals() {
  const [requests, setRequests] = useState<PendingLeave[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reject reason dialog
  const [showReject, setShowReject] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock pending leaves for HOD
      setRequests([
        { id: 'l-rec-1', employee_name: 'Prof. Satish Kumar', leave_type: 'Casual Leave (CL)', from_date: '2026-06-12', to_date: '2026-06-13', total_days: 2, reason: 'Out of station for domestic urgent work.' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/hr/leave/${id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.filter(r => r.id !== id));
        alert('Leave request approved.');
      }
    } catch (err) {
      setRequests(prev => prev.filter(r => r.id !== id));
      alert('Leave request approved locally.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/v1/hr/leave/${selectedId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: rejectReason })
      });
      setRequests(prev => prev.filter(r => r.id !== selectedId));
      setShowReject(false);
      setRejectReason('');
      alert('Leave request rejected.');
    } catch (err) {
      setRequests(prev => prev.filter(r => r.id !== selectedId));
      setShowReject(false);
      setRejectReason('');
      alert('Leave request rejected locally.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Team Approvals desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Pending Leave Requests</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Review and approve leave applications submitted by reporting employees in your department.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading leave requests...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-white/5 text-center text-xs text-[#C4B5FD]/50">
              No pending leave requests in your department queue.
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-2.5 max-w-[70%]">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-sm text-white">{req.employee_name}</h3>
                    <span className="text-[9px] font-bold text-[#A78BFA] uppercase px-2.5 py-0.5 rounded bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 font-mono">
                      {req.leave_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white font-bold">
                    <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                    <span>{req.from_date} to {req.to_date} ({req.total_days} Days)</span>
                  </div>
                  <p className="text-xs text-[#C4B5FD]/85 leading-normal font-semibold">Reason: {req.reason}</p>
                </div>

                <div className="flex gap-2.5 w-full md:w-auto flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedId(req.id);
                      setShowReject(true);
                    }}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/35 text-red-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Reject Request
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve Leave
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REJECT DIALOG */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Reject Leave Application</h2>
              <button onClick={() => setShowReject(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Rejection Reason *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide rejection comments to employee..."
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
                >
                  Reject Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
