"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  GraduationCap, PartyPopper, BookOpen, AlertTriangle, Filter, Sparkles, HelpCircle
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  description: string;
  start_date: string;
  end_date: string;
  semester: number;
  batch_year: string;
  color: string;
  days_until: number;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  is_optional: boolean;
}

const EVENT_TYPES = [
  { value: 'semester_start', label: 'Semester Start', icon: GraduationCap, color: '#06B6D4' },
  { value: 'semester_end', label: 'Semester End', icon: GraduationCap, color: '#6366F1' },
  { value: 'exam_start', label: 'Exam Start', icon: BookOpen, color: '#EF4444' },
  { value: 'exam_end', label: 'Exam End', icon: BookOpen, color: '#F59E0B' },
  { value: 'holiday', label: 'Holiday', icon: PartyPopper, color: '#8B5CF6' },
  { value: 'result_date', label: 'Results', icon: GraduationCap, color: '#10B981' },
  { value: 'fee_due', label: 'Fee Due', icon: AlertTriangle, color: '#EF4444' },
  { value: 'admission_start', label: 'Admission Start', icon: PlusIcon, color: '#3B82F6' },
  { value: 'admission_end', label: 'Admission End', icon: PlusIcon, color: '#6366F1' },
  { value: 'orientation', label: 'Orientation', icon: GraduationCap, color: '#10B981' },
  { value: 'vacation', label: 'Vacation', icon: PartyPopper, color: '#8B5CF6' },
  { value: 'internal_exam', label: 'Internal Exam', icon: BookOpen, color: '#F59E0B' },
  { value: 'other', label: 'Other', icon: Calendar, color: '#6B7280' },
];

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function StudentAcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [evRes, holRes] = await Promise.all([
        apiGet('campusCore/calendar', { months: '12' }),
        apiGet('campusCore/calendar/holidays'),
      ]);
      if (evRes.success) setEvents(evRes.events || []);
      if (holRes.success) setHolidays(holRes.holidays || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar calculations
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const start = e.start_date;
      const end = e.end_date || e.start_date;
      return dateStr >= start && dateStr <= end;
    });
  };

  const isHoliday = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr);
  };

  const filteredEvents = events.filter(e =>
    typeFilter === 'all' || e.event_type === typeFilter
  );

  // Find next upcoming academic event
  const upcomingSorted = [...events]
    .filter(e => new Date(e.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const nextMajorEvent = upcomingSorted.length > 0 ? upcomingSorted[0] : null;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#13102A]/80 backdrop-blur-md p-6 rounded-3xl border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white flex items-center gap-2">
                College Academic Calendar
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              </h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light mt-0.5">Stay updated with academic timelines, scheduled midterms, holiday logs, and semester schedules.</p>
            </div>
          </div>
          {nextMajorEvent && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-4 py-3 text-xs md:text-right flex flex-col justify-center gap-0.5 animate-fadeIn">
              <span className="text-[#C4B5FD]/50 font-medium uppercase tracking-wider text-[9px]">Next Major Landmark</span>
              <span className="font-bold text-white text-sm">{nextMajorEvent.title}</span>
              <span className="text-cyan-400 font-mono mt-0.5 font-semibold">
                In {Math.max(0, Math.ceil((new Date(nextMajorEvent.start_date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)))} Days ({new Date(nextMajorEvent.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Calendar Grid Container */}
          <div className="lg:col-span-2 bg-[#13102A]/80 backdrop-blur-md rounded-3xl border border-white/5 p-6 hover:border-cyan-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => { 
                  setCurrentMonth(m => m === 0 ? 11 : m - 1); 
                  if (currentMonth === 0) setCurrentYear(y => y - 1); 
                }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              <h2 className="text-lg font-bold text-white tracking-wide">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              
              <button 
                onClick={() => { 
                  setCurrentMonth(m => m === 11 ? 0 : m + 1); 
                  if (currentMonth === 11) setCurrentYear(y => y + 1); 
                }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {isLoading ? (
              <div className="h-96 flex items-center justify-center text-xs text-cyan-400 font-mono tracking-widest">
                <span className="animate-pulse">SYNCHRONIZING CALENDAR SCHEDULER...</span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-cyan-400/70 py-1 uppercase tracking-wider">{d}</div>
                ))}
                
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 bg-transparent rounded-2xl" />
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const holiday = isHoliday(day);
                  const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

                  return (
                    <div 
                      key={day} 
                      className={`h-20 rounded-2xl border p-1.5 overflow-hidden flex flex-col justify-between transition-all group hover:scale-[1.02] duration-200 ${
                        isToday ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/5' :
                        holiday ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40' :
                        'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <span className={`text-xs font-bold font-mono self-start ${
                        isToday ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white transition-colors'
                      }`}>
                        {String(day).padStart(2, '0')}
                      </span>
                      
                      <div className="space-y-1 mt-1 overflow-hidden flex-1 flex flex-col justify-end">
                        {holiday && (
                          <div className="text-[8px] font-bold text-amber-400 truncate bg-amber-500/10 border border-amber-500/20 px-1 rounded py-0.5 leading-none">
                            🎉 {holiday.name}
                          </div>
                        )}
                        {dayEvents.slice(0, 2).map(e => {
                          const typeInfo = EVENT_TYPES.find(t => t.value === e.event_type);
                          return (
                            <div 
                              key={e.id} 
                              className="text-[8px] font-medium truncate rounded px-1.5 py-0.5 border leading-none font-sans" 
                              style={{ 
                                backgroundColor: (e.color || '#6366F1') + '15', 
                                borderColor: (e.color || '#6366F1') + '30',
                                color: e.color || '#C4B5FD' 
                              }}
                            >
                              {e.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[7px] text-[#C4B5FD]/50 font-bold self-end pr-1 leading-none font-mono">
                            +{dayEvents.length - 2} MORE
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6 flex flex-col justify-start">
            
            {/* Filter & Upcoming Card */}
            <div className="bg-[#13102A]/80 backdrop-blur-md rounded-3xl border border-white/5 p-6 hover:border-cyan-500/20 transition-all duration-300">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                Upcoming Milestones
              </h2>
              
              <div className="relative mb-4">
                <select 
                  value={typeFilter} 
                  onChange={e => setTypeFilter(e.target.value)}
                  className="w-full bg-[#0D0A1A]/80 border border-white/10 hover:border-cyan-500/30 rounded-2xl px-4 py-2 text-white text-xs font-medium cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none"
                >
                  <option value="all">All Event Categories</option>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <Filter size={12} />
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#C4B5FD]/40 italic">
                  No upcoming events in this category.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {filteredEvents.slice(0, 10).map(e => {
                    const typeInfo = EVENT_TYPES.find(t => t.value === e.event_type) || EVENT_TYPES[EVENT_TYPES.length - 1];
                    const daysRemaining = Math.max(0, Math.ceil((new Date(e.start_date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)));
                    
                    return (
                      <div 
                        key={e.id} 
                        className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:border-cyan-500/10 transition-all flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" 
                              style={{ backgroundColor: e.color }} 
                            />
                            <p className="text-xs font-bold text-white truncate">{e.title}</p>
                          </div>
                          <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full shrink-0 font-mono">
                            {daysRemaining === 0 ? 'TODAY' : `In ${daysRemaining}d`}
                          </span>
                        </div>
                        
                        {e.description && (
                          <p className="text-[10px] text-[#C4B5FD]/60 leading-normal pl-4 font-light">{e.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mt-0.5 pl-4">
                          <span>
                            {new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {e.end_date && e.end_date !== e.start_date && ` — ${new Date(e.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </span>
                          {e.semester && (
                            <span className="text-[#C4B5FD]/70 font-semibold bg-white/5 px-1.5 py-0.5 rounded">
                              Sem {e.semester}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Holidays Card */}
            <div className="bg-[#13102A]/80 backdrop-blur-md rounded-3xl border border-white/5 p-6 hover:border-cyan-500/20 transition-all duration-300">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <PartyPopper size={16} className="text-amber-400" />
                Scheduled Holidays
              </h2>
              
              {holidays.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#C4B5FD]/40 italic">
                  No holidays configured.
                </div>
              ) : (
                <div className="space-y-2">
                  {holidays.slice(0, 6).map(h => (
                    <div 
                      key={h.id} 
                      className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5 hover:border-amber-500/10 transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{h.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </p>
                      </div>
                      {h.is_optional ? (
                        <span className="text-[8px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Optional
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-[#C4B5FD] bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Official
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Information Notice */}
            <div className="bg-gradient-to-br from-[#6C2BD9]/10 to-[#06B6D4]/10 border border-cyan-500/15 rounded-3xl p-5 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Calendar Details</p>
                <p className="text-[10px] text-[#C4B5FD]/75 leading-normal mt-1">
                  This calendar represents college-wide scheduling events published by the Academic Director. Attendance regulations require students to track exams and fee due dates closely.
                </p>
              </div>
            </div>

          </div>
          
        </div>

      </div>
    </main>
  );
}
