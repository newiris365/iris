"use client";

import React, { useState, useEffect } from 'react';
import { Home, Users, AlertTriangle, ShieldAlert, CreditCard, Layers, Grid, ArrowRight, UserCheck, CalendarCheck, FileSpreadsheet } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function WardenHostelDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overviewRes, blocksRes] = await Promise.all([
        apiGet('/hostel/overview'),
        apiGet('/hostel/blocks')
      ]);

      if (overviewRes.success) {
        setStats(overviewRes.stats);
      }
      if (blocksRes.success && blocksRes.blocks?.length > 0) {
        setBlocks(blocksRes.blocks);
        // Load first block by default
        setSelectedBlock(blocksRes.blocks[0]);
        loadRoomsForBlock(blocksRes.blocks[0].id);
      } else {
        throw new Error('No blocks returned');
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
      const mockBlocks = [
        { id: 'b1', name: 'Aryabhata Boys Hostel (Block A)', type: 'boys', total_rooms: 45, total_floors: 3 },
        { id: 'b2', name: 'Gargi Girls Hostel (Block B)', type: 'girls', total_rooms: 45, total_floors: 3 },
        { id: 'b3', name: 'Kalpana Staff Quarters', type: 'staff', total_rooms: 30, total_floors: 2 }
      ];
      setBlocks(mockBlocks);
      setSelectedBlock(mockBlocks[0]);
      loadRoomsMock(mockBlocks[0].id);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomsForBlock = async (blockId: string) => {
    setRoomsLoading(true);
    try {
      const res = await apiGet(`/hostel/rooms?blockId=${blockId}`);
      if (res.success) {
        setRooms(res.rooms || []);
      } else {
        loadRoomsMock(blockId);
      }
    } catch {
      loadRoomsMock(blockId);
    } finally {
      setRoomsLoading(false);
    }
  };

  const loadRoomsMock = (blockId: string) => {
    const prefix = blockId === 'b1' ? 'A-' : blockId === 'b2' ? 'B-' : 'S-';
    const capacity = blockId === 'b3' ? 1 : 2;
    const roomType = blockId === 'b3' ? 'single' : 'double';
    const blockMockRooms = Array.from({ length: 18 }).map((_, i) => {
      const roomNum = 101 + i + Math.floor(i / 6) * 94; // Floors 1, 2, 3
      const floor = Math.floor(i / 6) + 1;
      const occupied = Math.floor(Math.random() * (capacity + 1));
      return {
        id: `r-${blockId}-${i}`,
        room_number: `${prefix}${roomNum}`,
        floor,
        capacity,
        occupied,
        room_type: roomType,
        monthly_rent: blockId === 'b3' ? 12000 : 6500,
        is_active: true
      };
    });
    setRooms(blockMockRooms);
  };

  const handleBlockChange = (block: any) => {
    setSelectedBlock(block);
    loadRoomsForBlock(block.id);
  };

  const getRoomOccupancyColor = (occupied: number, capacity: number) => {
    if (occupied === 0) return 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400';
    if (occupied >= capacity) return 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400';
    return 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400';
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
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Hostel Warden Portal</h1>
                <p className="text-sm text-[#C4B5FD]/70">Administer Blocks • Occupancy Control • Requests Queue</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link href="/warden/hostel/allocations" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Manage Allocations
              </Link>
              <Link href="/warden/hostel/complaints" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5 relative">
                <AlertTriangle className="w-4 h-4" /> Complaints Queue
                {stats?.open_complaints > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[8px] font-extrabold flex items-center justify-center text-white animate-bounce">
                    {stats.open_complaints}
                  </span>
                )}
              </Link>
              <Link href="/warden/hostel/leave" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4" /> Leave Approvals
              </Link>
              <Link href="/warden/hostel/visitors" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Visitor Logs
              </Link>
              <Link href="/warden/hostel/reports" className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" /> Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Panel */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Occupancy Rate</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5">{stats?.occupancy_rate}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{stats?.occupied_count} of {stats?.total_capacity} beds filled</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Total Rooms</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5">{stats?.total_rooms}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Spread across {stats?.total_blocks} blocks</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Maintenance Queue</p>
          <h2 className="text-3xl font-extrabold text-amber-400 mt-1.5">{stats?.open_complaints} Open</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Requires immediate vendor assignment</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Visitors inside</p>
          <h2 className="text-3xl font-extrabold text-emerald-400 mt-1.5">{stats?.visitors_inside} Live</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Current visitor count inside premises</p>
        </div>
      </div>

      {/* Grid Occupancy view */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Blocks List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#A78BFA]" /> Blocks List
          </h3>

          <div className="space-y-2.5">
            {blocks.map((block) => (
              <button
                key={block.id}
                onClick={() => handleBlockChange(block)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedBlock?.id === block.id
                    ? 'border-[#6C2BD9] bg-gradient-to-br from-[#13102A] to-[#1A1538] shadow-lg shadow-[#6C2BD9]/10'
                    : 'border-white/5 bg-[#13102A]/40 hover:bg-[#13102A]/80'
                }`}
              >
                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] uppercase tracking-wider">
                  {block.type} Block
                </span>
                <h4 className="text-xs font-bold text-white mt-2">{block.name}</h4>
                <p className="text-[10px] text-[#C4B5FD]/40 mt-1">{block.total_rooms} rooms • {block.total_floors} floors</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Rooms Grid Occupancy */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#A78BFA]" /> Room Occupancy Grid
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-[10px] text-[#C4B5FD]/60">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/20" /> Vacant</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/20" /> Partially Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/20" /> Full</span>
            </div>
          </div>

          {roomsLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`border rounded-2xl p-4.5 text-center flex flex-col justify-center gap-1 transition-all cursor-pointer ${getRoomOccupancyColor(
                    room.occupied,
                    room.capacity
                  )}`}
                >
                  <p className="text-xs font-bold font-mono tracking-wide">{room.room_number}</p>
                  <p className="text-[9px] opacity-75">{room.room_type} sharing</p>
                  <p className="text-[10px] font-extrabold mt-1">
                    {room.occupied} / {room.capacity} beds
                  </p>
                </div>
              ))}
              {rooms.length === 0 && (
                <div className="col-span-full text-center py-12 text-[#C4B5FD]/30 text-xs">
                  No rooms setup in this block yet.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
