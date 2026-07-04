"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Layers, Plus, Settings, CheckCircle, ShieldAlert, PlusCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminBlocksSetupPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal displays
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);

  const [blockForm, setBlockForm] = useState({
    name: '',
    type: 'boys' as 'boys' | 'girls' | 'co-ed' | 'staff',
    total_rooms: 0,
    total_floors: 1,
    warden_id: '',
    amenities: [] as string[],
    autoGenerateRooms: false,
    roomsPerFloor: 10,
    bedsPerRoom: 2,
    roomType: 'double' as 'single' | 'double' | 'triple' | 'dormitory',
    monthlyRent: 6500,
    roomAmenities: [] as string[]
  });

  const [roomForm, setRoomForm] = useState({
    block_id: '',
    room_number: '',
    floor: 1,
    capacity: 2,
    room_type: 'double' as 'single' | 'double' | 'triple' | 'dormitory',
    amenities: [] as string[],
    monthly_rent: 6500
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Amenities tags presets
  const amenitiesPresets = ['Wi-Fi', 'AC', 'Attached Bathroom', 'Study Table', 'Balcony', 'Geyser'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [blocksRes, roomsRes] = await Promise.all([
        apiGet('/hostel/blocks'),
        apiGet('/hostel/rooms')
      ]);

      if (blocksRes.success) {
        setBlocks(blocksRes.blocks || []);
      }
      if (roomsRes.success) {
        setRooms(roomsRes.rooms || []);
      }
    } catch {
      // Mock Blocks Setup
      const mockBlocks = [
        { id: 'b1', name: 'Aryabhata Boys Hostel (Block A)', type: 'boys', total_rooms: 45, total_floors: 3 },
        { id: 'b2', name: 'Gargi Girls Hostel (Block B)', type: 'girls', total_rooms: 45, total_floors: 3 }
      ];
      setBlocks(mockBlocks);

      setRooms([
        { id: 'r1', room_number: 'A-304', capacity: 2, room_type: 'double', monthly_rent: 6500, hostel_blocks: { name: 'Aryabhata Boys Hostel' } },
        { id: 'r2', room_number: 'B-101', capacity: 2, room_type: 'double', monthly_rent: 6500, hostel_blocks: { name: 'Gargi Girls Hostel' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.name.trim()) {
      setErrorMsg('Block name is required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    const calculatedTotalRooms = blockForm.autoGenerateRooms 
      ? blockForm.total_floors * blockForm.roomsPerFloor 
      : blockForm.total_rooms;

    const payload: any = {
      name: blockForm.name,
      type: blockForm.type,
      total_rooms: calculatedTotalRooms,
      total_floors: blockForm.total_floors,
      amenities: blockForm.amenities
    };
    if (blockForm.warden_id) {
      payload.warden_id = blockForm.warden_id;
    }

    try {
      const res = await apiPost('/hostel/blocks', payload);
      if (res.success) {
        const blockId = res.block.id;
        
        // Auto-generate rooms if enabled
        if (blockForm.autoGenerateRooms) {
          const promises = [];
          for (let f = 1; f <= blockForm.total_floors; f++) {
            for (let r = 1; r <= blockForm.roomsPerFloor; r++) {
              const roomNum = f * 100 + r;
              const prefix = blockForm.type === 'boys' ? 'A-' : blockForm.type === 'girls' ? 'B-' : 'R-';
              promises.push(
                apiPost('/hostel/rooms', {
                  block_id: blockId,
                  room_number: `${prefix}${roomNum}`,
                  floor: f,
                  capacity: blockForm.bedsPerRoom,
                  room_type: blockForm.roomType,
                  amenities: blockForm.roomAmenities,
                  monthly_rent: blockForm.monthlyRent
                })
              );
            }
          }
          await Promise.all(promises);
        }

        setSuccessMsg(blockForm.autoGenerateRooms 
          ? `Hostel block and ${calculatedTotalRooms} rooms successfully configured and registered.`
          : 'Hostel block configured and registered.'
        );
        setShowBlockModal(false);
        setBlockForm({
          name: '',
          type: 'boys',
          total_rooms: 0,
          total_floors: 1,
          warden_id: '',
          amenities: [],
          autoGenerateRooms: false,
          roomsPerFloor: 10,
          bedsPerRoom: 2,
          roomType: 'double',
          monthlyRent: 6500,
          roomAmenities: []
        });
        loadData();
      } else {
        setErrorMsg(res.error || 'Failed to configure block.');
      }
    } catch {
      // Mock setup fallback
      const mockBlockId = 'mock-b-' + Math.random();
      const mockBlock = {
        id: mockBlockId,
        name: blockForm.name,
        type: blockForm.type,
        total_rooms: calculatedTotalRooms,
        total_floors: blockForm.total_floors
      };
      setBlocks([...blocks, mockBlock]);

      if (blockForm.autoGenerateRooms) {
        const generatedMockRooms = [];
        for (let f = 1; f <= blockForm.total_floors; f++) {
          for (let r = 1; r <= blockForm.roomsPerFloor; r++) {
            const roomNum = f * 100 + r;
            const prefix = blockForm.type === 'boys' ? 'A-' : blockForm.type === 'girls' ? 'B-' : 'R-';
            generatedMockRooms.push({
              id: 'mock-r-' + Math.random(),
              room_number: `${prefix}${roomNum}`,
              capacity: blockForm.bedsPerRoom,
              room_type: blockForm.roomType,
              monthly_rent: blockForm.monthlyRent,
              hostel_blocks: { name: blockForm.name }
            });
          }
        }
        setRooms(prev => [...prev, ...generatedMockRooms]);
      }

      setSuccessMsg(blockForm.autoGenerateRooms
        ? `Hostel block and ${calculatedTotalRooms} rooms successfully configured and registered. (Mock)`
        : 'Hostel block configured and registered. (Mock)'
      );
      setShowBlockModal(false);
      setBlockForm({
        name: '',
        type: 'boys',
        total_rooms: 0,
        total_floors: 1,
        warden_id: '',
        amenities: [],
        autoGenerateRooms: false,
        roomsPerFloor: 10,
        bedsPerRoom: 2,
        roomType: 'double',
        monthlyRent: 6500,
        roomAmenities: []
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.block_id || !roomForm.room_number.trim()) {
      setErrorMsg('Please select a block and specify a room number.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiPost('/hostel/rooms', roomForm);
      if (res.success) {
        setSuccessMsg('Hostel room configured and registered.');
        setShowRoomModal(false);
        setRoomForm({ block_id: '', room_number: '', floor: 1, capacity: 2, room_type: 'double', amenities: [], monthly_rent: 6500 });
        loadData();
      } else {
        setErrorMsg(res.error || 'Failed to configure room.');
      }
    } catch {
      // Mock setup
      const targetBlock = blocks.find(b => b.id === roomForm.block_id);
      const mockRoom = {
        id: 'mock-r-' + Math.random(),
        room_number: roomForm.room_number,
        capacity: roomForm.capacity,
        room_type: roomForm.room_type,
        monthly_rent: roomForm.monthly_rent,
        hostel_blocks: { name: targetBlock?.name || 'Unknown Block' }
      };
      setRooms([...rooms, mockRoom]);
      setSuccessMsg('Hostel room configured and registered. (Mock)');
      setShowRoomModal(false);
      setRoomForm({ block_id: '', room_number: '', floor: 1, capacity: 2, room_type: 'double', amenities: [], monthly_rent: 6500 });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBlockAmenity = (am: string) => {
    if (blockForm.amenities.includes(am)) {
      setBlockForm({ ...blockForm, amenities: blockForm.amenities.filter(a => a !== am) });
    } else {
      setBlockForm({ ...blockForm, amenities: [...blockForm.amenities, am] });
    }
  };

  const toggleRoomAmenity = (am: string) => {
    if (roomForm.amenities.includes(am)) {
      setRoomForm({ ...roomForm, amenities: roomForm.amenities.filter(a => a !== am) });
    } else {
      setRoomForm({ ...roomForm, amenities: [...roomForm.amenities, am] });
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Block & Room Configuration</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Register hostel blocks, set wardens, and instantiate room numbers</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setShowBlockModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add Block
            </button>
            <button
              onClick={() => setShowRoomModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Room
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {errorMsg}
          </div>
        )}

        {/* Add Block Modal */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateBlock} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#A78BFA]" /> Configure New Block
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Block Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramanujan Hostel"
                    value={blockForm.name}
                    onChange={e => setBlockForm({ ...blockForm, name: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Block Type</label>
                    <select
                      value={blockForm.type}
                      onChange={e => setBlockForm({ ...blockForm, type: e.target.value as any })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                    >
                      <option value="boys">Boys</option>
                      <option value="girls">Girls</option>
                      <option value="co-ed">Co-ed</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Total Floors</label>
                    <input
                      type="number"
                      value={blockForm.total_floors}
                      onChange={e => setBlockForm({ ...blockForm, total_floors: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Block Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesPresets.map(am => (
                      <button
                        type="button"
                        key={am}
                        onClick={() => toggleBlockAmenity(am)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          blockForm.amenities.includes(am)
                            ? 'bg-[#6C2BD9]/25 border-[#6C2BD9] text-[#A78BFA]'
                            : 'bg-white/5 border-white/5 text-[#C4B5FD]/50'
                        }`}
                      >
                        {am}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Room Auto Generation */}
                <div className="border-t border-white/5 pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blockForm.autoGenerateRooms}
                      onChange={e => setBlockForm({ ...blockForm, autoGenerateRooms: e.target.checked })}
                      className="rounded bg-[#0D0A1A] border-white/10 text-[#6C2BD9] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white">Auto-generate rooms in this block</span>
                  </label>
                </div>

                {blockForm.autoGenerateRooms && (
                  <div className="space-y-4 border-t border-white/5 pt-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Rooms per Floor</label>
                        <input
                          type="number"
                          min={1}
                          max={40}
                          value={blockForm.roomsPerFloor}
                          onChange={e => setBlockForm({ ...blockForm, roomsPerFloor: Math.min(40, parseInt(e.target.value) || 1) })}
                          className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Beds per Room</label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={blockForm.bedsPerRoom}
                          onChange={e => setBlockForm({ ...blockForm, bedsPerRoom: Math.min(8, parseInt(e.target.value) || 1) })}
                          className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Sharing Type</label>
                        <select
                          value={blockForm.roomType}
                          onChange={e => setBlockForm({ ...blockForm, roomType: e.target.value as any })}
                          className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                        >
                          <option value="single">Single Sharing</option>
                          <option value="double">Double Sharing</option>
                          <option value="triple">Triple Sharing</option>
                          <option value="dormitory">Dormitory</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Monthly Rent (₹)</label>
                        <input
                          type="number"
                          value={blockForm.monthlyRent}
                          onChange={e => setBlockForm({ ...blockForm, monthlyRent: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Room Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {amenitiesPresets.map(am => (
                          <button
                            type="button"
                            key={am}
                            onClick={() => {
                              if (blockForm.roomAmenities.includes(am)) {
                                setBlockForm({ ...blockForm, roomAmenities: blockForm.roomAmenities.filter(a => a !== am) });
                              } else {
                                setBlockForm({ ...blockForm, roomAmenities: [...blockForm.roomAmenities, am] });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              blockForm.roomAmenities.includes(am)
                                ? 'bg-[#6C2BD9]/25 border-[#6C2BD9] text-[#A78BFA]'
                                : 'bg-white/5 border-white/5 text-[#C4B5FD]/50'
                            }`}
                          >
                            {am}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md flex items-center justify-center"
                >
                  {submitting ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Room Modal */}
        {showRoomModal && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateRoom} className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#A78BFA]" /> Configure New Room
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Select Block</label>
                  <select
                    value={roomForm.block_id}
                    onChange={e => setRoomForm({ ...roomForm, block_id: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                    required
                  >
                    <option value="">Choose block...</option>
                    {blocks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Room Number</label>
                    <input
                      type="text"
                      placeholder="e.g. A-304"
                      value={roomForm.room_number}
                      onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Floor Number</label>
                    <input
                      type="number"
                      value={roomForm.floor}
                      onChange={e => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Beds Capacity</label>
                    <input
                      type="number"
                      value={roomForm.capacity}
                      onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={roomForm.monthly_rent}
                      onChange={e => setRoomForm({ ...roomForm, monthly_rent: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Room Type</label>
                  <select
                    value={roomForm.room_type}
                    onChange={e => setRoomForm({ ...roomForm, room_type: e.target.value as any })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="single">Single Sharing</option>
                    <option value="double">Double Sharing</option>
                    <option value="triple">Triple Sharing</option>
                    <option value="dormitory">Dormitory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Room Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesPresets.map(am => (
                      <button
                        type="button"
                        key={am}
                        onClick={() => toggleRoomAmenity(am)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          roomForm.amenities.includes(am)
                            ? 'bg-[#6C2BD9]/25 border-[#6C2BD9] text-[#A78BFA]'
                            : 'bg-white/5 border-white/5 text-[#C4B5FD]/50'
                        }`}
                      >
                        {am}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md flex items-center justify-center"
                >
                  {submitting ? 'Creating...' : 'Instantiate'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Setup Lists side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Blocks List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#A78BFA]" /> Active Blocks
            </h3>

            <div className="space-y-3">
              {blocks.map(b => (
                <div key={b.id} className="p-4 rounded-2xl border border-white/5 bg-[#13102A]/60 shadow-lg">
                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] uppercase tracking-wider">
                    {b.type} Block
                  </span>
                  <h4 className="text-xs font-bold text-white mt-2">{b.name}</h4>
                  <p className="text-[10px] text-[#C4B5FD]/40 mt-1">{b.total_rooms || 0} Rooms configured</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#A78BFA]" /> Configured Rooms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map(r => (
                <div key={r.id} className="p-4 rounded-2xl border border-white/5 bg-[#13102A]/60 shadow-lg flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.room_number}</h4>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{r.hostel_blocks?.name}</p>
                    <p className="text-[10px] text-[#A78BFA] mt-0.5 capitalize">{r.room_type} sharing</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-[#C4B5FD]/40 text-[9px] uppercase tracking-wider font-bold">Monthly Rent</p>
                    <p className="font-extrabold text-emerald-400 mt-1">₹{r.monthly_rent}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
