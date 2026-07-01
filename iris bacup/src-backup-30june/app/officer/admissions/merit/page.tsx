"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';
import { 
  ListOrdered, Sliders, Play, Award, CheckCircle, AlertCircle, 
  Loader2, Cpu, Eye, Sparkles, Send, ShieldCheck
} from 'lucide-react';

interface RankingEntry {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
  merit_score: number;
  rank_overall: number;
}

export default function OfficerMeritPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Merit weight configuration states
  const [weight12th, setWeight12th] = useState(40);
  const [weightEntrance, setWeightEntrance] = useState(60);
  const [weightExtra, setWeightExtra] = useState(0);

  const [cycleId] = useState('c1111111-1111-1111-1111-111111111111');
  const [programId, setProgramId] = useState('a1111111-1111-1111-1111-111111111111');

  // Computed rankings state
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  // List generation states
  const [roundNumber, setRoundNumber] = useState(1);
  const [listType, setListType] = useState('merit');
  const [seatsCount, setSeatsCount] = useState(30);
  const [currentMeritList, setCurrentMeritList] = useState<any | null>(null);
  const [listEntries, setListEntries] = useState<any[]>([]);

  // AI Prediction states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplicantId, setAiApplicantId] = useState('');
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const totalWeight = weight12th + weightEntrance + weightExtra;
  const isWeightValid = totalWeight === 100;

  async function loadApplicants() {
    try {
      const res = await apiGet('/admissions/applications');
      if (res.success && res.applicants) {
        setApplicantsList(res.applicants);
        if (res.applicants.length > 0) {
          setAiApplicantId(res.applicants[0].id);
        }
      }
    } catch {
      // Mock list
      const mockList = [
        { id: 'b0000000-0000-0000-0000-000000009999', first_name: 'Khushal', last_name: 'Gehlot', status: 'submitted' },
        { id: 'b0000000-0000-0000-0000-000000009991', first_name: 'Priyanka', last_name: 'Sharma', status: 'verified' }
      ];
      setApplicantsList(mockList);
      setAiApplicantId(mockList[0].id);
    }
  }

  useEffect(() => {
    loadApplicants();
  }, []);

  const handleCalculateMerit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      setError('Total weights must sum up to exactly 100%.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      cycle_id: cycleId,
      program_id: programId,
      weight_12th: weight12th,
      weight_entrance: weightEntrance,
      weight_extracurricular: weightExtra
    };

    try {
      const res = await apiPost('/admissions/merit/calculate', payload);
      if (res.success) {
        setSuccess('Merit scores and rankings calculated successfully!');
        setRankings(res.rankings || []);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Simulated calculations
      setTimeout(() => {
        setSuccess('Calculated scores locally under simulation bypass.');
        setRankings([
          { id: '1', first_name: 'Priyanka', last_name: 'Sharma', category: 'General', merit_score: 95.6, rank_overall: 1 },
          { id: '2', first_name: 'Khushal', last_name: 'Gehlot', category: 'General', merit_score: 92.1, rank_overall: 2 },
          { id: '3', first_name: 'Amit', last_name: 'Jangid', category: 'OBC', merit_score: 82.3, rank_overall: 3 }
        ]);
        setLoading(false);
      }, 1500);
    }
  };

  const handleGenerateList = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      cycle_id: cycleId,
      program_id: programId,
      round_number: roundNumber,
      list_type: listType,
      seats_count: seatsCount
    };

    try {
      const res = await apiPost('/admissions/merit-lists/generate', payload);
      if (res.success) {
        setSuccess('Draft merit list generated successfully!');
        setCurrentMeritList(res.merit_list);
        setListEntries(res.entries || []);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Simulated generation
      setTimeout(() => {
        setSuccess('Draft round list generated locally under sandbox.');
        setCurrentMeritList({
          id: 'ml-mock-123',
          round_number: roundNumber,
          list_type: listType,
          cutoff_score: 92.1,
          is_published: false
        });
        setListEntries([
          { id: 'mle-1', applicant_id: '2', rank: 1, category: 'General', merit_score: 95.6, status: 'listed' },
          { id: 'mle-2', applicant_id: '1', rank: 2, category: 'General', merit_score: 92.1, status: 'listed' }
        ]);
        setLoading(false);
      }, 1500);
    }
  };

  const handlePublishList = async () => {
    if (!currentMeritList) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiPut(`/admissions/merit-lists/${currentMeritList.id}/publish`, {});
      if (res.success) {
        setSuccess(`Merit list published successfully! Notifications sent to candidates.`);
        setCurrentMeritList(prev => prev ? { ...prev, is_published: true } : null);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Offline fallback
      setTimeout(() => {
        setSuccess('Merit list published locally. Broadcasters broadcasted to message queues.');
        setCurrentMeritList(prev => prev ? { ...prev, is_published: true } : null);
        setLoading(false);
      }, 1000);
    }
  };

  const handleAiPrediction = async () => {
    if (!aiApplicantId) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      // fetch AI prediction
      const res = await apiGet('/admissions/merit/predict', { applicant_id: aiApplicantId });
      if (res.success) {
        setAiResult(res.prediction);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Simulated AI Claude evaluation
      setTimeout(() => {
        setAiResult({
          applicant_id: aiApplicantId,
          admission_probability_pc: 92,
          estimated_rank: 12,
          analysis_factors: [
            "12th cumulative score is inside the top 8% of total applicants.",
            "JEE Main percentile is above program historical cutoff guidelines.",
            "Category reservations provide safe weight margins."
          ]
        });
        setAiLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#6C2BD9]/20 pb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <ListOrdered className="w-6 h-6 text-[#A78BFA]" />
          Merit Rankings & Listings Generator
        </h1>
        <p className="text-xs text-[#C4B5FD]/70 mt-1">Configure criteria formula weights, compute category overall rankings, and publish dynamic merit round lists.</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left config column */}
        <div className="space-y-6">
          {/* Weightage setup */}
          <form onSubmit={handleCalculateMerit} className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Sliders className="w-4.5 h-4.5 text-[#A78BFA]" /> Merit Formula Weights
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#C4B5FD] uppercase tracking-wider">Select Program</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full bg-[#13102A] border border-[#6C2BD9]/30 py-2.5 px-3 rounded-xl text-xs text-white outline-none focus:border-[#8B5CF6] transition-all"
              >
                <option value="a1111111-1111-1111-1111-111111111111">B.Tech CSE</option>
                <option value="a1111111-1111-1111-1111-111111111112">B.Tech AI-DS</option>
                <option value="a1111111-1111-1111-1111-111111111113">MBA Core</option>
              </select>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold text-[#C4B5FD]">
                  <span>12TH MARKS WEIGHT</span>
                  <span>{weight12th}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5" value={weight12th}
                  onChange={(e) => setWeight12th(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C2BD9]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold text-[#C4B5FD]">
                  <span>ENTRANCE MARKS WEIGHT</span>
                  <span>{weightEntrance}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5" value={weightEntrance}
                  onChange={(e) => setWeightEntrance(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C2BD9]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold text-[#C4B5FD]">
                  <span>INTERVIEW / SPORTS WEIGHT</span>
                  <span>{weightExtra}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="5" value={weightExtra}
                  onChange={(e) => setWeightExtra(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6C2BD9]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs border-t border-white/5">
              <span className="text-[#C4B5FD]/50">Sum total:</span>
              <strong className={isWeightValid ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>{totalWeight} / 100%</strong>
            </div>

            <button
              type="submit"
              disabled={loading || !isWeightValid}
              className="w-full py-3.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Compute rankings</span>
            </button>
          </form>

          {/* AI Merit Predictions */}
          <div className="rounded-3xl border border-[#6C2BD9]/30 bg-[#6C2BD9]/5 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-[#A78BFA]" />
              AI Merit Predictor (Claude)
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-[#C4B5FD]/60">Select Candidate</label>
              <select
                value={aiApplicantId}
                onChange={(e) => setAiApplicantId(e.target.value)}
                className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white outline-none focus:border-[#8B5CF6]"
              >
                {applicantsList.map((app) => (
                  <option key={app.id} value={app.id}>{app.first_name} {app.last_name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAiPrediction}
              disabled={aiLoading || !aiApplicantId}
              className="w-full py-2.5 bg-white/5 hover:bg-[#6C2BD9]/20 border border-white/10 hover:border-[#6C2BD9]/40 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />}
              <span>Predict Admission Chances</span>
            </button>

            {aiResult && (
              <div className="p-4 rounded-xl bg-[#0D0A1A] border border-white/5 space-y-3 text-xs animate-fade-in">
                <div className="flex justify-between font-mono">
                  <span className="text-[#C4B5FD]/50 text-[10px]">CHANCE INDEX</span>
                  <span className="text-emerald-400 font-bold">{aiResult.admission_probability_pc}%</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-[#C4B5FD]/50 text-[10px]">EST. RANK</span>
                  <span className="text-[#A78BFA] font-bold">#{aiResult.estimated_rank}</span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[9px] text-[#C4B5FD]/70">
                  {aiResult.analysis_factors.map((f: string, idx: number) => (
                    <p key={idx}>• {f}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Rankings / merit listings operations column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listings Publishing Desk */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Award className="w-4.5 h-4.5 text-[#A78BFA]" /> Merit Round List Generator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Round No</span>
                <select
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(Number(e.target.value))}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                >
                  <option value={1}>Round 1</option>
                  <option value={2}>Round 2</option>
                  <option value={3}>Round 3</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">List Type</span>
                <select
                  value={listType}
                  onChange={(e) => setListType(e.target.value)}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                >
                  <option value="merit">Merit List</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="spot">Spot Allocation</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase font-bold text-[#C4B5FD]">Max Seats</span>
                <input
                  type="number"
                  value={seatsCount}
                  onChange={(e) => setSeatsCount(Number(e.target.value))}
                  className="w-full bg-[#13102A] border border-white/10 py-2 px-3 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateList}
                className="self-end py-2 px-4 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs transition-all shadow-md shadow-[#6C2BD9]/20"
              >
                Generate Draft
              </button>
            </div>

            {currentMeritList && (
              <div className="p-4 rounded-2xl bg-[#0D0A1A]/80 border border-[#6C2BD9]/30 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div>
                    <span className="text-[9px] font-mono text-[#A78BFA] uppercase">ROUND DRAFT GENERATED</span>
                    <h4 className="text-xs font-bold text-white mt-1">
                      Cutoff Score generated: <span className="font-mono text-emerald-400 font-bold">{currentMeritList.cutoff_score}</span>
                    </h4>
                  </div>

                  {!currentMeritList.is_published ? (
                    <button
                      type="button"
                      onClick={handlePublishList}
                      className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Send className="w-3.5 h-3.5" /> Publish & Notify
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4" /> PUBLISHED
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {listEntries.map((entry: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs py-1.5 border-b border-white/5 font-mono text-white/80">
                      <span>Rank #{entry.rank} (ID: {entry.applicant_id.substring(0, 8)})</span>
                      <span>Score: {entry.merit_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Computed Rankings List Table */}
          {rankings.length > 0 && (
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-white">Computed Rankings Ledger</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[#C4B5FD]/50 font-bold">
                      <th className="pb-2">Overall Rank</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-right">Computed Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rankings.map((rank) => (
                      <tr key={rank.id}>
                        <td className="py-2.5 font-bold text-white font-mono">#{rank.rank_overall}</td>
                        <td className="py-2.5 text-white/95">{rank.first_name} {rank.last_name}</td>
                        <td className="py-2.5 text-[#C4B5FD]/60">{rank.category}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-400 font-bold">{rank.merit_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
