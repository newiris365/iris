"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, ArrowLeft, Send, CheckCircle, RefreshCw, Layers, Shield } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminGuardShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [guardName, setGuardName] = useState('Security Officer Ramesh');
  const [gateNumber, setGateNumber] = useState('Main Gate 1');
  const [shiftStart, setShiftStart] = useState('08:00 AM');
  const [shiftEnd, setShiftEnd] = useState('04:00 PM');
  const [notes, setNotes] = useState('');

  // Actions
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadShifts();
  }, []);

  const triggerAlert = (text: string, type: 'success' | 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 5000);
  };

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/gate/guards/shifts');
      if (res.success) {
        setShifts(res.shifts || []);
      } else {
        setShifts([]);
      }
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes) {
      triggerAlert('Please enter shift notes / instructions.', 'danger');
      return;
    }

    const newShift = {
      id: 'sh-' + Math.floor(100 + Math.random() * 900),
      guard_name: guardName,
      gate_number: gateNumber,
      shift_start: shiftStart,
      shift_end: shiftEnd,
      handover_notes: notes
    };

    setShifts(prev => [newShift, ...prev]);
    setNotes('');
    triggerAlert('Shift successfully scheduled and dispatched.', 'success');
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/admin/gate" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Security Guards Shifts</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Schedule and assign security guard duty shifts across main gates and residential portals</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {alertMsg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            alertMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{alertMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Scheduling form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleCreateShift} className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#A78BFA]" /> Dispatch Duty
              </h2>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Assign Guard</label>
                <input
                  type="text"
                  value={guardName}
                  onChange={e => setGuardName(e.target.value)}
                  placeholder="Enter guard name"
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Gate Assignment</label>
                <select
                  value={gateNumber}
                  onChange={e => setGateNumber(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                >
                  <option value="Main Gate 1">Main Gate 1</option>
                  <option value="Girls Hostel Gate">Girls Hostel Gate</option>
                  <option value="Boys Hostel Gate">Boys Hostel Gate</option>
                  <option value="Academic Block 2">Academic Block 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Shift Start</label>
                  <select
                    value={shiftStart}
                    onChange={e => setShiftStart(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="16:00 PM">16:00 PM</option>
                    <option value="00:00 AM">00:00 AM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Shift End</label>
                  <select
                    value={shiftEnd}
                    onChange={e => setShiftEnd(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-3 text-xs text-white"
                  >
                    <option value="16:00 PM">16:00 PM</option>
                    <option value="00:00 AM">00:00 AM</option>
                    <option value="08:00 AM">08:00 AM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Handover / Duty Notes</label>
                <textarea
                  placeholder="Enter special instructions (e.g. Inspect RFID cards, monitor late arrivals)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white min-h-[90px] resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Save Shift Scheduling
              </button>

            </form>
          </div>

          {/* Active shifts list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2.5">Scheduled Shifts Duty Sheet</h2>

              {loading ? (
                <div className="py-12 text-center text-xs text-white/30">Loading shifts...</div>
              ) : shifts.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/20">No shifts scheduled for today.</div>
              ) : (
                <div className="space-y-4">
                  {shifts.map(sh => (
                    <div key={sh.id} className="p-4 bg-[#0D0A1A] border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#A78BFA]">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-white">{sh.guard_name}</h3>
                            <p className="text-[9px] text-[#C4B5FD]/60">Gate: <strong className="text-white capitalize">{sh.gate_number}</strong></p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold text-[#C4B5FD] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {sh.shift_start} - {sh.shift_end}
                        </span>
                      </div>

                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs text-[#C4B5FD]">
                        <strong>Handover Instructions:</strong> {sh.handover_notes}
                      </div>
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
