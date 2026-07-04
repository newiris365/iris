"use client";

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Video, User, CheckCircle, RefreshCw, AlertCircle,
  Link as LinkIcon, XCircle, History, ChevronDown
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

interface Slot {
  id: string;
  time: string;
  available: boolean;
  date: string;
}

interface Booking {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_subject: string;
  date: string;
  slot_time: string;
  meet_link: string;
  status: string;
  created_at: string;
}

export default function ParentPTMPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('iris_jwt_token') || '') : '';

  const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  // Fetch teachers on mount
  useEffect(() => {
    fetchTeachers();
    fetchBookings();
  }, []);

  // Fetch slots when teacher or date changes
  useEffect(() => {
    if (selectedTeacherId) {
      fetchSlots();
    }
  }, [selectedTeacherId, selectedDate]);

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      setError(null);
      const res = await fetch('/api/v1/parent/ptm/teachers', { headers: authHeaders });
      const data = await res.json();
      if (data.success && data.teachers?.length > 0) {
        setTeachers(data.teachers);
        setSelectedTeacherId(data.teachers[0].id);
      } else {
        setTeachers([]);
        setError('No teachers available for PTM scheduling.');
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/v1/parent/ptm/slots/${selectedTeacherId}?date=${selectedDate}`,
        { headers: authHeaders }
      );
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        setSelectedSlotId(null);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await fetch('/api/v1/parent/ptm/bookings', { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookSlot = async () => {
    const slot = slots.find(s => s.id === selectedSlotId);
    if (!slot) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/v1/parent/ptm/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          teacher_id: selectedTeacherId,
          date: selectedDate,
          slot_time: slot.time
        })
      });
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
        setSlots(prev => prev.map(s => s.id === selectedSlotId ? { ...s, available: false } : s));
        setSelectedSlotId(null);
        fetchBookings();
      } else {
        setError(data.error || 'Failed to book slot.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`/api/v1/parent/ptm/cancel/${bookingId}`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        fetchSlots();
      } else {
        setError(data.error || 'Failed to cancel booking.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId);
  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && b.date >= today);
  const pastBookings = bookings.filter(b => b.status !== 'confirmed' || b.date < today);

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calendar className="w-8 h-8 text-[#A78BFA]" />
          Parent-Teacher Meeting Scheduler
        </h1>
        <p className="text-[#A78BFA]/70 mt-1">
          Select course teacher, pick a convenient calendar date, and instantly book slots with auto-generated video conference links.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('book')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'book'
              ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
              : 'bg-[#13102A]/60 text-[#A78BFA]/60 hover:text-white border border-[#6C2BD9]/20'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          Book New Meeting
        </button>
        <button
          onClick={() => { setActiveTab('history'); fetchBookings(); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
              : 'bg-[#13102A]/60 text-[#A78BFA]/60 hover:text-white border border-[#6C2BD9]/20'
          }`}
        >
          <History className="w-4 h-4 inline mr-1.5" />
          My Bookings {upcomingBookings.length > 0 && `(${upcomingBookings.length})`}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============ BOOK TAB ============ */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form */}
          <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 space-y-6 h-fit">
            <h2 className="text-lg font-semibold border-b border-[#6C2BD9]/20 pb-2">
              1. Meeting Options
            </h2>

            {/* Teacher Selector */}
            <div className="space-y-2">
              <label className="text-xs text-[#A78BFA]/70 font-semibold block uppercase">Select Faculty Teacher</label>
              {teachersLoading ? (
                <div className="w-full bg-[#0D0A1A]/85 border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm text-[#A78BFA]/50">
                  Loading teachers...
                </div>
              ) : teachers.length === 0 ? (
                <div className="w-full bg-[#0D0A1A]/85 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  No teachers available
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      setBooking(null);
                    }}
                    className="w-full bg-[#0D0A1A]/85 border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6] text-white appearance-none cursor-pointer"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#A78BFA]/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Date Selector */}
            <div className="space-y-2">
              <label className="text-xs text-[#A78BFA]/70 font-semibold block uppercase">Choose Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setBooking(null);
                }}
                min={today}
                className="w-full bg-[#0D0A1A]/85 border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6] text-white [color-scheme:dark]"
              />
              <p className="text-[10px] text-[#A78BFA]/40">
                Selected: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Right Column: Slots & Booking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Booking Confirmation */}
            {booking && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl space-y-4 shadow-lg shadow-emerald-500/5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-lg text-emerald-400">Booking Confirmed!</h3>
                    <p className="text-xs text-[#A78BFA]/70">Your appointment has been successfully scheduled.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0D0A1A]/40 p-4 rounded-xl text-sm border border-emerald-500/10">
                  <div>
                    <div className="text-[10px] text-[#A78BFA]/50 uppercase">Teacher</div>
                    <div className="font-bold mt-0.5">{activeTeacher?.name || booking.teacher_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#A78BFA]/50 uppercase">Date</div>
                    <div className="font-bold mt-0.5">{new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#A78BFA]/50 uppercase">Time Slot</div>
                    <div className="font-bold mt-0.5">{booking.slot_time}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 bg-[#13102A]/80 p-3 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs">
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Meeting Link:</span>
                    <a href={booking.meet_link} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline truncate max-w-[200px] sm:max-w-xs">
                      {booking.meet_link}
                    </a>
                  </div>
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Join Room
                  </a>
                </div>
              </div>
            )}

            {/* Slots Availability */}
            <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 space-y-4">
              <h2 className="text-lg font-semibold flex items-center justify-between border-b border-[#6C2BD9]/20 pb-2">
                <span>2. Available Time Slots</span>
                <span className="text-xs text-[#A78BFA]/60 font-normal">
                  {activeTeacher?.name || 'Select teacher'} &middot; {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </h2>

              {loading ? (
                <div className="py-12 text-center text-[#A78BFA]/60">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#6C2BD9]" />
                  Loading available slots...
                </div>
              ) : slots.length === 0 ? (
                <div className="py-12 text-center text-[#A78BFA]/40">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No meeting slots configured for this date.</p>
                  <p className="text-xs mt-1 text-[#A78BFA]/30">Try a different date or contact the teacher.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      disabled={!slot.available}
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setBooking(null);
                      }}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                        !slot.available
                          ? 'bg-red-500/5 border-red-500/10 text-[#A78BFA]/30 cursor-not-allowed'
                          : selectedSlotId === slot.id
                          ? 'bg-[#6C2BD9]/40 border-[#8B5CF6] text-white shadow-md shadow-[#6C2BD9]/15'
                          : 'bg-[#0D0A1A]/50 border-[#6C2BD9]/10 hover:border-[#6C2BD9]/30 text-white'
                      }`}
                    >
                      <Clock className={`w-5 h-5 ${!slot.available ? 'text-red-500/30' : selectedSlotId === slot.id ? 'text-white' : 'text-[#A78BFA]/70'}`} />
                      <span className="text-xs font-semibold">{slot.time}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full ${
                        slot.available
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {slot.available ? 'Available' : 'Booked'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Submit */}
              <div className="pt-4 border-t border-[#6C2BD9]/20 flex justify-end">
                <button
                  disabled={submitting || !selectedSlotId}
                  onClick={handleBookSlot}
                  className="bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#6C2BD9]/20"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Selected Appointment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ HISTORY TAB ============ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Upcoming */}
          <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
            <h2 className="text-lg font-semibold border-b border-[#6C2BD9]/20 pb-2 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Upcoming Meetings
            </h2>
            {bookingsLoading ? (
              <div className="py-8 text-center text-[#A78BFA]/50">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="py-8 text-center text-[#A78BFA]/40 text-sm">No upcoming meetings.</div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-4 bg-[#0D0A1A]/50 p-4 rounded-xl border border-[#6C2BD9]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#6C2BD9]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#A78BFA]" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{b.teacher_name}</div>
                        <div className="text-xs text-[#A78BFA]/50">
                          {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &middot; {b.slot_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={b.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join
                      </a>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-red-500/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past / Cancelled */}
          <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30">
            <h2 className="text-lg font-semibold border-b border-[#6C2BD9]/20 pb-2 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#A78BFA]/60" />
              Past & Cancelled
            </h2>
            {pastBookings.length === 0 ? (
              <div className="py-8 text-center text-[#A78BFA]/40 text-sm">No past meetings.</div>
            ) : (
              <div className="space-y-2">
                {pastBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-4 bg-[#0D0A1A]/30 p-3 rounded-xl border border-[#6C2BD9]/5 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6C2BD9]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#A78BFA]/50" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs">{b.teacher_name}</div>
                        <div className="text-[10px] text-[#A78BFA]/40">
                          {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {b.slot_time}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-semibold ${
                      b.status === 'cancelled'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
