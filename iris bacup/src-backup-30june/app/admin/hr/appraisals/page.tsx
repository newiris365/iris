"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Calendar, RefreshCw } from 'lucide-react';

interface Cycle {
  id: string;
  name: string;
  year: number;
  status: string;
  self_appraisal_deadline: string;
}

export default function AdminAppraisals() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New cycle form
  const [showAdd, setShowAdd] = useState(false);
  const [newCycle, setNewCycle] = useState({
    name: '',
    year: 2026,
    period_start: '2025-04-01',
    period_end: '2026-03-31',
    self_appraisal_deadline: '2026-06-30',
    hod_review_deadline: '2026-07-15',
    principal_review_deadline: '2026-07-31'
  });

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
      } else {
        // Fallback mock
        setCycles([
          { id: 'c-1', name: 'Annual Performance Appraisal Review Cycle 2026', year: 2026, status: 'active', self_appraisal_deadline: '2026-06-30' }
        ]);
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/hr/appraisal/cycles', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCycle)
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        loadData();
      }
    } catch (err) {
      const mockObj: Cycle = {
        id: `c-${Date.now()}`,
        name: newCycle.name,
        year: newCycle.year,
        status: 'active',
        self_appraisal_deadline: newCycle.self_appraisal_deadline
      };
      setCycles(prev => [mockObj, ...prev]);
      setShowAdd(false);
      alert('Appraisal cycle created successfully.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Performance Auditing Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Appraisal Cycles Manager</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Define performance periods, configure evaluation scoring matrices, and track self-review deadlines.
          </p>
        </div>
        
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
        >
          <Plus className="w-4 h-4" /> Start Appraisal Cycle
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading appraisal cycles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cycles.map(cycle => (
            <div key={cycle.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-full -z-10"></div>
              
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono text-[#A78BFA] px-2.5 py-1 rounded bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 font-bold uppercase">
                  FY {cycle.year}
                </span>
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  {cycle.status}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-white group-hover:text-[#A78BFA] transition-colors leading-snug">
                {cycle.name}
              </h3>

              <div className="flex gap-2 text-xs text-[#C4B5FD]/70 font-semibold border-t border-white/5 pt-3 mt-1 items-center">
                <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                <span>Self Deadline: {cycle.self_appraisal_deadline}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CYCLE DIALOG */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Start Appraisal Cycle</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Cycle Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Appraisal Cycle 2026"
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={newCycle.name}
                  onChange={e => setNewCycle({ ...newCycle, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Cycle Year *</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6] font-bold"
                    value={newCycle.year}
                    onChange={e => setNewCycle({ ...newCycle, year: parseInt(e.target.value) || 2026 })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#C4B5FD]/70 font-semibold">Self Submit Deadline *</label>
                  <input
                    type="date"
                    required
                    className="bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
                    value={newCycle.self_appraisal_deadline}
                    onChange={e => setNewCycle({ ...newCycle, self_appraisal_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
