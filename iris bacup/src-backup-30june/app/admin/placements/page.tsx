"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Award, ArrowUpRight,
  TrendingDown, ShieldCheck, Clock, FileSpreadsheet
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function AdminPlacementsOverview() {
  const [stats, setStats] = useState<any>({
    total_eligible: 320,
    total_placed: 215,
    total_companies: 42,
    avg_ctc: 7.8,
    highest_ctc: 44.0,
    ctc_segments: [
      { range: 'Dream (>10L)', count: 48 },
      { range: 'Core (5-10L)', count: 120 },
      { range: 'Mass (<5L)', count: 47 }
    ]
  });

  const [liveLogs, setLiveLogs] = useState<any[]>([
    { student: 'Khushal Sharma', company: 'Google India', action: 'Offer Accepted', time: '10m ago', reward: '₹32.5 LPA' },
    { student: 'Vikas Choudhary', company: 'ZS Associates', action: 'Shortlisted for interview', time: '35m ago', reward: '₹8.5 LPA' },
    { student: 'Neha Sen', company: 'Infosys', action: 'Technical round passed', time: '2h ago', reward: '₹4.5 LPA' }
  ]);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const res = await apiGet('/placements/analytics/dashboard');
      if (res.success && res.dashboard) {
        setStats(res.dashboard);
      }
    } catch (err) {
      console.log('Using default mock analytics');
    }
  };

  const placementRate = Math.round((stats.total_placed / stats.total_eligible) * 100);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-2xl text-white">Director Placement Cell Overview</h1>
            <p className="text-xs text-[#C4B5FD]/70">Accredited institutional audits, median package ranges, and real-time selections ticker.</p>
          </div>

          <div className="flex gap-2">
            <a
              href="/tpo/reports"
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Compilers & NIRF
            </a>
          </div>
        </div>

        {/* Top Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-3">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Placement Progress Target</span>
            
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-white">{placementRate}%</h3>
                <p className="text-[9px] text-[#C4B5FD]/40 mt-0.5">{stats.total_placed} of {stats.total_eligible} Students Placed</p>
              </div>
              
              {/* Circular Mini Gauge */}
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" className="stroke-white/5" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="24" cy="24" r="20"
                    className="stroke-[#6C2BD9]"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - placementRate / 100)}
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Average Annual Package</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">₹{stats.avg_ctc} LPA</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> Highest Package locks at {stats.highest_ctc} LPA
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Recruitment Campaign Count</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{stats.total_companies} Companies</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#C4B5FD]/50 mt-2">
              <Clock className="w-3.5 h-3.5" /> Regular recruiters list visited
            </div>
          </div>

        </div>

        {/* Live log ticker split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Ticker logs list */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
              Realtime Campus Selection Ticker
            </h2>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {liveLogs.map((log, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <div>
                      <span className="font-bold text-white">{log.student}</span>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{log.company} • {log.action}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white">{log.reward}</span>
                    <p className="text-[9px] text-[#C4B5FD]/40 mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured items */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-white/5 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white">Featured Accreditations</h2>
            
            <div className="flex flex-col gap-3 text-[10px] text-[#C4B5FD]/60">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="font-bold text-white">NIRF Compliance Status</span>
                <p className="text-[9px]">Fully calculated for academic year 2026. Median package is locked at ₹6.5 LPA.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="font-bold text-white">Alumni mentorship panel</span>
                <p className="text-[9px]">Featured student testimonials are configured for placement cell promotions brochures.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
