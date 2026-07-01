"use client";

import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Users, Tag, Clock, ChevronRight, Star, Zap } from 'lucide-react';
import { apiGet } from '../../../lib/api';

const CATEGORIES = ['All', 'Tech', 'Cultural', 'Sports', 'Academic', 'Social', 'Workshop'];

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'AI in Education — Faculty Summit',
    category: 'Tech',
    description: 'Explore the transformative role of artificial intelligence in modern education. Sessions on AI-powered grading, personalized learning paths, and ethical considerations for educators.',
    venue: 'Seminar Hall A',
    organizer: 'Dept. of Computer Science',
    start_datetime: '2026-06-20T10:00:00Z',
    end_datetime: '2026-06-20T16:00:00Z',
    max_participants: 120,
    attendees: 87,
    is_paid: false,
    ticket_price: 0,
    status: 'Scheduled',
    tags: ['AI', 'EdTech', 'Faculty']
  },
  {
    id: '2',
    title: 'Annual Cultural Fest — Rangoli',
    category: 'Cultural',
    description: 'The flagship cultural celebration featuring faculty performances, art exhibitions, and cross-departmental competitions. Open to all faculty and staff.',
    venue: 'Open Air Theatre',
    organizer: 'Cultural Committee',
    start_datetime: '2026-06-25T17:00:00Z',
    end_datetime: '2026-06-25T22:00:00Z',
    max_participants: 300,
    attendees: 214,
    is_paid: false,
    ticket_price: 0,
    status: 'Scheduled',
    tags: ['Culture', 'Performance', 'Community']
  },
  {
    id: '3',
    title: 'Research Methodology Workshop',
    category: 'Workshop',
    description: 'Intensive three-day workshop on advanced research methodologies, grant writing, and publishing strategies for mid-career faculty members.',
    venue: 'Conference Room 201',
    organizer: 'Research Cell',
    start_datetime: '2026-07-02T09:00:00Z',
    end_datetime: '2026-07-04T17:00:00Z',
    max_participants: 60,
    attendees: 52,
    is_paid: true,
    ticket_price: 499,
    status: 'Scheduled',
    tags: ['Research', 'Publishing', 'Grants']
  },
  {
    id: '4',
    title: 'Faculty Cricket League 2026',
    category: 'Sports',
    description: 'Inter-department cricket tournament for faculty members. Teams of 11, round-robin format with semi-finals and grand final.',
    venue: 'College Cricket Ground',
    organizer: 'Sports Council',
    start_datetime: '2026-07-10T07:00:00Z',
    end_datetime: '2026-07-12T18:00:00Z',
    max_participants: 100,
    attendees: 88,
    is_paid: true,
    ticket_price: 199,
    status: 'Scheduled',
    tags: ['Cricket', 'Tournament', 'Team Building']
  },
  {
    id: '5',
    title: 'Pedagogy Innovation Symposium',
    category: 'Academic',
    description: 'Showcase of innovative teaching practices. Faculty present case studies on flipped classrooms, gamification, and blended learning models.',
    venue: 'Main Auditorium',
    organizer: 'Academic Affairs',
    start_datetime: '2026-07-18T10:00:00Z',
    end_datetime: '2026-07-18T17:00:00Z',
    max_participants: 200,
    attendees: 156,
    is_paid: false,
    ticket_price: 0,
    status: 'Scheduled',
    tags: ['Teaching', 'Innovation', 'Pedagogy']
  },
  {
    id: '6',
    title: 'Faculty Wellness Retreat',
    category: 'Social',
    description: 'A day-long retreat focused on mental health, stress management, and work-life balance. Includes yoga sessions, mindfulness workshops, and group activities.',
    venue: 'Campus Green & Wellness Center',
    organizer: 'HR & Wellness Cell',
    start_datetime: '2026-07-25T08:00:00Z',
    end_datetime: '2026-07-25T17:00:00Z',
    max_participants: 150,
    attendees: 112,
    is_paid: false,
    ticket_price: 0,
    status: 'Scheduled',
    tags: ['Wellness', 'Mental Health', 'Yoga']
  },
  {
    id: '7',
    title: 'Industry-Academia Collaborative Summit',
    category: 'Academic',
    description: 'Bridge the gap between industry and academia. Panel discussions with corporate leaders, internship coordination strategies, and curriculum alignment.',
    venue: 'Management Block Hall',
    organizer: 'Placement Cell & Industry Relations',
    start_datetime: '2026-08-01T09:30:00Z',
    end_datetime: '2026-08-01T16:30:00Z',
    max_participants: 180,
    attendees: 95,
    is_paid: true,
    ticket_price: 349,
    status: 'Scheduled',
    tags: ['Industry', 'Collaboration', 'Placements']
  }
];

export default function TeacherEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    let result = events;
    if (activeCategory !== 'All') {
      result = result.filter(e => e.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q))
      );
    }
    setFilteredEvents(result);
  }, [events, activeCategory, searchQuery]);

  const loadEvents = async () => {
    try {
      const res = await apiGet('/events/events?upcoming=true');
      if (res.success && res.events) {
        setEvents(res.events);
      } else {
        throw new Error('API error');
      }
    } catch {
      setEvents(MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (eventId: string) => {
    setRegisteredIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Happening now';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Tech: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
      Cultural: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400',
      Sports: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
      Academic: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
      Social: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400',
      Workshop: 'from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-400',
    };
    return colors[cat] || 'from-gray-500/20 to-gray-500/10 border-gray-500/30 text-gray-400';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      Tech: '💻',
      Cultural: '🎭',
      Sports: '🏏',
      Academic: '📚',
      Social: '🧘',
      Workshop: '🔧',
    };
    return icons[cat] || '📌';
  };

  const featuredEvent = filteredEvents.length > 0 ? filteredEvents[0] : null;
  const otherEvents = filteredEvents.length > 1 ? filteredEvents.slice(1) : [];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Faculty Events</h1>
              <p className="text-sm text-[#C4B5FD]/70">Attend • Network • Grow</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              type="text"
              placeholder="Search events, topics, venues..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#13102A] border border-white/10 text-sm text-white placeholder-[#C4B5FD]/30 focus:outline-none focus:border-[#6C2BD9]/50 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30'
                  : 'bg-white/5 text-[#C4B5FD]/60 border border-white/5 hover:bg-white/10'
              }`}
            >
              {cat !== 'All' && <span className="mr-1.5">{getCategoryIcon(cat)}</span>}
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-32 text-[#C4B5FD]/40 text-sm">
            No events found matching your criteria.
          </div>
        ) : (
          <>
            {/* Featured Event Hero Card */}
            {featuredEvent && (
              <div className="mb-8 group">
                <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] hover:border-[#6C2BD9]/30 transition-all shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6C2BD9]/20 via-transparent to-[#8B5CF6]/10" />
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C2BD9]/10 rounded-full blur-[100px]" />

                  <div className="relative p-8 lg:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${getCategoryColor(featuredEvent.category)} border`}>
                        {getCategoryIcon(featuredEvent.category)} {featuredEvent.category}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA]">
                        <Star className="w-3 h-3 inline mr-1" />
                        Featured
                      </span>
                      {featuredEvent.is_paid ? (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          ₹{featuredEvent.ticket_price}
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          FREE
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3 group-hover:text-[#A78BFA] transition-colors">
                      {featuredEvent.title}
                    </h2>
                    <p className="text-sm text-[#C4B5FD]/60 mb-6 max-w-2xl line-clamp-2">
                      {featuredEvent.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-[#C4B5FD]/70">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                        {formatDate(featuredEvent.start_datetime)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                        {formatTime(featuredEvent.start_datetime)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#A78BFA]" />
                        {featuredEvent.venue || 'TBA'}
                      </div>
                      {featuredEvent.organizer && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#A78BFA]" />
                          {featuredEvent.organizer}
                        </div>
                      )}
                      {featuredEvent.max_participants && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#A78BFA]" />
                          {featuredEvent.attendees || 0}/{featuredEvent.max_participants} attending
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={() => handleRegister(featuredEvent.id)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 ${
                          registeredIds.has(featuredEvent.id)
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : 'bg-[#6C2BD9] text-white shadow-[#6C2BD9]/30 hover:bg-[#8B5CF6]'
                        }`}
                      >
                        {registeredIds.has(featuredEvent.id) ? '✓ Registered' : 'Register Now'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-[#C4B5FD]/40 font-bold">{getDaysUntil(featuredEvent.start_datetime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherEvents.map(event => (
                <div key={event.id} className="group">
                  <div className="h-full rounded-2xl border border-white/5 bg-[#13102A]/60 hover:border-[#6C2BD9]/30 transition-all p-5 flex flex-col">
                    {/* Category Badge + Price */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${getCategoryColor(event.category)} border`}>
                        {getCategoryIcon(event.category)} {event.category}
                      </span>
                      {event.is_paid ? (
                        <span className="text-xs font-bold text-emerald-400">₹{event.ticket_price}</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">FREE</span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-[#A78BFA] transition-colors mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-[11px] text-[#C4B5FD]/50 mb-4 line-clamp-2 flex-1">
                      {event.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-col gap-2 text-[10px] text-[#C4B5FD]/60 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#A78BFA]/60" />
                        {formatDate(event.start_datetime)} • {formatTime(event.start_datetime)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#A78BFA]/60" />
                        {event.venue || 'Venue TBA'}
                      </div>
                      {event.organizer && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-[#A78BFA]/60" />
                          {event.organizer}
                        </div>
                      )}
                      {event.max_participants && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-[#A78BFA]/60" />
                          {event.attendees || 0}/{event.max_participants} spots filled
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-[#C4B5FD]/40">{getDaysUntil(event.start_datetime)}</span>
                      <button
                        onClick={() => handleRegister(event.id)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition-colors px-3 py-1.5 rounded-lg ${
                          registeredIds.has(event.id)
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'text-[#A78BFA] hover:text-white hover:bg-[#6C2BD9]/20'
                        }`}
                      >
                        {registeredIds.has(event.id) ? '✓ Registered' : 'Register'}
                        {!registeredIds.has(event.id) && <ChevronRight className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
