"use client";

import React, { useState } from 'react';
import { Users, Search, Mail, Phone, BookOpen, Filter } from 'lucide-react';

const MOCK_FACULTY = [
  { id: '1', name: 'Mrs. Sharma', subject: 'Mathematics', department: 'Science', email: 'sharma@school.edu.in', phone: '+91-98290-12345', classes: ['10-A', '10-B', '9-A'], experience: '12 years', status: 'Active' },
  { id: '2', name: 'Mr. Meena', subject: 'Science', department: 'Science', email: 'meena@school.edu.in', phone: '+91-98290-12346', classes: ['9-B', '8-A', '8-B'], experience: '8 years', status: 'Active' },
  { id: '3', name: 'Mrs. Rathore', subject: 'English', department: 'Languages', email: 'rathore@school.edu.in', phone: '+91-98290-12347', classes: ['11-A', '11-C'], experience: '15 years', status: 'Active' },
  { id: '4', name: 'Mr. Gupta', subject: 'Physics', department: 'Science', email: 'gupta@school.edu.in', phone: '+91-98290-12348', classes: ['12-A', '12-B'], experience: '20 years', status: 'On Leave' },
  { id: '5', name: 'Ms. Jain', subject: 'Chemistry', department: 'Science', email: 'jain@school.edu.in', phone: '+91-98290-12349', classes: ['11-C', '10-A'], experience: '5 years', status: 'Active' },
  { id: '6', name: 'Mr. Singh', subject: 'Hindi', department: 'Languages', email: 'singh@school.edu.in', phone: '+91-98290-12350', classes: ['8-A', '7-A', '7-B'], experience: '10 years', status: 'Active' },
  { id: '7', name: 'Mrs. Kumari', subject: 'Social Studies', department: 'Humanities', email: 'kumari@school.edu.in', phone: '+91-98290-12351', classes: ['7-B', '6-A'], experience: '7 years', status: 'Active' },
  { id: '8', name: 'Mr. Verma', subject: 'Computer Science', department: 'Science', email: 'verma@school.edu.in', phone: '+91-98290-12352', classes: ['10-A', '9-A', '8-A'], experience: '6 years', status: 'Active' },
];

export default function FacultyPage() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');

  const filtered = MOCK_FACULTY.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.subject.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'all' || f.department === dept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={24} className="text-violet-400" /> Faculty Directory
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">Browse and manage faculty members</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or subject..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#6C2BD9]" />
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none">
          <option value="all">All Departments</option>
          <option value="Science">Science</option>
          <option value="Languages">Languages</option>
          <option value="Humanities">Humanities</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(f => (
          <div key={f.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
                {f.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{f.name}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    f.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {f.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{f.subject} · {f.department} · {f.experience}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Mail size={9} /> {f.email}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Classes: {f.classes.join(', ')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
