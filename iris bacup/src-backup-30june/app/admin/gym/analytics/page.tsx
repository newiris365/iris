"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ArrowLeft, BarChart2, Calendar, TrendingUp } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from '../../../../lib/charts';
import Link from 'next/link';

export default function AdminGymAnalytics() {
  const [loading, setLoading] = useState(true);

  const slotFillData = [
    { name: '06:00 AM', fillRate: 40, bookings: 12 },
    { name: '08:00 AM', fillRate: 100, bookings: 25 },
    { name: '10:00 AM', fillRate: 25, bookings: 6 },
    { name: '05:00 PM', fillRate: 95, bookings: 38 },
    { name: '07:00 PM', fillRate: 80, bookings: 28 },
    { name: '09:00 PM', fillRate: 15, bookings: 5 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 15000 },
    { month: 'Feb', revenue: 18500 },
    { month: 'Mar', revenue: 22000 },
    { month: 'Apr', revenue: 31000 },
    { month: 'May', revenue: 38500 },
    { month: 'Jun', revenue: 42500 }
  ];

  useEffect(() => {
    // Simulating loading state
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

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
            <BarChart2 className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Utilization Reports & Analytics</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Explore slot reservation frequencies, revenue indices, and peak attendance patterns.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">

        {loading ? (
          <div className="py-20 text-center text-xs text-[#C4B5FD]/45">Loading analytics models...</div>
        ) : (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Slot fill rate bar chart */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40">
                <h3 className="text-sm font-bold text-white mb-6">Slot Booking Fill Rates (%)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={slotFillData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#C4B5FD" style={{ fontSize: 10 }} />
                      <YAxis stroke="#C4B5FD" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Legend />
                      <Bar dataKey="fillRate" fill="#6C2BD9" radius={[4, 4, 0, 0]} name="Fill Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Revenue area chart */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40">
                <h3 className="text-sm font-bold text-white mb-6">Monthly Revenue Trend (INR)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#C4B5FD" style={{ fontSize: 10 }} />
                      <YAxis stroke="#C4B5FD" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" fill="rgba(139, 92, 246, 0.2)" strokeWidth={3} name="Revenue (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Student No-show list log */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/20">
              <h3 className="text-sm font-bold text-white mb-4">Student Attendance & No-Show Index</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#C4B5FD]/50">
                      <th className="py-3 px-2">Student Name</th>
                      <th className="py-3 px-2">Roll Number</th>
                      <th className="py-3 px-2">Total Bookings</th>
                      <th className="py-3 px-2">Checked In</th>
                      <th className="py-3 px-2">No Show Count</th>
                      <th className="py-3 px-2">Warning Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Karan Malhotra', roll: 'CS22B018', total: 14, checkin: 11, noShow: 3, warn: 'Suspended (7 Days)' },
                      { name: 'Sneha Roy', roll: 'EC23B045', total: 8, checkin: 7, noShow: 1, warn: 'Active' },
                      { name: 'Rohan Deshmukh', roll: 'ME21B009', total: 22, checkin: 22, noShow: 0, warn: 'Active' }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/5 text-white/80 hover:bg-white/5">
                        <td className="py-3 px-2 font-semibold">{row.name}</td>
                        <td className="py-3 px-2">{row.roll}</td>
                        <td className="py-3 px-2">{row.total}</td>
                        <td className="py-3 px-2">{row.checkin}</td>
                        <td className="py-3 px-2 text-red-400 font-bold">{row.noShow}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.warn.includes('Suspended') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {row.warn}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
