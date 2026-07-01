"use client";

import React, { useState, useEffect } from 'react';
import {
  Award, CheckCircle2, XCircle, Clock, Filter, MessageSquare
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface LeaveApplication {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  student_name: string;
  roll_number: string;
  faculty_remarks?: string;
  hod_remarks?: string;
}

export default function FacultyLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/faculty/leaves/pending');
      if (res.success) setLeaves(res.leaves || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/faculty/leaves/${id}/approve`, { remarks });
      if (res.success) {
        setLeaves(leaves.filter(l => l.id !== id));
        setExpandedId(null);
        setRemarks('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/faculty/leaves/${id}/reject`, { remarks });
      if (res.success) {
        setLeaves(leaves.filter(l => l.id !== id));
        setExpandedId(null);
        setRemarks('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeaves = leaves.filter((l) =>
    (statusFilter === 'all' || l.status === statusFilter) &&
    (typeFilter === 'all' || l.leave_type === typeFilter)
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400',
    faculty_approved: 'bg-blue-500/20 text-blue-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  const leaveTypes = ['Sick', 'Casual', 'Medical', 'Personal', 'Official', 'Other'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Award size={24} className="text-amber-400" />
        Leave Approvals
        {leaves.length > 0 && (
          <span className="bg-amber-500/20 text-amber-400 text-sm px-2 py-0.5 rounded-full">
            {leaves.length} pending
          </span>
        )}
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="faculty_approved">Faculty Approved</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Types</option>
          {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Leave Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading leave applications...</div>
      ) : filteredLeaves.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Award size={40} className="mx-auto mb-3 opacity-50" />
          <p>No pending leave applications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeaves.map((leave) => (
            <div key={leave.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === leave.id ? null : leave.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                    {leave.student_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{leave.student_name}</p>
                    <p className="text-xs text-slate-400">{leave.roll_number} — {leave.leave_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[leave.status] || 'bg-slate-500/20 text-slate-400'}`}>
                    {leave.status.replace('_', ' ')}
                  </span>
                  <div className="text-xs text-slate-400">
                    {leave.start_date} to {leave.end_date}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === leave.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Reason</p>
                    <p className="text-sm text-white">{leave.reason || 'No reason provided'}</p>
                  </div>
                  {leave.faculty_remarks && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Faculty Remarks</p>
                      <p className="text-sm text-blue-300">{leave.faculty_remarks}</p>
                    </div>
                  )}
                  {leave.hod_remarks && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">HOD Remarks</p>
                      <p className="text-sm text-violet-300">{leave.hod_remarks}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Remarks (optional)</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                      placeholder="Add remarks before approving/rejecting..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
