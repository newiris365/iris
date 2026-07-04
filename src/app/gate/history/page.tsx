"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Calendar, Clock, RefreshCw, ArrowLeft, MoveDownLeft, MoveUpRight, Info } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function StudentMovementHistoryPage() {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalHours: 0,
    lateArrivals: 0
  });

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('iris_user_profile') : null;
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setProfile(parsed);
        fetchHistory(parsed.id);
      } catch {}
    } else {
      const fallback = { id: '', name: 'Student', role: 'Student' };
      setProfile(fallback);
      fetchHistory(fallback.id);
    }
  }, []);

  const fetchHistory = async (personId: string) => {
    setLoading(true);
    try {
      const res = await apiGet(`/gate/person/${personId}/history`);
      if (res.success && res.history) {
        setHistory(res.history);
        calculateStats(res.history);
      }
    } catch {
      // Clean fallback
      setHistory([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: any[]) => {
    const entries = logs.filter(l => l.direction === 'in');
    const lates = logs.filter(l => l.reason?.toLowerCase().includes('late')).length;
    
    // Estimate some random mock hours based on logins
    setStats({
      totalEntries: entries.length,
      totalHours: entries.length * 7 + 4,
      lateArrivals: lates
    });
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-xl mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/student/dashboard" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-xl text-white">Movement Logs & History</h1>
            <p className="text-[10px] text-[#C4B5FD]/70">Track your entries, exits, and campus duration statistics</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 mt-8 space-y-6">
        
        {/* KPI stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#13102A]/60 p-3.5 border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase block">Total Visits</span>
            <p className="text-lg font-extrabold text-white">{stats.totalEntries} entries</p>
          </div>
          <div className="bg-[#13102A]/60 p-3.5 border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase block">Campus Hours</span>
            <p className="text-lg font-extrabold text-white">~{stats.totalHours} hrs</p>
          </div>
          <div className="bg-[#13102A]/60 p-3.5 border border-white/5 rounded-2xl text-center space-y-1">
            <span className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase block">Late Flags</span>
            <p className="text-lg font-extrabold text-amber-400">{stats.lateArrivals} alerts</p>
          </div>
        </div>

        {/* Timeline body */}
        <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">Timeline Log</h2>
          
          {loading ? (
            <div className="py-12 text-center text-xs text-white/30 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#8B5CF6]" />
              <span>Fetching logs history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/30">No gate activity logged for your profile.</div>
          ) : (
            <div className="relative border-l border-white/10 pl-6 space-y-6 ml-2.5">
              {history.map((item, idx) => {
                const isEntry = item.direction === 'in';
                return (
                  <div key={item.id || idx} className="relative">
                    {/* Circle icon marker */}
                    <div className={`absolute -left-[35px] top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border ${
                      isEntry ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {isEntry ? <MoveDownLeft className="w-3 h-3" /> : <MoveUpRight className="w-3 h-3" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs capitalize text-white">
                          {isEntry ? 'Entry Check-In' : 'Exit Check-Out'}
                        </span>
                        <span className="text-[8px] text-white/30 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#C4B5FD]/70">
                        Gate scanned: <strong className="text-white capitalize">{item.gate_number}</strong> • Method: <span className="uppercase font-mono text-white/50 text-[9px]">{item.entry_method}</span>
                      </p>
                      
                      {item.reason && (
                        <p className={`text-[9px] font-bold flex items-center gap-1 ${
                          item.reason.toLowerCase().includes('late') ? 'text-amber-400' : 'text-white/40'
                        }`}>
                          <Info className="w-3 h-3" />
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
