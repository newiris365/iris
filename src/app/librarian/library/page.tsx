"use client";

import React, { useState, useEffect } from 'react';
import { Book, ShieldAlert, Sparkles, BookOpen, Clock, AlertTriangle, Layers, UserCheck, FileSpreadsheet, PlusCircle } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function LibrarianDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const res = await apiGet('/library/analytics/overview');
      if (res.success) {
        setStats(res.stats);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock Stats
      setStats({
        total_books: 1240,
        active_borrowings: 84,
        overdue_borrowings: 12,
        pending_fines: 2350
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Librarian Desk Portal</h1>
              <p className="text-sm text-[#C4B5FD]/70">Administer catalogue entries, monitor return alerts, and manage group study bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Total Books</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5">{stats?.total_books}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Sourced in campus inventory</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Active Borrowings</p>
          <h2 className="text-3xl font-extrabold text-white mt-1.5">{stats?.active_borrowings}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Currently checked out copies</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Overdue Returns</p>
          <h2 className="text-3xl font-extrabold text-amber-400 mt-1.5">{stats?.overdue_borrowings} Overdue</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Require warning notifications</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Pending Fine Ledgers</p>
          <h2 className="text-3xl font-extrabold text-red-400 mt-1.5">₹{stats?.pending_fines}</h2>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Total unpaid late penalty fees</p>
        </div>
      </div>

      {/* Navigation Dashboard Links */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <h3 className="text-sm font-bold text-[#C4B5FD]/80 mb-6">Operations & Setup</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/librarian/library/issue" className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/20 transition-all flex flex-col justify-between h-48 group">
            <UserCheck className="w-8 h-8 text-[#A78BFA] group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-sm font-bold text-white">Issue / Return Desk</h4>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Scan book & student QR codes to process instant checkouts/returns.</p>
            </div>
          </Link>

          <Link href="/librarian/library/catalogue" className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/20 transition-all flex flex-col justify-between h-48 group">
            <PlusCircle className="w-8 h-8 text-[#A78BFA] group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-sm font-bold text-white">Catalogue & Book Manager</h4>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Add details, execute ISBN lookups, and configure shelf locations.</p>
            </div>
          </Link>

          <Link href="/librarian/library/ebooks" className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/20 transition-all flex flex-col justify-between h-48 group">
            <BookOpen className="w-8 h-8 text-[#A78BFA] group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-sm font-bold text-white">E-Resource Portal</h4>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Configure study materials, upload semester PDFs, and check download stats.</p>
            </div>
          </Link>

          <Link href="/librarian/library/overdue" className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/20 transition-all flex flex-col justify-between h-48 group">
            <AlertTriangle className="w-8 h-8 text-amber-400 group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-sm font-bold text-white">Overdue Management</h4>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">View overdue accounts and track student warning levels.</p>
            </div>
          </Link>

          <Link href="/librarian/library/reports" className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 hover:bg-[#1A1538] hover:border-[#6C2BD9]/20 transition-all flex flex-col justify-between h-48 group">
            <FileSpreadsheet className="w-8 h-8 text-[#A78BFA] group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="text-sm font-bold text-white">Reports & Exports</h4>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Audit sheet generation, study room utilization metrics, and exports.</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
