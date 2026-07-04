"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function LibraryFinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchFines(); }, []);

  const fetchFines = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('library/fines');
      if (res.success) setFines(res.fines || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    const res = await apiPost(`library/fines/${id}/pay`, {});
    if (res.success) fetchFines();
  };

  const filtered = fines.filter(f => {
    const matchSearch = !searchQuery ||
      f.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'all' || f.status === filter;
    return matchSearch && matchFilter;
  });

  const totalUnpaid = fines.filter(f => f.status === 'unpaid').reduce((acc, f) => acc + (f.amount || 0), 0);
  const totalPaid = fines.filter(f => f.status === 'paid').reduce((acc, f) => acc + (f.amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <IndianRupee size={24} className="text-cyan-400" /> Fine Management
      </h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-amber-400">₹{totalUnpaid}</p>
          <p className="text-xs text-slate-400">Unpaid</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-emerald-400">₹{totalPaid}</p>
          <p className="text-xs text-slate-400">Collected</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{fines.length}</p>
          <p className="text-xs text-slate-400">Total Fines</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student or reason..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500" />
        </div>
        <div className="flex gap-2">
          {['all', 'unpaid', 'paid'].map(f => (
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
          <IndianRupee size={40} className="mx-auto mb-3 opacity-50" />
          <p>No fines found. Library is in good standing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{f.student_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{f.reason || 'Overdue return'} · {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}</p>
                  {f.book_title && (
                    <p className="text-xs text-slate-500">Book: {f.book_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-amber-400">₹{f.amount || 0}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    f.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {f.status}
                  </span>
                  {f.status === 'unpaid' && (
                    <button onClick={() => handleMarkPaid(f.id)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-500">
                      Mark Paid
                    </button>
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
