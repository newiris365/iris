"use client";

import React, { useState, useEffect } from 'react';
import { Leaf, Award, Download, Users, TrendingUp, HelpCircle } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function StudentCarbonPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarbonData();
  }, []);

  const loadCarbonData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/transit/carbon/tracker');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Offline default fallback mock data structure
  const carbonData = data || {
    current_month_estimate: {
      month: '2026-06',
      students_using_bus: 14,
      co2_saved_kg: 245.50
    },
    footprints: [
      { id: 'f1', month: '2026-05', co2_saved_kg: 1355.20, students_using_bus: 134, certificate_url: '#' },
      { id: 'f2', month: '2026-04', co2_saved_kg: 1240.50, students_using_bus: 120, certificate_url: '#' }
    ],
    leaderboard: [
      { name: "Khushal Student", points: 450, co2_saved: 38.5 },
      { name: "Aditya Sharma", points: 420, co2_saved: 36.2 },
      { name: "Pooja Verma", points: 390, co2_saved: 34.0 },
      { name: "Rahul Singh", points: 350, co2_saved: 30.5 }
    ]
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Eco-Transit Carbon Tracker</h1>
              <p className="text-xs text-[#C4B5FD]/70">Track your carbon credits, green points, and campus sustainability progress</p>
            </div>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Column: Current Monthly Metrics & Reports */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Highlight Dashboard */}
              <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#132A1C] to-[#10221A] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                  Current Month Forecast ({carbonData.current_month_estimate.month})
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold tracking-wider">CO2 Saved on Campus</span>
                    <h2 className="text-4xl font-extrabold text-white mt-2 font-mono">
                      {carbonData.current_month_estimate.co2_saved_kg} <span className="text-lg font-normal text-emerald-400">kg</span>
                    </h2>
                    <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-relaxed">
                      Offset achieved by optimizing individual car travel into transit shuttle bus runs this month.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold tracking-wider">Active Bus Commuters</span>
                    <h2 className="text-4xl font-extrabold text-white mt-2 font-mono">
                      {carbonData.current_month_estimate.students_using_bus} <span className="text-lg font-normal text-[#A78BFA]">Students</span>
                    </h2>
                    <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-relaxed">
                      Active transit subscriptions that participate in reducing road congestion and fossil fuel footprints.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <TrendingUp className="w-4 h-4" /> <span>+14.2% CO2 offset from last month</span>
                  </div>
                </div>
              </div>

              {/* Institution Monthly Certificates */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#A78BFA]" />
                  <span>Campus Sustainability Certificates</span>
                </h3>
                <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed mb-4">
                  Monthly institutional verification documents certifying total carbon footprint offset achievements.
                </p>

                <div className="space-y-3">
                  {carbonData.footprints.map((fp: any) => (
                    <div key={fp.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">{fp.month} Report</h4>
                        <p className="text-[9px] text-[#C4B5FD]/50 mt-0.5">Saved {fp.co2_saved_kg} kg CO2 with {fp.students_using_bus} riders</p>
                      </div>
                      <a 
                        href={fp.certificate_url}
                        download
                        className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Student Green Points Leaderboard & Info */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Green Points widget */}
              <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#1A1538] to-[#13102A] p-6 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C2BD9]/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider">Your Eco points</span>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-white font-mono">450 <span className="text-xs text-[#A78BFA]">Credits</span></h2>
                  <p className="text-[10px] text-[#C4B5FD]/60 mt-1">
                    Keep taking the bus to accumulate credits! Redeemable for campus canteen vouchers.
                  </p>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Green Commuter Leaderboard</span>
                </h3>

                <div className="space-y-3">
                  {carbonData.leaderboard.map((lb: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{lb.name}</span>
                      </div>
                      <div className="text-right text-[10px] font-mono">
                        <span className="block font-bold text-emerald-400">+{lb.points} pts</span>
                        <span className="text-[#C4B5FD]/45 block text-[9px]">Saved {lb.co2_saved} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carbon credit formula brief */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/20 p-5 space-y-3">
                <h4 className="text-[10px] font-bold text-[#C4B5FD] uppercase tracking-widest flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Offset Calculation Method
                </h4>
                <p className="text-[9px] text-[#C4B5FD]/50 leading-relaxed">
                  Formula: <code>(Riders * Avg_Distance * 0.18kg_Car) - Bus_Fossil_Fuel</code>. We factor standard petrol single-commute parameters against shuttle engine metrics to derive authentic, verifiable offsets.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
