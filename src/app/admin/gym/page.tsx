"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Users, Calendar, AlertTriangle, ArrowRight, Activity, DollarSign } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AdminGymDashboard() {
  const [stats, setStats] = useState({
    active_members: 142,
    today_bookings: 38,
    under_maintenance: 3,
    monthly_revenue: 42500
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const plansRes = await apiGet('/fitzone/gym/membership-plans');
      const equipRes = await apiGet('/fitzone/gym/equipment');
      
      // Compute details if available
      let maintenanceCount = 0;
      if (equipRes.success && equipRes.equipment) {
        maintenanceCount = equipRes.equipment.filter((e: any) => e.condition === 'maintenance').length;
      }

      setStats(prev => ({
        ...prev,
        under_maintenance: maintenanceCount || prev.under_maintenance
      }));
    } catch (err) {
      console.log('Error loading stats, using mocks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">FitZone Admin Center</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Campus Wellness & Athletic Facility Operations Control.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[#C4B5FD]/50">
              <span className="text-[10px] uppercase font-bold">Active Members</span>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-2xl font-extrabold text-white mt-1">{stats.active_members}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[#C4B5FD]/50">
              <span className="text-[10px] uppercase font-bold">Today's Bookings</span>
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-2xl font-extrabold text-white mt-1">{stats.today_bookings}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[#C4B5FD]/50">
              <span className="text-[10px] uppercase font-bold">Repair Queue</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-2xl font-extrabold text-white mt-1">{stats.under_maintenance}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[#C4B5FD]/50">
              <span className="text-[10px] uppercase font-bold">Revenue (June)</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-2xl font-extrabold text-white mt-1">₹{stats.monthly_revenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Administration Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/gym/slots" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex justify-between items-center group">
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Slot Management</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Schedules & blackout dates</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-white transition-colors" />
          </Link>

          <Link href="/admin/gym/memberships" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex justify-between items-center group">
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Memberships Log</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Student subscriptions & plans</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-white transition-colors" />
          </Link>

          <Link href="/admin/gym/equipment" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex justify-between items-center group">
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Equipment Inventory</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Logs & maintenance alerts</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-white transition-colors" />
          </Link>

          <Link href="/admin/gym/trainers" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex justify-between items-center group">
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Trainer Setup</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Profiles, availability & schedules</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-white transition-colors" />
          </Link>

          <Link href="/admin/gym/analytics" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex justify-between items-center group col-span-2 md:col-span-1">
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Utilization & Heatmaps</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Peak hours & reports</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-white transition-colors" />
          </Link>
        </div>

        {/* Heatmap Simulation Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/30">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-[#A78BFA]" /> Peak Hour Heatmap (Slot Occupancy Rate)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { time: '06:00 - 07:30', rate: '40%', fill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              { time: '08:00 - 09:30', rate: '100%', fill: 'bg-red-500/20 text-red-400 border-red-500/30' },
              { time: '10:00 - 11:30', rate: '25%', fill: 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20' },
              { time: '17:00 - 18:30', rate: '95%', fill: 'bg-red-500/20 text-red-400 border-red-500/30' },
              { time: '19:00 - 20:30', rate: '80%', fill: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
              { time: '21:00 - 22:30', rate: '15%', fill: 'bg-emerald-500/10 text-emerald-500/70 border-emerald-500/20' }
            ].map((slot, i) => (
              <div key={i} className={`p-4 rounded-xl border flex flex-col gap-1.5 items-center justify-center text-center ${slot.fill}`}>
                <span className="text-[10px] font-bold text-white/50">{slot.time}</span>
                <span className="text-lg font-extrabold">{slot.rate}</span>
                <span className="text-[9px]">Fill Rate</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
