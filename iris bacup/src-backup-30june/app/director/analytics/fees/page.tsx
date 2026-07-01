"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { ArrowLeft, RefreshCw, DollarSign, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function FeeAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [monthlyCollection, setMonthlyCollection] = useState<any[]>([]);
  const [feeBreakdown, setFeeBreakdown] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    loadFeeData();
  }, []);

  const loadFeeData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/director/analytics/fees');
      if (res.success) {
        setMonthlyCollection(res.monthly_collection || []);
        setFeeBreakdown(res.fee_breakdown || []);
        setPaymentMethods(res.payment_methods || []);
        setForecast(res.forecast);
      }
    } catch {
      // Mock Fallbacks
      setMonthlyCollection([
        { month: 'Jan', collected: 4500000, target: 5000000 },
        { month: 'Feb', collected: 4800000, target: 5000000 },
        { month: 'Mar', collected: 5200000, target: 5000000 },
        { month: 'Apr', collected: 3900000, target: 5000000 },
        { month: 'May', collected: 4100000, target: 5000000 },
        { month: 'Jun', collected: 4900000, target: 5000000 }
      ]);
      setFeeBreakdown([
        { name: 'Tuition Fee', value: 70 },
        { name: 'Hostel Rent', value: 20 },
        { name: 'Transport Pass', value: 10 }
      ]);
      setPaymentMethods([
        { name: 'UPI', value: 55 },
        { name: 'Credit/Debit Card', value: 25 },
        { name: 'Netbanking', value: 15 },
        { name: 'Cash', value: 5 }
      ]);
      setForecast({
        month_end_projection: 5100000,
        confidence_interval: 'High'
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/director/analytics" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Fee Revenue Analytics</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Track month-wise collection progress, structural breakdowns, payment patterns, and month-end projections</p>
          </div>

          <button
            onClick={loadFeeData}
            className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* KPI Projection widget */}
        {forecast && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Month-End Projection</span>
                <h4 className="text-xl font-extrabold text-white mt-1">₹{forecast.month_end_projection.toLocaleString('en-IN')}</h4>
              </div>
            </div>

            <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Projection Accuracy</span>
                <h4 className="text-xl font-extrabold text-emerald-400 mt-1">{forecast.confidence_interval} Confidence</h4>
              </div>
            </div>

            <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Outstanding Receivables</span>
                <h4 className="text-xl font-extrabold text-amber-400 mt-1">₹12,45,000</h4>
              </div>
            </div>
          </div>
        )}

        {/* 1. VISUAL RECHART GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Monthly Revenue vs Target (Bar chart) */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monthly Collections Rate</h3>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCollection}>
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(255,255,255,0.1)' }} formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="collected" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Fee structure distribution (Pie) */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fee Structure Breakdown</h3>
            <div className="h-64 w-full flex items-center justify-center">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {feeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* 2. PAYMENT METHODS & DEFAULTER TABLES SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Defaulter Table */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Pending Receivables</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD]/50">
                    <th className="py-2.5 font-semibold">Student Name</th>
                    <th className="py-2.5 font-semibold">Category</th>
                    <th className="py-2.5 font-semibold">Outstanding Amount</th>
                    <th className="py-2.5 font-semibold">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.01]">
                    <td className="py-3 font-bold text-white">Khushal Gehlot</td>
                    <td className="py-3 text-[#C4B5FD]/70">Tuition Fees</td>
                    <td className="py-3 font-mono font-bold text-red-400">₹45,000</td>
                    <td className="py-3 text-white/50">28 Days</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="py-3 font-bold text-white">Amit Kumar Patel</td>
                    <td className="py-3 text-[#C4B5FD]/70">Hostel Rent</td>
                    <td className="py-3 font-mono font-bold text-red-400">₹6,500</td>
                    <td className="py-3 text-white/50">12 Days</td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="py-3 font-bold text-white">Priyesh Chawla</td>
                    <td className="py-3 text-[#C4B5FD]/70">Transport Pass</td>
                    <td className="py-3 font-mono font-bold text-red-400">₹2,800</td>
                    <td className="py-3 text-white/50">8 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Preferred Transaction Channels</h3>
            <div className="h-62 w-full flex items-center justify-center">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
