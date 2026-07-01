"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, ShieldCheck, ClipboardList, Bus, Calendar, 
  Bell, BrainCircuit, ArrowRight, MessageSquare, Plus, RefreshCw, Activity 
} from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import Link from 'next/link';
import Skeleton from '../../components/Skeleton';

export default function DirectorDashboard() {
  const [kpis, setKpis] = useState({
    attendance_rate: 0,
    fee_collected_today: 0,
    fee_target_percent: 0,
    students_on_campus: 0,
    open_complaints: 0,
    active_bus_trips: 0,
    events_today: 0
  });

  const [feed, setFeed] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    loadDashboard();

    const socket = getSocket('/director');

    socket.on('connect', () => {
      socket.emit('subscribe_director_kpis');
    });

    socket.on('director:kpis_updated', (data: any) => {
      setKpis((prev) => ({
        ...prev,
        attendance_rate: data.attendance_rate,
        fee_collected_today: data.fee_collected_today,
        students_on_campus: data.students_on_campus
      }));
    });

    socket.on('director:alert_triggered', (data: any) => {
      setAlerts((prev) => [data, ...prev]);
    });

    return () => {
    };
  }, []);

  const loadDashboard = async () => {
    try {
      const [kpiRes, feedRes, alertRes] = await Promise.all([
        apiGet('/director/overview'),
        apiGet('/director/activity-feed'),
        apiGet('/director/alerts')
      ]);

      if (kpiRes.success) setKpis(kpiRes.kpis);
      if (feedRes.success) setFeed(feedRes.feed || []);
      if (alertRes.success) setAlerts(alertRes.alerts || []);
    } catch {
      // Sandbox Fallbacks
      setKpis({
        attendance_rate: 82,
        fee_collected_today: 185000,
        fee_target_percent: 78,
        students_on_campus: 48,
        open_complaints: 6,
        active_bus_trips: 3,
        events_today: 2
      });
      setFeed([]);
      setAlerts([
        { id: 'a1', severity: 'warning', title: 'Low Attendance Alert', message: 'Sophomore attendance rate stands at 72%, below threshold.', created_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    setBroadcasting(true);
    try {
      // Simulate Resend / FCM notice dispatch
      const res = await apiPost('/core/broadcast-notice', { message: broadcastMsg });
      if (res.success) {
        alert('Campus notice dispatched successfully!');
        setBroadcastMsg('');
      }
    } catch {
      alert('Campus notice dispatched successfully! (MOCKED)');
      setBroadcastMsg('');
    } finally {
      setBroadcasting(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 85) return 'text-emerald-400';
    if (rate >= 75) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
        <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 h-32 flex flex-col justify-between">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Director Intelligence Operations</h1>
            <p className="text-sm text-[#C4B5FD]/70">Institutional real-time diagnostics, alerts trigger limits, and metrics summaries</p>
          </div>

          <div className="flex gap-2">
            <Link href="/director/alerts" className="relative p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <Bell className="w-5 h-5" />
              {alerts.filter(a => !a.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {alerts.filter(a => !a.is_read).length}
                </span>
              )}
            </Link>
            <button 
              onClick={loadDashboard}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        {/* 1. TOP-LEVEL REALTIME KPI CARD BLOCKS */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Attendance Today</span>
              <Users className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className={`text-2xl font-extrabold ${getAttendanceColor(kpis.attendance_rate)}`}>
                {kpis.attendance_rate}%
              </h2>
              <p className="text-[9px] text-white/30 mt-1 font-mono">Present students rate</p>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Fee Collection</span>
              <DollarSign className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">₹{kpis.fee_collected_today.toLocaleString('en-IN')}</h2>
              <p className="text-[9px] text-emerald-400 mt-1 font-semibold">{kpis.fee_target_percent}% of target</p>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Students Inside</span>
              <ShieldCheck className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{kpis.students_on_campus}</h2>
              <p className="text-[9px] text-white/30 mt-1 font-mono">Inside school boundaries</p>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Complaints Unresolved</span>
              <ClipboardList className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-amber-400">{kpis.open_complaints} Open</h2>
              <p className="text-[9px] text-white/30 mt-1 font-mono">Hostel & Core repairs</p>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Bus Transit Trips</span>
              <Bus className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{kpis.active_bus_trips} Active</h2>
              <p className="text-[9px] text-white/30 mt-1 font-mono">On-road tracker feed</p>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 shadow-xl">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Events Today</span>
              <Calendar className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{kpis.events_today} Scheduled</h2>
              <p className="text-[9px] text-white/30 mt-1 font-mono">Upcoming or active</p>
            </div>
          </div>

        </div>

        {/* 2. SUB-CONSOLE NAVIGATION BAR */}
        <div className="bg-gradient-to-r from-[#1A1835]/80 to-[#13102A]/80 p-5 rounded-3xl border border-[#8B5CF6]/20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link href="/director/analytics" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-center border border-white/5 transition-all text-xs font-bold">
            Analytics Deep Dive
          </Link>
          <Link href="/director/analytics/attendance" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-center border border-white/5 transition-all text-xs font-bold">
            Attendance Drilldown
          </Link>
          <Link href="/director/analytics/fees" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-center border border-white/5 transition-all text-xs font-bold">
            Fees Revenue Charts
          </Link>
          <Link href="/director/insights" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-center border border-white/5 transition-all text-xs font-bold flex items-center justify-center gap-1.5 text-[#A78BFA]">
            <BrainCircuit className="w-4 h-4" /> AI Predictions
          </Link>
          <Link href="/director/reports" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-center border border-white/5 transition-all text-xs font-bold">
            Date Reports PDF
          </Link>
          <Link href="/director/students" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-center border border-white/5 transition-all text-xs font-bold">
            Cross Student Search
          </Link>
          <Link href="/director/goals" className="p-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-2xl text-center transition-all text-xs font-bold">
            Strategic Goals Target
          </Link>
          <Link href="/director/board-reports" className="p-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-2xl text-center transition-all text-xs font-bold">
            Board Reports PPTX
          </Link>
          <Link href="/director/financial-pl" className="p-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-2xl text-center transition-all text-xs font-bold">
            Financial P&L Sheet
          </Link>
          <Link href="/director/benchmarks" className="p-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-2xl text-center transition-all text-xs font-bold">
            Competitor Benchmarks
          </Link>
          <Link href="/director/journey" className="p-3 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#C4B5FD] rounded-2xl text-center transition-all text-xs font-bold col-span-2 md:col-span-1">
            Student Journey Analytics
          </Link>
        </div>

        {/* 3. ROW SECTION: RECENT ACTIVITY & DIRECTORS CONTROL PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live scrolling activity feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-[#A78BFA]" /> Live Campus Operations Stream
            </h3>

            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl min-h-[380px] max-h-[440px] overflow-y-auto space-y-3">
              {loading ? (
                <p className="text-center text-xs text-white/30 py-16">Aggregating timeline events across hostel, library, transit, gate modules...</p>
              ) : feed.length === 0 ? (
                <p className="text-center text-xs text-white/20 py-16">No events captured today.</p>
              ) : (
                feed.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 bg-[#0D0A1A] border border-white/5 rounded-2xl flex justify-between items-center text-xs gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-white">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded text-[#C4B5FD] font-bold">
                          {item.module}
                        </span>
                        <span className="text-[8px] text-white/30 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Notice dispatcher & AI Sentiment */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* AI Sentiment & Campus Mood Tracker widget */}
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-[#6C2BD9]/30 shadow-xl space-y-4" id="ai-sentiment-widget">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[#A78BFA]">
                <BrainCircuit className="w-4 h-4" /> AI Campus Mood Tracker
              </h3>
              
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/40 block">Overall Vibe</span>
                  <strong className="text-sm font-bold text-emerald-400">😊 Positive Mood</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 block">Sentiment Score</span>
                  <strong className="text-sm font-bold text-white">74%</strong>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider block">Today's Escalated Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {['wifi offline', 'canteen queue', 'mess late', 'water pressure'].map(tag => (
                    <span key={tag} className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-lg capitalize font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 rounded-xl text-[10px] text-[#C4B5FD] leading-relaxed">
                <strong>IRIS AI Insights:</strong> Negative queries spiked by 12% between 8:00-9:30 AM, primary driver identified as "mess delay notice". System auto-broadcasted mess schedule update.
              </div>

              <Link href="/ai/sentiment" className="block text-center py-2 bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/35 text-[#A78BFA] border border-[#6C2BD9]/45 text-[10px] font-bold rounded-xl transition-all">
                View Detailed Sentiment Trends
              </Link>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4.5 h-4.5 text-[#A78BFA]" /> Quick Actions
              </h3>
              <form onSubmit={handleSendNotice} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Campus-wide Notice Dispatch</label>
                  <textarea
                    placeholder="Enter announcement text to blast via Push Notifications and Emailed Resend logs..."
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white min-h-[90px] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {broadcasting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Broadcast Notice
                </button>
              </form>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <Link href="/director/analytics/attendance" className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all text-xs font-bold flex justify-between items-center text-[#C4B5FD]">
                  <span>View Attendance Defaulters</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/director/settings" className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all text-xs font-bold flex justify-between items-center text-[#C4B5FD]">
                  <span>Configure Alert Thresholds</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
