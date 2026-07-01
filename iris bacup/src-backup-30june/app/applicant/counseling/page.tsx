"use client";

import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../lib/api';
import { 
  CalendarDays, Video, MapPin, CheckCircle, Clock, AlertTriangle, ExternalLink, HelpCircle
} from 'lucide-react';

interface CounselingSlot {
  id: string;
  slot_time: string;
  status: string; // assigned, attended, no_show, rescheduled
  attended: boolean;
  notes?: string | null;
  counseling_sessions?: {
    mode: string; // online, offline, hybrid
    venue?: string | null;
    meeting_link?: string | null;
    scheduled_date: string;
  };
}

export default function CandidateCounselingPage() {
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<CounselingSlot | null>(null);

  async function loadCounselingSlot() {
    try {
      const res = await apiGet('/admissions/application/my');
      if (res.success && res.applicant) {
        const slots = res.applicant.counseling_slots || [];
        if (slots.length > 0) {
          setSlot(slots[0]);
        }
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Offline fallback mock data
      const mockSlot: CounselingSlot = {
        id: 'slot-1234',
        slot_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'assigned',
        attended: false,
        notes: 'Please keep all original marksheets and verification certificates ready.',
        counseling_sessions: {
          mode: 'online',
          meeting_link: 'https://meet.jit.si/siet-admissions-counseling-room-2026',
          venue: 'Room 204, Academic Block A',
          scheduled_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      };
      setSlot(mockSlot);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCounselingSlot();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Checking Counseling Appointments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#6C2BD9]/20 pb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-[#A78BFA]" />
          Counseling & Interview slots
        </h1>
        <p className="text-xs text-[#C4B5FD]/70 mt-1">Review scheduled counseling sessions, join online interviews, or find reporting venue details.</p>
      </div>

      {!slot ? (
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-10 text-center space-y-6 max-w-xl mx-auto">
          <Clock className="w-12 h-12 text-[#A78BFA]/50 mx-auto animate-pulse" />
          <h3 className="font-bold text-white text-lg">Slot Scheduling Pending</h3>
          <p className="text-xs text-[#C4B5FD]/70 leading-relaxed">
            We are currently compiling candidate lists and assigning counseling desks. Slots will be configured and published immediately after merit rounds are confirmed.
          </p>
          <div className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5 text-xs text-left flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block">Status Notification</span>
              <span className="text-[10px] text-[#C4B5FD]/50">Once assigned, you will receive an automated WhatsApp and email notification with direct links.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Appointment details */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-tr from-[#13102A]/90 to-[#1D1740]/80 p-8 shadow-xl space-y-6">
              
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[10px] font-mono uppercase tracking-wider">
                  Slot Assigned
                </span>
                <span className="text-xs font-bold text-amber-400 capitalize flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {slot.status}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Seat counseling & Document Verification Interview</h3>
                <p className="text-xs text-[#C4B5FD]/70">
                  Please report promptly at the scheduled time. A counselor will verify original marksheets, academic eligibility certificates, and allocate seats.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5">
                  <span className="text-[10px] text-[#C4B5FD]/40 uppercase font-mono block">Scheduled Date</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {slot.counseling_sessions?.scheduled_date ? new Date(slot.counseling_sessions.scheduled_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5">
                  <span className="text-[10px] text-[#C4B5FD]/40 uppercase font-mono block">Slot Time Window</span>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {slot.slot_time ? new Date(slot.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Mode Specific box */}
              {slot.counseling_sessions?.mode === 'online' ? (
                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Video className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Online Video Interview</span>
                  </div>
                  <p className="text-[11px] text-[#C4B5FD]/80">
                    Your session is hosted via integrated video conferencing. Tapping the link below will direct you to the admissions counseling panel.
                  </p>
                  <a
                    href={slot.counseling_sessions.meeting_link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 py-2 px-5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs transition-all shadow-md shadow-[#6C2BD9]/20"
                  >
                    Join Video Conference <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <MapPin className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Offline Venue Location</span>
                  </div>
                  <p className="text-[11px] text-[#C4B5FD]/80">
                    Your session is scheduled offline. Please report with print documents at:
                  </p>
                  <div className="p-3 bg-[#0D0A1A]/50 border border-white/5 rounded-xl font-mono text-xs text-white">
                    🏢 {slot.counseling_sessions?.venue || 'Room 204, Academic Block A'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Checklist */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Interviewer Guidelines
              </h4>
              <ul className="text-[10px] text-[#C4B5FD]/70 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Keep physically verified marks copies (10th, 12th, Aadhar card).</li>
                <li>Ensure a quiet environment and working camera for online modes.</li>
                <li>Check-in is automatically registered by the officer at the venue.</li>
                {slot.notes && <li className="text-[#A78BFA] font-semibold">Notes: {slot.notes}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
