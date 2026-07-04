"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, IndianRupee, TrendingUp, AlertTriangle, CheckCircle, PieChart } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminAnalyticsPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [summary, setSummary] = useState({
    totalCollected: 0,
    outstanding: 0,
    penaltiesCollected: 0,
    collectionRate: '0%'
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const res = await apiGet('/hostel/fees');
      if (res.success && res.fees) {
        setFees(res.fees);
        calculateStats(res.fees);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock billing list
      const mockFees = [];
      setFees(mockFees);
      calculateStats(mockFees);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records: any[]) => {
    let collected = 0;
    let pending = 0;
    let penalties = 0;

    records.forEach(r => {
      if (r.payment_status === 'paid') {
        collected += r.amount;
        penalties += r.penalty || 0;
      } else {
        pending += r.amount + (r.penalty || 0);
      }
    });

    const totalBills = collected + pending;
    const rate = totalBills ? ((collected / totalBills) * 100).toFixed(1) + '%' : '0%';

    setSummary({
      totalCollected: collected,
      outstanding: pending,
      penaltiesCollected: penalties,
      collectionRate: rate
    });
  };

  const getMonthName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Financial & Revenue Analytics</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Monitor real-time cashflow, penalty yields, and collection deficits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Analytics Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
            <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Total Collection</p>
            <h2 className="text-3xl font-extrabold text-white mt-1.5 flex items-center gap-0.5">
              <IndianRupee className="w-6 h-6 text-[#A78BFA]" />
              <span>{summary.totalCollected.toLocaleString()}</span>
            </h2>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Cash captured in bank
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
            <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Outstanding Deficit</p>
            <h2 className="text-3xl font-extrabold text-red-400 mt-1.5 flex items-center gap-0.5">
              <IndianRupee className="w-6 h-6" />
              <span>{summary.outstanding.toLocaleString()}</span>
            </h2>
            <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Pending student clearance</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
            <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Fine Penalties Collected</p>
            <h2 className="text-3xl font-extrabold text-white mt-1.5 flex items-center gap-0.5">
              <IndianRupee className="w-6 h-6 text-[#A78BFA]" />
              <span>{summary.penaltiesCollected.toLocaleString()}</span>
            </h2>
            <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Out of date payouts
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-2xl" />
            <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Collection Capture Rate</p>
            <h2 className="text-3xl font-extrabold text-emerald-400 mt-1.5">{summary.collectionRate}</h2>
            <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Cleared vs issued rents</p>
          </div>
        </div>

        {/* CSS Flex-bar Chart visual block */}
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 mb-8 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#A78BFA]" /> Collection Efficiency Ratio
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between text-xs text-[#C4B5FD]/60">
              <span>Rents Collected (₹{summary.totalCollected.toLocaleString()})</span>
              <span>Pending Clearance (₹{summary.outstanding.toLocaleString()})</span>
            </div>

            {/* Simulated bar chart with HTML/CSS */}
            <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden flex">
              <div
                style={{ width: summary.collectionRate }}
                className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6]"
              />
              <div
                style={{ width: `calc(100% - ${summary.collectionRate})` }}
                className="h-full bg-red-500/30"
              />
            </div>
            
            <p className="text-[10px] text-[#C4B5FD]/40 leading-relaxed text-center">
              Target efficiency threshold is 95%. Automated late-fine cron job runs daily at 00:00 midnight to penalize defaulters.
            </p>
          </div>
        </div>

        {/* Ledger logs */}
        <h3 className="text-sm font-bold text-[#C4B5FD]/80 mb-4">Rent Invoice Ledger</h3>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 overflow-hidden shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">
                  <th className="p-4">Billing Month</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Base Rent</th>
                  <th className="p-4">Penalties</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-[#C4B5FD]/80">
                {fees.map((invoice, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{getMonthName(invoice.month)}</td>
                    <td className="p-4 font-medium">{invoice.students?.name || 'Institutional Host'}</td>
                    <td className="p-4 font-mono">₹{invoice.amount}</td>
                    <td className="p-4 text-amber-400 font-mono">
                      {invoice.penalty > 0 ? `+₹${invoice.penalty}` : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                        invoice.payment_status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {invoice.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
