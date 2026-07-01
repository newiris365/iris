"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Building, DollarSign, Award,
  CheckCircle, Calendar, ArrowUpRight, BarChart3
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function TpoPlacementsDashboard() {
  const [stats, setStats] = useState<any>({
    total_eligible: 320,
    total_registered: 310,
    total_placed: 215,
    total_companies: 42,
    avg_ctc: 7.8,
    median_ctc: 6.5,
    highest_ctc: 44.0,
    lowest_ctc: 3.6,
    branch_rates: [
      { branch: 'CSE', rate: 92 },
      { branch: 'AIDS', rate: 88 },
      { branch: 'ECE', rate: 74 },
      { branch: 'MECH', rate: 45 }
    ],
    ctc_segments: [
      { range: 'Dream (>10L)', count: 48 },
      { range: 'Core (5-10L)', count: 120 },
      { range: 'Mass (<5L)', count: 47 }
    ]
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const res = await apiGet('/placements/analytics/dashboard');
      if (res.success && res.dashboard) {
        setStats(res.dashboard);
      }
    } catch (err) {
      console.log('Using fallback dashboard stats');
    }
  };

  const placementRate = Math.round((stats.total_placed / stats.total_eligible) * 100);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Title */}
        <div>
          <h1 className="font-extrabold text-3xl text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#A78BFA]" />
            TPO Placements Dashboard
          </h1>
          <p className="text-sm text-[#C4B5FD]/70">Track annual institutional statistics, CTC brackets distributions, and drive schedules.</p>
        </div>

        {/* Top metrics grids */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Placement Rate</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{placementRate}%</h3>
              <p className="text-[9px] text-[#C4B5FD]/40 mt-1">{stats.total_placed} of {stats.total_eligible} placed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Visiting Companies</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{stats.total_companies}</h3>
              <p className="text-[9px] text-[#C4B5FD]/40 mt-1">Visited in academic year 2026</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Building className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Average Package</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">₹{stats.avg_ctc} LPA</h3>
              <p className="text-[9px] text-[#C4B5FD]/40 mt-1">Median CTC: {stats.median_ctc} LPA</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Highest CTC</span>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">₹{stats.highest_ctc} LPA</h3>
              <p className="text-[9px] text-emerald-400/40 mt-1">Dream tier recruiting lists</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Charts and distributions split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Branch-wise metrics */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A78BFA]" />
              Branch Placement Rates (%)
            </h2>

            <div className="flex flex-col gap-4 mt-2">
              {stats.branch_rates?.map((item: any) => (
                <div key={item.branch} className="flex flex-col gap-1.5 text-xs text-[#C4B5FD]/80">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{item.branch} Branch</span>
                    <span>{item.rate}% Placed</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full" style={{ width: `${item.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package segment distributions */}
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#A78BFA]" />
              CTC Brackets Distribution (Offers count)
            </h2>

            <div className="flex flex-col gap-4 mt-2">
              {stats.ctc_segments?.map((item: any) => {
                const percentage = Math.round((item.count / stats.total_placed) * 100);
                return (
                  <div key={item.range} className="flex flex-col gap-1.5 text-xs text-[#C4B5FD]/80">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{item.range}</span>
                      <span>{item.count} offers ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
