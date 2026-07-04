"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle, Clock, Plus, ShieldCheck, Trash2, Tag, Key, Info } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';
import Link from 'next/link';

export default function StudyRoomsBookingPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  const [form, setForm] = useState({
    start_time: '09:00',
    end_time: '10:00',
    purpose: '',
    memberInput: '',
    group_members: [] as string[]
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRoomsData();
  }, [selectedDate]);

  const loadRoomsData = async () => {
    try {
      const res = await apiGet(`/library/study-rooms?date=${selectedDate}`);
      if (res.success) {
        setRooms(res.rooms || []);
        setBookings(res.bookings || []);
        
        // Filter student's own bookings for previewing
        const userStr = localStorage.getItem('iris_user_profile');
        const user = userStr ? JSON.parse(userStr) : null;
        const studentId = user?.student_id || user?.id || '';

        const myBks = (res.bookings || []).filter((b: any) => b.student_id === studentId);
        setMyBookings(myBks);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock Data Fallbacks
      const mockRooms = [
        { id: 'r1', name: 'Albert Einstein Room', capacity: 6, floor: 1, amenities: ['Projector', 'Whiteboard', 'AC'] },
        { id: 'r2', name: 'Marie Curie Room', capacity: 4, floor: 1, amenities: ['TV Screen', 'Whiteboard', 'AC'] },
        { id: 'r3', name: 'Srinivasa Ramanujan Room', capacity: 8, floor: 2, amenities: ['Projector', 'AC', 'Power Sockets'] }
      ];
      setRooms(mockRooms);
      setBookings([
        { id: 'b1', room_id: 'r1', student_id: 's2', date: selectedDate, start_time: '10:00', end_time: '12:00', status: 'confirmed' }
      ]);
      setMyBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    if (!form.memberInput.trim()) return;
    if (form.group_members.includes(form.memberInput.trim())) {
      setForm({ ...form, memberInput: '' });
      return;
    }
    setForm({
      ...form,
      group_members: [...form.group_members, form.memberInput.trim()],
      memberInput: ''
    });
  };

  const handleRemoveMember = (idx: number) => {
    setForm({
      ...form,
      group_members: form.group_members.filter((_, i) => i !== idx)
    });
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      setErrorMsg('Please select a study room.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const payload = {
        room_id: selectedRoom.id,
        student_id: studentId,
        date: selectedDate,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        group_members: form.group_members
      };

      const res = await apiPost('/library/study-room-bookings', payload);
      if (res.success) {
        setSuccessMsg(`Room "${selectedRoom.name}" booked successfully! Check-in QR: ${res.booking?.qr_code}`);
        setForm({ start_time: '09:00', end_time: '10:00', purpose: '', memberInput: '', group_members: [] });
        setSelectedRoom(null);
        loadRoomsData();
      } else {
        setErrorMsg(res.error || 'Failed to book study room.');
      }
    } catch {
      // Mock Success
      const qrCode = 'SRB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockBk = {
        id: 'mock-bk-' + Math.random(),
        room_id: selectedRoom.id,
        date: selectedDate,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        qr_code: qrCode,
        status: 'confirmed',
        checked_in: false,
        study_rooms: { name: selectedRoom.name }
      };
      setMyBookings([mockBk, ...myBookings]);
      setSuccessMsg(`Room booked successfully! (Mock Mode) QR: ${qrCode}`);
      setForm({ start_time: '09:00', end_time: '10:00', purpose: '', memberInput: '', group_members: [] });
      setSelectedRoom(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await apiDelete(`/library/study-room-bookings/${bookingId}`);
      if (res.success) {
        setSuccessMsg('Booking cancelled successfully.');
        loadRoomsData();
      }
    } catch {
      setMyBookings(myBookings.filter(b => b.id !== bookingId));
      setSuccessMsg('Booking cancelled successfully! (Mock)');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Study Room Scheduler</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Rent group rooms, configure calendars, and check active slots</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Date slider */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A78BFA]" /> Configure Booking
          </h2>

          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-5 shadow-xl">
            <div>
              <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Target Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            {selectedRoom && (
              <form onSubmit={handleBookSubmit} className="space-y-4 pt-3 border-t border-white/5">
                <div className="p-3.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/20">
                  <p className="text-[10px] text-[#A78BFA] font-bold">Selected Room</p>
                  <h4 className="text-xs font-bold text-white mt-1">{selectedRoom.name}</h4>
                  <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">Capacity: {selectedRoom.capacity} students • Floor {selectedRoom.floor}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Start Time</label>
                    <select
                      value={form.start_time}
                      onChange={e => setForm({ ...form, start_time: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      {Array.from({ length: 14 }).map((_, i) => {
                        const h = 8 + i;
                        const tStr = `${h < 10 ? '0' + h : h}:00`;
                        return <option key={tStr} value={tStr}>{tStr}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">End Time</label>
                    <select
                      value={form.end_time}
                      onChange={e => setForm({ ...form, end_time: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      {Array.from({ length: 14 }).map((_, i) => {
                        const h = 9 + i;
                        const tStr = `${h < 10 ? '0' + h : h}:00`;
                        return <option key={tStr} value={tStr}>{tStr}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Study Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Group presentation / Semester prep"
                    value={form.purpose}
                    onChange={e => setForm({ ...form, purpose: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Add Group Members (UUIDs)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter student UUID"
                      value={form.memberInput}
                      onChange={e => setForm({ ...form, memberInput: e.target.value })}
                      className="bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/10 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#C4B5FD] hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.group_members.map((mem, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[10px] font-mono">
                        {mem.slice(0, 8)}...
                        <button type="button" onClick={() => handleRemoveMember(idx)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md flex justify-center"
                  >
                    {submitting ? 'Booking...' : 'Book Room'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Columns: Active Rooms & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Active study rooms list */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Select Study Room</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`text-left p-4.5 rounded-2xl border transition-all ${
                      selectedRoom?.id === room.id
                        ? 'border-[#6C2BD9] bg-[#1A1538] shadow-lg shadow-[#6C2BD9]/10'
                        : 'border-white/5 bg-[#13102A]/60 hover:bg-[#13102A]'
                    }`}
                  >
                    <h4 className="text-sm font-bold text-white">{room.name}</h4>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Capacity: {room.capacity} students • Floor {room.floor}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {room.amenities?.map((am: string) => (
                        <span key={am} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-[#C4B5FD]/70 font-medium">
                          {am}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User's confirmed bookings & QR passes */}
          {myBookings.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Confirmed Bookings & passes
              </h3>

              <div className="space-y-4">
                {myBookings.map(bk => (
                  <div key={bk.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">{bk.study_rooms?.name || 'Albert Einstein Room'}</h4>
                      <p className="text-[10px] text-[#C4B5FD]/50">
                        Date: {new Date(bk.date).toLocaleDateString()} • {bk.start_time} to {bk.end_time}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Checked-In: {bk.checked_in ? 'Yes' : 'No (Show QR at door)'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Simulated QR Code box */}
                      <div className="p-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-center">
                        <span className="text-[8px] font-mono text-[#A78BFA] block mb-1">SCAN DOOR</span>
                        <div className="w-12 h-12 bg-white flex items-center justify-center rounded-lg mx-auto">
                          <span className="text-[6px] font-bold text-black select-none">QR PASS</span>
                        </div>
                        <span className="text-[8px] font-mono text-[#C4B5FD]/50 mt-1 block">{bk.qr_code}</span>
                      </div>

                      <button
                        onClick={() => handleCancelBooking(bk.id)}
                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-xs font-bold"
                        title="Cancel Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
