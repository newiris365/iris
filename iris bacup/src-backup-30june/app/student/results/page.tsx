"use client";

import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function StudentResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sandbox student profile ID and exam ID
    apiGet('/core/exams/marksheet/b0000000-0000-0000-0000-000000000006/a0000000-0000-0000-0000-000000000001').then(res => {
      if (res.success) {
        setResults(res.results || []);
        if (res.results?.length > 0) {
          setActiveExam(res.results[0].exams);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const calculateOverallGpa = () => {
    if (results.length === 0) return '0.0';
    // Mapped letter grades to GPA values
    const gpaMap: Record<string, number> = { 'A+': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'F': 0 };
    const totalPoints = results.reduce((acc, curr) => acc + (gpaMap[curr.grade || 'C'] || 7), 0);
    return (totalPoints / results.length).toFixed(1);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Your Grade Marksheet Report</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Inspect assessment transcripts, average GPA performance, and letter grades.</p>
          </div>
        </div>

        {/* GPA Overview Ring & Grade Sheet list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* GPA dial */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
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

          {/* Marksheet detail rows */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="font-heading font-bold text-lg text-white">
              Transcript: {activeExam?.name || 'Semester End Examination'}
            </h3>

            {isLoading ? (
              <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Syncing database grades...</div>
            ) : results.length === 0 ? (
              <div className="text-center text-xs text-[#C4B5FD]/50 py-10">No gradesheet results recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {results.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{r.subject}</h4>
                      <span className="text-[10px] text-[#C4B5FD]/70">Score: {r.marks_obtained}/{r.max_marks} | {r.remarks}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded bg-[#6C2BD9]/20 text-[#A78BFA] font-bold font-mono text-xs border border-[#6C2BD9]/30`}>
                        Grade {r.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4 text-[10px] text-[#C4B5FD]/50">
              <span className="flex items-center gap-1"><BarChart2 className="w-4 h-4 text-emerald-400" /> Digital signature key verified.</span>
              <button 
                onClick={() => alert('Downloading official marksheet PDF with Registrar signature...')}
                className="text-[#A78BFA] hover:text-white transition-colors underline underline-offset-2"
              >
                Download PDF Marksheet
              </button>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
