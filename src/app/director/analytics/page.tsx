"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, BookOpen, Train, ShieldAlert, ArrowLeft, 
  ArrowRight, ShieldCheck, ChevronRight, BarChart2, Activity 
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AnalyticsHubPage() {
  const [metrics, setMetrics] = useState({
    attendance_rate: 82,
    hostel_occupancy: 84,
    gym_slot_bookings: 62,
    books_issued_daily: 45,
    study_room_booking_rate: 76,
    canteen_revenue: 125000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsSummary();
  }, []);

  const loadAnalyticsSummary = async () => {
    try {
      const res = await apiGet('/director/analytics/utilization');
      if (res.success) {
        setMetrics(prev => ({
          ...prev,
          ...res.utilization
        }));
      }
    } catch {}
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/director" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Analytics Deep Dive Hub</h1>
            <p className="text-sm text-[#C4B5FD]/70">Track performance trends, module usage adoption rate, and utilization details</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Analytics Drilldown cards link grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Users className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-lg font-bold text-white">Attendance Deep Dive</h2>
              <p className="text-xs text-[#C4B5FD]/70 max-w-sm">Review overall attendance percentages, department rankings, daily heatmaps, and low attendance defaulters logs.</p>
              <Link href="/director/analytics/attendance" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1.5 pt-2">
                Open Attendance Console <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <DollarSign className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-lg font-bold text-white">Fees Revenue Charts</h2>
              <p className="text-xs text-[#C4B5FD]/70 max-w-sm">Inspect financial collections rate targets, fee structured breakdowns (tuition vs hostels vs transit), and method allocations.</p>
              <Link href="/director/analytics/fees" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1.5 pt-2">
                Open Finance Console <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Utilization Cards Row */}
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <BarChart2 className="w-4.5 h-4.5 text-[#A78BFA]" /> Campus Utilization Diagnostics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Hostel Occupancy</span>
              <span className="text-xs font-bold text-[#A78BFA]">{metrics.hostel_occupancy}% Allotted</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] h-full" style={{ width: `${metrics.hostel_occupancy}%` }} />
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Gym Slots Bookings</span>
              <span className="text-xs font-bold text-[#A78BFA]">{metrics.gym_slot_bookings}% utilized</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] h-full" style={{ width: `${metrics.gym_slot_bookings}%` }} />
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Study Rooms Rate</span>
              <span className="text-xs font-bold text-[#A78BFA]">{metrics.study_room_booking_rate}% booking</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] h-full" style={{ width: `${metrics.study_room_booking_rate}%` }} />
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/60">Library Circulation</span>
              <span className="text-xs font-bold text-[#A78BFA]">{metrics.books_issued_daily} issues/day</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] h-full" style={{ width: '60%' }} />
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
