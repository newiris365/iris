"use client";

import React, { useState, useEffect } from 'react';
import { Phone, Check, X, RefreshCw, Volume2, ShieldAlert } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function StudentIntercomPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<any>(null);

  useEffect(() => {
    loadIntercomCalls();
  }, []);

  const loadIntercomCalls = async () => {
    setLoading(true);
    try {
      // Fetch intercom logs mock/DB
      // For student portal, we show incoming calls or logs
      // Set default mock calls list
      const mockCalls = [];
      setCalls(mockCalls);

      // Simulate a live incoming ring
      setActiveCall({
        id: 'call-active-1',
        visitor_name: 'Pooja Sharma (Guardian)',
        visitor_phone: '+91 98290 12340',
        called_at: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (callId: string, approved: boolean) => {
    try {
      const res = await apiPost(`/gate/intercom/respond/${callId}`, { approved });
      if (res.success) {
        if (activeCall && activeCall.id === callId) {
          setCalls(prev => [{ ...activeCall, answered: true, approved }, ...prev]);
          setActiveCall(null);
        }
      }
    } catch {
      if (activeCall && activeCall.id === callId) {
        setCalls(prev => [{ ...activeCall, answered: true, approved }, ...prev]);
        setActiveCall(null);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Smart Video Intercom</h1>
              <p className="text-xs text-[#C4B5FD]/70">Respond to gate visitor intercom calls, approve entries, and listen to caller logs</p>
            </div>
          </div>

          <button 
            onClick={loadIntercomCalls} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main call responder */}
          <div className="md:col-span-2 space-y-6">
            {activeCall ? (
              <div className="rounded-3xl border border-yellow-500/25 bg-[#2A2312]/30 p-6 shadow-xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-yellow-500/20 text-yellow-400 uppercase tracking-widest animate-pulse border border-yellow-500/30">
                      INCOMING VIDEO CALL FROM GATE
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-3">{activeCall.visitor_name}</h2>
                    <p className="text-xs text-[#C4B5FD]/70 mt-1">{activeCall.visitor_phone}</p>
                  </div>

                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-8 h-8 text-yellow-400 animate-bounce" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleRespond(activeCall.id, true)}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                  >
                    <Check className="w-4 h-4" /> APPROVE ENTRY
                  </button>
                  <button
                    onClick={() => handleRespond(activeCall.id, false)}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/10"
                  >
                    <X className="w-4 h-4" /> DENY ACCESS
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/20 p-8 text-center text-[#C4B5FD]/30 text-xs">
                No active incoming visitor intercom calls.
              </div>
            )}

            {/* Call History list */}
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">Intercom Call logs</h3>
              
              <div className="space-y-3">
                {calls.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.visitor_name}</h4>
                      <p className="text-[9px] text-[#C4B5FD]/50 mt-0.5">{new Date(c.called_at).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                        c.approved 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {c.approved ? 'Approved' : 'Denied'}
                      </span>
                      
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all">
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column details */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-yellow-400" /> Kiosk Guidelines
              </h4>
              <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
                Smart video intercom calls are automatically recorded and archived in compliance logs. Recording files are cleared after 30 days.
              </p>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
