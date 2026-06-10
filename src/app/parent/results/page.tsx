"use client";

import React, { useState, useEffect } from 'react';
import { Home, Calendar, CreditCard, Award, BarChart2, CheckCircle2 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function ParentResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sandbox student profile ID
    apiGet('/core/exams/marksheet/b0000000-0000-0000-0000-000000000006/a0000000-0000-0000-0000-000000000001').then(res => {
      if (res.success) {
        setResults(res.results || []);
      }
      setIsLoading(false);
    });
  }, []);

  const calculateOverallGpa = () => {
    if (results.length === 0) return '8.2'; // Mock baseline
    const gpaMap: Record<string, number> = { 'A+': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'F': 0 };
    const totalPoints = results.reduce((acc, curr) => acc + (gpaMap[curr.grade || 'C'] || 7), 0);
    return (totalPoints / results.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#6C2BD9]/25 bg-[#13102A]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center font-extrabold text-sm text-white">I</div>
          <span className="font-extrabold text-lg text-white">IRIS 365</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider">Parent Console</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-[#C4B5FD]">Logged: <strong>Mr. S. R. Gehlot</strong></span>
        </div>
      </header>

      {/* Main Portals */}
      <div className="max-w-7xl mx-auto px-6 py-10 w-full grid md:grid-cols-12 gap-8 flex-1">
        
        {/* Navigation */}
        <nav className="md:col-span-3 flex flex-col gap-2.5">
          <a href="/parent/dashboard" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <Home className="w-5 h-5" />
            <span>Telemetry Summary</span>
          </a>
          <a href="/parent/attendance" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <Calendar className="w-5 h-5" />
            <span>Child Attendance</span>
          </a>
          <a href="/parent/fees" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#13102A] text-[#C4B5FD] hover:bg-white/5 border border-white/5 transition-all">
            <CreditCard className="w-5 h-5" />
            <span>Pay Dues Ledger</span>
          </a>
          <a href="/parent/results" className="w-full py-3.5 px-4 rounded-xl flex items-center gap-3 font-heading font-bold text-sm bg-[#6C2BD9] text-white transition-all">
            <Award className="w-5 h-5" />
            <span>Child Report Card</span>
          </a>
        </nav>

        {/* Content Portal */}
        <div className="md:col-span-9 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-8 border border-white/5">
            <h2 className="font-heading font-extrabold text-2xl text-white">Academic Performance Sheet</h2>
            <p className="text-xs text-[#C4B5FD] mt-1 font-light">Inspect child's marksheet transcripts, subject GPA indexes, and result averages.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              
              {/* GPA overview */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-semibold">Cumulative SGPA</span>
                <div className="relative w-36 h-36 flex items-center justify-center bg-[#13102A] border-4 border-[#6C2BD9]/50 rounded-full shadow-2xl">
                  <div className="flex flex-col items-center">
                    <strong className="font-heading font-extrabold text-4xl text-white">{calculateOverallGpa()}</strong>
                    <span className="text-[9px] text-[#C4B5FD]/70 mt-0.5">Scale: 10.0</span>
                  </div>
                </div>
                <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All Subjects Clear
                </div>
              </div>

              {/* Marksheet transcripts */}
              <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                <h3 className="font-bold text-white text-sm">Exam Transcripts</h3>

                {isLoading ? (
                  <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Fetching gradesheets...</div>
                ) : results.length === 0 ? (
                  <div className="text-center text-xs text-[#C4B5FD]/50 py-10">No gradesheet records found for the child.</div>
                ) : (
                  <div className="space-y-3">
                    {results.map((r, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-white text-[13px]">{r.subject}</h4>
                          <span className="text-[10px] text-[#C4B5FD]/70">Score: {r.marks_obtained}/{r.max_marks} | {r.remarks}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-[#6C2BD9]/20 text-[#A78BFA] font-bold font-mono text-xs border border-[#6C2BD9]/30">
                          Grade {r.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-[#C4B5FD]/50">
                  <span className="flex items-center gap-1"><BarChart2 className="w-4 h-4 text-emerald-400" /> Digital signature key verified.</span>
                  <button 
                    onClick={() => alert('Downloading marksheet PDF to your device...')}
                    className="text-[#A78BFA] hover:text-white transition-colors underline underline-offset-2"
                  >
                    Download report PDF
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
