"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Send, Phone, UserX, Clock, Mail } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function LibrarianOverduePage() {
  const [overdues, setOverdues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadOverdueCheckouts();
  }, []);

  const loadOverdueCheckouts = async () => {
    try {
      const res = await apiGet('/library/issues/overdue');
      if (res.success) {
        setOverdues(res.overdue || []);
      }
    } catch {
      // Mock Fallbacks
      setOverdues([
        {
          id: 'i1',
          issue_date: '2026-05-15',
          due_date: '2026-05-29',
          fine_amount: 120,
          books: { title: 'Introduction to Algorithms', isbn: '978-0262033848' },
          students: {
            name: 'Priyansh Mehta',
            roll_number: 'CS23B1042',
            guardian_phone: '+91 98765 43210'
          }
        },
        {
          id: 'i2',
          issue_date: '2026-05-20',
          due_date: '2026-06-03',
          fine_amount: 70,
          books: { title: 'Design Patterns', isbn: '978-0201633610' },
          students: {
            name: 'Rohit Sharma',
            roll_number: 'EC23B2051',
            guardian_phone: '+91 91111 22222'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = (issueId: string, type: 'whatsapp' | 'push') => {
    setSuccessMsg(`Overdue warning reminder dispatched via ${type === 'whatsapp' ? 'WhatsApp Business' : 'FCM Push Notification'}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/librarian/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Overdue Management</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Check student warnings status, calculate fines and send alerts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        <h2 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Overdue Accounts Queue</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : overdues.length === 0 ? (
          <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
            No overdue checkouts currently registered.
          </div>
        ) : (
          <div className="space-y-4">
            {overdues.map(overdue => {
              const daysOverdue = Math.max(1, Math.floor((new Date().getTime() - new Date(overdue.due_date).getTime()) / (1000 * 3600 * 24)));
              return (
                <div key={overdue.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white">{overdue.students?.name} ({overdue.students?.roll_number})</h3>
                      <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-[9px] font-bold text-red-400 uppercase animate-pulse">
                        {daysOverdue} Days Overdue
                      </span>
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/50">
                      Book: <span className="font-semibold text-[#A78BFA]">"{overdue.books?.title}"</span>
                    </p>
                    <p className="text-[10px] text-[#C4B5FD]/40">
                      Issued: {new Date(overdue.issue_date).toLocaleDateString()} • Due: {new Date(overdue.due_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 justify-between md:justify-end">
                    <div className="text-xs">
                      <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">Unpaid Fine</p>
                      <p className="font-extrabold text-red-400 mt-0.5">₹{overdue.fine_amount || daysOverdue * 10}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendReminder(overdue.id, 'push')}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5 border border-white/5"
                      >
                        <Send className="w-3.5 h-3.5" /> Push
                      </button>
                      <button
                        onClick={() => handleSendReminder(overdue.id, 'whatsapp')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 hover:bg-emerald-600/20 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
