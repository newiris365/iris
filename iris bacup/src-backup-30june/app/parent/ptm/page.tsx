"use client";

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, User, CheckCircle, RefreshCw, AlertCircle, Link as LinkIcon
} from 'lucide-react';

interface Slot {
  id: string;
  time: string;
  available: boolean;
}

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

interface Booking {
  id: string;
  teacher_id: string;
  parent_id: string;
  date: string;
  slot_time: string;
  meet_link: string;
  status: string;
}

export default function ParentPTMPage() {
  const [teachers] = useState<Teacher[]>([
    { id: 't-1', name: 'Dr. Aditya Kumar', subject: 'Compiler Design' },
    { id: 't-2', name: 'Prof. Sarah Vance', subject: 'Database Systems' },
    { id: 't-3', name: 'Dr. Vivek Sharma', subject: 'Artificial Intelligence' }
  ]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t-1');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0] // tomorrow default
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [selectedTeacherId, selectedDate]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch(`/api/v1/parent/ptm/slots/${selectedTeacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    const slot = slots.find(s => s.id === selectedSlotId);
    if (!slot) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch('/api/v1/parent/ptm/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teacher_id: selectedTeacherId,
          date: selectedDate,
          slot_time: slot.time
        })
      });
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
        // Mark booked slot as taken locally
        setSlots(prev => prev.map(s => s.id === selectedSlotId ? { ...s, available: false } : s));
        setSelectedSlotId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 space-y-6 h-fit">
          <h2 className="text-lg font-semibold border-b border-[#6C2BD9]/20 pb-2">
            1. Meeting Options
          </h2>

          {/* Teacher Selector */}
          <div className="space-y-2">
            <label className="text-xs text-[#A78BFA]/70 font-semibold block uppercase">Select Faculty Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                setBooking(null);
              }}
              className="w-full bg-[#0D0A1A]/85 border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6] text-white"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
              ))}
            </select>
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
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-[#0D0A1A]/85 border border-[#6C2BD9]/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6] text-white"
            />
          </div>
        </div>

        {/* Center/Right Columns: Slots & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Booking Confirmation */}
          {booking && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-lg text-emerald-400">Booking Confirmed!</h3>
                  <p className="text-xs text-[#A78BFA]/70">Your appointment has been successfully scheduled and calendar entries generated.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0D0A1A]/40 p-4 rounded-xl text-sm border border-emerald-500/10">
                <div>
                  <div className="text-[10px] text-[#A78BFA]/50 uppercase">Teacher</div>
                  <div className="font-bold mt-0.5">{activeTeacher?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A78BFA]/50 uppercase">Date</div>
                  <div className="font-bold mt-0.5">{booking.date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A78BFA]/50 uppercase">Time Slot</div>
                  <div className="font-bold mt-0.5">{booking.slot_time}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 bg-[#13102A]/80 p-3 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Online Meeting Link:</span>
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

          {/* Slots Availability Card */}
          <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6C2BD9]/30 space-y-4">
            <h2 className="text-lg font-semibold flex items-center justify-between border-b border-[#6C2BD9]/20 pb-2">
              <span>2. Available PTM Time Slots</span>
              <span className="text-xs text-[#A78BFA]/60 font-normal">Date: {selectedDate}</span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-[#A78BFA]/60">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#6C2BD9]" />
                Checking slot diaries...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-12 text-center text-[#A78BFA]/40">
                No meeting slots configured by teacher for this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

            {/* Submit Block */}
            <div className="pt-4 border-t border-[#6C2BD9]/20 flex justify-end">
              <button
                disabled={submitting || !selectedSlotId}
                onClick={handleBookSlot}
                className="bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#6C2BD9]/20"
              >
                {submitting ? 'Creating Slot Invitation...' : 'Book Selected Appointment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
