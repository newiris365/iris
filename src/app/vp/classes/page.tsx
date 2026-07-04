"use client";

import React, { useState } from 'react';
import { BookOpen, Users, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const MOCK_CLASSES = [
  { id: '1', class: '10-A', section: 'A', teacher: 'Mrs. Sharma', subject: 'Mathematics', time: '08:00 - 08:45', students: 42, present: 38, status: 'Completed' },
  { id: '2', class: '10-B', section: 'B', teacher: 'Mr. Meena', subject: 'Science', time: '08:00 - 08:45', students: 40, present: 37, status: 'Completed' },
  { id: '3', class: '9-A', section: 'A', teacher: 'Mrs. Rathore', subject: 'English', time: '08:45 - 09:30', students: 44, present: 41, status: 'Completed' },
  { id: '4', class: '12-A', section: 'A', teacher: 'Mr. Gupta', subject: 'Physics', time: '09:30 - 10:15', students: 38, present: 35, status: 'Ongoing' },
  { id: '5', class: '11-C', section: 'C', teacher: 'Ms. Jain', subject: 'Chemistry', time: '09:30 - 10:15', students: 36, present: 33, status: 'Ongoing' },
  { id: '6', class: '8-A', section: 'A', teacher: 'Mr. Singh', subject: 'Hindi', time: '10:30 - 11:15', students: 45, present: 0, status: 'Upcoming' },
  { id: '7', class: '7-B', section: 'B', teacher: 'Mrs. Kumari', subject: 'Social Studies', time: '11:15 - 12:00', students: 43, present: 0, status: 'Upcoming' },
];

export default function ClassesPage() {
  const [classes] = useState(MOCK_CLASSES);

  const getStatusColor = (s: string) => {
    if (s === 'Ongoing') return 'bg-emerald-500/20 text-emerald-400';
    if (s === 'Completed') return 'bg-slate-500/20 text-slate-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  const totalPresent = classes.reduce((sum, c) => sum + c.present, 0);
  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);
  const ongoing = classes.filter(c => c.status === 'Ongoing').length;
  const avgAttendance = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen size={24} className="text-violet-400" /> Class Monitoring
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Real-time overview of all active classes today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Classes', value: classes.length, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Currently Ongoing', value: ongoing, icon: Clock, color: 'text-emerald-400' },
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-blue-400' },
          { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: TrendingUp, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {['Class', 'Subject', 'Teacher', 'Time', 'Students', 'Attendance', 'Status'].map(h => (
            <div key={h} className="px-4 py-3">{h}</div>
          ))}
        </div>
        {classes.map(c => {
          const attRate = c.students > 0 ? Math.round((c.present / c.students) * 100) : 0;
          return (
            <div key={c.id} className="grid grid-cols-7 gap-px bg-white/[0.02] text-sm border-t border-white/5">
              <div className="px-4 py-3 font-medium text-white">{c.class}</div>
              <div className="px-4 py-3 text-slate-300">{c.subject}</div>
              <div className="px-4 py-3 text-slate-300">{c.teacher}</div>
              <div className="px-4 py-3 text-slate-400 text-xs">{c.time}</div>
              <div className="px-4 py-3 text-slate-300">{c.students}</div>
              <div className="px-4 py-3">
                {c.status !== 'Upcoming' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${attRate >= 85 ? 'bg-emerald-400' : attRate >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${attRate}%` }} />
                    </div>
                    <span className="text-xs text-slate-300">{attRate}%</span>
                  </div>
                ) : <span className="text-xs text-slate-500">—</span>}
              </div>
              <div className="px-4 py-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>
                  {c.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
