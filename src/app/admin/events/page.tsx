"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Users, Ticket, DollarSign, TrendingUp, BarChart3, Plus, ArrowRight, Eye, PieChart } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AdminEventsDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        apiGet('/events/events/analytics/overview'),
        apiGet('/events/events')
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      if (eventsRes.success) setRecentEvents(eventsRes.events?.slice(0, 6) || []);
    } catch {
      // Fallback mocks
      setAnalytics({
        total_events: 24,
        upcoming_events: 8,
        total_registrations: 3420,
        total_checked_in: 2856,
        attendance_rate: '83.5%',
        total_revenue: 245000,
        events_by_category: { Tech: 8, Cultural: 5, Sports: 4, Workshop: 3, Hackathon: 2, Social: 2 }
      });
      setRecentEvents([
        { id: '1', title: 'TechFest 2026', category: 'Tech', status: 'Scheduled', start_datetime: '2026-06-20T10:00:00Z', max_participants: 500 },
        { id: '2', title: 'Cultural Nite', category: 'Cultural', status: 'Scheduled', start_datetime: '2026-06-25T18:00:00Z', max_participants: 1000 },
        { id: '3', title: 'Basketball Championship', category: 'Sports', status: 'Scheduled', start_datetime: '2026-07-05T09:00:00Z', max_participants: 200 },
        { id: '4', title: 'Design Workshop', category: 'Workshop', status: 'Completed', start_datetime: '2026-05-18T14:00:00Z', max_participants: 50 },
        { id: '5', title: 'CodeStorm Hackathon', category: 'Hackathon', status: 'Scheduled', start_datetime: '2026-07-12T08:00:00Z', max_participants: 300 },
        { id: '6', title: 'Alumni Meet', category: 'Social', status: 'Completed', start_datetime: '2026-05-20T17:00:00Z', max_participants: 400 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const kpiCards = analytics ? [
    { label: 'Total Events', value: analytics.total_events, icon: Calendar, gradient: 'from-[#6C2BD9]/20 to-[#8B5CF6]/10', iconColor: 'text-[#A78BFA]', borderColor: 'border-[#6C2BD9]/20' },
    { label: 'Upcoming', value: analytics.upcoming_events, icon: TrendingUp, gradient: 'from-emerald-500/15 to-teal-500/10', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
    { label: 'Total Registrations', value: analytics.total_registrations.toLocaleString(), icon: Users, gradient: 'from-blue-500/15 to-cyan-500/10', iconColor: 'text-blue-400', borderColor: 'border-blue-500/20' },
    { label: 'Attendance Rate', value: analytics.attendance_rate, icon: Ticket, gradient: 'from-amber-500/15 to-yellow-500/10', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20' },
    { label: 'Revenue', value: `₹${analytics.total_revenue.toLocaleString()}`, icon: DollarSign, gradient: 'from-pink-500/15 to-rose-500/10', iconColor: 'text-pink-400', borderColor: 'border-pink-500/20' },
    { label: 'Checked In', value: analytics.total_checked_in.toLocaleString(), icon: Eye, gradient: 'from-violet-500/15 to-purple-500/10', iconColor: 'text-violet-400', borderColor: 'border-violet-500/20' }
  ] : [];

  const categoryColors: Record<string, string> = {
    Tech: 'bg-blue-500', Cultural: 'bg-pink-500', Sports: 'bg-emerald-500',
    Workshop: 'bg-orange-500', Hackathon: 'bg-teal-500', Social: 'bg-violet-500', Academic: 'bg-amber-500'
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS Events — Admin</h1>
                <p className="text-sm text-[#C4B5FD]/70">Manage • Organize • Report</p>
              </div>
            </div>
            <Link
              href="/admin/events/create"
              className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Event
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {kpiCards.map((kpi, i) => (
                <div key={i} className={`rounded-2xl border ${kpi.borderColor} bg-gradient-to-br ${kpi.gradient} p-4 flex flex-col gap-3`}>
                  <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${kpi.iconColor}`}>
                    <kpi.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white">{kpi.value}</p>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{kpi.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Events Table */}
              <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#A78BFA]" /> All Events
                  </h2>
                  <Link href="/admin/events/analytics" className="text-[10px] font-bold text-[#A78BFA] hover:text-white transition-colors flex items-center gap-1">
                    View Analytics <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-2 text-left text-[#C4B5FD]/40 font-semibold">Event</th>
                        <th className="py-2 text-left text-[#C4B5FD]/40 font-semibold">Category</th>
                        <th className="py-2 text-left text-[#C4B5FD]/40 font-semibold">Date</th>
                        <th className="py-2 text-left text-[#C4B5FD]/40 font-semibold">Status</th>
                        <th className="py-2 text-right text-[#C4B5FD]/40 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map(ev => (
                        <tr key={ev.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 text-white font-semibold max-w-[200px] truncate">{ev.title}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-[#C4B5FD]/70">{ev.category}</span>
                          </td>
                          <td className="py-3 text-[#C4B5FD]/60">{formatDate(ev.start_datetime)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              ev.status === 'Scheduled' ? 'bg-emerald-500/15 text-emerald-400' :
                              ev.status === 'Ongoing' ? 'bg-amber-500/15 text-amber-400' :
                              ev.status === 'Completed' ? 'bg-blue-500/15 text-blue-400' :
                              'bg-red-500/15 text-red-400'
                            }`}>{ev.status}</span>
                          </td>
                          <td className="py-3 text-right">
                            <Link href={`/admin/events/${ev.id}`} className="text-[#A78BFA] hover:text-white transition-colors font-bold">
                              Manage →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-5">
                  <PieChart className="w-4 h-4 text-[#A78BFA]" /> By Category
                </h2>

                {analytics?.events_by_category && (
                  <div className="flex flex-col gap-3">
                    {Object.entries(analytics.events_by_category)
                      .sort((a: any, b: any) => b[1] - a[1])
                      .map(([category, count]: [string, any]) => {
                        const total = Object.values(analytics.events_by_category).reduce((a: any, b: any) => a + b, 0) as number;
                        const pct = ((count / total) * 100).toFixed(0);

                        return (
                          <div key={category}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-[#C4B5FD]/80 font-semibold">{category}</span>
                              <span className="text-[#C4B5FD]/50">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${categoryColors[category] || 'bg-gray-500'}`}
                                style={{ width: `${pct}%`, opacity: 0.7 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-3">
                  <Link href="/admin/events/create" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                    <Plus className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-xs font-bold text-white group-hover:text-[#A78BFA] transition-colors">Create New Event</span>
                  </Link>
                  <Link href="/admin/events/analytics" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                    <BarChart3 className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-xs font-bold text-white group-hover:text-[#A78BFA] transition-colors">Full Analytics</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
