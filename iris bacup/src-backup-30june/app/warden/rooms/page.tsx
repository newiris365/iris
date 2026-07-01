"use client";

import React, { useState, useEffect } from 'react';
import {
  Home, LogOut, UserPlus, AlertTriangle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../../../lib/api';

interface Allocation {
  id: string;
  student_id: string;
  room_id: string;
  allotted_date: string;
  vacated_date: string;
  is_current: boolean;
  deposit_status: string;
  students?: { roll_number: string; users: { full_name: string } };
  hostel_rooms?: { room_number: string; capacity: number; occupied: number; hostel_blocks?: { name: string } };
}

interface UnallocatedStudent {
  student_id: string;
  full_name: string;
  roll_number: string;
  department_name: string;
  semester: number;
  batch_year: string;
}

export default function WardenRoomsPage() {
  const [activeTab, setActiveTab] = useState<'allocated' | 'unallocated'>('allocated');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [unallocated, setUnallocated] = useState<UnallocatedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkoutReason, setCheckoutReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allocRes, unallocRes] = await Promise.all([
        apiGet('hostel/allocations'),
        apiGet('campusCore/hostel/unallocated-students'),
      ]);
      if (allocRes.success) setAllocations(allocRes.allocations || []);
      if (unallocRes.success) setUnallocated(unallocRes.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckout = async (allocationId: string) => {
    setActionLoading(true);
    try {
      const res = await apiPut(`campusCore/hostel/allocations/${allocationId}/checkout`, {
        reason: checkoutReason,
        deposit_action: 'refunded',
      });
      if (res.success) {
        setAllocations(allocations.map(a => a.id === allocationId ? { ...a, is_current: false, vacated_date: new Date().toISOString().split('T')[0] } : a));
        setExpandedId(null);
        setCheckoutReason('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const activeAllocations = allocations.filter(a => a.is_current);
  const vacatedAllocations = allocations.filter(a => !a.is_current);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Home size={24} className="text-blue-400" />
        Room Management
      </h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('allocated')}
          className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'allocated' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}>
          Active Allocations ({activeAllocations.length})
        </button>
        <button onClick={() => setActiveTab('unallocated')}
          className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'unallocated' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}>
          Unallocated Students ({unallocated.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : activeTab === 'allocated' ? (
        <>
          {activeAllocations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No active allocations.</div>
          ) : (
            <div className="space-y-3">
              {activeAllocations.map(a => (
                <div key={a.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {a.hostel_rooms?.room_number || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{a.students?.users?.full_name}</p>
                        <p className="text-xs text-slate-400">Room {a.hostel_rooms?.room_number} — {a.hostel_rooms?.hostel_blocks?.name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Since {a.allotted_date}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${a.deposit_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        Deposit: {a.deposit_status}
                      </span>
                    </div>
                  </div>

                  {expandedId === a.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><p className="text-xs text-slate-400">Roll Number</p><p className="text-white">{a.students?.roll_number}</p></div>
                        <div><p className="text-xs text-slate-400">Room Capacity</p><p className="text-white">{a.hostel_rooms?.occupied}/{a.hostel_rooms?.capacity}</p></div>
                        <div><p className="text-xs text-slate-400">Allotted Date</p><p className="text-white">{a.allotted_date}</p></div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Checkout Reason</label>
                        <input type="text" value={checkoutReason} onChange={e => setCheckoutReason(e.target.value)}
                          placeholder="e.g. Graduation, Transfer, Drop-out"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                      </div>
                      <button onClick={() => handleCheckout(a.id)} disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm flex items-center gap-2 disabled:opacity-50">
                        <LogOut size={16} /> {actionLoading ? 'Processing...' : 'Vacate Room'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Unallocated Students */
        unallocated.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400 opacity-50" />
            <p>All students have room allocations.</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10 bg-white/5">
                  <th className="p-3">Student</th>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">Batch</th>
                </tr>
              </thead>
              <tbody>
                {unallocated.map(s => (
                  <tr key={s.student_id} className="border-b border-white/5">
                    <td className="p-3 text-white font-medium">{s.full_name}</td>
                    <td className="p-3 text-slate-400 font-mono">{s.roll_number}</td>
                    <td className="p-3 text-slate-300">{s.department_name || '—'}</td>
                    <td className="p-3 text-slate-300">{s.semester}</td>
                    <td className="p-3 text-slate-300">{s.batch_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
