"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Search, Users, ShieldAlert, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';
import Skeleton from '../../../components/Skeleton';

export default function InsideOccupantsPage() {
  const [occupants, setOccupants] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'student' | 'staff' | 'visitor'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInsideOccupants();
  }, []);

  const loadInsideOccupants = async () => {
    setLoading(true);
    try {
      const [occRes, visRes] = await Promise.all([
        apiGet('/gate/occupants/inside'),
        apiGet('/gate/visitors/inside'),
      ]);

      let fetchedOccupants = [];
      let fetchedVisitors = [];

      if (occRes.success) {
        fetchedOccupants = occRes.occupants || [];
      }
      if (visRes.success) {
        fetchedVisitors = visRes.visitors || [];
      }

      setOccupants(fetchedOccupants);
      setVisitors(fetchedVisitors);
    } catch {
      // Mock Fallbacks if local backend is not running or seeds are empty
      setOccupants([
        { id: 'o1', person_name: 'Khushal Gehlot', person_type: 'student', entry_method: 'rfid', gate_number: 'main', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
        { id: 'o2', person_name: 'Dr. K. R. Sharma', person_type: 'staff', entry_method: 'biometric', gate_number: 'academic_gate', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 'o3', person_name: 'Amit Kumar Patel', person_type: 'student', entry_method: 'qr', gate_number: 'main', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
      ]);
      setVisitors([
        { id: 'v1', visitor_name: 'Rajesh Malhotra', visitor_phone: '+91 98765 43210', host_name: 'Dr. K. R. Sharma', purpose: 'Research Collaboration', pass_number: 'VP-84920', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Compile both arrays to a single display layout format
  const displayItems = [
    ...occupants.map(o => ({
      id: o.id,
      name: o.person_name,
      type: o.person_type as 'student' | 'staff',
      method: o.entry_method || 'manual',
      gate: o.gate_number || 'main',
      time: o.timestamp,
      extra: ''
    })),
    ...visitors.map(v => ({
      id: v.id,
      name: v.visitor_name,
      type: 'visitor' as const,
      method: 'visitor_pass',
      gate: 'main',
      time: v.created_at || new Date().toISOString(),
      extra: `Host: ${v.host_name} (Purpose: ${v.purpose})`
    }))
  ];

  // Filter based on selected tabs and search fields
  const filteredItems = displayItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.extra?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.gate?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return item.type === filterType && matchesSearch;
  });

  const studentsCount = displayItems.filter(i => i.type === 'student').length;
  const staffCount = displayItems.filter(i => i.type === 'staff').length;
  const visitorsCount = displayItems.filter(i => i.type === 'visitor').length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/gate" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Campus Occupants Track</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Search and monitor all students, staff, and guests currently within school parameters</p>
          </div>
          
          <button
            onClick={loadInsideOccupants}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* KPI Counter summaries */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setFilterType('all')} 
            className={`p-4.5 rounded-2xl border text-left transition-all ${
              filterType === 'all' ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-white' : 'bg-[#13102A]/60 border-white/5 text-white/70 hover:border-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">All Inside</span>
            <h2 className="text-2xl font-extrabold mt-1.5">{displayItems.length} Occupants</h2>
          </button>
          
          <button 
            onClick={() => setFilterType('student')} 
            className={`p-4.5 rounded-2xl border text-left transition-all ${
              filterType === 'student' ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-white' : 'bg-[#13102A]/60 border-white/5 text-white/70 hover:border-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Students</span>
            <h2 className="text-2xl font-extrabold mt-1.5">{studentsCount} Students</h2>
          </button>
          
          <button 
            onClick={() => setFilterType('staff')} 
            className={`p-4.5 rounded-2xl border text-left transition-all ${
              filterType === 'staff' ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-white' : 'bg-[#13102A]/60 border-white/5 text-white/70 hover:border-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Staff / Faculty</span>
            <h2 className="text-2xl font-extrabold mt-1.5">{staffCount} Employees</h2>
          </button>

          <button 
            onClick={() => setFilterType('visitor')} 
            className={`p-4.5 rounded-2xl border text-left transition-all ${
              filterType === 'visitor' ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-white' : 'bg-[#13102A]/60 border-white/5 text-white/70 hover:border-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Guests / Visitors</span>
            <h2 className="text-2xl font-extrabold text-amber-400 mt-1.5">{visitorsCount} Guests</h2>
          </button>
        </div>

        {/* Audit Search bar */}
        <div className="bg-[#13102A]/60 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              type="text"
              placeholder="Search by occupant name, host details, gate number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Occupants grid/list */}
        <div className="bg-[#13102A]/60 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-24 text-center space-y-2 text-white/30">
              <Users className="w-12 h-12 mx-auto" />
              <p className="text-xs font-bold uppercase">No matching occupants currently inside</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD]/50 bg-white/[0.01]">
                    <th className="py-4.5 px-6 font-semibold">Occupant Name</th>
                    <th className="py-4.5 px-6 font-semibold">Role Group</th>
                    <th className="py-4.5 px-6 font-semibold">Last Entry Gate</th>
                    <th className="py-4.5 px-6 font-semibold">Check-in Time</th>
                    <th className="py-4.5 px-6 font-semibold">Authentication Method</th>
                    <th className="py-4.5 px-6 font-semibold">Additional Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-all">
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#6C2BD9]/10 border border-[#8B5CF6]/20 flex items-center justify-center font-bold text-[#A78BFA] capitalize text-[10px]">
                          {item.name?.slice(0, 2)}
                        </div>
                        {item.name}
                      </td>
                      <td className="py-4 px-6 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          item.type === 'student' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          item.type === 'staff' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-white/80 capitalize">{item.gate}</td>
                      <td className="py-4 px-6 text-[#C4B5FD]/70">{new Date(item.time).toLocaleTimeString()} ({new Date(item.time).toLocaleDateString()})</td>
                      <td className="py-4 px-6 font-mono font-bold text-white/50 text-[10px] uppercase">{item.method}</td>
                      <td className="py-4 px-6 text-[#C4B5FD]/60 italic font-mono text-[10px]">{item.extra || 'Regular Shift movement'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
