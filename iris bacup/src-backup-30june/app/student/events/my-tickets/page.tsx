"use client";

import React, { useState, useEffect } from 'react';
import { Ticket, ArrowLeft, Calendar, MapPin, QrCode, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function MyTicketsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => { loadRegistrations(); }, []);

  const loadRegistrations = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/events/events/my-registrations/${studentId}`);
      if (res.success) {
        setRegistrations(res.registrations);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback mocks
      setRegistrations([
        {
          id: 'r1', ticket_number: 'EVT-K8XFGL2P', payment_status: 'Completed', attendance_marked: false,
          registered_at: '2026-06-09T10:00:00Z',
          events: {
            title: 'TechFest 2026 — AI & Robotics Summit', category: 'Tech',
            venue: 'Main Auditorium', start_datetime: '2026-06-20T10:00:00Z',
            end_datetime: '2026-06-21T18:00:00Z', status: 'Scheduled', banner_url: null
          }
        },
        {
          id: 'r2', ticket_number: 'EVT-M3WNPQ7Y', payment_status: 'Completed', attendance_marked: true,
          registered_at: '2026-05-20T14:00:00Z',
          events: {
            title: 'Design Thinking Workshop', category: 'Workshop',
            venue: 'Seminar Hall B', start_datetime: '2026-05-25T14:00:00Z',
            end_datetime: '2026-05-25T17:00:00Z', status: 'Completed', banner_url: null
          }
        },
        {
          id: 'r3', ticket_number: 'EVT-Z9RTY4AQ', payment_status: 'Completed', attendance_marked: false,
          registered_at: '2026-06-08T09:00:00Z',
          events: {
            title: 'Cultural Nite: Rhythm & Hues', category: 'Cultural',
            venue: 'Open Air Theatre', start_datetime: '2026-06-25T18:00:00Z',
            end_datetime: '2026-06-25T23:00:00Z', status: 'Scheduled', banner_url: null
          }
        },
        {
          id: 'r4', ticket_number: 'EVT-LP2BXFK8', payment_status: 'Pending', attendance_marked: false,
          registered_at: '2026-06-09T11:00:00Z',
          events: {
            title: 'CodeStorm — 24hr Hackathon', category: 'Hackathon',
            venue: 'Innovation Lab', start_datetime: '2026-07-12T08:00:00Z',
            end_datetime: '2026-07-13T08:00:00Z', status: 'Scheduled', banner_url: null
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  const filtered = registrations.filter(r => {
    if (activeFilter === 'upcoming') return isUpcoming(r.events?.start_datetime);
    if (activeFilter === 'past') return !isUpcoming(r.events?.start_datetime);
    return true;
  });

  const getStatusBadge = (reg: any) => {
    if (reg.attendance_marked) return { text: 'Attended', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' };
    if (reg.payment_status === 'Pending') return { text: 'Payment Pending', color: 'bg-amber-500/15 border-amber-500/30 text-amber-400' };
    if (isUpcoming(reg.events?.start_datetime)) return { text: 'Confirmed', color: 'bg-blue-500/15 border-blue-500/30 text-blue-400' };
    return { text: 'Missed', color: 'bg-red-500/15 border-red-500/30 text-red-400' };
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-6 pb-6">
          <Link href="/student/events" className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/60 hover:text-[#A78BFA] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Ticket className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">My Tickets</h1>
              <p className="text-sm text-[#C4B5FD]/70">{registrations.length} events registered</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 mb-6 max-w-sm">
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeFilter === f
                  ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                  : 'text-[#C4B5FD]/50 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-[#C4B5FD]/40 text-sm">
            No tickets found.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map(reg => {
              const ev = reg.events;
              const status = getStatusBadge(reg);
              const upcoming = isUpcoming(ev?.start_datetime);

              return (
                <div key={reg.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 overflow-hidden hover:border-[#6C2BD9]/20 transition-all">
                  <div className="flex flex-col lg:flex-row">
                    {/* Ticket Left Section */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                          {status.text}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-[#C4B5FD]/60">
                          {ev?.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-3">{ev?.title}</h3>

                      <div className="flex flex-wrap gap-4 text-xs text-[#C4B5FD]/60">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
                          {formatDate(ev?.start_datetime)} • {formatTime(ev?.start_datetime)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#A78BFA]" />
                          {ev?.venue || 'TBA'}
                        </div>
                      </div>

                      <p className="text-[10px] text-[#C4B5FD]/40 mt-3">
                        Registered: {formatDate(reg.registered_at)}
                      </p>
                    </div>

                    {/* Ticket Right Section (QR / Ticket Number) */}
                    <div className="lg:w-56 border-t lg:border-t-0 lg:border-l border-dashed border-white/10 p-6 flex flex-col items-center justify-center bg-white/[0.02]">
                      <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                        <QrCode className="w-12 h-12 text-[#A78BFA]/60" />
                      </div>
                      <p className="text-xs font-mono font-bold text-[#A78BFA]">{reg.ticket_number}</p>
                      <p className="text-[9px] text-[#C4B5FD]/30 mt-1">Show at entry</p>

                      {upcoming && reg.payment_status === 'Completed' && (
                        <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </div>
                      )}

                      {reg.payment_status === 'Pending' && (
                        <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                          <AlertCircle className="w-3 h-3" /> Complete Payment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
