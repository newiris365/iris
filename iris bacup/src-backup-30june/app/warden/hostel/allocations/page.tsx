"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, UserMinus, ShieldAlert, CheckCircle, Clock, Trash2, ArrowLeftRight, FileText } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';
import Link from 'next/link';

export default function WardenAllocationsPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  
  // Forms overlay state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any>(null);

  const [allocateForm, setAllocateForm] = useState({
    room_id: '',
    student_id: '',
    allotted_date: new Date().toISOString().split('T')[0],
    deposit_amount: 10000,
    deposit_status: 'paid' as 'pending' | 'paid'
  });

  const [vacateForm, setVacateForm] = useState({
    vacated_date: new Date().toISOString().split('T')[0],
    vacating_reason: '',
    refund_amount: 10000
  });

  const [swapForm, setSwapForm] = useState({
    student_id: '',
    target_room_id: '',
    reason: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('iris_jwt_token') || '');
    }
  }, []);

  const loadData = async () => {
    try {
      const [allocRes, roomsRes] = await Promise.all([
        apiGet('/hostel/allocations'),
        apiGet('/hostel/rooms?status=available')
      ]);

      if (allocRes.success) {
        setAllocations(allocRes.allocations || []);
      }
      if (roomsRes.success) {
        setRooms(roomsRes.rooms || []);
      }
    } catch {
      // Mock allocations fallback
      setAllocations([
        {
          id: 'a1',
          student_id: 's1',
          allotted_date: '2025-07-15',
          deposit_amount: 10000,
          deposit_status: 'paid',
          is_current: true,
          students: {
            name: 'Priyansh Mehta',
            roll_number: 'CS23B1042',
            department: 'Computer Science'
          },
          hostel_rooms: {
            id: 'r1',
            room_number: 'A-304',
            hostel_blocks: { name: 'Aryabhata Boys Hostel (Block A)' }
          }
        },
        {
          id: 'a2',
          student_id: 's2',
          allotted_date: '2025-08-01',
          deposit_amount: 10000,
          deposit_status: 'paid',
          is_current: true,
          students: {
            name: 'Rohit Sharma',
            roll_number: 'EC23B2051',
            department: 'Electronics'
          },
          hostel_rooms: {
            id: 'r1',
            room_number: 'A-304',
            hostel_blocks: { name: 'Aryabhata Boys Hostel (Block A)' }
          }
        }
      ]);

      setRooms([
        { id: 'r2', room_number: 'A-305', capacity: 2, occupied: 1, hostel_blocks: { name: 'Aryabhata Boys Hostel' } },
        { id: 'r3', room_number: 'B-101', capacity: 2, occupied: 0, hostel_blocks: { name: 'Gargi Girls Hostel' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateForm.room_id || !allocateForm.student_id) {
      setErrorMsg('Please specify target Room and Student ID.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPost('/hostel/allocations', allocateForm);
      if (res.success) {
        setSuccessMsg('Room allocated successfully!');
        setShowAllocateModal(false);
        loadData();
      } else {
        setErrorMsg(res.error || 'Failed to allocate room.');
      }
    } catch {
      // Mock Allocate
      const mockAlloc = {
        id: 'mock-alloc-' + Math.random(),
        student_id: allocateForm.student_id,
        allotted_date: allocateForm.allotted_date,
        deposit_amount: allocateForm.deposit_amount,
        deposit_status: allocateForm.deposit_status,
        is_current: true,
        students: { name: 'New Student (' + allocateForm.student_id.slice(0, 5) + ')', roll_number: 'CS26B1090', department: 'BioTech' },
        hostel_rooms: { room_number: 'A-305', hostel_blocks: { name: 'Aryabhata Boys Hostel' } }
      };
      setAllocations([mockAlloc, ...allocations]);
      setSuccessMsg('Room allocated successfully! (Mock)');
      setShowAllocateModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVacate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPut(`/hostel/allocations/${selectedAlloc.id}/vacate`, vacateForm);
      if (res.success) {
        setSuccessMsg('Room vacated and record deactivated.');
        setShowVacateModal(false);
        loadData();
      } else {
        setErrorMsg(res.error || 'Failed to vacate room.');
      }
    } catch {
      // Mock Vacate
      setAllocations(allocations.filter(a => a.id !== selectedAlloc.id));
      setSuccessMsg('Room vacated and record deactivated! (Mock)');
      setShowVacateModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapForm.student_id || !swapForm.target_room_id) {
      setErrorMsg('Please enter student ID and target room.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPost('/hostel/allocations/swap', swapForm);
      if (res.success) {
        setSuccessMsg('Room swap processed successfully.');
        setShowSwapModal(false);
        loadData();
      } else {
        setErrorMsg(res.error || 'Failed to swap rooms.');
      }
    } catch {
      setSuccessMsg('Room swap processed successfully! (Mock)');
      setShowSwapModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openVacateModal = (alloc: any) => {
    setSelectedAlloc(alloc);
    setVacateForm({
      vacated_date: new Date().toISOString().split('T')[0],
      vacating_reason: '',
      refund_amount: alloc.deposit_amount
    });
    setShowVacateModal(true);
  };

  const openSwapModal = (alloc: any) => {
    setSwapForm({
      student_id: alloc.student_id,
      target_room_id: '',
      reason: ''
    });
    setShowSwapModal(true);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/warden/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Allocation Control Center</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Process room allotments, swap beds, and execute checkout clearances</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setShowAllocateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Allocate Room
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
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

        {/* Allocate Room Modal Overlay */}
        {showAllocateModal && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAllocate} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#A78BFA]" /> Allocate New Room
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Target Room</label>
                  <select
                    value={allocateForm.room_id}
                    onChange={e => setAllocateForm({ ...allocateForm, room_id: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none transition-all"
                  >
                    <option value="">Select available room...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} ({r.hostel_blocks?.name} - {r.occupied}/{r.capacity} Occupied)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Student ID (UUID)</label>
                  <input
                    type="text"
                    placeholder="e.g. s0000000-0000-0000-0000-000000000001"
                    value={allocateForm.student_id}
                    onChange={e => setAllocateForm({ ...allocateForm, student_id: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#6C2BD9]/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Deposit (₹)</label>
                    <input
                      type="number"
                      value={allocateForm.deposit_amount}
                      onChange={e => setAllocateForm({ ...allocateForm, deposit_amount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Deposit Status</label>
                    <select
                      value={allocateForm.deposit_status}
                      onChange={e => setAllocateForm({ ...allocateForm, deposit_status: e.target.value as any })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Allocate'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vacate Room Modal Overlay */}
        {showVacateModal && selectedAlloc && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleVacate} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-red-400" /> Vacate Room Allocation
              </h3>

              <p className="text-xs text-[#C4B5FD]/70">
                Process hostel departure clearance for <span className="font-bold text-white">{selectedAlloc.students?.name}</span> (Room {selectedAlloc.hostel_rooms?.room_number}).
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Vacating Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Course completed / Semester exchange"
                    value={vacateForm.vacating_reason}
                    onChange={e => setVacateForm({ ...vacateForm, vacating_reason: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Vacated Date</label>
                    <input
                      type="date"
                      value={vacateForm.vacated_date}
                      onChange={e => setVacateForm({ ...vacateForm, vacated_date: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Refund Deposit (₹)</label>
                    <input
                      type="number"
                      value={vacateForm.refund_amount}
                      onChange={e => setVacateForm({ ...vacateForm, refund_amount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVacateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Confirm Vacate'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Swap Room Modal Overlay */}
        {showSwapModal && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSwap} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#A78BFA]" /> Swap Room Allocation
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Target Room</label>
                  <select
                    value={swapForm.target_room_id}
                    onChange={e => setSwapForm({ ...swapForm, target_room_id: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#6C2BD9]/50 focus:outline-none"
                  >
                    <option value="">Select available room...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} ({r.hostel_blocks?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Reason for Swap</label>
                  <input
                    type="text"
                    placeholder="e.g. Medical reasons / Mutual roommate request"
                    value={swapForm.reason}
                    onChange={e => setSwapForm({ ...swapForm, reason: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#6C2BD9]/50"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Confirm Swap'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Allocations Listing */}
        <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Active Room Allocations</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allocations.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No active allocations found.
          </div>
        ) : (
          <div className="space-y-4">
            {allocations.map((alloc) => (
              <div key={alloc.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{alloc.students?.name}</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50">
                    Roll: <span className="font-mono">{alloc.students?.roll_number}</span> • Dept: {alloc.students?.department}
                  </p>
                  <p className="text-[10px] text-[#A78BFA] font-bold">
                    Room {alloc.hostel_rooms?.room_number} • {alloc.hostel_rooms?.hostel_blocks?.name}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-xs">
                    <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">Allotted On</p>
                    <p className="font-bold text-white mt-0.5">{new Date(alloc.allotted_date).toLocaleDateString()}</p>
                  </div>

                  <div className="text-xs">
                    <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">Deposit Security</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      alloc.deposit_status === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      ₹{alloc.deposit_amount} {alloc.deposit_status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`/api/v1/hostel/allocations/${alloc.id}/report/pdf?token=${token}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD]/80 hover:text-white transition-all"
                      title="Download Certificate"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openSwapModal(alloc)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
                    </button>
                    <button
                      onClick={() => openVacateModal(alloc)}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-1.5"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Vacate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
