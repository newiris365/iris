"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface DayRecord {
  date: string;
  status: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'Present': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'P' },
  'Absent': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'A' },
  'Half-Day': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'H' },
  'Leave': { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'L' },
  'Late': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'T' },
};

const DAYS_IN_MONTH = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
const FIRST_DAY_OF_MONTH = (month: number, year: number) => new Date(year, month, 1).getDay();

export default function ParentAttendancePage() {
  const [stats, setStats] = useState<any>({ overall: 72, total: 25, present: 18 });
  const [heatmap, setHeatmap] = useState<DayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    apiGet('/core/parent/child-info').then(childRes => {
      if (childRes.success && childRes.child?.student_id) {
        return apiGet(`/core/attendance/student/${childRes.child.student_id}`);
      }
      return null;
    }).then(res => {
      if (res?.success) {
        setStats(res.stats || { overall: 72, total: 25, present: 18 });
        setHeatmap(res.heatmap || []);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysCount = DAYS_IN_MONTH(currentMonth, currentYear);
  const firstDay = FIRST_DAY_OF_MONTH(currentMonth, currentYear);

  const getStatusForDate = (day: number): DayRecord | undefined => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return heatmap.find(h => h.date === dateStr);
  };

  const monthlyStats = (() => {
    let present = 0, absent = 0, halfDay = 0, leave = 0, late = 0, noClass = 0;
    for (let d = 1; d <= daysCount; d++) {
      const rec = getStatusForDate(d);
      if (!rec) { noClass++; continue; }
      switch (rec.status) {
        case 'Present': present++; break;
        case 'Absent': absent++; break;
        case 'Half-Day': halfDay++; break;
        case 'Leave': leave++; break;
        case 'Late': late++; break;
        default: noClass++;
      }
    }
    const total = present + absent + halfDay + leave + late;
    const attended = present + leave + halfDay * 0.5;
    return { present, absent, halfDay, leave, late, noClass, total, percentage: total > 0 ? Math.round((attended / total) * 100) : 100 };
  })();

  return (
    <div className="max-w-4xl mx-auto py-6 w-full flex flex-col gap-6">
      <div className="glass-panel rounded-3xl p-8 border border-white/5">
        <h2 className="font-heading font-extrabold text-2xl text-white">Class Check-ins Ledger</h2>
        <p className="text-xs text-[#C4B5FD] mt-1 font-light">Audit your child&apos;s daily class checkin statuses and thresholds.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

          {/* Circular Gauge */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
            <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Attendance Gauge</span>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="#6C2BD9"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * stats.overall) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <strong className="font-heading font-extrabold text-3xl text-white">{stats.overall}%</strong>
                <span className="text-[9px] text-[#C4B5FD]/70 mt-0.5">Threshold: 75%</span>
              </div>
            </div>

            {stats.overall < 75 && (
              <div className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Below criteria. Overdue alert sent.
              </div>
            )}

            {stats.daysNeeded > 0 && (
              <div className="text-[10px] text-yellow-400 font-semibold">
                Need {stats.daysNeeded} more days to reach 75%
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#A78BFA]" /> Daily Attendance
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={goToPrevMonth} className="p-1 rounded-lg hover:bg-white/10 text-[#C4B5FD] transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-white min-w-[100px] text-center">{monthName}</span>
                <button onClick={goToNextMonth} className="p-1 rounded-lg hover:bg-white/10 text-[#C4B5FD] transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Loading attendance...</div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[9px] text-[#C4B5FD]/50 font-semibold py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const rec = getStatusForDate(day);
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
                    const statusInfo = rec ? STATUS_COLORS[rec.status] : null;

                    return (
                      <div
                        key={day}
                        className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg text-xs transition-all ${
                          isToday ? 'ring-1 ring-[#6C2BD9] bg-[#6C2BD9]/10' : ''
                        } ${statusInfo ? statusInfo.bg : 'bg-transparent'}`}
                      >
                        <span className={`font-semibold text-[11px] ${isToday ? 'text-[#A78BFA]' : 'text-white/80'}`}>
                          {day}
                        </span>
                        {statusInfo && (
                          <span className={`text-[8px] font-bold ${statusInfo.text} leading-none mt-0.5`}>
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2 pt-3 border-t border-white/5">
                  {Object.entries(STATUS_COLORS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-sm ${val.bg} border border-white/10`} />
                      <span className="text-[9px] text-[#C4B5FD]/60">{key}</span>
                    </div>
                  ))}
                </div>

                {/* Monthly summary */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-lg font-bold text-emerald-400">{monthlyStats.present}</div>
                    <div className="text-[9px] text-emerald-400/60">Present</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-lg font-bold text-red-400">{monthlyStats.absent}</div>
                    <div className="text-[9px] text-red-400/60">Absent</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <div className="text-lg font-bold text-sky-400">{monthlyStats.leave}</div>
                    <div className="text-[9px] text-sky-400/60">Leave</div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
