"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Sparkles, Send, ShieldAlert, CheckSquare, Plus, RefreshCw } from 'lucide-react';

interface Recommendation {
  po: string;
  gap_percentage: string;
  interventions: string[];
}

interface InterventionPlan {
  id: string;
  po_code: string;
  action_plan: string;
  target_semester: string;
  status: 'pending' | 'implemented';
}

export default function HodGapAnalysis() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [plans, setPlans] = useState<InterventionPlan[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Custom Intervention inputs
  const [poCode, setPoCode] = useState('PO3');
  const [actionPlan, setActionPlan] = useState('');
  const [targetSem, setTargetSem] = useState('Semester 5');
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    // Initial mock logged intervention plans
    setPlans([
      { id: 'p-1', po_code: 'PO3', action_plan: 'Organize design-thinking bootcamps on Next.js backend interfaces.', target_semester: 'Semester 5', status: 'pending' },
      { id: 'p-2', po_code: 'PO7', action_plan: 'Assign energy auditing coding tasks in database sharding classes.', target_semester: 'Semester 6', status: 'implemented' }
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/obe/ai/gap-analysis', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ po_data: {} })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setRecommendations([
        {
          po: 'PO3 (Design/Development)',
          gap_percentage: '8%',
          interventions: [
            'Introduce dedicated cloud database orchestration seminars.',
            'Formulate grading incentives for production-grade projects.',
            'Schedule industrial design-thinking bootcamps.'
          ]
        },
        {
          po: 'PO7 (Sustainability)',
          gap_percentage: '2%',
          interventions: [
            'Conduct green computing server optimization contests.',
            'Analyze energy footprints of large index structures.',
            'Assign research audits on resource consumption profiles.'
          ]
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPlan.trim()) return;
    setSaving(true);
    try {
      const newPlan: InterventionPlan = {
        id: `p-${Date.now()}`,
        po_code: poCode,
        action_plan: actionPlan,
        target_semester: targetSem,
        status: 'pending'
      };
      setPlans(prev => [newPlan, ...prev]);
      setActionPlan('');
      alert('Intervention program logged successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'pending' ? 'implemented' : 'pending' } : p));
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link href="/hod/obe/programs" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Courses Overview
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Curriculum Audit Advisor</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">OBE Gap Analysis</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Audit unmapped program targets, evaluate curriculum deficits, and utilize Claude AI to formulate remediation activities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: AI Gap Suggester */}
        <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <span>Claude Advisor Recommendations</span>
            </h3>
          </div>

          <p className="text-xs text-[#C4B5FD]/75 leading-relaxed">
            Trigger the AI engine to cross-reference mapped course attainments with criteria goals to design remedial projects.
          </p>

          <button
            onClick={triggerAiAnalysis}
            disabled={aiLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Performing Analysis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run AI Gap Diagnostics
              </>
            )}
          </button>

          {recommendations.length > 0 && (
            <div className="flex flex-col gap-4 mt-4 max-h-[300px] overflow-y-auto pr-1">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-[#6C2BD9]/20 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#A78BFA]">{rec.po}</span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                      -{rec.gap_percentage} Deficit
                    </span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-[#C4B5FD]/80 leading-normal">
                    {rec.interventions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Columns: Custom Intervention plans and log */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Custom plan form */}
          <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-6 bg-[#13102A]/20">
            <h3 className="font-extrabold text-sm text-white mb-4">Log Intervention Plan</h3>
            <form onSubmit={handleAddPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Target PO *</label>
                <select
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={poCode}
                  onChange={e => setPoCode(e.target.value)}
                >
                  <option value="PO3">PO3 (Design/Development)</option>
                  <option value="PO7">PO7 (Sustainability)</option>
                  <option value="PO12">PO12 (Life-long Learning)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Target Class *</label>
                <select
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={targetSem}
                  onChange={e => setTargetSem(e.target.value)}
                >
                  <option value="Semester 4">Semester 4 (CS-401)</option>
                  <option value="Semester 5">Semester 5 (CS-502)</option>
                  <option value="Semester 6">Semester 6 (CS-608)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-3">
                <label className="text-[#C4B5FD]/70 font-semibold">Intervention Strategy Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Set up a special hands-on lab workshop to practice edge caching architecture templates."
                  className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={actionPlan}
                  onChange={e => setActionPlan(e.target.value)}
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all"
                >
                  Add Intervention Plan
                </button>
              </div>
            </form>
          </div>

          {/* Intervention Logs list */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white">Active Intervention Registers</h3>
            
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
              {plans.map(p => (
                <div key={p.id} className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5 max-w-[75%]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#A78BFA] font-mono uppercase bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded">
                        {p.po_code} Action
                      </span>
                      <span className="text-[9px] text-[#C4B5FD]/50 font-bold">{p.target_semester}</span>
                    </div>
                    <p className="text-xs text-white leading-normal font-medium">{p.action_plan}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleStatus(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all flex-shrink-0 ${
                      p.status === 'implemented'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {p.status === 'implemented' ? 'Implemented' : 'Pending'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
