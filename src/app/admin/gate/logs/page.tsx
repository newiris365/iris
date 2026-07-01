"use client";

import React, { useState, useEffect } from 'react';
import { Search, Calendar, RefreshCw, ArrowLeft, ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminMovementLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedGate, setSelectedGate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMovementLogs();
  }, [selectedDate, selectedType, selectedGate]);

  const loadMovementLogs = async () => {
    setLoading(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedType) params.type = selectedType;
      if (selectedGate) params.gate = selectedGate;

      const res = await apiGet('/gate/logs', params);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch {
      // Mock Fallbacks
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.person_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entry_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/admin/gate" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Movement Logs Audit</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Search, filter, and audit full institutional gate movement timelines</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Filters control bar */}
        <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Audit Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Person Group</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3.5 text-xs text-white"
            >
              <option value="">All Groups</option>
              <option value="student">Students</option>
              <option value="staff">Staff Members</option>
              <option value="visitor">Visitors / Guests</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Gate Location</label>
            <select
              value={selectedGate}
              onChange={e => setSelectedGate(e.target.value)}
              className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3.5 text-xs text-white"
            >
              <option value="">All Gates</option>
              <option value="main">Main Gate</option>
              <option value="academic_gate">Academic Gate</option>
              <option value="transit_gate">Transit Gate</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Search Name / Notes</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#C4B5FD]/40" />
              <input
                type="text"
                placeholder="Search name or method..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white"
              />
            </div>
          </div>

        </div>

        {/* Audit Table */}
        <div className="bg-[#13102A]/60 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center text-xs text-white/30 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#8B5CF6]" />
              <span>Fetching audit timeline logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-xs text-white/20">No movement logs recorded matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD]/50 bg-white/[0.01]">
                    <th className="py-4.5 px-6 font-semibold">Direction</th>
                    <th className="py-4.5 px-6 font-semibold">User Name</th>
                    <th className="py-4.5 px-6 font-semibold">Group</th>
                    <th className="py-4.5 px-6 font-semibold">Gate Location</th>
                    <th className="py-4.5 px-6 font-semibold">Time Scanned</th>
                    <th className="py-4.5 px-6 font-semibold">Auth Method</th>
                    <th className="py-4.5 px-6 font-semibold">Reason / Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map(log => {
                    const isEntry = log.direction === 'in';
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-4.5 px-6">
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[8px] flex items-center gap-1 w-fit ${
                            isEntry ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {isEntry ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {log.direction?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 font-bold text-white">{log.person_name}</td>
                        <td className="py-4.5 px-6 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-semibold ${
                            log.person_type === 'student' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            log.person_type === 'staff' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.person_type}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 font-semibold text-white/80 capitalize">{log.gate_number}</td>
                        <td className="py-4.5 px-6 font-mono text-[#C4B5FD]/70">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="py-4.5 px-6 font-mono font-bold text-white/40 text-[9px] uppercase">{log.entry_method}</td>
                        <td className="py-4.5 px-6 text-[#C4B5FD]/70 italic">{log.reason || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
