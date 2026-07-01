"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Search, ArrowLeft, Ticket, CheckCircle2, XCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { apiGet, apiPost } from '../../../../../lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminCheckinScannerPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; registration?: any } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventRes, regsRes] = await Promise.all([
        apiGet(`/events/events/${eventId}`),
        apiGet(`/events/events/${eventId}/registrations`)
      ]);

      if (eventRes.success) setEvent(eventRes.event);
      if (regsRes.success) setRegistrations(regsRes.registrations || []);
    } catch (err) {
      setError('Offline mode: Using simulated data.');
      setEvent({
        id: eventId,
        title: 'TechFest 2026 — AI & Robotics Summit',
        max_participants: 500
      });
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (code: string) => {
    if (!code) return;
    setChecking(true);
    setScanResult(null);
    try {
      const res = await apiPost(`/events/events/${eventId}/checkin`, {
        ticket_number: code
      });

      if (res.success) {
        setScanResult({
          success: true,
          message: `Check-in successful! Student: ${res.registration?.students?.name || 'Attendee'}`,
          registration: res.registration
        });
        setTicketNumber('');
        loadData(); // Reload lists
      } else {
        throw new Error(res.error || 'Invalid ticket code or already checked in.');
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'Check-in failed. Please verify ticket number.'
      });
    } finally {
      setChecking(false);
    }
  };

  const checkedInCount = registrations.filter(r => r.attendance_marked).length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link href={`/admin/events/${eventId}`} className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/50 hover:text-[#A78BFA] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Event Hub
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Viewfinder Simulator */}
            <div className="flex flex-col gap-5">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 p-6 flex flex-col items-center">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 w-full">
                  <Camera className="w-4.5 h-4.5 text-[#A78BFA]" /> Check-In Scanner
                </h2>

                {/* Simulated Camera Viewport */}
                <div className="w-full aspect-square max-w-[280px] rounded-2xl border border-dashed border-[#6C2BD9]/30 relative overflow-hidden bg-black/60 flex flex-col items-center justify-center text-center p-6">
                  {/* Glowing Laser */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-md shadow-red-500 top-1/2 -translate-y-1/2 animate-bounce w-full" />
                  
                  <Ticket className="w-12 h-12 text-[#C4B5FD]/20 mb-3 animate-pulse" />
                  <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">Align student QR Ticket inside this viewfinder viewport to trigger scanner checkin.</p>
                </div>

                <div className="w-full flex flex-col gap-3 mt-6">
                  <p className="text-[10px] text-center text-[#C4B5FD]/40 uppercase tracking-widest font-bold">Manual Checkout Fallback</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Ticket Number (e.g. EVT-A3F9...)"
                      value={ticketNumber}
                      onChange={e => setTicketNumber(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-xs text-white uppercase outline-none focus:border-[#8B5CF6]/50 placeholder-[#C4B5FD]/30"
                    />
                    <button
                      onClick={() => handleCheckin(ticketNumber)}
                      disabled={checking || !ticketNumber}
                      className="px-5 py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {checking ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Scan result toast-alert */}
              {scanResult && (
                <div className={`p-4 rounded-2xl border ${
                  scanResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                } flex items-start gap-3 text-xs`}>
                  {scanResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">{scanResult.success ? 'Success' : 'Check-in Failed'}</p>
                    <p className="opacity-90 mt-0.5">{scanResult.message}</p>
                    {scanResult.registration && (
                      <p className="opacity-60 text-[10px] mt-1 font-mono">Ticket Code: {scanResult.registration.ticket_number}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Checkin statistics and search lists */}
            <div className="flex flex-col gap-5">
              {/* Checkin Gauges */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-[#A78BFA]" /> Live Turnout Stats
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-2xl font-extrabold text-white">{checkedInCount}</p>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Attendees Checked In</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-2xl font-extrabold text-white">{registrations.length}</p>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Total Registrations</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all"
                    style={{ width: `${registrations.length ? (checkedInCount / registrations.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#C4B5FD]/40 text-center mt-2">
                  Live Attendance Rate: {registrations.length ? Math.round((checkedInCount / registrations.length) * 100) : 0}%
                </p>
              </div>

              {/* Attendee lists filterable */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 p-6 flex-1 flex flex-col max-h-[360px]">
                <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-3">Registrations Checkout Queue</h3>
                
                <div className="overflow-y-auto space-y-2 flex-1 pr-1 text-xs">
                  {registrations.map(reg => (
                    <div key={reg.id} className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{reg.students?.name || 'Student'}</p>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5 font-mono">{reg.ticket_number} • {reg.students?.roll_number}</p>
                      </div>

                      {reg.attendance_marked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Checked-In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckin(reg.ticket_number)}
                          className="px-3 py-1 bg-[#6C2BD9]/20 hover:bg-[#6C2BD9] hover:text-white border border-[#6C2BD9]/30 text-[9px] font-bold text-[#A78BFA] rounded-lg transition-all"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  ))}

                  {registrations.length === 0 && (
                    <p className="text-center text-[#C4B5FD]/30 py-8 text-xs">No registrations loaded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
