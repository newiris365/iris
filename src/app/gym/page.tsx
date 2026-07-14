"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, Users, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import Link from 'next/link';
import SubscriptionGate from '../../components/SubscriptionGate';

function GymContent() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profile = localStorage.getItem('iris_user_profile');
      const parsed = profile ? JSON.parse(profile) : null;
      setUser(parsed);
      const studentId = parsed?.student_id || parsed?.id || '';

      const [equipRes, slotsRes, bookingsRes] = await Promise.all([
        apiGet('/fitzone/equipment'),
        apiGet('/fitzone/slots'),
        studentId ? apiGet(`/fitzone/bookings?student_id=${studentId}`) : Promise.resolve({ success: false }),
      ]);

      if (equipRes.success) setEquipment(equipRes.equipment || []);
      if (slotsRes.success) setSlots(slotsRes.slots || []);
      if (bookingsRes.success) setBookings((bookingsRes as any).bookings || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId: string) => {
    try {
      const profile = localStorage.getItem('iris_user_profile');
      const parsed = profile ? JSON.parse(profile) : null;
      const studentId = parsed?.student_id || parsed?.id || '';
      if (!studentId) return;

      const res = await apiPost('/fitzone/bookings', { student_id: studentId, slot_id: slotId });
      if (res.success) {
        loadData();
      } else {
        alert(res.error || 'Failed to book slot');
      }
    } catch (err) {
      alert('Booking failed');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#F59E0B]/25">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS FitZone</h1>
              <p className="text-sm text-[#C4B5FD]/70">Workouts • Equipment • Slot Booking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Equipment Grid */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] p-6 relative overflow-hidden shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#F59E0B]" /> Equipment
            </h3>
            {equipment.length === 0 ? (
              <p className="text-xs text-[#C4B5FD]/40 text-center py-6">No equipment data available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {equipment.map((eq: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5">
                    <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-white">{eq.name}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        eq.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {eq.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{eq.category} • {eq.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Slots */}
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] p-6 relative overflow-hidden shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F59E0B]" /> Available Slots
            </h3>
            {slots.length === 0 ? (
              <p className="text-xs text-[#C4B5FD]/40 text-center py-6">No slots available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map((slot: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">{slot.slot_name || `Slot ${i + 1}`}</h4>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBookSlot(slot.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/20 text-[10px] font-bold text-[#F59E0B] hover:bg-[#F59E0B]/30 transition-all"
                      >
                        Book
                      </button>
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/40 mt-2">
                      {slot.capacity || 20} spots • {slot.booked_count || 0} booked
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* My Bookings */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#F59E0B]" /> My Bookings
            </h3>
            {bookings.length === 0 ? (
              <p className="text-xs text-[#C4B5FD]/40 text-center py-4">No bookings yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {bookings.slice(0, 5).map((b: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{b.gym_slots?.slot_name || 'Gym Slot'}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                        b.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/40 mt-1">{b.booking_date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Gym Guidelines</h3>
            <ul className="text-[10px] text-[#C4B5FD]/70 space-y-2.5 list-disc pl-4">
              <li>Carry your student ID for entry verification.</li>
              <li>Book your slot at least 30 minutes before the session.</li>
              <li>Cancel bookings at least 2 hours in advance.</li>
              <li>Wear appropriate athletic footwear and attire.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GymPage() {
  const [user, setUser] = useState<any>(null);
  const [instId, setInstId] = useState('');

  useEffect(() => {
    const profile = localStorage.getItem('iris_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setUser(parsed);
      setInstId(parsed.institution_id || 'a0000000-0000-0000-0000-000000000001');
    }
  }, []);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <SubscriptionGate serviceType="gym" institutionId={instId} studentId={user.student_id || user.id}>
      <GymContent />
    </SubscriptionGate>
  );
}
