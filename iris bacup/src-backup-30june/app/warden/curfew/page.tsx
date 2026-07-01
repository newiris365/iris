"use client";

import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, XCircle, Save, AlertTriangle
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

interface CurfewStudent {
  student_id: string;
  student_name: string;
  roll_number: string;
  room_number: string;
  is_present: boolean;
  marked_at: string;
}

export default function WardenCurfewPage() {
  const [students, setStudents] = useState<CurfewStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMarking, setIsMarking] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await apiGet('hostel/blocks');
      if (res.success) {
        setBlocks(res.blocks || []);
        if (res.blocks?.length > 0) setSelectedBlock(res.blocks[0].id);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedBlock) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await apiGet('campusCore/hostel/curfew/status', { blockId: selectedBlock, date: checkDate });
        if (res.success) setStudents(res.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedBlock, checkDate]);

  const togglePresent = (idx: number) => {
    const updated = [...students];
    updated[idx].is_present = !updated[idx].is_present;
    setStudents(updated);
  };

  const markAllPresent = () => {
    setStudents(students.map(s => ({ ...s, is_present: true })));
  };

  const handleSubmit = async () => {
    if (!selectedBlock || students.length === 0) return;
    setIsMarking(true);
    setResult(null);
    try {
      const payload = students.map(s => ({ student_id: s.student_id, is_present: s.is_present }));
      const res = await apiPost('campusCore/hostel/curfew/mark', {
        block_id: selectedBlock,
        date: checkDate,
        students: payload,
      });
      if (res.success) {
        setResult({ present: res.present, absent: res.absent });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarking(false);
    }
  };

  const presentCount = students.filter(s => s.is_present).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ClipboardList size={24} className="text-emerald-400" />
        Nightly Curfew Check-In
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">Select Block</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" value={checkDate} onChange={e => setCheckDate(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
        <button onClick={markAllPresent}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm">
          Mark All Present
        </button>
        <button onClick={handleSubmit} disabled={isMarking || students.length === 0}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {isMarking ? 'Saving...' : 'Submit Check-In'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{students.length}</p>
          <p className="text-xs text-slate-400">Total Students</p>
        </div>
        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
          <p className="text-xs text-slate-400">Present</p>
        </div>
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{absentCount}</p>
          <p className="text-xs text-slate-400">Absent</p>
        </div>
      </div>

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold">
            Check-in submitted: {result.present} present, {result.absent} absent
          </p>
          <p className="text-sm text-slate-400 mt-1">Parents of absent students will be notified via WhatsApp.</p>
        </div>
      )}

      {/* Student List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
          <p>No students found. Select a block to begin check-in.</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10 bg-white/5">
                <th className="p-3">Room</th>
                <th className="p-3">Student</th>
                <th className="p-3">Roll No</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.student_id} className={`border-b border-white/5 ${s.is_present ? '' : 'bg-red-500/5'}`}>
                  <td className="p-3 font-mono text-slate-300">{s.room_number}</td>
                  <td className="p-3 text-white">{s.student_name}</td>
                  <td className="p-3 text-slate-400">{s.roll_number}</td>
                  <td className="p-3 text-center">
                    {s.is_present ? (
                      <span className="text-emerald-400 flex items-center gap-1 justify-center">
                        <CheckCircle2 size={14} /> Present
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 justify-center">
                        <XCircle size={14} /> Absent
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => togglePresent(idx)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold ${
                        s.is_present ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                      {s.is_present ? 'P' : 'A'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
