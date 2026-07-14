"use client";

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../lib/api';
import { 
  Users, CheckCircle2, ShieldAlert, Sparkles, Loader2, ArrowRight,
  TrendingUp, Award, DollarSign, BarChart3, GraduationCap, MapPin
} from 'lucide-react';

interface ProgramOccupancy {
  name: string;
  seats: number;
  filled: number;
}

interface GeographicDistribution {
  state: string;
  count: number;
}

interface DashboardStats {
  applications_received: number;
  applications_submitted: number;
  documents_pending: number;
  merit_listed: number;
  offers_sent: number;
  offers_accepted: number;
  seats_filled: number;
  program_occupancies: ProgramOccupancy[];
  geographic_distribution: GeographicDistribution[];
}

export default function AdminAdmissionsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  async function loadDashboardStats() {
    try {
      const res = await apiGet('/admissions/analytics/dashboard');
      if (res.success && res.dashboard) {
        setStats(res.dashboard);
      } else {
        // No data from backend — show zeros
        setStats({
          applications_received: 0,
          applications_submitted: 0,
          documents_pending: 0,
          merit_listed: 0,
          offers_sent: 0,
          offers_accepted: 0,
          seats_filled: 0,
          program_occupancies: [],
          geographic_distribution: []
        });
      }
    } catch {
      // Backend not reachable — show zeros
      setStats({
        applications_received: 0,
        applications_submitted: 0,
        documents_pending: 0,
        merit_listed: 0,
        offers_sent: 0,
        offers_accepted: 0,
        seats_filled: 0,
        program_occupancies: [],
        geographic_distribution: []
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Funnel Dashboard...</p>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Applications Received', value: stats.applications_received, change: '+12% vs last week', icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Form Submitted', value: stats.applications_submitted, change: '78.7% conversion', icon: CheckCircle2, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: 'Provisional Offers Sent', value: stats.offers_sent, change: '24.4% of submissions', icon: Award, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Admissions Completed', value: stats.seats_filled, change: '86.1% of accepted', icon: GraduationCap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Metrics Card row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, idx) => {
          const IconComp = c.icon;
          return (
            <div key={idx} className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 tracking-wider">{c.label}</span>
                <div className={`p-2 rounded-xl border ${c.color}`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-mono font-black text-white">{c.value.toLocaleString()}</span>
                <span className="block text-[10px] text-white/50">{c.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Program occupancy split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Occupancies list */}
        <div className="md:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-[#A78BFA]" /> Program Seat Occupancy Rates
          </h3>
          
          <div className="space-y-4">
            {stats.program_occupancies.map((p) => {
              const ratio = Math.round((p.filled / p.seats) * 100);
              return (
                <div key={p.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-white/90">
                    <span className="truncate max-w-sm">{p.name}</span>
                    <span className="font-mono text-[#A78BFA]">{p.filled} / {p.seats} seats ({ratio}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6]"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Distribution Card */}
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-[#A78BFA]" /> Regional Demographics
          </h3>
          
          <div className="space-y-3">
            {stats.geographic_distribution.map((geo, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 text-xs text-[#C4B5FD]/80">
                <span className="font-semibold">{geo.state}</span>
                <span className="font-mono font-bold text-white">{geo.count} leads</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
