"use client";

import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Search } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface Student {
  student_id: string;
  student_name: string;
  roll_number: string;
  stop_name: string;
  has_boarded: boolean;
  boarded_at: string;
}

export default function DriverHeadcountPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadHeadcount(); }, []);

  const loadHeadcount = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/driver/headcount');
      if (res.success) setStudents(res.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = students.filter(s =>
    !searchQuery || s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const boarded = students.filter(s => s.has_boarded).length;
  const notBoarded = students.length - boarded;

  // Group by stop
  const byStop: Record<string, Student[]> = {};
  students.forEach(s => {
    const stop = s.stop_name || 'Unknown';
    if (!byStop[stop]) byStop[stop] = [];
    byStop[stop].push(s);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users size={24} className="text-violet-400" />
        Student Headcount
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
          <p className="text-3xl font-bold text-white">{students.length}</p>
          <p className="text-xs text-slate-400">Expected</p>
        </div>
        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20 text-center">
          <p className="text-3xl font-bold text-emerald-400">{boarded}</p>
          <p className="text-xs text-slate-400">Boarded</p>
        </div>
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20 text-center">
          <p className="text-3xl font-bold text-red-400">{notBoarded}</p>
          <p className="text-xs text-slate-400">Not Boarded</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name or roll number..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm" />
      </div>

      {/* Student List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading headcount...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>No students subscribed to this route.</p>
        </div>
      ) : (
        Object.entries(byStop).map(([stop, stopStudents]) => (
          <div key={stop} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 bg-white/5 border-b border-white/10">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                {stop}
                <span className="text-xs text-slate-400 font-normal">
                  ({stopStudents.filter(s => s.has_boarded).length}/{stopStudents.length} boarded)
                </span>
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {stopStudents.map(s => (
                <div key={s.student_id} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.has_boarded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {s.has_boarded ? <CheckCircle2 size={16} /> : s.student_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-white">{s.student_name}</p>
                      <p className="text-xs text-slate-400">{s.roll_number}</p>
                    </div>
                  </div>
                  <div>
                    {s.has_boarded ? (
                      <span className="text-xs text-emerald-400">Boarded {s.boarded_at ? new Date(s.boarded_at).toLocaleTimeString() : ''}</span>
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
