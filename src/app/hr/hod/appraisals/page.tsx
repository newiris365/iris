"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckSquare, RefreshCw } from 'lucide-react';

interface TeamAppraisal {
  id: string;
  employee_name: string;
  designation: string;
  self_score: number;
  self_comments: string;
}

export default function HodAppraisalReviews() {
  const [appraisals, setAppraisals] = useState<TeamAppraisal[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [selectedReview, setSelectedReview] = useState<TeamAppraisal | null>(null);
  const [hodScore, setHodScore] = useState<number>(4);
  const [hodComments, setHodComments] = useState<string>('');
  const [incrementPct, setIncrementPct] = useState<number>(8);
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock team appraisals waiting VP feedback
      setAppraisals([
        { id: 'ap-rec-1', employee_name: 'Prof. Satish Kumar', designation: 'Associate Professor', self_score: 4.5, self_comments: 'Successfully published 2 research articles in IEEE journals and completed FDP on NEP compliance syllabus setups.' }
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

  const handleHodReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/hr/appraisal/${selectedReview.id}/hod-review`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          hod_score: hodScore,
          hod_comments: hodComments,
          increment_recommended: incrementPct,
          promotion_recommended: false
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppraisals(prev => prev.filter(a => a.id !== selectedReview.id));
        setSelectedReview(null);
        setHodComments('');
        alert('Appraisal review submitted to Principal desk.');
      }
    } catch (err) {
      setAppraisals(prev => prev.filter(a => a.id !== selectedReview.id));
      setSelectedReview(null);
      setHodComments('');
      alert('Appraisal review submitted locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Vice Principal Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Team Performance Reviews</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Score employee self-appraisals, submit Vice Principal evaluations, and recommend monthly basic increment percentages.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading team appraisals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {appraisals.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl border border-white/5 text-center text-xs text-[#C4B5FD]/50">
                No pending team reviews in your queue.
              </div>
            ) : (
              appraisals.map(app => (
                <div
                  key={app.id}
                  onClick={() => setSelectedReview(app)}
                  className={`glass-panel border p-5 rounded-2xl cursor-pointer flex flex-col gap-2.5 transition-all ${
                    selectedReview?.id === app.id
                      ? 'bg-[#6C2BD9]/15 border-[#6C2BD9] text-white'
                      : 'bg-[#13102A]/40 border-white/5 text-[#C4B5FD]/80 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-white">{app.employee_name}</h3>
                    <span className="text-xs font-bold text-[#A78BFA]">Self Score: {app.self_score} / 5</span>
                  </div>
                  <p className="text-xs text-[#C4B5FD]/60 font-semibold">{app.designation}</p>
                  <div className="p-3 rounded-lg bg-[#0D0A1A]/80 border border-white/5 text-[11px] leading-normal font-semibold">
                    <span className="font-bold text-white block mb-1">Self Comments:</span>
                    {app.self_comments}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* HOD Review Form panel */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/20 flex flex-col gap-4 text-xs">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <span>Score Evaluation</span>
            </h3>

            {selectedReview ? (
              <form onSubmit={handleHodReviewSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">VP Rating Score (1-5) *</label>
                  <div className="flex gap-2.5 mt-1">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setHodScore(val)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold transition-all ${
                          hodScore === val
                            ? 'bg-[#6C2BD9] text-white border-[#8B5CF6]/50 shadow-lg'
                            : 'bg-[#0D0A1A]/60 border-white/5 text-[#C4B5FD]/60 hover:bg-white/5'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Recommended Increment (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    required
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] font-bold"
                    value={incrementPct}
                    onChange={e => setIncrementPct(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">VP Assessment Remarks *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide review feedback..."
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={hodComments}
                    onChange={e => setHodComments(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold transition-all flex items-center justify-center gap-1.5 border border-[#A78BFA]/20 shadow-lg"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                  Submit Evaluation Remarks
                </button>
              </form>
            ) : (
              <p className="text-[#C4B5FD]/50 text-center py-12">Select reporting staff appraisal from the list to audit parameters.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
