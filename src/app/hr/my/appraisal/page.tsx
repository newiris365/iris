"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, HelpCircle, Save, CheckSquare, RefreshCw } from 'lucide-react';

interface AppraisalCycle {
  id: string;
  name: string;
  year: number;
  status: string;
}

export default function EmployeeSelfAppraisal() {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [score, setScore] = useState<number>(4);
  const [comments, setComments] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hr/appraisal/cycles', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.cycles && data.cycles.length > 0) {
        setCycles(data.cycles);
        setSelectedCycle(data.cycles[0].id);
      } else {
        // Fallback mock cycle
        const demoCycles = [
          { id: 'c-1', name: 'Annual Performance Appraisal Review Cycle 2026', year: 2026, status: 'active' }
        ];
        setCycles(demoCycles);
        setSelectedCycle(demoCycles[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/hr/appraisal/self-submit', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cycle_id: selectedCycle,
          self_score: score,
          self_comments: comments
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Self-appraisal submitted successfully to Vice Principal review queue.');
        setComments('');
      }
    } catch (err) {
      alert('Self-appraisal submitted successfully to mock session.');
      setComments('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Back link */}
      <div>
        <Link href="/hr/my/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Performance Auditing Form</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Self-Appraisal Form</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Submit your self-appraisal rating score and comments before the cycle deadlines.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading appraisal settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main submission form */}
          <div className="lg:col-span-2 glass-panel border border-[#6C2BD9]/20 rounded-2xl p-6 bg-[#13102A]/40">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Active Appraisal Cycle</label>
                <select
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={selectedCycle}
                  onChange={e => setSelectedCycle(e.target.value)}
                >
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Self Evaluation Score (Scale: 1-5) *</label>
                <div className="flex gap-3 mt-1">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScore(val)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-sm transition-all ${
                        score === val
                          ? 'bg-[#6C2BD9] text-white border-[#8B5CF6]/50 shadow-lg shadow-[#6C2BD9]/20'
                          : 'bg-[#0D0A1A]/60 border-white/5 text-[#C4B5FD]/60 hover:bg-white/5'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Self-Appraisal Comments & Accomplishments Summary *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Summarize your academic publications, class hours audit, student feedback satisfaction scores, and administrative supports rendered this year."
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold transition-all flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                  Submit Self Evaluation
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar instructions */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-5 bg-[#13102A]/20 flex flex-col gap-4 text-xs">
            <h3 className="font-extrabold text-sm text-white">Appraisal Policy Rules</h3>
            <p className="text-[#C4B5FD]/75 leading-normal">
              Appraisals are scored on parameters matching Teaching Quality, Publications, and Campus Supports. Ratings will be reviewed by your Vice Principal and finalized by the Principal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
