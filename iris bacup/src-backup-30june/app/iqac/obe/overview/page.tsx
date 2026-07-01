"use client";

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, ChevronRight, BarChart3, RefreshCw } from 'lucide-react';

interface ProgramStats {
  id: string;
  name: string;
  code: string;
  courses_count: number;
  average_attainment: number;
  target_met_percentage: number;
}

export default function IqacObeOverview() {
  const [stats, setStats] = useState<ProgramStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock stats
      setStats([
        { id: 'p-1', name: 'Bachelor of Technology (Computer Science)', code: 'BTECH-CSE', courses_count: 32, average_attainment: 74.2, target_met_percentage: 88 },
        { id: 'p-2', name: 'Bachelor of Technology (Electronics)', code: 'BTECH-ECE', courses_count: 28, average_attainment: 68.5, target_met_percentage: 75 },
        { id: 'p-3', name: 'Master of Business Administration', code: 'MBA', courses_count: 18, average_attainment: 81.0, target_met_percentage: 94 }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Curriculum Analytics Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Campus Outcomes-Based Education</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Audit institution-wide target indices across all departments, inspect program attainment ratios, and verify NBA curriculum reach parameters.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Compiling institutional attainments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(prog => (
            <div key={prog.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-full -z-10"></div>
              
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono text-[#A78BFA] px-2 py-0.5 rounded bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 font-bold">
                  {prog.code}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {prog.target_met_percentage}% Targets Met
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-white group-hover:text-[#A78BFA] transition-colors leading-snug">
                {prog.name}
              </h3>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 text-xs mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-[#C4B5FD]/45 uppercase font-bold">Courses</span>
                  <span className="font-bold text-white text-sm">{prog.courses_count} Active</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-[#C4B5FD]/45 uppercase font-bold">Avg Attainment</span>
                  <span className="font-bold text-white text-sm">{prog.average_attainment}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
