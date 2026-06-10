"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Home, Settings, BarChart2, Layers, Users, ShieldAlert, IndianRupee, ArrowRight } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AdminHostelOverview() {
  const [stats, setStats] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [overviewRes, blocksRes] = await Promise.all([
        apiGet('/hostel/overview'),
        apiGet('/hostel/blocks')
      ]);

      if (overviewRes.success) {
        setStats(overviewRes.stats);
      }
      if (blocksRes.success) {
        setBlocks(blocksRes.blocks || []);
      }
    } catch {
      // Mock stats
      setStats({
        total_blocks: 3,
        total_rooms: 120,
        total_capacity: 240,
        occupied_count: 185,
        available_count: 55,
        occupancy_rate: '77.1%',
        open_complaints: 8,
        visitors_inside: 3,
        monthly_revenue_est: 1202500
      });

      // Mock blocks
      setBlocks([
        { id: 'b1', name: 'Aryabhata Boys Hostel (Block A)', type: 'boys', total_rooms: 45, total_floors: 3, staff: { name: 'Dr. Alok Verma' } },
        { id: 'b2', name: 'Gargi Girls Hostel (Block B)', type: 'girls', total_rooms: 45, total_floors: 3, staff: { name: 'Prof. Sunita Rao' } },
        { id: 'b3', name: 'Kalpana Staff Quarters', type: 'staff', total_rooms: 30, total_floors: 2, staff: { name: 'Mr. Rajesh Dixit' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Hostel Admin Desk</h1>
                <p className="text-sm text-[#C4B5FD]/70">Institutional Overviews • Block Setup • Financial Analytics</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Link href="/admin/hostel/blocks" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Block & Room Setup
              </Link>
              <Link href="/admin/hostel/analytics" className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Revenue & Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main stats overview */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Total Blocks Setup</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5">{stats?.total_blocks}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Multi-gender accommodation system</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Total Hostel Capacity</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5">{stats?.total_capacity} Beds</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Across {stats?.total_rooms} registered rooms</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Active Occupancy Rate</p>
          <h2 className="text-3xl font-extrabold text-emerald-400 mt-1.5">{stats?.occupancy_rate}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{stats?.occupied_count} filled, {stats?.available_count} vacant</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Est. Monthly Revenue</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5 flex items-center gap-0.5">
            <IndianRupee className="w-6 h-6 text-[#A78BFA]" />
            <span>{stats?.monthly_revenue_est?.toLocaleString()}</span>
          </h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Based on current active rentals</p>
        </div>
      </div>

      {/* Blocks Listing */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <h2 className="text-base font-bold text-white mb-4">Accommodations Block List</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blocks.map((block) => (
            <div key={block.id} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
              
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] uppercase tracking-wider">
                  {block.type} Block
                </span>
                <h3 className="text-base font-extrabold text-white mt-3">{block.name}</h3>
                <p className="text-xs text-[#C4B5FD]/50 mt-1">Managed by: {block.staff?.name || 'Unassigned'}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-4 text-xs">
                  <div>
                    <span className="text-[#C4B5FD]/40 block">Rooms</span>
                    <span className="font-extrabold text-white">{block.total_rooms} Setup</span>
                  </div>
                  <div>
                    <span className="text-[#C4B5FD]/40 block">Floors</span>
                    <span className="font-extrabold text-white">{block.total_floors} Floors</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <Link
                  href={`/warden/hostel`}
                  className="text-xs font-bold text-[#A78BFA] hover:text-white transition-colors flex items-center gap-1"
                >
                  Configure Occupancy Grid <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
