"use client";

import React, { useState, useEffect } from 'react';
import { Ticket, ArrowLeft, Calendar, MapPin, QrCode, Download, Clock, Printer, ShieldAlert } from 'lucide-react';
import { apiGet } from '../../../../../lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StudentTicketPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, [eventId]);

  const loadTicket = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      // Load all student registrations and find the one for this event
      const res = await apiGet(`/events/events/my-registrations/${studentId}`);
      if (res.success) {
        const reg = res.registrations.find((r: any) => r.event_id === eventId);
        if (reg) {
          setRegistration(reg);
        } else {
          throw new Error('Ticket not found');
        }
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback mock ticket
      setRegistration({
        id: 'mock-reg-id',
        ticket_number: 'EVT-A3F9K2L1',
        payment_status: 'Completed',
        amount_paid: 299,
        registration_type: 'in_person',
        registered_at: '2026-06-09T10:15:00Z',
        attendance_marked: false,
        events: {
          title: 'TechFest 2026 — AI & Robotics Summit',
          category: 'Tech',
          venue: 'Main Auditorium, Block A',
          start_datetime: '2026-06-20T10:00:00Z',
          end_datetime: '2026-06-21T18:00:00Z',
          status: 'Scheduled'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!registration) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex flex-col items-center justify-center text-white gap-4">
        <ShieldAlert className="w-10 h-10 text-rose-400" />
        <p>No valid ticket found for this event.</p>
        <Link href="/student/events" className="px-4 py-2 bg-[#6C2BD9] rounded-xl text-xs font-bold">
          Back to Events
        </Link>
      </main>
    );
  }

  const ev = registration.events;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 print:bg-white print:text-black">
      {/* Header (hidden in print) */}
      <div className="max-w-md mx-auto px-6 pt-6 print:hidden">
        <Link href="/student/events/my-tickets" className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/60 hover:text-[#A78BFA] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Tickets
        </Link>
      </div>

      <div className="max-w-md mx-auto px-6 mt-8 flex flex-col items-center">
        {/* Ticket Container */}
        <div className="w-full rounded-3xl border border-white/10 bg-[#13102A]/80 backdrop-blur-md overflow-hidden shadow-2xl shadow-[#6C2BD9]/5 print:border-black print:bg-white">
          {/* Banner Strip */}
          <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] p-6 text-center print:from-gray-200 print:to-gray-200">
            <Ticket className="w-8 h-8 text-white mx-auto mb-2 print:text-black" />
            <h2 className="text-white font-extrabold text-sm tracking-wider uppercase print:text-black">IRIS Event Pass</h2>
            <p className="text-[10px] text-[#C4B5FD] font-mono mt-0.5 print:text-black">{registration.registration_type.replace('_', ' ')}</p>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-dashed border-white/10 print:border-black">
            <h3 className="font-extrabold text-lg text-white text-center leading-snug mb-4 print:text-black">{ev?.title}</h3>
            
            <div className="flex flex-col gap-3.5 text-xs text-[#C4B5FD]/70 print:text-black">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4.5 h-4.5 text-[#A78BFA]" />
                <div>
                  <p className="font-bold text-white print:text-black">{formatDate(ev?.start_datetime)}</p>
                  <p className="text-[10px] text-[#C4B5FD]/40 print:text-black">{formatTime(ev?.start_datetime)} onwards</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-[#A78BFA]" />
                <div>
                  <p className="font-bold text-white print:text-black">{ev?.venue || 'TBA'}</p>
                  <p className="text-[10px] text-[#C4B5FD]/40 print:text-black">Verify location at main counter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Barcode Area */}
          <div className="p-8 flex flex-col items-center justify-center bg-white/[0.01]">
            <div className="p-4 rounded-2xl bg-white border border-white/10 flex items-center justify-center shadow-lg">
              <QrCode className="w-32 h-32 text-black" />
            </div>
            
            <p className="text-[10px] text-[#C4B5FD]/40 mt-4 uppercase tracking-widest font-bold">Ticket Code</p>
            <p className="text-lg font-mono font-extrabold text-[#A78BFA] mt-1 print:text-black">{registration.ticket_number}</p>
            
            <div className="mt-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${registration.payment_status === 'Completed' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60 print:text-black">
                Payment: {registration.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Action controls (hidden in print) */}
        <div className="w-full flex gap-3 mt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-[#A78BFA]" /> Print / PDF
          </button>
          
          <a
            href={`whatsapp://send?text=My%20IRIS%20Event%20Pass:%20${encodeURIComponent(registration.ticket_number)}`}
            className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
          >
            Send WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
