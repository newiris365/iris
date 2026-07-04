"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Users, Search } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function LibraryBookClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', max_members: 10, meeting_day: 'Saturday', meeting_time: '16:00' });

  useEffect(() => { fetchClubs(); }, []);

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('library/book-clubs');
      if (res.success) setClubs(res.clubs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const res = await apiPost('library/book-clubs', form);
    if (res.success) {
      setShowForm(false);
      setForm({ name: '', description: '', max_members: 10, meeting_day: 'Saturday', meeting_time: '16:00' });
      fetchClubs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen size={24} className="text-cyan-400" /> Book Clubs
        </h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Create Club
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-3">New Book Club</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Club name" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm col-span-2" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Description" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm col-span-2 h-16" />
            <input type="number" value={form.max_members} onChange={e => setForm({...form, max_members: parseInt(e.target.value) || 0})}
              placeholder="Max members" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            <select value={form.meeting_day} onChange={e => setForm({...form, meeting_day: e.target.value})}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
          <p>No book clubs yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map(club => (
            <div key={club.id} className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{club.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{club.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Users size={10} /> {club.member_count || 0}/{club.max_members} members
                </span>
                <span className="text-[10px] text-slate-400">
                  Meets: {club.meeting_day || '—'} {club.meeting_time || ''}
                </span>
              </div>
              {club.current_book && (
                <div className="mt-2 bg-cyan-500/10 rounded-lg p-2 border border-cyan-500/20">
                  <p className="text-[10px] text-cyan-400">Currently Reading: {club.current_book}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
