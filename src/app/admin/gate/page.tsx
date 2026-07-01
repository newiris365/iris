"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Cpu, Users, Eye, FileText, ArrowRight, ShieldCheck, UserMinus, Calendar } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AdminGateConsolePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState({
    students_inside: 0,
    staff_inside: 0,
    visitors_inside: 0,
    total_occupancy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const logsRes = await apiGet('/gate/logs');
      const incRes = await apiGet('/gate/incidents');
      const occRes = await apiGet('/gate/occupancy/live');

      if (logsRes.success) setLogs(logsRes.logs || []);
      if (incRes.success) setIncidents(incRes.incidents || []);
      if (occRes.success && occRes.occupancy) setOccupancy(occRes.occupancy);
    } catch {
      // Clean Fallbacks
      setLogs([]);
      setIncidents([]);
      setOccupancy({ students_inside: 0, staff_inside: 0, visitors_inside: 0, total_occupancy: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Admin Smart Gate Control Console</h1>
            <p className="text-sm text-[#C4B5FD]/70">Central administrator dashboard for campus security, occupancy statistics, and reports</p>
          </div>
          
          {/* Quick Actions Links Grid */}
          <div className="flex flex-wrap gap-2.5">
            <Link href="/admin/dashboard" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] transition-all">
              Main Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* KPI Row cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Students Checked IN</span>
            <h2 className="text-3xl font-extrabold text-white mt-1.5">{occupancy.students_inside}</h2>
          </div>
          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Staff Checked IN</span>
            <h2 className="text-3xl font-extrabold text-white mt-1.5">{occupancy.staff_inside}</h2>
          </div>
          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Active Guests / Visitors</span>
            <h2 className="text-3xl font-extrabold text-amber-400 mt-1.5">{occupancy.visitors_inside}</h2>
          </div>
          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Total Occupancy Estimate</span>
            <h2 className="text-3xl font-extrabold text-[#A78BFA] mt-1.5">{occupancy.total_occupancy}</h2>
          </div>
        </div>

        {/* Console Sections / Sub-pages Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Audits & Movement Logs</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Review full detailed timelines of RFID swipes, QR scans, and manual overrides.</p>
            <Link href="/admin/gate/logs" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Access Log Audit <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Visitor Pass Logs</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Monitor registered visitors, check validity bounds, and track overstays.</p>
            <Link href="/admin/gate/visitors" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Manage Visitors <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Blacklist Registry</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Add, view, and manage block lists to prevent unauthorized gate access checkouts.</p>
            <Link href="/admin/gate/blacklist" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Open Blacklist <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Daily PDF Reports</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Compile and export official daily security gate summaries as signed PDF sheets.</p>
            <Link href="/admin/gate/reports" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Export PDF Summaries <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white">Guard Shifts Calendar</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Schedule and assign security guard duty shifts across main/hostel gates.</p>
            <Link href="/admin/gate/guards" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Shift Scheduling Sheet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white text-red-400">AI Threat detection</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">CCTV anomalies motion logs, ALPR recognition warning alarms feed.</p>
            <Link href="/admin/gate/threats" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              CCTV Threat Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white text-emerald-400">Emergency Muster</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Initiate evacuation drills, track unaccounted commuters, print stats.</p>
            <Link href="/admin/gate/muster" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Evac Muster Console <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/70 to-[#13102A]/70 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white text-[#A78BFA]">Contractors Registry</h3>
            <p className="text-[11px] text-[#C4B5FD]/70">Register builder firms, daily entry permit passes, completion signoff.</p>
            <Link href="/admin/gate/contractors" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-all flex items-center gap-1.5">
              Manage Contractors <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* Chart representation & Live activities split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mock Peak traffic analysis chart (SVG area) */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4.5 h-4.5 text-[#A78BFA]" /> Peak Entry-Exit Traffic Analytics (Hourly Peak)
            </h3>
            
            {/* SVG area graphic chart */}
            <div className="relative h-64 bg-[#0D0A1A] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              {/* Y Axis guide */}
              <div className="absolute left-4 top-4 bottom-12 border-r border-white/5 flex flex-col justify-between text-[8px] text-white/30 pr-2">
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              
              {/* Peak Wave SVG graphic area */}
              <div className="flex-1 w-full pl-6 relative">
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  
                  {/* Traffic Graph wave */}
                  <path d="M 0 130 Q 50 20 100 80 T 200 40 T 300 120 T 400 60 L 400 150 L 0 150 Z" fill="url(#purpleGrad)" />
                  <path d="M 0 130 Q 50 20 100 80 T 200 40 T 300 120 T 400 60" fill="none" stroke="#A78BFA" strokeWidth="2.5" />
                </svg>
              </div>

              {/* X Axis guide */}
              <div className="flex justify-between pl-6 text-[8px] text-white/30 border-t border-white/5 pt-2">
                <span>08:00 AM</span>
                <span>12:00 PM</span>
                <span>04:00 PM</span>
                <span>08:00 PM</span>
              </div>
            </div>
          </div>

          {/* Incidents alerts feed on right side */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 text-red-400">
              <ShieldAlert className="w-4.5 h-4.5" /> Recent Security Alerts
            </h3>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {incidents.slice(0, 3).map(inc => (
                <div key={inc.id} className="p-3 bg-[#0D0A1A] border border-white/5 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{inc.incident_type}</span>
                    <span className="text-[8px] text-white/30">{new Date(inc.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/70">{inc.description}</p>
                  <p className="text-[8px] text-white/30 font-mono">Location: {inc.location}</p>
                </div>
              ))}
              {incidents.length === 0 && (
                <p className="text-xs text-white/20 text-center py-12">No active alerts reported today</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
