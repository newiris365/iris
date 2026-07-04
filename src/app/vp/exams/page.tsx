"use client";

import React, { useState } from 'react';
import { GraduationCap, Clock, Users, FileText, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

const MOCK_EXAMS = [
  { id: '1', name: 'Unit Test 3', class: '10', subject: 'Mathematics', date: '2026-07-10', time: '09:00 - 11:00', duration: '2h', totalMarks: 80, students: 165, rooms: 6, status: 'Scheduled' },
  { id: '2', name: 'Unit Test 3', class: '10', subject: 'Science', date: '2026-07-11', time: '09:00 - 11:00', duration: '2h', totalMarks: 80, students: 165, rooms: 6, status: 'Scheduled' },
  { id: '3', name: 'Unit Test 3', class: '9', subject: 'English', date: '2026-07-12', time: '09:00 - 10:30', duration: '1.5h', totalMarks: 60, students: 180, rooms: 7, status: 'Scheduled' },
  { id: '4', name: 'Mid-Term Exam', class: '12', subject: 'Physics', date: '2026-07-15', time: '10:00 - 01:00', duration: '3h', totalMarks: 100, students: 152, rooms: 6, status: 'Preparation' },
  { id: '5', name: 'Mid-Term Exam', class: '11', subject: 'Chemistry', date: '2026-07-16', time: '10:00 - 01:00', duration: '3h', totalMarks: 100, students: 148, rooms: 6, status: 'Preparation' },
];

export default function ExamsPage() {
  const [exams] = useState(MOCK_EXAMS);

  const scheduled = exams.filter(e => e.status === 'Scheduled').length;
  const prep = exams.filter(e => e.status === 'Preparation').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GraduationCap size={24} className="text-violet-400" /> Exam Oversight
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Monitor upcoming exams, room assignments, and preparation status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Exams', value: exams.length, color: 'text-white' },
          { label: 'Scheduled', value: scheduled, color: 'text-emerald-400' },
          { label: 'In Preparation', value: prep, color: 'text-amber-400' },
          { label: 'Total Students', value: exams.reduce((s, e) => s + e.students, 0), color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{exam.name} — {exam.subject}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Class {exam.class} · {exam.duration} · {exam.totalMarks} marks</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> {exam.date} · {exam.time}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Users size={10} /> {exam.students} students
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <FileText size={10} /> {exam.rooms} rooms
                  </span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                exam.status === 'Scheduled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {exam.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
