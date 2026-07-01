"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, ChevronLeft, ChevronRight, Clock,
  GraduationCap, PartyPopper, BookOpen, AlertTriangle, Filter
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api';

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
  { value: 'semester_start', label: 'Semester Start', icon: GraduationCap, color: '#10B981' },
  { value: 'semester_end', label: 'Semester End', icon: GraduationCap, color: '#6366F1' },
  { value: 'exam_start', label: 'Exam Start', icon: BookOpen, color: '#EF4444' },
  { value: 'exam_end', label: 'Exam End', icon: BookOpen, color: '#F59E0B' },
  { value: 'holiday', label: 'Holiday', icon: PartyPopper, color: '#8B5CF6' },
  { value: 'result_date', label: 'Results', icon: GraduationCap, color: '#10B981' },
  { value: 'fee_due', label: 'Fee Due', icon: AlertTriangle, color: '#EF4444' },
  { value: 'admission_start', label: 'Admission Start', icon: Plus, color: '#3B82F6' },
  { value: 'admission_end', label: 'Admission End', icon: Plus, color: '#6366F1' },
  { value: 'orientation', label: 'Orientation', icon: GraduationCap, color: '#10B981' },
  { value: 'vacation', label: 'Vacation', icon: PartyPopper, color: '#8B5CF6' },
  { value: 'internal_exam', label: 'Internal Exam', icon: BookOpen, color: '#F59E0B' },
  { value: 'other', label: 'Other', icon: Calendar, color: '#6B7280' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState('all');

  // Create event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', event_type: 'semester_start', description: '', start_date: '',
    end_date: '', semester: '', batch_year: '', color: '#6C2BD9',
  });

  // Create holiday form
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', is_optional: false });

  useEffect(() => { fetchData(); }, []);

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

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.start_date) return;
    const res = await apiPost('campusCore/calendar', eventForm);
    if (res.success) {
      setShowEventForm(false);
      setEventForm({ title: '', event_type: 'semester_start', description: '', start_date: '', end_date: '', semester: '', batch_year: '', color: '#6C2BD9' });
      fetchData();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const res = await apiDelete(`campusCore/calendar/${id}`);
    if (res.success) fetchData();
  };

  const handleCreateHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) return;
    const res = await apiPost('campusCore/calendar/holidays', holidayForm);
    if (res.success) {
      setShowHolidayForm(false);
      setHolidayForm({ name: '', date: '', is_optional: false });
      fetchData();
    }
  };

  // Calendar grid
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={24} className="text-violet-400" />
          Academic Calendar
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowHolidayForm(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm flex items-center gap-2">
            <Plus size={16} /> Add Holiday
          </button>
          <button onClick={() => setShowEventForm(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm flex items-center gap-2">
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setCurrentMonth(m => m === 0 ? 11 : m - 1); if (currentMonth === 0) setCurrentYear(y => y - 1); }}
              className="text-slate-400 hover:text-white"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-semibold text-white">{MONTHS[currentMonth]} {currentYear}</h2>
            <button onClick={() => { setCurrentMonth(m => m === 11 ? 0 : m + 1); if (currentMonth === 11) setCurrentYear(y => y + 1); }}
              className="text-slate-400 hover:text-white"><ChevronRight size={20} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs text-slate-400 py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDate(day);
              const holiday = isHoliday(day);
              const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

              return (
                <div key={day} className={`h-16 rounded-lg border p-1 overflow-hidden ${
                  isToday ? 'border-violet-500 bg-violet-500/10' :
                  holiday ? 'border-amber-500/30 bg-amber-500/10' :
                  'border-white/5 bg-white/5'
                }`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-violet-400' : 'text-slate-300'}`}>{day}</p>
                  {holiday && (
                    <p className="text-[9px] text-amber-400 truncate">{holiday.name}</p>
                  )}
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="text-[9px] truncate rounded px-1" style={{ backgroundColor: e.color + '30', color: e.color }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[9px] text-slate-400">+{dayEvents.length - 2}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-violet-400" />
              Upcoming Events
            </h2>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm mb-3">
              <option value="all">All Types</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {filteredEvents.length === 0 ? (
              <p className="text-slate-400 text-sm">No upcoming events.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredEvents.slice(0, 10).map(e => {
                  const typeInfo = EVENT_TYPES.find(t => t.value === e.event_type) || EVENT_TYPES[EVENT_TYPES.length - 1];
                  return (
                    <div key={e.id} className="bg-white/5 rounded-lg p-3 border border-white/5 group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                          <div>
                            <p className="text-sm font-medium text-white">{e.title}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {e.end_date && e.end_date !== e.start_date && ` — ${new Date(e.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteEvent(e.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Holidays */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Holidays</h2>
            {holidays.length === 0 ? (
              <p className="text-slate-400 text-sm">No holidays defined.</p>
            ) : (
              <div className="space-y-2">
                {holidays.slice(0, 8).map(h => (
                  <div key={h.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/5">
                    <div>
                      <p className="text-sm text-white">{h.name}</p>
                      <p className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</p>
                    </div>
                    {h.is_optional && (
                      <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add Calendar Event</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Title *</label>
                <input type="text" value={eventForm.title}
                  onChange={e => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Event Type *</label>
                <select value={eventForm.event_type}
                  onChange={e => setEventForm({...eventForm, event_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Description</label>
                <textarea value={eventForm.description}
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Start Date *</label>
                  <input type="date" value={eventForm.start_date}
                    onChange={e => setEventForm({...eventForm, start_date: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">End Date</label>
                  <input type="date" value={eventForm.end_date}
                    onChange={e => setEventForm({...eventForm, end_date: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Semester</label>
                  <select value={eventForm.semester}
                    onChange={e => setEventForm({...eventForm, semester: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">All</option>
                    {Array.from({length:8},(_,i)=>(
                      <option key={i+1} value={i+1}>Semester {i+1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Color</label>
                  <input type="color" value={eventForm.color}
                    onChange={e => setEventForm({...eventForm, color: e.target.value})}
                    className="w-full h-9 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreateEvent}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm">Create Event</button>
                <button onClick={() => setShowEventForm(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Holiday Modal */}
      {showHolidayForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add Holiday</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Holiday Name *</label>
                <input type="text" value={holidayForm.name}
                  onChange={e => setHolidayForm({...holidayForm, name: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="e.g. Republic Day" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Date *</label>
                <input type="date" value={holidayForm.date}
                  onChange={e => setHolidayForm({...holidayForm, date: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={holidayForm.is_optional}
                  onChange={e => setHolidayForm({...holidayForm, is_optional: e.target.checked})}
                  className="rounded" />
                <label className="text-sm text-slate-300">Optional holiday</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreateHoliday}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm">Add Holiday</button>
                <button onClick={() => setShowHolidayForm(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
