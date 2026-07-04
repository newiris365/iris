"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, HelpCircle, Users, Percent, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function CompetitorBenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/director/competitor-benchmarks');
      if (res.success) {
        setBenchmarks(res.benchmarks || []);
        setSuggestions(res.suggestions || []);
      }
    } catch {
      // Sandbox fallback data
      setBenchmarks([
        { id: 'b1', metric: 'Attendance Rate', our_value: 82, industry_avg: 78.5, top_performer: 92, percentile: 74 },
        { id: 'b2', metric: 'Fee Collection Rate', our_value: 78, industry_avg: 72, top_performer: 95, percentile: 82 },
        { id: 'b3', metric: 'Module Adoption (Canteen)', our_value: 92, industry_avg: 80, top_performer: 98, percentile: 88 },
        { id: 'b4', metric: 'Module Adoption (FitZone)', our_value: 64, industry_avg: 50, top_performer: 85, percentile: 70 },
        { id: 'b5', metric: 'Module Adoption (Library+)', our_value: 72, industry_avg: 60, top_performer: 90, percentile: 75 },
        { id: 'b6', metric: 'Module Adoption (Transit)', our_value: 58, industry_avg: 65, top_performer: 88, percentile: 42 }
      ]);
      setSuggestions([
        { metric: 'Attendance Rate', suggestion: 'Introduce RFID bus scans to capture transit-linked attendance automatically.' },
        { metric: 'Fee Collection Rate', suggestion: 'Configure auto-whatsapp reminders 3 days prior to fee structures installments due date.' },
        { metric: 'Module Adoption (FitZone)', suggestion: 'Run virtual classes stream logs directly in student mobile feed to boost subscriptions.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/director" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Competitor Benchmarking</h1>
            <p className="text-sm text-[#C4B5FD]/70">Compare metric variables vs Rajasthan institutions averages and percentile placement</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Info Banner */}
        <div className="bg-[#13102A]/60 border border-[#8B5CF6]/20 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
          <AlertCircle className="w-5 h-5 text-[#A78BFA] shrink-0" />
          <p className="text-xs text-white/70">
            📊 **Network Analytics Privacy**: All benchmark data points are shared anonymously across the IRIS Rajasthan Institutional Network for academic optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Benchmarks metrics table */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#A78BFA]" /> Comparative Performance Matrix
            </h3>

            <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl min-h-[380px] overflow-x-auto">
              {loading ? (
                <p className="text-center text-xs text-white/30 py-24">Loading network averages...</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#C4B5FD]/60 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pr-2">Metric Type</th>
                      <th className="pb-3 text-center pr-2">Our Value</th>
                      <th className="pb-3 text-center pr-2">Rajasthan Avg</th>
                      <th className="pb-3 text-center pr-2">Top Performer</th>
                      <th className="pb-3 text-right">Percentile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarks.map(b => (
                      <tr key={b.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all">
                        <td className="py-4 font-bold text-white pr-2">{b.metric}</td>
                        <td className="py-4 text-center text-emerald-400 font-extrabold pr-2">{b.our_value}%</td>
                        <td className="py-4 text-center text-white/60 pr-2">{b.industry_avg}%</td>
                        <td className="py-4 text-center text-white/80 pr-2">{b.top_performer}%</td>
                        <td className="py-4 text-right pr-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${b.percentile >= 75 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : b.percentile >= 50 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}>
                            {b.percentile}th
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Suggestions and recommendations panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#A78BFA]" /> Best Practice Recommendations
            </h3>

            <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
              {loading ? (
                <p className="text-xs text-white/30 text-center py-6">Analyzing best performer schedules...</p>
              ) : suggestions.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-6">No suggestions generated.</p>
              ) : (
                suggestions.map((s, idx) => (
                  <div key={idx} className="bg-[#0D0A1A]/60 border border-white/5 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-[#A78BFA] font-bold uppercase tracking-wider">
                      <span>{s.metric} Action</span>
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-white/80 leading-relaxed">{s.suggestion}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
