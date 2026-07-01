"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Filter, ChevronDown } from 'lucide-react';
import { apiGet } from '../../../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SUBJECT_COLORS: Record<string, string> = {
  Math: 'from-cyan-500/30 to-cyan-600/20 border-cyan-500/40 text-cyan-300',
  Physics: 'from-violet-500/30 to-violet-600/20 border-violet-500/40 text-violet-300',
  'CS Basics': 'from-emerald-500/30 to-emerald-600/20 border-emerald-500/40 text-emerald-300',
  English: 'from-amber-500/30 to-amber-600/20 border-amber-500/40 text-amber-300',
  Database: 'from-rose-500/30 to-rose-600/20 border-rose-500/40 text-rose-300',
  Networks: 'from-blue-500/30 to-blue-600/20 border-blue-500/40 text-blue-300',
};

const DEFAULT_COLOR = 'from-slate-500/30 to-slate-600/20 border-slate-500/40 text-slate-300';

interface TimetableCell {
  subject: string;
  teacher: string;
  room: string;
  colorIndex: number;
}

type TimetableGrid = (TimetableCell | null)[][];

interface Department {
  id: string;
  name: string;
}

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'cs', name: 'Computer Science' },
  { id: 'ee', name: 'Electrical Engineering' },
  { id: 'me', name: 'Mechanical Engineering' },
  { id: 'ce', name: 'Civil Engineering' },
];

const MOCK_CS_TIMETABLE: TimetableGrid = [
  [
    { subject: 'Math', teacher: 'Dr. Sharma', room: 'Room 101', colorIndex: 0 },
    { subject: 'Physics', teacher: 'Dr. Patel', room: 'Room 204', colorIndex: 1 },
    null,
    { subject: 'CS Basics', teacher: 'Prof. Gupta', room: 'Lab 3', colorIndex: 2 },
  ],
  [
    { subject: 'English', teacher: 'Ms. Rao', room: 'Room 105', colorIndex: 3 },
    { subject: 'Math', teacher: 'Dr. Sharma', room: 'Room 101', colorIndex: 0 },
    { subject: 'Database', teacher: 'Prof. Mehta', room: 'Lab 1', colorIndex: 4 },
    null,
  ],
  [
    null,
    { subject: 'CS Basics', teacher: 'Prof. Gupta', room: 'Lab 3', colorIndex: 2 },
    { subject: 'Networks', teacher: 'Dr. Nair', room: 'Room 302', colorIndex: 5 },
    { subject: 'Math', teacher: 'Dr. Sharma', room: 'Room 101', colorIndex: 0 },
  ],
  [
    { subject: 'Database', teacher: 'Prof. Mehta', room: 'Lab 1', colorIndex: 4 },
    null,
    { subject: 'Physics', teacher: 'Dr. Patel', room: 'Room 204', colorIndex: 1 },
    { subject: 'English', teacher: 'Ms. Rao', room: 'Room 105', colorIndex: 3 },
  ],
  [
    { subject: 'Networks', teacher: 'Dr. Nair', room: 'Room 302', colorIndex: 5 },
    { subject: 'English', teacher: 'Ms. Rao', room: 'Room 105', colorIndex: 3 },
    { subject: 'Math', teacher: 'Dr. Sharma', room: 'Room 101', colorIndex: 0 },
    null,
  ],
  [
    null,
    { subject: 'Database', teacher: 'Prof. Mehta', room: 'Lab 1', colorIndex: 4 },
    { subject: 'CS Basics', teacher: 'Prof. Gupta', room: 'Lab 3', colorIndex: 2 },
    { subject: 'Networks', teacher: 'Dr. Nair', room: 'Room 302', colorIndex: 5 },
  ],
];

const PERIOD_TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];

export default function HodTimetablePage() {
  const [departments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState<string>('cs');
  const [semester, setSemester] = useState<string>('3');
  const [batch, setBatch] = useState<string>('A');
  const [timetable, setTimetable] = useState<TimetableGrid>([]);
  const [loading, setLoading] = useState(true);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const res = await apiGet(`/campusCore/timetable/${selectedDept}`);
        if (res.success && res.timetable) {
          setTimetable(res.timetable);
        } else {
          setTimetable(MOCK_CS_TIMETABLE);
        }
      } catch {
        setTimetable(MOCK_CS_TIMETABLE);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedDept]);

  const selectedDeptName = departments.find(d => d.id === selectedDept)?.name || 'CS';

  const totalClasses = timetable.flat().filter(Boolean).length;

  const subjectSummary = timetable.flat().reduce<Record<string, number>>((acc, cell) => {
    if (cell) {
      acc[cell.subject] = (acc[cell.subject] || 0) + 1;
    }
    return acc;
  }, {});

  const getColorClass = (subject: string): string => {
    return SUBJECT_COLORS[subject] || DEFAULT_COLOR;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const lines: string[] = [];
    lines.push(`Timetable - ${selectedDeptName}`);
    lines.push(`Semester ${semester} | Batch ${batch}`);
    lines.push('');
    lines.push(`Period,${DAYS.join(',')}`);

    const periodCount = timetable[0]?.length || 4;
    for (let p = 0; p < periodCount; p++) {
      const row = [`Period ${p + 1} (${PERIOD_TIMES[p] || ''})`];
      for (let d = 0; d < DAYS.length; d++) {
        const cell = timetable[d]?.[p];
        row.push(cell ? `${cell.subject} - ${cell.teacher} (${cell.room})` : '-');
      }
      lines.push(row.join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${selectedDept}-sem${semester}-batch${batch}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0891B2] border-t-transparent rounded-full animate-spin" />
          <p className="text-cyan-400 animate-pulse text-sm">Loading timetable...</p>
        </div>
      </div>
    );
  }

  const periodCount = timetable[0]?.length || 4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar size={24} className="text-[#0891B2]" />
            Department Timetable
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View the weekly class schedule for {selectedDeptName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#0891B2]/20 hover:bg-[#0891B2]/30 border border-[#0891B2]/30 rounded-xl text-[#0891B2] text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0D0A1A] border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Department Selector */}
          <div className="relative flex-1 min-w-[200px]">
            <label className="text-xs text-slate-400 mb-1 block">Department</label>
            <button
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm hover:border-[#0891B2]/40 transition-colors"
            >
              <span>{selectedDeptName}</span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDeptDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDeptDropdown && (
              <div className="absolute z-20 top-full mt-1 w-full bg-[#1a1530] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setSelectedDept(dept.id);
                      setShowDeptDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                      selectedDept === dept.id ? 'text-[#0891B2] bg-[#0891B2]/10' : 'text-slate-300'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Semester */}
          <div className="min-w-[120px]">
            <label className="text-xs text-slate-400 mb-1 block">Semester</label>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm appearance-none cursor-pointer hover:border-[#0891B2]/40 transition-colors focus:outline-none focus:border-[#0891B2]/60"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s} className="bg-[#1a1530] text-white">Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Batch */}
          <div className="min-w-[100px]">
            <label className="text-xs text-slate-400 mb-1 block">Batch</label>
            <select
              value={batch}
              onChange={e => setBatch(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm appearance-none cursor-pointer hover:border-[#0891B2]/40 transition-colors focus:outline-none focus:border-[#0891B2]/60"
            >
              {['A', 'B', 'C'].map(b => (
                <option key={b} value={b} className="bg-[#1a1530] text-white">Batch {b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center gap-2 mt-3 text-xs text-slate-400 hover:text-[#0891B2] transition-colors"
        >
          <Filter size={14} />
          {showFilters ? 'Hide Filters' : 'More Filters'}
        </button>
      </div>

      {/* Summary Bar */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(subjectSummary).map(([subject, count]) => (
          <div
            key={subject}
            className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${getColorClass(subject)} border rounded-lg text-xs font-medium`}
          >
            <div className="w-2 h-2 rounded-full bg-current opacity-60" />
            {subject}
            <span className="opacity-60">{count}x</span>
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400">
          Total: {totalClasses} classes
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-[#0D0A1A] border border-white/10 rounded-2xl overflow-hidden">
        {/* Desktop Grid */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 bg-white/5 border-b border-white/10 min-w-[100px]">
                  Day / Period
                </th>
                {Array.from({ length: periodCount }, (_, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-center text-xs font-medium text-slate-400 bg-white/5 border-b border-l border-white/10 min-w-[160px]"
                  >
                    <div>Period {i + 1}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{PERIOD_TIMES[i] || ''}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dayIdx) => (
                <tr key={day} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white border-b border-white/5 bg-white/[0.02]">
                    <div>{day}</div>
                    <div className="text-[10px] text-slate-500 md:hidden">{SHORT_DAYS[dayIdx]}</div>
                  </td>
                  {Array.from({ length: periodCount }, (_, periodIdx) => {
                    const cell = timetable[dayIdx]?.[periodIdx];
                    return (
                      <td
                        key={periodIdx}
                        className="px-3 py-3 border-b border-l border-white/5 align-top"
                      >
                        {cell ? (
                          <div
                            className={`rounded-xl p-3 border bg-gradient-to-br ${getColorClass(cell.subject)} transition-all hover:scale-[1.02] hover:shadow-lg cursor-default`}
                          >
                            <div className="text-xs font-semibold mb-1">{cell.subject}</div>
                            <div className="text-[10px] opacity-75">{cell.teacher}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">{cell.room}</div>
                          </div>
                        ) : (
                          <div className="h-full min-h-[60px] rounded-xl border border-dashed border-white/5 flex items-center justify-center">
                            <span className="text-xs text-slate-600">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{day}</h3>
              <div className="grid grid-cols-1 gap-2">
                {Array.from({ length: periodCount }, (_, periodIdx) => {
                  const cell = timetable[dayIdx]?.[periodIdx];
                  return (
                    <div key={periodIdx} className="flex items-start gap-3">
                      <div className="text-[10px] text-slate-500 w-14 pt-2 shrink-0">
                        P{periodIdx + 1}
                        <br />
                        {PERIOD_TIMES[periodIdx] || ''}
                      </div>
                      {cell ? (
                        <div
                          className={`flex-1 rounded-xl p-3 border bg-gradient-to-br ${getColorClass(cell.subject)} transition-all`}
                        >
                          <div className="text-xs font-semibold">{cell.subject}</div>
                          <div className="text-[10px] opacity-75">{cell.teacher}</div>
                          <div className="text-[10px] opacity-60">{cell.room}</div>
                        </div>
                      ) : (
                        <div className="flex-1 rounded-xl border border-dashed border-white/5 p-3 flex items-center justify-center">
                          <span className="text-xs text-slate-600">Free</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#0D0A1A] border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Color Legend</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(SUBJECT_COLORS).map(([subject, colorClass]) => (
            <div
              key={subject}
              className={`flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${colorClass} border rounded-lg text-xs`}
            >
              {subject}
            </div>
          ))}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDeptDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDeptDropdown(false)}
        />
      )}
    </div>
  );
}
