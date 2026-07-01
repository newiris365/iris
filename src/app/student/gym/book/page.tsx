"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ShieldAlert, Sparkles, ChevronRight, Check } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

const SLOT_TYPES: Record<string, string> = {
  general: 'General Gym',
  'cardio-only': 'Cardio Only',
  'weights-only': 'Strength/Weights',
  yoga: 'Yoga / Stretching'
};

export default function StudentGymBooking() {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate next 7 days list
  const daysList = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum = d.getDate();
    return { dateStr, dayName, dayNum };
  });

  useEffect(() => {
    setSelectedDate(daysList[0].dateStr);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSlotsAndBookings();
    }
  }, [selectedDate]);

  const loadSlotsAndBookings = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      // Load slots for date
      const slotsRes = await apiGet(`/fitzone/gym/slots?date=${selectedDate}`);
      
      // Load student bookings
      const bookRes = await apiGet(`/fitzone/gym/bookings/student/${studentId}`);

      if (slotsRes.success) setSlots(slotsRes.slots || []);
      if (bookRes.success) setBookings(bookRes.bookings || []);
    } catch (err) {
      console.log('Error loading slots');
      setSlots([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slotId: string) => {
    setError('');
    setMessage('');
    setSuccess(false);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiPost('/fitzone/gym/bookings', {
        slot_id: slotId,
        student_id: studentId
      });

      if (res.success) {
        setSuccess(true);
        setMessage('Slot booked successfully! QR code generated.');
        loadSlotsAndBookings();
      } else {
        setError(res.error || 'Failed to book slot.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const isBookedByMe = (slotId: string) => {
    return bookings.some(b => b.slot_id === slotId && ['booked', 'checked_in', 'Booked', 'Checked_in'].includes(b.status));
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Book Workout Slot</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Choose a date and reserve a 90-minute training window.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Date Selector Slider */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
          {daysList.map(day => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[70px] py-3.5 rounded-2xl border transition-all ${
                selectedDate === day.dateStr
                  ? 'bg-[#6C2BD9] border-[#8B5CF6] text-white shadow-lg shadow-[#6C2BD9]/30'
                  : 'bg-[#13102A] border-white/5 text-[#C4B5FD]/60 hover:border-[#6C2BD9]/30'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</span>
              <span className="text-lg font-extrabold mt-1">{day.dayNum}</span>
            </button>
          ))}
        </div>

        {/* Alerts & Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 mb-6">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}
        {success && message && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4" /> {message}
          </div>
        )}

        {/* Slots Queue */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#C4B5FD]/40">Loading available slots...</div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#C4B5FD]/40">No slots available for this date. Check back later!</div>
          ) : (
            slots.map(slot => {
              const bookedByMe = isBookedByMe(slot.id);
              const isFull = slot.booked_count >= slot.capacity;
              
              // Define color status
              let statusBorder = 'border-emerald-500/20 hover:border-emerald-500/40';
              let statusText = 'text-emerald-400';
              let btnClass = 'bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white';
              let btnText = 'Book Now';

              if (bookedByMe) {
                statusBorder = 'border-purple-500/40 bg-purple-500/5';
                statusText = 'text-purple-400';
                btnClass = 'bg-purple-500/10 border border-purple-500/30 text-purple-300 cursor-default';
                btnText = 'Booked';
              } else if (isFull) {
                statusBorder = 'border-red-500/20 bg-red-500/5';
                statusText = 'text-red-400';
                btnClass = 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed';
                btnText = 'Full';
              }

              return (
                <div
                  key={slot.id}
                  className={`glass-panel p-5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${statusBorder}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        slot.slot_type === 'yoga' ? 'bg-indigo-500/20 text-indigo-300' :
                        slot.slot_type === 'cardio-only' ? 'bg-pink-500/20 text-pink-300' :
                        slot.slot_type === 'weights-only' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-[#6C2BD9]/20 text-[#C4B5FD]'
                      }`}>
                        {SLOT_TYPES[slot.slot_type] || slot.slot_type}
                      </span>
                      {bookedByMe && (
                        <span className="flex items-center gap-1 text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Your Booking
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm font-semibold">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Clock className="w-4 h-4 text-[#C4B5FD]/50" />
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </div>
                      <div className="text-[11px] text-[#C4B5FD]/50">
                        Capacity: <span className="font-extrabold text-white">{slot.booked_count}/{slot.capacity}</span>
                      </div>
                    </div>

                    {slot.gym_trainers && (
                      <div className="flex items-center gap-1.5 text-xs text-[#C4B5FD]/60">
                        <User className="w-3.5 h-3.5" />
                        Trainer: <span className="font-semibold text-white/90">{slot.gym_trainers.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      disabled={isFull || bookedByMe}
                      onClick={() => handleBook(slot.id)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${btnClass}`}
                    >
                      {btnText}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
