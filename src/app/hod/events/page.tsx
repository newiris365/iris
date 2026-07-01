"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, MapPin, Users, Clock, Award, ChevronRight } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface DepartmentEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  attendees: number;
  category: 'Tech' | 'Cultural' | 'Sports' | 'Academic' | 'Workshop';
  status: 'upcoming' | 'completed' | 'cancelled';
}

const mockEvents: DepartmentEvent[] = [];

const categoryColors: Record<string, string> = {
  Tech: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Cultural: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Sports: 'bg-green-500/20 text-green-400 border-green-500/30',
  Academic: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Workshop: 'bg-[#0891B2]/20 text-[#0891B2] border-[#0891B2]/30',
};

const categories = ['All', 'Tech', 'Cultural', 'Sports', 'Academic', 'Workshop'];

export default function HodEventsPage() {
  const [events, setEvents] = useState<DepartmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    organizer: '',
    category: 'Tech' as DepartmentEvent['category'],
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await apiGet('/events/events');
        if (res.success && Array.isArray(res.events) && res.events.length) {
          setEvents(res.events);
        } else {
          setEvents(mockEvents);
        }
      } catch {
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filtered = Array.isArray(events) ? events.filter(e => {
    const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.organizer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  const stats = {
    upcoming: Array.isArray(events) ? events.filter(e => e.status === 'upcoming').length : 0,
    completed: Array.isArray(events) ? events.filter(e => e.status === 'completed').length : 0,
    total: Array.isArray(events) ? events.length : 0,
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.venue) return;
    const created: DepartmentEvent = {
      id: `EVT-${String(events.length + 1).padStart(3, '0')}`,
      ...newEvent,
      attendees: 0,
      status: 'upcoming',
    };
    setEvents(prev => [created, ...prev]);
    setNewEvent({ title: '', description: '', date: '', time: '', venue: '', organizer: '', category: 'Tech' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#0891B2] animate-pulse text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#0D0A1A] min-h-screen p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={24} className="text-[#0891B2]" />
          Department Events
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#06b4d4] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', value: stats.upcoming, color: 'text-[#0891B2]' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
          { label: 'Total Events', value: stats.total, color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Create New Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
              className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2]"
            />
            <select
              value={newEvent.category}
              onChange={e => setNewEvent(p => ({ ...p, category: e.target.value as DepartmentEvent['category'] }))}
              className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0891B2]"
            >
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c} className="bg-[#0D0A1A]">{c}</option>
              ))}
            </select>
            <input
              type="date"
              value={newEvent.date}
              onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
              className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0891B2]"
            />
            <input
              type="text"
              placeholder="Time (e.g. 10:00 AM - 04:00 PM)"
              value={newEvent.time}
              onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
              className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2]"
            />
            <input
              type="text"
              placeholder="Venue"
              value={newEvent.venue}
              onChange={e => setNewEvent(p => ({ ...p, venue: e.target.value }))}
              className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2]"
            />
            <input
              type="text"
              placeholder="Organizer"
              value={newEvent.organizer}
              onChange={e => setNewEvent(p => ({ ...p, organizer: e.target.value }))}
              className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2]"
            />
          </div>
          <textarea
            placeholder="Event description..."
            value={newEvent.description}
            onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2] resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreateEvent}
              className="bg-[#0891B2] hover:bg-[#06b4d4] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create Event
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-white/10 hover:bg-white/20 text-slate-300 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search events by title, description, or organizer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#0891B2]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat
                  ? 'bg-[#0891B2]/20 text-[#0891B2] border-[#0891B2]/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No events found matching your criteria.
          </div>
        ) : (
          filtered.map(event => (
            <div
              key={event.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-[#0891B2]/30 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#0891B2] transition-colors">
                      {event.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColors[event.category]}`}>
                      {event.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'upcoming'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#0891B2]" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#0891B2]" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#0891B2]" />
                      {event.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award size={14} className="text-[#0891B2]" />
                      {event.organizer}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-[#0891B2]" />
                      {event.attendees} attendees
                    </span>
                  </div>
                </div>
                <button className="self-center text-slate-500 group-hover:text-[#0891B2] transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
