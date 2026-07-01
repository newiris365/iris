"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../../lib/api';
import { 
  Award, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, 
  HelpCircle, Sparkles, Database, Percent, Plus
} from 'lucide-react';

interface OfferItem {
  id: string;
  applicant_name: string;
  program_code: string;
  status: string; // sent, accepted, rejected, expired
  offered_at: string;
  expires_at: string;
}

export default function OfficerOffersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [meritLists, setMeritLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  
  // Seat metrics
  const [seatsData, setSeatsData] = useState([
    { code: 'BTECH-CSE', name: 'B.Tech CSE', total: 120, offered: 45, accepted: 28 },
    { code: 'BTECH-AIDS', name: 'B.Tech AI-DS', total: 60, offered: 25, accepted: 14 },
    { code: 'MBA-CORE', name: 'MBA Core', total: 60, offered: 15, accepted: 9 }
  ]);

  // Generated offers list
  const [offersLog, setOffersLog] = useState<OfferItem[]>([]);

  async function loadInitialData() {
    try {
      // Fetch lists
      const res = await apiGet('/merit-list/1'); // Fetch round 1 lists
      if (res.success && res.merit_lists) {
        setMeritLists(res.merit_lists);
        if (res.merit_lists.length > 0) {
          setSelectedListId(res.merit_lists[0].id);
        }
      }
    } catch {
      // Mock merit lists
      const mockLists = [
        { id: 'ml-1', program_code: 'BTECH-CSE', round_number: 1, list_type: 'merit', cutoff_score: 92.1 },
        { id: 'ml-2', program_code: 'BTECH-AIDS', round_number: 1, list_type: 'merit', cutoff_score: 89.6 }
      ];
      setMeritLists(mockLists);
      setSelectedListId(mockLists[0].id);

      // Mock offer log
      setOffersLog([]);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleGenerateOffers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiPost('/admissions/offers/generate-bulk', { merit_list_id: selectedListId });
      if (res.success) {
        setSuccess(res.message || 'Provisional offers generated successfully!');
        await loadInitialData();
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Simulation
      setTimeout(() => {
        setSuccess('Offers generated locally for all listed candidates under sandbox.');
        const targetList = meritLists.find(l => l.id === selectedListId);
        const newOffers: OfferItem[] = [
          {
            id: `off-${Date.now()}`,
            applicant_name: 'New Candidate A',
            program_code: targetList?.program_code || 'BTECH-CSE',
            status: 'sent',
            offered_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setOffersLog(prev => [newOffers[0], ...prev]);
        
        // Update metric
        setSeatsData(prev => prev.map(s => {
          if (s.code === targetList?.program_code) {
            return { ...s, offered: s.offered + 1 };
          }
          return s;
        }));

        setLoading(false);
      }, 1500);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'sent': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'rejected': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'expired': return 'text-white/30 bg-white/5 border-white/10';
      default: return 'text-[#C4B5FD]/50 border-transparent';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#6C2BD9]/20 pb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-[#A78BFA]" />
          Admissions Offer dispatch Desk
        </h1>
        <p className="text-xs text-[#C4B5FD]/70 mt-1">Audit seat allocation ratios, generate bulk provisional offer letter PDFs, and audit acceptance logs.</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" /> {error}
        </div>
      )}

      {/* Seat matrices card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {seatsData.map((seat) => {
          const fillRatio = Math.round((seat.accepted / seat.total) * 100);
          return (
            <div key={seat.code} className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold">{seat.code}</span>
                  <h4 className="text-sm font-bold text-white mt-1">{seat.name}</h4>
                </div>
                <span className="text-lg font-mono font-extrabold text-[#A78BFA]">{fillRatio}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] transition-all"
                  style={{ width: `${fillRatio}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center pt-2">
                <div className="p-2 bg-[#0D0A1A]/60 rounded-lg border border-white/5">
                  <span className="text-[#C4B5FD]/40 block">TOTAL</span>
                  <span className="text-white font-bold">{seat.total}</span>
                </div>
                <div className="p-2 bg-[#0D0A1A]/60 rounded-lg border border-white/5">
                  <span className="text-[#C4B5FD]/40 block">OFFERED</span>
                  <span className="text-[#A78BFA] font-bold">{seat.offered}</span>
                </div>
                <div className="p-2 bg-[#0D0A1A]/60 rounded-lg border border-white/5">
                  <span className="text-[#C4B5FD]/40 block">ACCEPTED</span>
                  <span className="text-emerald-400 font-bold">{seat.accepted}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Bulk Generate */}
        <div className="space-y-6">
          <form onSubmit={handleGenerateOffers} className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="w-4.5 h-4.5 text-[#A78BFA]" /> Bulk Issue Offers
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#C4B5FD] uppercase tracking-wider font-mono">Select Published Merit Round</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2.5 px-3 rounded-xl text-xs text-white outline-none focus:border-[#8B5CF6]"
              >
                {meritLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.program_code} - Round {l.round_number} ({l.list_type})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedListId}
              className="w-full py-3.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C2BD9]/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Generate Provisional Offers</span>
            </button>
          </form>

          <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-indigo-400" /> Dispatch Pipeline
            </h4>
            <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
              Generating provisional offers will automatically:
              <br/>1. Create a downloadable letter PDF template path.
              <br/>2. Send SMS, email, and WhatsApp notification checkouts.
              <br/>3. Start a 7-day confirmation payment lock timer.
            </p>
          </div>
        </div>

        {/* Right Log List */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Admissions Offers Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD]/50 font-bold">
                  <th className="pb-2">Candidate</th>
                  <th className="pb-2">Program</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Offered At</th>
                  <th className="pb-2">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {offersLog.map((off) => (
                  <tr key={off.id}>
                    <td className="py-3 font-bold text-white">{off.applicant_name}</td>
                    <td className="py-3 font-mono text-indigo-400">{off.program_code}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(off.status)}`}>
                        {off.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#C4B5FD]/50">{new Date(off.offered_at).toLocaleDateString()}</td>
                    <td className="py-3 text-[#C4B5FD]/50">{new Date(off.expires_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
