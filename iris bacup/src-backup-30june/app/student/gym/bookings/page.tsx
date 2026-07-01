"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, X, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function StudentGymBookingsList() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/fitzone/gym/bookings/student/${studentId}`);
      if (res.success) {
        setBookings(res.bookings || []);
      }
    } catch (err) {
      console.log('Error loading bookings, using fallback mocks');
      // Fallback mocks
      setBookings([
        {
          id: 'b1',
          qr_code: 'FIT-BOOK-b1-s0001',
          status: 'booked',
          booking_date: '2026-06-09',
          gym_slots: { date: '2026-06-10', start_time: '08:00:00', end_time: '09:30:00', slot_type: 'general', gym_trainers: { name: 'Rahul Sharma' } }
        },
        {
          id: 'b2',
          qr_code: 'FIT-BOOK-b2-s0001',
          status: 'checked_in',
          booking_date: '2026-06-08',
          checkin_time: '2026-06-08T08:05:00Z',
          gym_slots: { date: '2026-06-08', start_time: '08:00:00', end_time: '09:30:00', slot_type: 'weights-only', gym_trainers: null }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiPost(`/fitzone/gym/bookings/${bookingId}/cancel`, {});
      if (res.success) {
        setSuccess('Booking cancelled successfully.');
        loadBookings();
      } else {
        setError(res.error || 'Failed to cancel booking.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during cancellation.');
    }
  };

  const activeBookings = bookings.filter(b => ['booked', 'Booked'].includes(b.status));
  const pastBookings = bookings.filter(b => !['booked', 'Booked'].includes(b.status));

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">My Bookings</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Track upcoming check-ins and cancellation deadlines.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-8">

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {success}
          </div>
        )}

        {/* 1. Upcoming Bookings */}
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-[#6C2BD9]" /> Upcoming Slots
          </h2>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/40">Loading upcoming bookings...</div>
            ) : activeBookings.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-xs text-[#C4B5FD]/40">
                No upcoming slots booked.
              </div>
            ) : (
              activeBookings.map(b => (
                <div key={b.id} className="glass-panel p-5 rounded-2xl border border-[#6C2BD9]/25 bg-gradient-to-tr from-[#13102A] to-[#1F1B3E] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  {/* Slot Details */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 text-[#A78BFA] text-[10px] font-bold uppercase tracking-wider">
                        {b.gym_slots?.slot_type || 'General'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#C4B5FD]/50" />
                      {b.gym_slots?.date}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-[#C4B5FD]/80">
                      <Clock className="w-4.5 h-4.5 text-[#C4B5FD]/50" />
                      {b.gym_slots?.start_time.substring(0, 5)} - {b.gym_slots?.end_time.substring(0, 5)}
                      {b.gym_slots?.gym_trainers && (
                        <span>• Trainer: {b.gym_slots.gym_trainers.name}</span>
                      )}
                    </div>
                  </div>

                  {/* QR Card Container */}
                  <div className="flex flex-col items-center gap-2 w-full md:w-auto p-4 rounded-xl bg-white/5 border border-white/5">
                    {/* Visual QR Simulation */}
                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-2 relative shadow-lg">
                      <div className="grid grid-cols-6 grid-rows-6 gap-0.5 w-full h-full opacity-90">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-sm ${(i * 7 + 3) % 5 === 0 || i % 4 === 0 || i < 6 || i % 6 === 0 ? 'bg-[#0D0A1A]' : 'bg-white'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#C4B5FD]/50">{b.qr_code}</span>
                  </div>

                  {/* Cancel Button */}
                  <div className="w-full md:w-auto self-stretch md:self-center">
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <X className="w-4 h-4" /> Cancel Booking
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Past Bookings History */}
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            History
          </h2>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/40">Loading history...</div>
            ) : pastBookings.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/30">No booking history records.</div>
            ) : (
              pastBookings.map(b => {
                let badgeStyle = 'bg-white/5 text-white/50';
                let icon = <Clock className="w-3.5 h-3.5" />;
                if (['checked_in', 'Checked_in'].includes(b.status)) {
                  badgeStyle = 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
                  icon = <Check className="w-3.5 h-3.5" />;
                } else if (['cancelled', 'Cancelled'].includes(b.status)) {
                  badgeStyle = 'bg-white/5 border border-white/10 text-[#C4B5FD]/40';
                  icon = <X className="w-3.5 h-3.5" />;
                } else if (['no_show', 'No_show'].includes(b.status)) {
                  badgeStyle = 'bg-red-500/10 border border-red-500/20 text-red-400';
                  icon = <ShieldAlert className="w-3.5 h-3.5" />;
                }

                return (
                  <div key={b.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white">{b.gym_slots?.date} ({b.gym_slots?.slot_type || 'General'})</p>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                        {b.gym_slots?.start_time.substring(0, 5)} - {b.gym_slots?.end_time.substring(0, 5)}
                      </p>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 ${badgeStyle}`}>
                      {icon} {b.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
