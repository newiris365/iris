"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Check, X, ShieldAlert, ArrowLeft, Send, Clock, QrCode, FileText, Landmark, Key } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function ExitPassConsolePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  // Student Form State
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('Dr. K. R. Sharma (HOD)');
  const [exitTime, setExitTime] = useState('');

  // Pass List
  const [passes, setPasses] = useState<any[]>([]);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('iris_user_profile') : null;
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setProfile(parsed);
        setIsTeacher(parsed.role?.toLowerCase() === 'staff' || parsed.role?.toLowerCase() === 'teacher');
      } catch {}
    } else {
      // Default profile
      setProfile({ id: '', name: 'Student', role: 'Student' });
    }

    loadExitPasses();
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 5000);
  };

  const loadExitPasses = () => {
    setLoading(true);
    setPasses([]);
    setLoading(false);
  };

  const handleRequestPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !exitTime) {
      triggerAlert('Reason and targeted exit time details are required.', 'danger');
      return;
    }

    const newPass = {
      id: 'ep-' + Math.floor(100 + Math.random() * 900),
      student_name: profile?.name || 'Student',
      student_id: profile?.id || '',
      reason,
      approver,
      exit_time: exitTime,
      status: 'pending'
    };

    setPasses(prev => [newPass, ...prev]);
    setReason('');
    setExitTime('');
    triggerAlert('Early exit request submitted to approver.', 'success');
  };

  const handleApprove = (id: string) => {
    setPasses(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', qr_pass: 'EXIT-' + id.toUpperCase() } : p));
    triggerAlert('Exit request approved and ticket signed.', 'success');
  };

  const handleReject = (id: string) => {
    setPasses(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    triggerAlert('Exit request rejected.', 'danger');
  };

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/student/dashboard" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Early Exit Pass Console</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Apply for early campus exits or review and authorize student exit request tickets</p>
          </div>

          {/* Toggle Role Mock UI */}
          <button
            onClick={() => setIsTeacher(!isTeacher)}
            className="px-4 py-2 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-[#A78BFA]" />
            Switch View: {isTeacher ? 'Teacher / Approver' : 'Student'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {alertMsg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            alertMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{alertMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Block: Student Submit / Info pass */}
          <div className="lg:col-span-1 space-y-6">
            {!isTeacher ? (
              <form onSubmit={handleRequestPass} className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#A78BFA]" /> Request Early Leave
                </h2>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Leave Approver / Head</label>
                  <select
                    value={approver}
                    onChange={e => setApprover(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                  >
                    <option value="Dr. K. R. Sharma (HOD)">Dr. K. R. Sharma (HOD)</option>
                    <option value="Prof. Ananya Sen">Prof. Ananya Sen</option>
                    <option value="Hostel Warden Office">Hostel Warden Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Target Exit Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 02:30 PM"
                    value={exitTime}
                    onChange={e => setExitTime(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Detailed Reason</label>
                  <textarea
                    placeholder="Specify the medical emergency or academic tournament reason..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white min-h-[80px] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Submit Early Exit Request
                </button>
              </form>
            ) : (
              <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center mx-auto text-[#A78BFA]">
                  <Landmark className="w-6 h-6" />
                </div>
                <h2 className="text-sm font-bold text-white">Approver Console Mode</h2>
                <p className="text-[11px] text-[#C4B5FD]/70 leading-relaxed">
                  You are viewing the dashboard as a Staff member / HOD. You can review pending exit tickets from students in your department and sign exit authorization tokens.
                </p>
              </div>
            )}

            {/* Approved pass details check */}
            {!isTeacher && passes.filter(p => p.status === 'approved').length > 0 && (
              <div className="bg-[#1E1B4B]/70 p-6 rounded-3xl border border-[#8B5CF6]/20 shadow-xl space-y-4 text-center">
                <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active Leave Ticket</span>
                <h3 className="text-xs font-bold text-white mt-2">Early Leave Signed</h3>
                
                {/* Simulated QR block */}
                <div className="bg-[#13102A] p-3.5 rounded-2xl inline-block border border-white/10 mt-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(passes.filter(p => p.status === 'approved')[0].qr_pass || 'EXIT')}&bgcolor=13102A&color=ffffff`}
                    alt="Exit Pass QR"
                    className="w-32 h-32 rounded border border-white/5"
                  />
                </div>
                <p className="text-[9px] text-[#C4B5FD]/50 font-mono">CODE: {passes.filter(p => p.status === 'approved')[0].qr_pass}</p>
                <p className="text-[10px] text-emerald-400">Valid Exit Time: {passes.filter(p => p.status === 'approved')[0].exit_time}</p>
              </div>
            )}
          </div>

          {/* Right Block: Request list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">Student Leave Tickets</h2>

              {loading ? (
                <div className="py-12 text-center text-xs text-white/30">Loading tickets...</div>
              ) : passes.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/30">No exit requests recorded.</div>
              ) : (
                <div className="space-y-4">
                  {passes.map(p => (
                    <div key={p.id} className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-xs text-white">{p.student_name}</h3>
                          <p className="text-[9px] text-white/40 font-mono">ID: {p.student_id} • Target Exit: {p.exit_time}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold capitalize ${statusBadgeColor(p.status)}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5 text-xs text-[#C4B5FD] flex flex-col gap-1.5">
                        <p><strong>Reason:</strong> {p.reason}</p>
                        <p className="text-[10px] text-white/40"><strong>Assigned HOD:</strong> {p.approver}</p>
                      </div>

                      {/* Approval buttons for teacher view */}
                      {isTeacher && p.status === 'pending' && (
                        <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                          <button
                            onClick={() => handleReject(p.id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject Request
                          </button>
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Leave
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
