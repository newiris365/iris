"use client";

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';

interface CriteriaScore {
  name: string;
  score: number;
  max: number;
}

export default function AdminNaacDashboard() {
  const [cgpa, setCgpa] = useState(3.78);
  const [grade, setGrade] = useState('A++');
  const [scores, setScores] = useState<CriteriaScore[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/naac/score/estimate', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setCgpa(data.cgpa);
        setGrade(data.grade);
        setScores(data.criteria_scores);
      } else {
        setScores(getDefaultScores());
      }
    } catch (err) {
      console.error(err);
      setScores(getDefaultScores());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultScores = (): CriteriaScore[] => [
    { name: 'Curricular Aspects', score: 3.8, max: 4.0 },
    { name: 'Teaching-Learning & Evaluation', score: 3.75, max: 4.0 },
    { name: 'Research, Innovations & Extensions', score: 3.5, max: 4.0 },
    { name: 'Infrastructure & Learning Resources', score: 3.85, max: 4.0 },
    { name: 'Student Support & Progression', score: 3.9, max: 4.0 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Executive Quality Metrics</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Institutional Self-Assessment Ratios</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Review predicted NAAC grades and grade summary indices calculated from active evidence databases.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Compiling NAAC score projections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predicted Grade Widget */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col items-center justify-center gap-4 text-center">
            <h3 className="font-extrabold text-sm text-white w-full text-left border-b border-white/5 pb-3">Predicted Quality Grade</h3>
            
            <div className="flex flex-col items-center gap-1.5 my-3">
              <span className="text-6xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-md">
                {grade}
              </span>
              <span className="text-xs font-bold text-[#C4B5FD]/70">Estimated CGPA: {cgpa} / 4.00</span>
            </div>

            <div className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-[#C4B5FD] font-semibold leading-normal">
                Self-study metrics meet the parameters required for top accreditation rankings.
              </p>
            </div>
          </div>

          {/* Criteria Score List */}
          <div className="lg:col-span-2 glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-3">Criterion GPAs</h3>
            
            <div className="flex flex-col gap-4">
              {scores.map((cScore, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white leading-normal truncate max-w-[75%]">{cScore.name}</span>
                    <span className="font-bold text-[#A78BFA]">{cScore.score} / {cScore.max}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#1D163F] overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6]"
                      style={{ width: `${(cScore.score / cScore.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
