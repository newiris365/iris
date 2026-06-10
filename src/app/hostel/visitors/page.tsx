"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, ShieldAlert, Phone, Clock, FileText, CheckCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StudentVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/hostel/visitors?studentId=${studentId}`);
      if (res.success) {
        setVisitors(res.visitors || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setVisitors([
        {
          id: 'v1',
          visitor_name: 'Rajesh Mehta',
          visitor_phone: '+91 98765 43210',
          visitor_id_type: 'Aadhaar',
          visitor_id_number: 'XXXX XXXX 1234',
          relation: 'Father',
          purpose: 'Delivering winter clothing and home food',
          gate_pass_id: 'GP-VIS826X',
          in_time: new Date().toISOString(),
          status: 'inside',
          is_approved: false
        },
        {
          id: 'v2',
          visitor_name: 'Amit Sharma',
          visitor_phone: '+91 91111 22222',
          visitor_id_type: 'Driving License',
          visitor_id_number: 'DL-XXXXXX992',
          relation: 'Friend',
          purpose: 'Group study reference textbook delivery',
          gate_pass_id: 'GP-VIS103Q',
          in_time: '2026-06-08T15:00:00Z',
          out_time: '2026-06-08T16:30:00Z',
          status: 'checked_out',
          is_approved: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (visitorId: string, approve: boolean) => {
    try {
      const res = await apiPost(`/hostel/visitors/${visitorId}/approve`, { approve });
      if (res.success) {
        setSuccessMsg(approve ? 'Guest entry approved.' : 'Guest entry rejected.');
        loadVisitors();
      } else {
        setErrorMsg(res.error || 'Failed to submit decision.');
      }
    } catch {
      // Mock Decision
      setVisitors(
        visitors.map(v =>
          v.id === visitorId ? { ...v, is_approved: approve, status: approve ? 'inside' : 'rejected' } : v
        )
      );
      setSuccessMsg(approve ? 'Guest entry approved! (Mock)' : 'Guest entry rejected! (Mock)');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Visitor Access Registry</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Authorize safety logs, gatepasses, and guest entries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {errorMsg}
          </div>
        )}

        <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Current & Previous Visitors</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No visitor logs recorded.
          </div>
        ) : (
          <div className="space-y-4">
            {visitors.map((vis) => (
              <div key={vis.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 space-y-4 shadow-lg">
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{vis.visitor_name}</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-[#C4B5FD]/50 font-mono">
                        {vis.relation || 'Guest'}
                      </span>
                    </h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-[#C4B5FD]/40" /> {vis.visitor_phone || 'No Phone'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50 bg-[#6C2BD9]/20 px-2 py-0.5 rounded font-bold font-mono border border-[#6C2BD9]/30">
                      {vis.gate_pass_id}
                    </span>
                    {vis.status === 'inside' && !vis.is_approved && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                        Awaiting Approval
                      </span>
                    )}
                    {vis.status === 'inside' && vis.is_approved && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                        Inside Campus
                      </span>
                    )}
                    {vis.status === 'checked_out' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[#C4B5FD]/40 border border-white/5 text-[9px] font-bold uppercase tracking-wider">
                        Checked Out
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">Purpose:</span> {vis.purpose}</p>
                    <p className="text-[#C4B5FD]/90 font-mono"><span className="text-[#C4B5FD]/40 font-sans font-semibold">ID Proof:</span> {vis.visitor_id_type} • {vis.visitor_id_number}</p>
                  </div>

                  <div className="space-y-1.5 md:text-right">
                    <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">In Time:</span> {new Date(vis.in_time).toLocaleString()}</p>
                    {vis.out_time && (
                      <p className="text-[#C4B5FD]/90"><span className="text-[#C4B5FD]/40 font-semibold">Out Time:</span> {new Date(vis.out_time).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {vis.status === 'inside' && !vis.is_approved && (
                  <div className="pt-3 border-t border-white/5 flex gap-3 justify-end">
                    <button
                      onClick={() => handleDecision(vis.id, false)}
                      className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Deny Access
                    </button>
                    <button
                      onClick={() => handleDecision(vis.id, true)}
                      className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Entry
                    </button>
                  </div>
                )}

                {vis.is_approved && (
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-emerald-400">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Authorized by You</span>
                    <a
                      href={`/api/v1/hostel/visitors/${vis.id}/gatepass`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4B5FD]/80 hover:text-white transition-all font-bold flex items-center gap-1 border border-white/5"
                    >
                      <FileText className="w-3 h-3" /> Get PDF Pass
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
