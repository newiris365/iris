"use client";

import React, { useState, useEffect } from 'react';
import { Armchair, Plus, Trash2, RefreshCw, Users, Building, QrCode, Download } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';

interface ExamHall {
  id: string;
  hall_name: string;
  room_number: string;
  capacity: number;
  has_ac: boolean;
  has_projector: boolean;
  building: string;
  floor_number: number;
  is_active: boolean;
}

interface SeatingAllocation {
  id: string;
  exam_id: string;
  room_number: string;
  seat_number: string;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
}

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  date: string;
  department_id: string;
}

export default function ExamSeatingPage() {
  const [halls, setHalls] = useState<ExamHall[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [seating, setSeating] = useState<SeatingAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [showAddHall, setShowAddHall] = useState(false);
  const [newHall, setNewHall] = useState({ hall_name: '', room_number: '', capacity: 30, building: '', has_ac: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hallsRes, examsRes] = await Promise.all([
        apiGet('campusCore/exam-halls'),
        apiGet('campusCore/exams'),
      ]);
      if (hallsRes.success) setHalls(hallsRes.halls || []);
      if (examsRes.success) setExams(examsRes.exams || []);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchSeating = async (examId: string) => {
    if (!examId) return;
    try {
      const res = await apiGet(`campusCore/exam-seating?exam_id=${examId}`);
      if (res.success) setSeating(res.seating || []);
    } catch (err) {
      console.error('Failed to load seating', err);
    }
  };

  useEffect(() => { if (selectedExam) fetchSeating(selectedExam); }, [selectedExam]);

  const handleAllocate = async () => {
    if (!selectedExam) return;
    setAllocating(true);
    try {
      const res = await apiPost('campusCore/exam-seating/allocate', { exam_id: selectedExam });
      if (res.success) {
        fetchSeating(selectedExam);
      }
    } catch (err) {
      console.error('Failed to allocate seating', err);
    } finally {
      setAllocating(false);
    }
  };

  const handleAddHall = async () => {
    try {
      const res = await apiPost('campusCore/exam-halls', newHall);
      if (res.success) {
        setShowAddHall(false);
        setNewHall({ hall_name: '', room_number: '', capacity: 30, building: '', has_ac: false });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add hall', err);
    }
  };

  // Group seating by room
  const seatingByRoom = seating.reduce((acc, s) => {
    if (!acc[s.room_number]) acc[s.room_number] = [];
    acc[s.room_number].push(s);
    return acc;
  }, {} as Record<string, SeatingAllocation[]>);

  const checkedInCount = seating.filter(s => s.is_checked_in).length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
              <Armchair className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Exam Hall Seating</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Auto-allocate seats and track check-ins</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddHall(true)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] text-xs font-bold flex items-center gap-1.5 transition-all">
              <Plus className="w-4 h-4" /> Add Hall
            </button>
            <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] text-xs font-bold flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Exam Halls */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-heading font-bold text-sm mb-4">Exam Halls ({halls.length})</h3>
          <div className="grid grid-cols-4 gap-4">
            {halls.map(hall => (
              <div key={hall.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{hall.hall_name}</span>
                  <span className="text-[10px] text-[#C4B5FD]/50">Room {hall.room_number}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#C4B5FD]/60">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {hall.capacity}</span>
                  {hall.has_ac && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">AC</span>}
                  {hall.building && <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {hall.building}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Hall Modal */}
        {showAddHall && (
          <div className="glass-panel rounded-2xl p-6 border border-[#6C2BD9]/30">
            <h3 className="font-heading font-bold text-sm mb-4">Add New Exam Hall</h3>
            <div className="grid grid-cols-4 gap-4">
              <input value={newHall.hall_name} onChange={e => setNewHall(h => ({ ...h, hall_name: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Hall Name" />
              <input value={newHall.room_number} onChange={e => setNewHall(h => ({ ...h, room_number: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Room Number" />
              <input type="number" value={newHall.capacity} onChange={e => setNewHall(h => ({ ...h, capacity: parseInt(e.target.value) || 30 }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Capacity" />
              <input value={newHall.building} onChange={e => setNewHall(h => ({ ...h, building: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Building" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddHall} className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold transition-all">
                Add Hall
              </button>
              <button onClick={() => setShowAddHall(false)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD] text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Exam Selection + Allocate */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-[#C4B5FD]/50 mb-1 block">Select Exam</label>
            <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
              className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]">
              <option value="">Choose an exam...</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.name} ({new Date(exam.date).toLocaleDateString('en-IN')})</option>
              ))}
            </select>
          </div>
          <button onClick={handleAllocate} disabled={!selectedExam || allocating}
            className="px-6 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 mt-5">
            {allocating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Armchair className="w-4 h-4" />}
            Auto-Allocate Seats
          </button>
          {selectedExam && seating.length > 0 && (
            <div className="mt-5 text-xs text-[#C4B5FD]/70">
              <span className="font-bold text-white">{checkedInCount}</span>/{seating.length} checked in
            </div>
          )}
        </div>

        {/* Seating Chart */}
        {selectedExam && seating.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-bold text-sm">Seating Chart — {Object.keys(seatingByRoom).length} rooms, {seating.length} students</h3>
            {Object.entries(seatingByRoom).map(([room, seats]) => (
              <div key={room} className="glass-panel rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-bold text-sm">Room {room}</h4>
                  <span className="text-[10px] text-[#C4B5FD]/50">{seats.filter(s => s.is_checked_in).length}/{seats.length} checked in</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {seats.sort((a, b) => a.seat_number.localeCompare(b.seat_number)).map(seat => (
                    <div key={seat.id}
                      className={`p-2 rounded-lg text-center text-[10px] border transition-all ${
                        seat.is_checked_in
                          ? 'bg-green-500/20 border-green-500/30 text-green-400'
                          : 'bg-white/5 border-white/10 text-[#C4B5FD]/70'
                      }`}>
                      <div className="font-bold">{seat.seat_number}</div>
                      <div className="truncate mt-0.5">{seat.student_name || seat.roll_number || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
