"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RefreshCw, CheckCircle, Clock, Trash2, 
  MessageSquare, User, AlertCircle, Bookmark, ShieldAlert,
  Save, Eye
} from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';
import Link from 'next/link';

interface Escalation {
  id: string;
  conversation_id: string;
  user_id: string;
  query: string;
  reason: string;
  status: 'pending' | 'investigating' | 'resolved';
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  users?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Escalation | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/ai/escalations');
      if (res.success) {
        setEscalations(res.escalations || []);
        if (res.escalations && res.escalations.length > 0) {
          setSelectedTicket(res.escalations[0]);
        }
      }
    } catch {
      // Sandbox Fallbacks
      const fallbackList: Escalation[]  = [];
      setEscalations(fallbackList);
      setSelectedTicket(fallbackList[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !resolutionText.trim()) return;
    setSavingId(selectedTicket.id);

    try {
      const res = await apiPut(`/ai/escalations/${selectedTicket.id}/resolve`, {
        resolution: resolutionText
      });

      if (res.success) {
        setEscalations(prev => prev.map(esc => esc.id === selectedTicket.id ? res.escalation : esc));
        setSelectedTicket(res.escalation);
        setResolutionText('');
        alert('Ticket marked as resolved and logged.');
      }
    } catch {
      // Sandbox fallback update
      const updated: Escalation = {
        ...selectedTicket,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution: resolutionText
      };
      setEscalations(prev => prev.map(esc => esc.id === selectedTicket.id ? updated : esc));
      setSelectedTicket(updated);
      setResolutionText('');
      alert('Ticket marked as resolved successfully (MOCKED).');
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" /> Resolved
          </span>
        );
      case 'investigating':
        return (
          <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-bold flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 animate-spin" /> In Progress
          </span>
        );
      default:
        return (
          <span className="text-[9px] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-red-400 font-bold flex items-center gap-0.5">
            <AlertCircle className="w-2.5 h-2.5" /> Pending Override
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/ai" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Escalation Handoff Queue</h1>
              <p className="text-sm text-[#C4B5FD]/70">Resolve student AI queries escalated due to frustration detection or overrides requests</p>
            </div>
          </div>

          <button 
            onClick={loadEscalations}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tickets checklist */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-xs uppercase font-bold tracking-wider text-white/45 flex items-center gap-1.5">
            <ShieldAlert className="w-4.5 h-4.5 text-red-400" /> Pending override handoffs
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 shadow-xl max-h-[500px] overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-center text-xs text-white/30 py-12">Loading handoff queue...</p>
            ) : escalations.length === 0 ? (
              <p className="text-center text-xs text-white/20 py-12">Queue clean. No escalations.</p>
            ) : (
              escalations.map((esc) => (
                <button
                  key={esc.id}
                  onClick={() => { setSelectedTicket(esc); setResolutionText(esc.resolution || ''); }}
                  className={`w-full p-4 rounded-2xl text-left border transition-all flex flex-col gap-2 ${
                    selectedTicket?.id === esc.id
                      ? 'bg-[#6C2BD9]/20 border-[#8B5CF6]/50 text-white'
                      : 'bg-black/20 border-white/5 text-white/60 hover:bg-black/30 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-white/50" /> {esc.users?.name || 'Student'}
                    </span>
                    {getStatusBadge(esc.status)}
                  </div>
                  <p className="text-[11px] opacity-75 truncate w-full">"{esc.query}"</p>
                  <span className="text-[8px] text-white/30 font-mono">
                    Raised: {new Date(esc.created_at).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket details and Resolve console */}
        <div className="lg:col-span-2">
          {!selectedTicket ? (
            <div className="bg-[#13102A]/60 p-12 rounded-3xl border border-white/5 shadow-xl text-center text-sm text-white/30 min-h-[480px] flex items-center justify-center">
              Select a ticket from the queue list to audit and resolve.
            </div>
          ) : (
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-6 min-h-[480px]">
              
              {/* Ticket details header */}
              <div className="flex justify-between items-start pb-4 border-b border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">Ticket override details</h3>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/75">Raised by: {selectedTicket.users?.name} ({selectedTicket.users?.email})</p>
                </div>
                <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/40 font-mono">
                  ID: {selectedTicket.id}
                </span>
              </div>

              {/* Handoff context */}
              <div className="space-y-4 text-xs">
                
                <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#A78BFA] font-bold">Unresolved Query</span>
                  <p className="text-white font-medium">"{selectedTicket.query}"</p>
                </div>

                <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold">Escalation Trigger Factor</span>
                  <p className="text-white/80">{selectedTicket.reason}</p>
                </div>

              </div>

              {/* Resolve action block */}
              <div className="border-t border-white/5 pt-4">
                {selectedTicket.status === 'resolved' ? (
                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">Resolution logged</span>
                    <p className="text-xs text-white/90 font-medium">"{selectedTicket.resolution}"</p>
                    <span className="text-[8px] text-white/30 block font-mono">Resolved on {new Date(selectedTicket.resolved_at!).toLocaleString()}</span>
                  </div>
                ) : (
                  <form onSubmit={handleResolve} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Custom staff resolution response</label>
                      <textarea
                        placeholder="Type resolution message here... Message will be logged and dispatched to student notifications dashboard."
                        value={resolutionText}
                        onChange={e => setResolutionText(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white min-h-[90px] resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingId !== null}
                        className="px-4 py-2 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#A78BFA] transition-all rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow"
                      >
                        {savingId !== null ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Resolve & Answer User
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
