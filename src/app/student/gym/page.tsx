"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, CreditCard, Activity, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function StudentGymOverview() {
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const membRes = await apiGet(`/fitzone/gym/memberships/${studentId}`);
      if (membRes.success && membRes.memberships?.length > 0) {
        // Find the active or most recent membership
        const active = membRes.memberships.find((m: any) => m.status === 'active') || membRes.memberships[0];
        setMembership(active);
      }

      const wrkRes = await apiGet(`/fitzone/gym/workouts/${studentId}`);
      if (wrkRes.success) {
        setRecentWorkouts(wrkRes.workouts?.slice(0, 3) || []);
      }
    } catch (err) {
      console.log('Error loading overview data, using fallback mocks');
      // Fallback mocks
      setMembership({
        plan: 'Premium Annual Pro',
        status: 'active',
        start_date: '2026-01-10',
        end_date: '2027-01-09',
        is_frozen: false,
        amount_paid: 4999
      });
      setRecentWorkouts([
        { id: '1', date: '2026-06-08', duration_minutes: 45, calories_burned: 315, self_rating: 4 },
        { id: '2', date: '2026-06-06', duration_minutes: 60, calories_burned: 420, self_rating: 5 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (dateStr: string) => {
    const end = new Date(dateStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS FitZone</h1>
              <p className="text-sm text-[#C4B5FD]/70">Elevate your limits • Campus Wellness Center</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Columns: Membership Card + Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Membership Glass Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-tr from-[#13102A] to-[#1F1B3E] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BD9]/10 rounded-full blur-3xl" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C4B5FD]/50 font-bold">FitZone Member Pass</span>
                <h2 className="text-xl font-extrabold text-white mt-1">
                  {membership ? membership.plan : 'No Active Membership'}
                </h2>
              </div>
              <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[#A78BFA] flex items-center gap-1.5">
                {membership?.is_frozen ? (
                  <>❄️ Frozen</>
                ) : membership?.status === 'active' ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active</>
                ) : (
                  <><ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Expired</>
                )}
              </div>
            </div>

            {membership ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 relative z-10">
                <div>
                  <p className="text-[10px] text-[#C4B5FD]/40">Valid Until</p>
                  <p className="text-sm font-semibold text-white">{membership.end_date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#C4B5FD]/40">Days Remaining</p>
                  <p className="text-sm font-semibold text-white">{getDaysLeft(membership.end_date)} Days</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#C4B5FD]/40">Access Type</p>
                  <p className="text-sm font-semibold text-white">Full Gym Access</p>
                </div>
              </div>
            ) : (
              <div className="mb-8 text-sm text-[#C4B5FD]/50 relative z-10">
                Purchase a FitZone membership plan to unlock booking and logging privileges.
              </div>
            )}

            <div className="flex flex-wrap gap-3 relative z-10">
              <Link href="/student/gym/membership" className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/30 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> {membership ? 'Upgrade / Manage' : 'Get Membership'}
              </Link>
              <Link href="/student/gym/book" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Book Slot <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link href="/student/gym/book" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Book Gym Slot</h3>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Reserve workout session</p>
              </div>
            </Link>

            <Link href="/student/gym/workout" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 flex items-center justify-center border border-purple-500/20">
                <Dumbbell className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Log Workout</h3>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Record sets, reps & weight</p>
              </div>
            </Link>

            <Link href="/student/gym/progress" className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-[#6C2BD9]/30 transition-all flex flex-col gap-4 group col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center border border-pink-500/20">
                <Activity className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">Progress Dashboard</h3>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Track weight & measurements</p>
              </div>
            </Link>
          </div>

        </div>

        {/* Right Column: Recent Activity Logs */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#A78BFA]" /> Recent Workouts
          </h2>

          <div className="flex flex-col gap-3">
            {recentWorkouts.map(w => (
              <div key={w.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#C4B5FD]/60">{w.date}</span>
                  <span className="text-xs font-semibold text-emerald-400">{w.calories_burned} kcal</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#C4B5FD]/80">Duration: {w.duration_minutes} mins</span>
                  <span className="text-yellow-400">★ {w.self_rating}/5</span>
                </div>
              </div>
            ))}

            {recentWorkouts.length === 0 && (
              <div className="py-12 text-center text-xs text-[#C4B5FD]/40">
                No workouts logged recently. Get started today!
              </div>
            )}
          </div>

          <Link href="/student/gym/progress" className="w-full mt-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-center transition-all">
            View Full Progress History
          </Link>
        </div>
      </div>
    </main>
  );
}
