"use client";

import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function LibraryReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('library/reservations');
      if (res.success) setReservations(res.reservations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    const res = await apiPost(`library/reservations/${id}/cancel`, {});
    if (res.success) fetchReservations();
  };

  const handleFulfill = async (id: string) => {
    const res = await apiPost(`library/reservations/${id}/fulfill`, {});
    if (res.success) fetchReservations();
  };

  const filtered = reservations.filter(r => {
    const matchSearch = !searchQuery ||
      r.book_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const fulfilledCount = reservations.filter(r => r.status === 'fulfilled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarClock size={24} className="text-cyan-400" /> Book Reservations
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
          <p className="text-xs text-slate-400">Pending</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-emerald-400">{fulfilledCount}</p>
          <p className="text-xs text-slate-400">Fulfilled</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{reservations.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book or student..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500" />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'fulfilled', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs capitalize ${filter === f ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-300'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CalendarClock size={40} className="mx-auto mb-3 opacity-50" />
          <p>No reservations found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{r.book_title || 'Unknown Book'}</p>
                  <p className="text-xs text-slate-400">By {r.student_name} · Reserved {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</p>
                  {r.expiry_date && (
                    <p className="text-xs text-slate-500">Expires: {new Date(r.expiry_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    r.status === 'fulfilled' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleFulfill(r.id)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-500">
                        Fulfill
                      </button>
                      <button onClick={() => handleCancel(r.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
