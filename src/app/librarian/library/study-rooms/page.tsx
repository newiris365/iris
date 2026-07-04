"use client";

import React, { useState, useEffect } from 'react';
import { DoorOpen, Plus, Search, Clock, Users } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function LibraryStudyRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ room_name: '', capacity: 6, floor: '1st Floor', amenities: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        apiGet('library/study-rooms'),
        apiGet('library/study-rooms/bookings'),
      ]);
      if (roomsRes.success) setRooms(roomsRes.rooms || []);
      if (bookingsRes.success) setBookings(bookingsRes.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const res = await apiPost('library/study-rooms', form);
    if (res.success) {
      setShowForm(false);
      setForm({ room_name: '', capacity: 6, floor: '1st Floor', amenities: '' });
      fetchData();
    }
  };

  const getRoomBookings = (roomId: string) => bookings.filter(b => b.room_id === roomId && b.status !== 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DoorOpen size={24} className="text-cyan-400" /> Study Rooms
        </h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-3">New Study Room</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.room_name} onChange={e => setForm({...form, room_name: e.target.value})}
              placeholder="Room name" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 0})}
              placeholder="Capacity" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            <select value={form.floor} onChange={e => setForm({...form, floor: e.target.value})}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              <option>Ground Floor</option>
              <option>1st Floor</option>
              <option>2nd Floor</option>
            </select>
            <input type="text" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})}
              placeholder="Amenities (whiteboard, projector...)" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <DoorOpen size={40} className="mx-auto mb-3 opacity-50" />
          <p>No study rooms configured. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => {
            const roomBookings = getRoomBookings(room.id);
            const isAvailable = room.is_available !== false;
            return (
              <div key={room.id} className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{room.room_name || room.name}</h3>
                    <p className="text-xs text-slate-400">{room.floor || '—'} · Capacity: {room.capacity}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isAvailable ? 'Available' : 'Occupied'}
                  </span>
                </div>
                {room.amenities && (
                  <p className="text-[10px] text-slate-500 mb-2">Amenities: {room.amenities}</p>
                )}
                {roomBookings.length > 0 && (
                  <div className="border-t border-white/5 pt-2 mt-2">
                    <p className="text-[10px] text-slate-400 mb-1">Today&apos;s Bookings:</p>
                    {roomBookings.slice(0, 3).map((b: any) => (
                      <p key={b.id} className="text-[10px] text-slate-300">
                        {b.student_name} · {b.start_time}–{b.end_time}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
