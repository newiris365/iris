"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Home, Settings, BarChart2, Layers, Users, ShieldAlert, IndianRupee, ArrowRight, Grid, X, User, Phone, Mail, Calendar, MapPin, Wifi, Droplets, Zap, BedDouble } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';



export default function AdminHostelOverview() {
  const [stats, setStats] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Room detail modal
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [roomStudents, setRoomStudents] = useState<any[]>([]);
  const [roomDetailLoading, setRoomDetailLoading] = useState(false);

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
      if (blocksRes.success && blocksRes.blocks?.length > 0) {
        setBlocks(blocksRes.blocks || []);
        setSelectedBlock(blocksRes.blocks[0]);
        loadRoomsForBlock(blocksRes.blocks[0].id);
      } else {
        throw new Error('No blocks returned');
      }
    } catch {
      setStats(null);
      setBlocks([]);
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
        setRooms([]);
      }
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleBlockChange = (block: any) => {
    setSelectedBlock(block);
    loadRoomsForBlock(block.id);
  };

  const handleRoomClick = async (room: any) => {
    setSelectedRoom(room);
    setRoomDetailLoading(true);

    try {
      const res = await apiGet(`/hostel/rooms/${room.id}/students`);
      if (res.success) {
        setRoomStudents(res.students || []);
      } else {
        throw new Error('No students data');
      }
    } catch {
      setRoomStudents([]);
    } finally {
      setRoomDetailLoading(false);
    }
  };

  const closeRoomModal = () => {
    setSelectedRoom(null);
    setRoomStudents([]);
  };

  const getRoomOccupancyColor = (occupied: number, capacity: number) => {
    if (occupied === 0) return 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400';
    if (occupied >= capacity) return 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400';
    return 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeRoomModal}>
          <div
            className="rounded-3xl border border-white/10 bg-[#0F0D1F] w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-[#6C2BD9]/30 to-[#0F0D1F] p-6 border-b border-white/5">
              <button
                onClick={closeRoomModal}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[#C4B5FD]/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
                  <BedDouble className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Room {selectedRoom.room_number}</h2>
                  <p className="text-xs text-[#C4B5FD]/60 mt-0.5">
                    Floor {selectedRoom.floor} • {selectedRoom.room_type} sharing • ₹{selectedRoom.monthly_rent}/month
                  </p>
                </div>
              </div>

              {/* Room Stats Mini */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
                  <p className="text-[9px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Capacity</p>
                  <p className="text-lg font-extrabold text-white mt-0.5">{selectedRoom.capacity}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
                  <p className="text-[9px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Occupied</p>
                  <p className={`text-lg font-extrabold mt-0.5 ${selectedRoom.occupied >= selectedRoom.capacity ? 'text-red-400' : selectedRoom.occupied > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {selectedRoom.occupied}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
                  <p className="text-[9px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Vacant</p>
                  <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{selectedRoom.capacity - selectedRoom.occupied}</p>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <h3 className="text-xs font-bold text-[#C4B5FD]/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Students in this Room
              </h3>

              {roomDetailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : roomStudents.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <BedDouble className="w-8 h-8 text-emerald-400/50" />
                  </div>
                  <p className="text-sm font-semibold text-[#C4B5FD]/50">Room is Vacant</p>
                  <p className="text-[10px] text-[#C4B5FD]/30 mt-1">No students currently allocated to this room</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roomStudents.map((student, idx) => (
                    <div
                      key={student.id || idx}
                      className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-4 hover:border-[#6C2BD9]/30 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Student Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6C2BD9]/50 to-[#8B5CF6]/30 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 border border-[#6C2BD9]/20">
                          {getInitials(student.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{student.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider border flex-shrink-0 ${
                              student.fee_status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}>
                              Fee {student.fee_status}
                            </span>
                          </div>

                          <p className="text-[10px] text-[#A78BFA] mt-0.5 font-semibold">
                            {student.enrollment} • {student.branch} • {student.year}
                          </p>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                              <BedDouble className="w-3 h-3 flex-shrink-0" />
                              <span>Bed #{student.bed_number}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>Since {new Date(student.check_in_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{student.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#C4B5FD]/50">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          </div>

                          {/* Parent Info */}
                          <div className="mt-2.5 pt-2.5 border-t border-white/5">
                            <p className="text-[9px] text-[#C4B5FD]/30 uppercase tracking-wider font-bold mb-1">Guardian Details</p>
                            <div className="flex items-center gap-4 text-[10px] text-[#C4B5FD]/40">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {student.parentName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {student.parentPhone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                {block.staff?.name && (
                  <p className="text-[9px] text-[#C4B5FD]/50 mt-1 italic">Warden: {block.staff.name}</p>
                )}
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

          <p className="text-[10px] text-[#C4B5FD]/30 -mt-2">Click on any room to view student details</p>

          {roomsLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className={`border rounded-2xl p-4.5 text-center flex flex-col justify-center gap-1 transition-all cursor-pointer group ${getRoomOccupancyColor(
                    room.occupied,
                    room.capacity
                  )}`}
                >
                  <p className="text-xs font-bold font-mono tracking-wide group-hover:scale-105 transition-transform">{room.room_number}</p>
                  <p className="text-[9px] opacity-75">{room.room_type} sharing</p>
                  <p className="text-[10px] font-extrabold mt-1">
                    {room.occupied} / {room.capacity} beds
                  </p>
                </button>
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
