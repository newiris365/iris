"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, BookOpen } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface TimetableEntry {
  id: string;
  day_of_week: string;
  time_slot: string;
  subject: string;
  room: string;
  department_name: string;
  semester: number;
  batch_year: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacultyTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');

  useEffect(() => {
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setSelectedDay(dayName);

    const load = async () => {
      try {
        const res = await apiGet('campusCore/faculty/timetable');
        if (res.success) setTimetable(res.timetable || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Group by day
  const byDay: Record<string, TimetableEntry[]> = {};
  DAYS.forEach(d => { byDay[d] = []; });
  timetable.forEach(t => {
    if (byDay[t.day_of_week]) byDay[t.day_of_week].push(t);
  });

  // Sort each day by time_slot
  Object.keys(byDay).forEach(day => {
    byDay[day].sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ClipboardList size={24} className="text-blue-400" />
        My Timetable
      </h1>

      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDay === day
                ? day === today ? 'bg-violet-600 text-white' : 'bg-blue-600 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {day.slice(0, 3)}
            {day === today && <span className="ml-1 text-xs opacity-70">(Today)</span>}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading timetable...</div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-400" />
            {selectedDay}
            {selectedDay === today && <span className="text-sm text-violet-400 font-normal">— Today</span>}
          </h2>
          {byDay[selectedDay]?.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No classes on {selectedDay}.</p>
          ) : (
            <div className="space-y-3">
              {byDay[selectedDay]?.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    entry.day_of_week === today
                      ? 'bg-violet-500/10 border-violet-500/20'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="min-w-[80px] text-center">
                    <p className="text-xs text-slate-400">Time</p>
                    <p className="text-lg font-mono font-semibold text-white">{entry.time_slot}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex-1">
                    <p className="text-base font-medium text-white flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-400" />
                      {entry.subject}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {entry.department_name || 'General'}
                      {entry.semester ? ` — Sem ${entry.semester}` : ''}
                      {entry.batch_year ? ` (${entry.batch_year})` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Room</p>
                    <p className="text-sm font-medium text-white">{entry.room || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Overview */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Overview</h2>
        {timetable.length === 0 ? (
          <p className="text-slate-400 text-sm">No timetable entries found.</p>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {DAYS.map((day) => (
              <div key={day} className="space-y-1">
                <p className={`text-xs font-medium text-center py-1 rounded ${
                  day === today ? 'bg-violet-500/20 text-violet-400' : 'text-slate-400'
                }`}>
                  {day.slice(0, 3)}
                </p>
                {byDay[day]?.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 rounded p-1.5 text-center border border-white/5"
                    title={`${entry.subject} — ${entry.time_slot}`}
                  >
                    <p className="text-[10px] font-mono text-slate-300">{entry.time_slot}</p>
                    <p className="text-[10px] text-white truncate">{entry.subject}</p>
                  </div>
                ))}
                {byDay[day]?.length === 0 && (
                  <p className="text-[10px] text-slate-500 text-center py-1">—</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
