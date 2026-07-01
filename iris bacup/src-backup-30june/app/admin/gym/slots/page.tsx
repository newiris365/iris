"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, ShieldAlert, Sparkles, User, ArrowLeft } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPut } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminGymSlots() {
  const [slots, setSlots] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('07:30');
  const [capacity, setCapacity] = useState(30);
  const [trainerId, setTrainerId] = useState('');
  const [slotType, setSlotType] = useState('general');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Set default date to today
    setDate(new Date().toISOString().split('T')[0]);
    loadSlotsAndTrainers();
  }, []);

  const loadSlotsAndTrainers = async () => {
    setLoading(true);
    try {
      const slotsRes = await apiGet(`/fitzone/gym/slots`);
      const trainersRes = await apiGet('/fitzone/gym/trainers');

      if (slotsRes.success) setSlots(slotsRes.slots || []);
      if (trainersRes.success) setTrainers(trainersRes.trainers || []);
    } catch (err) {
      console.log('Error loading slots, using fallback mocks');
      setSlots([
        { id: 's1', date: '2026-06-10', start_time: '06:00:00', end_time: '07:30:00', capacity: 30, booked_count: 12, slot_type: 'general', is_cancelled: false },
        { id: 's2', date: '2026-06-10', start_time: '08:00:00', end_time: '09:30:00', capacity: 25, booked_count: 5, slot_type: 'cardio-only', is_cancelled: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await apiPost('/fitzone/gym/slots', {
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        capacity,
        trainer_id: trainerId || null,
        slot_type: slotType
      });

      if (res.success) {
        setSuccess('Gym slot created successfully!');
        loadSlotsAndTrainers();
      } else {
        setError(res.error || 'Failed to create slot.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/fitzone/gym/slots/${id}`);
      if (res.success) {
        setSuccess('Slot removed or cancelled successfully.');
        loadSlotsAndTrainers();
      } else {
        setError(res.error || 'Failed to delete slot.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting slot.');
    }
  };

  const toggleCancel = async (id: string, currentlyCancelled: boolean) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiPut(`/fitzone/gym/slots/${id}`, {
        is_cancelled: !currentlyCancelled
      });
      if (res.success) {
        setSuccess(`Slot status updated.`);
        loadSlotsAndTrainers();
      } else {
        setError(res.error || 'Failed to update slot.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <Link href="/admin/gym" className="flex items-center gap-1.5 text-xs text-[#C4B5FD]/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Slot Scheduling & Blackouts</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Configure recurring training block capacities, assignments, and holiday blackout periods.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Create Slot Form */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <form onSubmit={handleCreate} className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#A78BFA]" /> Add New Slot
            </h3>

            {/* Inputs */}
            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Start Time</label>
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">End Time</label>
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Capacity</label>
              <input
                required
                type="number"
                value={capacity}
                onChange={e => setCapacity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Slot Type</label>
              <select
                value={slotType}
                onChange={e => setSlotType(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
              >
                <option value="general">General Floor</option>
                <option value="cardio-only">Cardio Zone</option>
                <option value="weights-only">Strength Floor</option>
                <option value="yoga">Yoga Room</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold block mb-1">Assigned Trainer (Optional)</label>
              <select
                value={trainerId}
                onChange={e => setTrainerId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none"
              >
                <option value="">No Trainer Assigned</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white shadow-lg mt-2"
            >
              Generate Scheduling Block
            </button>
          </form>
        </div>

        {/* Existing Slots Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
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

          <h3 className="text-sm font-bold text-white mb-2">Existing Slots Calendar</h3>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/45">Loading slots...</div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/30">No slots defined yet. Use the sidebar to create slot blocks.</div>
            ) : (
              slots.map(s => (
                <div
                  key={s.id}
                  className={`glass-panel p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    s.is_cancelled ? 'border-red-500/20 bg-red-500/5 opacity-60' : 'border-white/5 hover:border-[#6C2BD9]/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/25 text-[#C4B5FD] text-[9px] font-bold uppercase">
                        {s.slot_type}
                      </span>
                      {s.is_cancelled && (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold uppercase">
                          Cancelled
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#C4B5FD]/50" />
                      {s.date}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-[#C4B5FD]/80 mt-1">
                      <Clock className="w-4 h-4 text-[#C4B5FD]/50" />
                      {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      <span>• Booked: {s.booked_count}/{s.capacity}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCancel(s.id, s.is_cancelled)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${
                        s.is_cancelled
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {s.is_cancelled ? 'Re-enable' : 'Cancel Slot'}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
