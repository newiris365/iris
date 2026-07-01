"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Filter, Eye
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  relation: string;
  visit_purpose: string;
  approval_status: string;
  is_approved: boolean;
  expected_time: string;
  students?: { users: { full_name: string }; roll_number: string };
  hostel_rooms?: { room_number: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired: 'bg-slate-500/20 text-slate-400',
};

export default function WardenVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiGet('campusCore/hostel/visitors', params);
      if (res.success) setVisitors(res.visitors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVisitors(); }, [statusFilter]);

  const handleApprove = async (id: string, approve: boolean) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/hostel/visitors/${id}/approve`, { approve, remarks });
      if (res.success) {
        setVisitors(visitors.map(v => v.id === id ? { ...v, approval_status: approve ? 'approved' : 'rejected', is_approved: approve } : v));
        setExpandedId(null);
        setRemarks('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users size={24} className="text-amber-400" />
        Visitor Approvals
      </h1>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>No {statusFilter === 'all' ? '' : statusFilter} visitor requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitors.map(v => (
            <div key={v.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {v.visitor_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{v.visitor_name}</p>
                    <p className="text-xs text-slate-400">
                      {v.relation || 'Visitor'} — {v.students?.users?.full_name || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.approval_status] || 'bg-slate-500/20 text-slate-400'}`}>
                    {v.approval_status}
                  </span>
                </div>
              </div>

              {expandedId === v.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div><p className="text-xs text-slate-400">Phone</p><p className="text-sm text-white">{v.visitor_phone || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">Purpose</p><p className="text-sm text-white">{v.visit_purpose || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">Student Room</p><p className="text-sm text-white">{v.hostel_rooms?.room_number || '—'}</p></div>
                  </div>
                  {v.approval_status === 'pending' && (
                    <>
                      <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)}
                        placeholder="Remarks (optional)"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(v.id, true)} disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2 disabled:opacity-50">
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button onClick={() => handleApprove(v.id, false)} disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm flex items-center gap-2 disabled:opacity-50">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
