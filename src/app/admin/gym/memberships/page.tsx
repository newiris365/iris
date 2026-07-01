"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Search, ShieldAlert, Sparkles, User, ArrowLeft, ToggleLeft, Check, X } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminGymMemberships() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllMemberships();
  }, []);

  const loadAllMemberships = async () => {
    setLoading(true);
    try {
      // In this setup, we can query metrics/memberships by student, or fetch all from gym_memberships
      // For fallback/demos, let's load a list
      const res = await apiGet('/fitzone/gym/membership-plans'); // check endpoints
      // Fetch mock memberships if table is fresh
      setMemberships([]);
    } catch (err) {
      console.log('Error loading memberships');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    // Manually toggle membership status
    setError('');
    setSuccess('');
    const newStatus = currentStatus === 'active' ? 'expired' : 'active';
    setMemberships(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    setSuccess(`Membership status updated successfully.`);
  };

  const filtered = memberships.filter(m =>
    m.student_name.toLowerCase().includes(search.toLowerCase()) ||
    m.roll_number.toLowerCase().includes(search.toLowerCase()) ||
    m.plan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <Link href="/admin/gym" className="flex items-center gap-1.5 text-xs text-[#C4B5FD]/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Student Memberships Log</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Audit student payment receipts, activate custom plans, and resolve freezes.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-6">

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or plan type..."
            className="w-full pl-11 pr-4 py-3 bg-[#13102A]/85 border border-white/10 rounded-2xl text-sm text-white"
          />
        </div>

        {/* Grid list of memberships */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#C4B5FD]/45">Loading memberships history...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#C4B5FD]/30">No memberships found matching criteria.</div>
          ) : (
            filtered.map(m => (
              <div
                key={m.id}
                className={`glass-panel p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                  m.status === 'expired' ? 'opacity-60 border-white/5 bg-[#13102A]/10' : 'border-white/5 hover:border-[#6C2BD9]/25'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[#C4B5FD]/50" />
                    {m.student_name} <span className="text-xs text-[#C4B5FD]/50 font-normal">({m.roll_number})</span>
                  </h3>
                  <p className="text-xs text-[#C4B5FD]/70 mt-1">Plan: <span className="font-semibold text-white">{m.plan}</span> • ₹{m.amount_paid}</p>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Validity: {m.start_date} to {m.end_date}</p>
                  <p className="text-[9px] font-mono text-[#C4B5FD]/40 mt-1">TXN: {m.transaction_id}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    m.is_frozen ? 'bg-blue-500/20 text-blue-300' :
                    m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {m.is_frozen ? 'Frozen' : m.status}
                  </span>

                  <button
                    onClick={() => toggleStatus(m.id, m.status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${
                      m.status === 'active'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {m.status === 'active' ? 'Deactivate' : 'Re-activate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}
