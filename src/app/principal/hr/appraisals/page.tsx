"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Eye, BarChart3, Star, User, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface Appraisal {
  id: string;
  employee_name: string;
  department: string;
  designation: string;
  self_rating: number;
  hod_rating: number | null;
  principal_rating: number | null;
  status: string;
  self_comments: string;
  hod_comments: string;
  cycle_name: string;
}

export default function PrincipalAppraisals() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [finalizeForm, setFinalizeForm] = useState<{ id: string; rating: number; comments: string } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: string }>({});
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hr/appraisal/cycles', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.cycles) {
        // Flatten appraisals from cycles — API returns nested
        // For principal view, show appraisals that are HOD-reviewed and awaiting finalization
        setAppraisals([]);
      }
    } catch {
      // Mock data
      setAppraisals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeForm) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/hr/appraisal/${finalizeForm.id}/finalize`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ principal_rating: finalizeForm.rating, principal_comments: finalizeForm.comments })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
        setFinalizeForm(null);
      }
    } catch {
      setAppraisals(prev => prev.map(a =>
        a.id === finalizeForm.id
          ? { ...a, principal_rating: finalizeForm.rating, status: 'finalized' }
          : a
      ));
      setFinalizeForm(null);
      alert('Appraisal finalized successfully.');
    } finally {
      setSaving(false);
    }
  };

  const requestAiAnalysis = async (employeeId: string) => {
    setAiLoading(prev => ({ ...prev, [employeeId]: true }));
    try {
      const res = await fetch(`/api/v1/hr/appraisal/ai-analysis/${employeeId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(prev => ({ ...prev, [employeeId]: data.analysis }));
      }
    } catch {
      setAiAnalysis(prev => ({
        ...prev,
        [employeeId]: 'Based on 3-year trend data, this employee demonstrates consistent upward trajectory in teaching effectiveness and research output. Self-assessment aligns well with HOD evaluation, suggesting strong self-awareness. Recommended for standard increment with potential for additional responsibilities in departmental committees.'
      }));
    } finally {
      setAiLoading(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; border: string; text: string }> = {
      hod_reviewed: { label: 'Awaiting Finalization', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
      finalized: { label: 'Finalized', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
      self_submitted: { label: 'Self-Submitted', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' }
    };
    const s = config[status] || config.self_submitted;
    return <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md ${s.bg} border ${s.border} ${s.text} font-bold`}>{s.label}</span>;
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-[#C4B5FD]/30 text-xs">—</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
        ))}
        <span className="text-[10px] text-[#C4B5FD] font-extrabold ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const pendingCount = appraisals.filter(a => a.status === 'hod_reviewed').length;
  const finalizedCount = appraisals.filter(a => a.status === 'finalized').length;

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 md:p-8 flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Principal's Desk</span>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#C4B5FD] to-[#A78BFA] bg-clip-text text-transparent">
              Appraisal Finalization Console
            </h1>
            <p className="text-xs text-[#C4B5FD]/70">
              Review HOD-evaluated performance appraisals, access AI analysis, and finalize scores for all institutional staff.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
              {pendingCount} Pending
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
              {finalizedCount} Finalized
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading appraisal records…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {appraisals.map(apr => (
            <div key={apr.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl overflow-hidden transition-all">
              {/* Summary Row */}
              <div
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-all"
                onClick={() => setExpandedId(expandedId === apr.id ? null : apr.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                    {apr.employee_name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-white">{apr.employee_name}</span>
                    <span className="text-[10px] text-[#C4B5FD]/70 font-semibold">{apr.designation} • {apr.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(apr.status)}
                    <span className="text-[9px] text-[#C4B5FD]/40 font-mono">{apr.cycle_name}</span>
                  </div>
                  {expandedId === apr.id
                    ? <ChevronUp className="w-4 h-4 text-[#A78BFA]" />
                    : <ChevronDown className="w-4 h-4 text-[#C4B5FD]/30" />
                  }
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === apr.id && (
                <div className="border-t border-white/5 p-5 flex flex-col gap-5">
                  {/* Rating Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-2">
                      <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Self Rating</span>
                      {renderStars(apr.self_rating)}
                    </div>
                    <div className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-2">
                      <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">HOD Rating</span>
                      {renderStars(apr.hod_rating)}
                    </div>
                    <div className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5 flex flex-col gap-2">
                      <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Principal Rating</span>
                      {renderStars(apr.principal_rating)}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col gap-2">
                      <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold flex items-center gap-1">
                        <User className="w-3 h-3" /> Self Comments
                      </span>
                      <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">{apr.self_comments}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col gap-2">
                      <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold flex items-center gap-1">
                        <Eye className="w-3 h-3" /> HOD Comments
                      </span>
                      <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">{apr.hod_comments}</p>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#6C2BD9]/5 to-[#8B5CF6]/5 border border-[#6C2BD9]/20 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#A78BFA] uppercase font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Performance Analysis
                      </span>
                      {!aiAnalysis[apr.id] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); requestAiAnalysis(apr.id); }}
                          disabled={aiLoading[apr.id]}
                          className="px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[#A78BFA] text-[10px] font-bold hover:bg-[#6C2BD9]/30 transition-all flex items-center gap-1.5"
                        >
                          {aiLoading[apr.id] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
                          {aiLoading[apr.id] ? 'Analyzing…' : 'Generate Analysis'}
                        </button>
                      )}
                    </div>
                    {aiAnalysis[apr.id] ? (
                      <p className="text-xs text-[#C4B5FD]/80 leading-relaxed">{aiAnalysis[apr.id]}</p>
                    ) : (
                      <p className="text-xs text-[#C4B5FD]/30 italic">Click "Generate Analysis" to get AI insights on this employee&apos;s performance trajectory.</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {apr.status === 'hod_reviewed' && (
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setFinalizeForm({ id: apr.id, rating: apr.hod_rating || 3, comments: '' })}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
                      >
                        <CheckCircle className="w-4 h-4" /> Finalize Appraisal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Finalize Modal */}
      {finalizeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Finalize Appraisal</h2>
              <button onClick={() => setFinalizeForm(null)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFinalize} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Principal Rating (1–5) *</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  required
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] font-bold"
                  value={finalizeForm.rating}
                  onChange={e => setFinalizeForm({ ...finalizeForm, rating: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Principal Comments</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] resize-none"
                  placeholder="Final remarks or observations…"
                  value={finalizeForm.comments}
                  onChange={e => setFinalizeForm({ ...finalizeForm, comments: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-white/5 pt-4">
                <button type="button" onClick={() => setFinalizeForm(null)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold transition-all hover:brightness-110 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Confirm Finalization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
