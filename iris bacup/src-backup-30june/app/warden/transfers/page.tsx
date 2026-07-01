"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight, CheckCircle2, XCircle, Clock, ChevronDown
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface TransferRequest {
  id: string;
  student_id: string;
  reason: string;
  reason_category: string;
  status: string;
  warden_remarks: string;
  admin_remarks: string;
  created_at: string;
  students?: { roll_number: string; users: { full_name: string } };
  current_room?: { room_number: string };
  requested_room?: { room_number: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  warden_approved: 'bg-blue-500/20 text-blue-400',
  admin_approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
  completed: 'bg-green-500/20 text-green-400',
};

export default function WardenTransfersPage() {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiGet('campusCore/hostel/transfers', params);
      if (res.success) setRequests(res.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleApprove = async (id: string, approve: boolean) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/hostel/transfers/${id}/approve`, { approve, remarks });
      if (res.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: approve ? 'warden_approved' : 'rejected' } : r));
        setExpandedId(null);
        setRemarks('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/hostel/transfers/${id}/complete`, {});
      if (res.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'completed' } : r));
        setExpandedId(null);
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
        <ArrowLeftRight size={24} className="text-violet-400" />
        Room Transfer Requests
      </h1>

      <div className="flex gap-2">
        {['pending', 'warden_approved', 'rejected', 'completed', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${
              statusFilter === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-50" />
          <p>No {statusFilter === 'all' ? '' : statusFilter.replace('_', ' ')} transfer requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                    {r.students?.users?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{r.students?.users?.full_name}</p>
                    <p className="text-xs text-slate-400">{r.reason_category?.replace('_', ' ')} — {r.reason?.slice(0, 60)}{r.reason?.length > 60 ? '...' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {expandedId === r.id && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-400">Reason</p><p className="text-white">{r.reason}</p></div>
                    <div><p className="text-xs text-slate-400">Requested</p><p className="text-white">{new Date(r.created_at).toLocaleDateString()}</p></div>
                  </div>
                  {r.warden_remarks && (
                    <div><p className="text-xs text-slate-400">Warden Remarks</p><p className="text-sm text-blue-300">{r.warden_remarks}</p></div>
                  )}
                  {r.admin_remarks && (
                    <div><p className="text-xs text-slate-400">Admin Remarks</p><p className="text-sm text-violet-300">{r.admin_remarks}</p></div>
                  )}
                  {r.status === 'pending' && (
                    <>
                      <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)}
                        placeholder="Remarks (optional)"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(r.id, true)} disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2 disabled:opacity-50">
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button onClick={() => handleApprove(r.id, false)} disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm flex items-center gap-2 disabled:opacity-50">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </>
                  )}
                  {r.status === 'warden_approved' && (
                    <button onClick={() => handleComplete(r.id)} disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm disabled:opacity-50">
                      Complete Transfer (Move Student)
                    </button>
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
