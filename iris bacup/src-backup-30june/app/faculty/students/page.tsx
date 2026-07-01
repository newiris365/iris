"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/faculty/students');
        if (res.success) setStudents(res.students || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = students.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users size={24} className="text-blue-400" />
        My Students
        {students.length > 0 && (
          <span className="bg-blue-500/20 text-blue-400 text-sm px-2 py-0.5 rounded-full">{students.length}</span>
        )}
      </h1>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          placeholder="Search by name, roll number..." />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No students found.</div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-slate-400 font-medium">Student</th>
                <th className="text-left p-3 text-slate-400 font-medium">Roll Number</th>
                <th className="text-left p-3 text-slate-400 font-medium">Email</th>
                <th className="text-left p-3 text-slate-400 font-medium">Phone</th>
                <th className="text-center p-3 text-slate-400 font-medium">Semester</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                        {s.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-white font-medium">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300">{s.roll_number}</td>
                  <td className="p-3 text-slate-300 flex items-center gap-1"><Mail size={12} /> {s.email}</td>
                  <td className="p-3 text-slate-300 flex items-center gap-1"><Phone size={12} /> {s.phone || '—'}</td>
                  <td className="p-3 text-center text-white">{s.current_semester || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
