"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Search, Filter, MapPin, Clock, Users, Ticket, Star, ArrowRight, ChevronDown } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

const CATEGORIES = ['All', 'Cultural', 'Tech', 'Sports', 'Academic', 'Social', 'Workshop', 'Hackathon'];

export default function StudentEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadEvents(); }, []);

  useEffect(() => {
    let result = events;
    if (activeCategory !== 'All') {
      result = result.filter(e => e.category === activeCategory);
    }
    if (searchQuery) {
      result = result.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredEvents(result);
  }, [events, activeCategory, searchQuery]);

  const loadEvents = async () => {
    try {
      const res = await apiGet('/events/events?upcoming=true');
      if (res.success) {
        setEvents(res.events);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback mock data
      setEvents([
        {
          id: '1', title: 'TechFest 2026 — AI & Robotics Summit', category: 'Tech',
          venue: 'Main Auditorium', start_datetime: '2026-06-20T10:00:00Z', end_datetime: '2026-06-21T18:00:00Z',
          max_participants: 500, is_paid: true, ticket_price: 299, status: 'Scheduled',
          banner_url: null, tags: ['AI', 'Robotics', 'Innovation'], description: 'The flagship technology summit featuring hackathons, workshops, and keynote speakers from leading tech companies.'
        },
        {
          id: '2', title: 'Cultural Nite: Rhythm & Hues', category: 'Cultural',
          venue: 'Open Air Theatre', start_datetime: '2026-06-25T18:00:00Z', end_datetime: '2026-06-25T23:00:00Z',
          max_participants: 1000, is_paid: false, ticket_price: 0, status: 'Scheduled',
          banner_url: null, tags: ['Music', 'Dance', 'Performance'], description: 'Annual cultural extravaganza with live performances, DJ night, and food stalls.'
        },
        {
          id: '3', title: 'Inter-College Basketball Championship', category: 'Sports',
          venue: 'Indoor Sports Complex', start_datetime: '2026-07-05T09:00:00Z', end_datetime: '2026-07-07T18:00:00Z',
          max_participants: 200, is_paid: true, ticket_price: 149, status: 'Scheduled',
          banner_url: null, tags: ['Basketball', 'Sports', 'Tournament'], description: 'Three-day inter-college basketball tournament with teams from 20+ institutions.'
        },
        {
          id: '4', title: 'Design Thinking Workshop', category: 'Workshop',
          venue: 'Seminar Hall B', start_datetime: '2026-06-18T14:00:00Z', end_datetime: '2026-06-18T17:00:00Z',
          max_participants: 50, is_paid: false, ticket_price: 0, status: 'Scheduled',
          banner_url: null, tags: ['Design', 'UX', 'Product'], description: 'Hands-on workshop on design thinking methodology with industry professionals.'
        },
        {
          id: '5', title: 'CodeStorm — 24hr Hackathon', category: 'Hackathon',
          venue: 'Innovation Lab', start_datetime: '2026-07-12T08:00:00Z', end_datetime: '2026-07-13T08:00:00Z',
          max_participants: 300, is_paid: true, ticket_price: 199, status: 'Scheduled',
          banner_url: null, tags: ['Coding', 'Hackathon', 'Prizes'], description: 'Build, break, innovate. 24 hours of non-stop coding with prizes worth ₹2,00,000.'
        },
        {
          id: '6', title: 'Alumni Meet & Networking Gala', category: 'Social',
          venue: 'Grand Hall', start_datetime: '2026-07-20T17:00:00Z', end_datetime: '2026-07-20T22:00:00Z',
          max_participants: 400, is_paid: false, ticket_price: 0, status: 'Scheduled',
          banner_url: null, tags: ['Alumni', 'Networking'], description: 'Connect with distinguished alumni, share experiences, and build professional networks.'
        }
      ]);
    } finally {
      setLoading(false);
    }
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
      Hackathon: 'from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400'
    };
    return colors[cat] || 'from-gray-500/20 to-gray-500/10 border-gray-500/30 text-gray-400';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      Tech: '🚀', Cultural: '🎭', Sports: '🏆', Academic: '📚',
      Social: '🤝', Workshop: '🔧', Hackathon: '💻'
    };
    return icons[cat] || '📌';
  };

  // Determine featured event (first one)
  const featuredEvent = filteredEvents.length > 0 ? filteredEvents[0] : null;
  const otherEvents = filteredEvents.length > 1 ? filteredEvents.slice(1) : [];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS Events</h1>
              <p className="text-sm text-[#C4B5FD]/70">Discover • Register • Experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              type="text"
              placeholder="Search events..."
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
              <Link href={`/student/events/${featuredEvent.id}`} className="block mb-8 group">
                <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-[#13102A] to-[#1A1538] hover:border-[#6C2BD9]/30 transition-all shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6C2BD9]/20 via-transparent to-[#8B5CF6]/10" />
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C2BD9]/10 rounded-full blur-[100px]" />
                  
                  <div className="relative p-8 lg:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${getCategoryColor(featuredEvent.category)} border`}>
                        {getCategoryIcon(featuredEvent.category)} {featuredEvent.category}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA]">
                        ⭐ Featured
                      </span>
                      {featuredEvent.is_paid && (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          ₹{featuredEvent.ticket_price}
                        </span>
                      )}
                      {!featuredEvent.is_paid && (
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
                      {featuredEvent.max_participants && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#A78BFA]" />
                          {featuredEvent.max_participants} spots
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <span className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] text-xs font-bold text-white shadow-lg shadow-[#6C2BD9]/30 group-hover:bg-[#8B5CF6] transition-all flex items-center gap-1.5">
                        View Details <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] text-[#C4B5FD]/40 font-bold">{getDaysUntil(featuredEvent.start_datetime)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherEvents.map(event => (
                <Link key={event.id} href={`/student/events/${event.id}`} className="group">
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
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-[#C4B5FD]/40">{getDaysUntil(event.start_datetime)}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#A78BFA] group-hover:text-white transition-colors">
                        Register <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Quick Action: My Tickets */}
        <div className="mt-10">
          <Link
            href="/student/events/my-tickets"
            className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-[#13102A] to-[#1A1538] border border-white/5 hover:border-[#6C2BD9]/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C2BD9]/30 to-[#8B5CF6]/20 flex items-center justify-center border border-[#6C2BD9]/20">
                <Ticket className="w-6 h-6 text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">My Tickets & Registrations</h3>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">View your registered events, QR codes, and tickets</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#C4B5FD]/30 group-hover:text-[#A78BFA] transition-colors" />
          </Link>
        </div>
      </div>
    </main>
  );
}
