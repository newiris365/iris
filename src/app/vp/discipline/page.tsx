"use client";

import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, User, Filter } from 'lucide-react';

const MOCK_INCIDENTS = [
  { id: '1', student: 'Rahul Verma', class: '10-A', type: 'Behavioral', severity: 'High', description: 'Disruptive behavior during assembly', date: '2026-07-02', status: 'Pending Review', reportedBy: 'Mrs. Sharma' },
  { id: '2', student: 'Priya Gupta', class: '9-B', type: 'Academic', severity: 'Medium', description: 'Plagiarism in science project', date: '2026-07-01', status: 'Investigating', reportedBy: 'Mr. Meena' },
  { id: '3', student: 'Amit Singh', class: '12-A', type: 'Attendance', severity: 'Low', description: '3 consecutive absent without notice', date: '2026-06-30', status: 'Resolved', reportedBy: 'Class Teacher' },
  { id: '4', student: 'Neha Joshi', class: '11-C', type: 'Behavioral', severity: 'Medium', description: 'Uniform violation repeated', date: '2026-06-29', status: 'Warning Issued', reportedBy: 'Mrs. Rathore' },
  { id: '5', student: 'Karan Patel', class: '8-A', type: 'Bullying', severity: 'High', description: 'Bullying younger student in playground', date: '2026-07-03', status: 'Pending Review', reportedBy: 'Warden' },
];

export default function DisciplinePage() {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status.toLowerCase().includes(filter));

  const getSeverityColor = (s: string) => {
    if (s === 'High') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (s === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  const getStatusColor = (s: string) => {
    if (s.includes('Pending')) return 'bg-yellow-500/20 text-yellow-400';
    if (s.includes('Investigating')) return 'bg-blue-500/20 text-blue-400';
    if (s.includes('Resolved')) return 'bg-emerald-500/20 text-emerald-400';
    return 'bg-purple-500/20 text-purple-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-violet-400" /> Student Discipline
          </h1>
          <p className="text-sm text-[#C4B5FD]/60 mt-1">Track and manage student behavioral incidents</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: incidents.length, color: 'text-white' },
          { label: 'Pending Review', value: incidents.filter(i => i.status.includes('Pending')).length, color: 'text-yellow-400' },
          { label: 'High Severity', value: incidents.filter(i => i.severity === 'High').length, color: 'text-red-400' },
          { label: 'Resolved', value: incidents.filter(i => i.status.includes('Resolved')).length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(inc => (
          <div key={inc.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-white">
                  {inc.student.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{inc.student}</h3>
                  <p className="text-[10px] text-slate-400">Class {inc.class} · Reported by {inc.reportedBy}</p>
                  <p className="text-xs text-slate-300 mt-1">{inc.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getSeverityColor(inc.severity)}`}>
                  {inc.severity}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(inc.status)}`}>
                  {inc.status}
                </span>
                <span className="text-[9px] text-slate-500">{inc.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
