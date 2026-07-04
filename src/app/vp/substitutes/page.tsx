"use client";

import React, { useState } from 'react';
import { UserCheck, Calendar, Clock, Plus, CheckCircle, AlertCircle, X } from 'lucide-react';

const MOCK_SUBSTITUTES = [
  { id: '1', originalTeacher: 'Mrs. Sharma', subject: 'Mathematics', class: '10-A', date: '2026-07-03', period: '1st', substitute: 'Mr. Gupta', reason: 'Medical Leave', status: 'Confirmed' },
  { id: '2', originalTeacher: 'Mr. Meena', subject: 'Science', class: '9-B', date: '2026-07-03', period: '3rd', substitute: 'Ms. Jain', reason: 'Personal Leave', status: 'Confirmed' },
  { id: '3', originalTeacher: 'Mrs. Rathore', subject: 'English', class: '11-A', date: '2026-07-04', period: '2nd', substitute: '—', reason: 'Training', status: 'Unassigned' },
  { id: '4', originalTeacher: 'Mr. Singh', subject: 'Hindi', class: '8-A', date: '2026-07-04', period: '4th', substitute: '—', reason: 'PTM Meeting', status: 'Unassigned' },
];

const AVAILABLE_TEACHERS = ['Mr. Gupta', 'Ms. Jain', 'Mrs. Kumari', 'Mr. Verma', 'Ms. Rajput'];

export default function SubstitutesPage() {
  const [substitutes, setSubstitutes] = useState(MOCK_SUBSTITUTES);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const handleAssign = () => {
    if (!selectedSub || !selectedTeacher) return;
    setSubstitutes(subs => subs.map(s =>
      s.id === selectedSub ? { ...s, substitute: selectedTeacher, status: 'Confirmed' } : s
    ));
    setShowAssignModal(false);
    setSelectedSub(null);
    setSelectedTeacher('');
  };

  const unassigned = substitutes.filter(s => s.status === 'Unassigned');
  const confirmed = substitutes.filter(s => s.status === 'Confirmed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCheck size={24} className="text-violet-400" /> Substitute Scheduler
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Manage substitute teacher assignments for absent faculty</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{unassigned.length}</p>
          <p className="text-xs text-yellow-400">Unassigned</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{confirmed.length}</p>
          <p className="text-xs text-emerald-400">Confirmed</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{substitutes.length}</p>
          <p className="text-xs text-slate-400">Total Requests</p>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="bg-yellow-500/5 rounded-xl border border-yellow-500/20 p-4">
          <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> Needs Substitute Assignment
          </h3>
          <div className="space-y-2">
            {unassigned.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div>
                  <p className="text-sm text-white font-medium">{s.class} — {s.subject}</p>
                  <p className="text-[10px] text-slate-400">{s.originalTeacher} · {s.date} · {s.period} period · {s.reason}</p>
                </div>
                <button
                  onClick={() => { setSelectedSub(s.id); setShowAssignModal(true); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] hover:bg-[#6C2BD9]/30 transition-colors font-medium"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">All Substitute Assignments</h3>
        </div>
        <div className="divide-y divide-white/5">
          {substitutes.map(s => (
            <div key={s.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{s.class} — {s.subject}</p>
                <p className="text-[10px] text-slate-400">{s.originalTeacher} → {s.substitute} · {s.date} · {s.period}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                s.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowAssignModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <h3 className="font-bold text-base text-white mb-1">Assign Substitute</h3>
            <p className="text-xs text-slate-400 mb-4">Select a teacher to cover this period</p>
            <div className="space-y-2">
              {AVAILABLE_TEACHERS.map(t => (
                <button key={t} onClick={() => setSelectedTeacher(t)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    selectedTeacher === t
                      ? 'bg-[#6C2BD9]/15 border-[#6C2BD9]/40 text-white'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.07]'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={!selectedTeacher}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white text-xs font-bold disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
