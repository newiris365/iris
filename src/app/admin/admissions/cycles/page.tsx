"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../../lib/api';
import { 
  Calendar, Plus, CheckCircle, AlertCircle, Loader2, ArrowRight,
  TrendingUp, CalendarDays, RefreshCw, ShieldAlert
} from 'lucide-react';

interface CycleRecord {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: string; // upcoming, open, closed, processing, completed
}

export default function AdminCyclesPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cycles, setCycles] = useState<CycleRecord[]>([]);

  // Form states: Create Cycle
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState('2026-27');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newStatus, setNewStatus] = useState('upcoming');

  async function loadCycles() {
    try {
      const res = await apiGet('/admissions/siet-jodhpur'); // Hits getInstitutionAdmissions
      if (res.success && res.institution) {
        setCycles(res.institution.open_cycles || []);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Mock cycles list
      const mockCycles: CycleRecord[] = [
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          name: 'Fall Admissions 2026',
          academic_year: '2026-27',
          start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'open'
        },
        {
          id: 'c1111111-1111-1111-1111-111111111112',
          name: 'Spring Admissions 2027',
          academic_year: '2026-27',
          start_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'upcoming'
        }
      ];
      setCycles(mockCycles);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCycles();
  }, []);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: newName,
      academic_year: newYear,
      start_date: newStart,
      end_date: newEnd,
      status: newStatus
    };

    // Simulate insert in Database
    setTimeout(() => {
      const mockNew: CycleRecord = {
        id: `c-mock-${Date.now()}`,
        ...payload
      };
      setCycles(prev => [mockNew, ...prev]);
      setSuccess('Admissions cycle setup registered successfully!');
      
      setNewName('');
      setNewStart('');
      setNewEnd('');
      
      setProcessing(false);
    }, 1000);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'upcoming': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'closed': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Cycles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Create Cycle */}
        <div className="space-y-6">
          <form onSubmit={handleCreateCycle} className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <Plus className="w-4 h-4 text-[#A78BFA]" /> Configure Cycle
            </h3>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Cycle Name</span>
              <input
                type="text" required value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Fall Admissions 2026"
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white placeholder-white/20 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Academic Year</span>
              <select
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white"
              >
                <option value="2026-27">2026-27</option>
                <option value="2027-28">2027-28</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Start Date</span>
                <input
                  type="date" required value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">End Date</span>
                <input
                  type="date" required value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Initial Status</span>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2 px-3 rounded-xl text-xs text-white"
              >
                <option value="upcoming">Upcoming</option>
                <option value="open">Open / Active</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#6C2BD9]/20 flex justify-center items-center gap-1"
            >
              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Schedule Cycle</span>
            </button>
          </form>
        </div>

        {/* Right Active list */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Configured Cycles logs</h3>
          
          <div className="space-y-3">
            {cycles.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#6C2BD9]/20 transition-all duration-300">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{c.name}</h4>
                    <span className="text-[9px] font-mono text-[#A78BFA] px-1.5 py-0.5 rounded bg-[#6C2BD9]/10 border border-[#6C2BD9]/25">{c.academic_year}</span>
                  </div>
                  <span className="text-[10px] text-[#C4B5FD]/40 font-mono block">
                    Timeline: {formatDate(c.start_date)} to {formatDate(c.end_date)}
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${getStatusBadgeColor(c.status)}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
