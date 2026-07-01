"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, User, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

export default function TrainerSessionsQueue() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      // Assume trainer id corresponds to user ID or is mapped
      const trainerId = user?.id || 't0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/fitzone/gym/trainer-sessions/${trainerId}`);
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (err) {
      console.log('Error loading sessions, using mock fallbacks');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId: string, newStatus: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiPut(`/fitzone/gym/trainer-sessions/${sessionId}/status`, {
        status: newStatus,
        notes: `Trainer marked session as ${newStatus}`
      });

      if (res.success) {
        setSuccess(`Session status updated to ${newStatus}.`);
        loadSessions();
      } else {
        setError(res.error || 'Failed to update status.');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating session status.');
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status !== 'scheduled');

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Trainer Sessions Queue</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Manage scheduled personal training requests and review students.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-8">
        
        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {success}
          </div>
        )}

        {/* 1. Pending/Scheduled Sessions */}
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#A78BFA]" /> Scheduled Training
          </h2>

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/40">Loading scheduled sessions...</div>
            ) : activeSessions.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-xs text-[#C4B5FD]/40">
                No active training requests scheduled.
              </div>
            ) : (
              activeSessions.map(s => (
                <div key={s.id} className="glass-panel p-5 rounded-2xl border border-[#6C2BD9]/20 bg-[#13102A]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  {/* Details */}
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#6C2BD9]/20 text-[#A78BFA] text-[10px] font-bold uppercase">
                        {s.session_type}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <User className="w-4.5 h-4.5 text-[#C4B5FD]/60" />
                      {s.students?.name} <span className="text-xs text-[#C4B5FD]/50 font-normal">({s.students?.roll_number})</span>
                    </h3>

                    <p className="text-xs text-[#C4B5FD]/60">Department: {s.students?.department}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-[#C4B5FD]/80 mt-1">
                      <Clock className="w-4 h-4 text-[#C4B5FD]/50" />
                      {new Date(s.scheduled_at).toLocaleString()} ({s.duration_minutes} mins)
                    </div>

                    {s.notes && (
                      <p className="text-xs text-white/70 italic mt-2">Notes: "{s.notes}"</p>
                    )}
                  </div>

                  {/* Accept / Complete Actions */}
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleStatusUpdate(s.id, 'completed')}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(s.id, 'rejected')}
                      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 hover:bg-red-500/20 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel / Decline
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Past Sessions History */}
        <div>
          <h2 className="text-base font-bold text-white mb-4">Completed History</h2>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/40">Loading history...</div>
            ) : pastSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#C4B5FD]/30">No historical sessions.</div>
            ) : (
              pastSessions.map(s => (
                <div key={s.id} className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">{s.students?.name} ({s.session_type})</p>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                      {new Date(s.scheduled_at).toLocaleString()} | {s.duration_minutes} mins
                    </p>
                  </div>

                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                    s.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-white/5 text-[#C4B5FD]/40'
                  }`}>
                    {s.status === 'completed' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {s.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
