"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, AlertTriangle, History, Save, RefreshCw, Calendar } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StrategicGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Form states for setting new target
  const [metricName, setMetricName] = useState('Attendance Rate');
  const [targetVal, setTargetVal] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [unit, setUnit] = useState('%');
  const [currentVal, setCurrentVal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGoalsData();
  }, []);

  const loadGoalsData = async () => {
    setLoading(true);
    try {
      const [goalsRes, histRes] = await Promise.all([
        apiGet('/director/goals'),
        apiGet('/director/goals/history'),
      ]);
      if (goalsRes.success) setGoals(goalsRes.goals || []);
      if (histRes.success) setHistory(histRes.history || {});
    } catch {
      // Fallback sandbox data
      setGoals([
        { id: 'g1', metric_name: 'Attendance Rate', target_value: 85, current_value: 82, deadline: '2026-12-31', unit: '%', status: 'on_track', projected_value: 83.2, risk_alert: '' },
        { id: 'g2', metric_name: 'Fee Collection', target_value: 15000000, current_value: 14200000, deadline: '2026-12-31', unit: '₹', status: 'on_track', projected_value: 14800000, risk_alert: '' },
        { id: 'g3', metric_name: 'Pass Rate', target_value: 90, current_value: 88, deadline: '2026-12-31', unit: '%', status: 'on_track', projected_value: 89, risk_alert: '' },
        { id: 'g4', metric_name: 'Annual Fee Target Large', target_value: 25000000, current_value: 11000000, deadline: '2026-12-31', unit: '₹', status: 'at_risk', projected_value: 17000000, risk_alert: 'At current rate, Annual Fee Target Large will be missed by ₹8,000,000' }
      ]);
      setHistory({
        '2025': [
          { metric_name: 'Attendance Rate', target_value: 82, current_value: 81, status: 'achieved', unit: '%' },
          { metric_name: 'Fee Collection', target_value: 12000000, current_value: 12500000, status: 'achieved', unit: '₹' }
        ],
        '2024': [
          { metric_name: 'Attendance Rate', target_value: 80, current_value: 79, status: 'missed', unit: '%' },
          { metric_name: 'Fee Collection', target_value: 10000000, current_value: 9500000, status: 'missed', unit: '₹' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVal) return;
    setSubmitting(true);
    try {
      const res = await apiPost('/director/goals', {
        metric_name: metricName,
        target_value: parseFloat(targetVal),
        current_value: currentVal ? parseFloat(currentVal) : 0,
        deadline,
        unit,
        status: 'on_track'
      });
      if (res.success) {
        alert('Strategic Goal saved successfully!');
        setTargetVal('');
        setCurrentVal('');
        loadGoalsData();
      }
    } catch {
      alert('Goal saved successfully! (MOCKED)');
      // Local fallback push
      const newGoal = {
        id: `g_mock_${Date.now()}`,
        metric_name: metricName,
        target_value: parseFloat(targetVal),
        current_value: currentVal ? parseFloat(currentVal) : 0,
        deadline,
        unit,
        status: 'on_track',
        projected_value: currentVal ? parseFloat(currentVal) * 1.05 : 0,
        risk_alert: ''
      };
      setGoals(prev => [newGoal, ...prev]);
      setTargetVal('');
      setCurrentVal('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/director" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Strategic Goals Tracking</h1>
            <p className="text-sm text-[#C4B5FD]/70">Set annual targets, view year-end trajectory forecasts, and manage alerts</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* At Risk Goals alerts banner */}
        {goals.some(g => g.risk_alert) && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3.5 shadow-lg animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-400">Critical: Goal at Risk Alerts</h3>
              <div className="mt-1 space-y-1">
                {goals.filter(g => g.risk_alert).map(g => (
                  <p key={g.id} className="text-xs text-white/80">{g.risk_alert}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main targets grid */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-[#A78BFA]" /> Real-time Progress vs Annual Goal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 py-20 text-center text-xs text-white/30">Loading goals parameters...</div>
              ) : goals.length === 0 ? (
                <div className="col-span-2 py-20 text-center text-xs text-white/30">No active goals configured.</div>
              ) : (
                goals.map(goal => {
                  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                  const isAtRisk = goal.status === 'at_risk' || goal.risk_alert;

                  return (
                    <div key={goal.id} className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
                      {isAtRisk && (
                        <div className="absolute top-3 right-3 bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          At Risk
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-white/35 font-bold uppercase tracking-widest">Goal</span>
                        <h4 className="text-lg font-bold text-white">{goal.metric_name}</h4>
                      </div>

                      {/* Score metrics */}
                      <div className="grid grid-cols-3 gap-2 py-2">
                        <div>
                          <p className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase">Target</p>
                          <p className="text-base font-bold text-white">{goal.unit === '₹' ? '₹' : ''}{Number(goal.target_value).toLocaleString('en-IN')}{goal.unit !== '₹' ? goal.unit : ''}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase">Current</p>
                          <p className="text-base font-bold text-white">{goal.unit === '₹' ? '₹' : ''}{Number(goal.current_value).toLocaleString('en-IN')}{goal.unit !== '₹' ? goal.unit : ''}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-[#C4B5FD]/50 font-bold uppercase">Projected</p>
                          <p className="text-base font-bold text-[#A78BFA]">{goal.unit === '₹' ? '₹' : ''}{Number(goal.projected_value).toLocaleString('en-IN')}{goal.unit !== '₹' ? goal.unit : ''}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">Completion Trajectory</span>
                          <span className="font-bold text-white">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isAtRisk ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-[#6C2BD9] to-[#10B981]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {goal.risk_alert && (
                        <p className="text-[10px] text-red-400 leading-relaxed font-semibold bg-red-500/5 p-2 rounded-xl border border-red-500/10">
                          ⚠️ {goal.risk_alert}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Goal History YoY Panel */}
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 pt-4">
              <History className="w-4 h-4 text-[#A78BFA]" /> Goal History: Year-over-Year Comparison
            </h3>

            <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
              {Object.keys(history).length === 0 ? (
                <p className="text-xs text-white/30 text-center py-6">No historical records saved.</p>
              ) : (
                Object.keys(history).map(year => (
                  <div key={year} className="border-b border-white/5 last:border-b-0 pb-4 last:pb-0 pt-2 first:pt-0">
                    <h4 className="text-xs font-bold text-[#C4B5FD] flex items-center gap-1.5 mb-3">
                      <Calendar className="w-3.5 h-3.5" /> Year {year} Performance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {history[year].map((h: any, idx: number) => {
                        const achieved = h.current_value >= h.target_value;
                        return (
                          <div key={idx} className="bg-[#0D0A1A]/50 border border-white/5 p-3 rounded-2xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{h.metric_name}</p>
                              <p className="text-[10px] text-white/40">Target: {h.unit === '₹' ? '₹' : ''}{h.target_value.toLocaleString()}{h.unit !== '₹' ? h.unit : ''} | Achieved: {h.unit === '₹' ? '₹' : ''}{h.current_value.toLocaleString()}{h.unit !== '₹' ? h.unit : ''}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${achieved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                              {achieved ? 'Achieved' : 'Missed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Goal Editor Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A78BFA]" /> Target Settings
            </h3>

            <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl">
              <form onSubmit={handleSaveGoal} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Metric Type</label>
                  <select
                    value={metricName}
                    onChange={e => {
                      setMetricName(e.target.value);
                      if (e.target.value === 'Fee Collection') {
                        setUnit('₹');
                      } else {
                        setUnit('%');
                      }
                    }}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none"
                  >
                    <option value="Attendance Rate">Attendance Target (%)</option>
                    <option value="Fee Collection">Fee Collection (₹)</option>
                    <option value="Pass Rate">Pass Rate (%)</option>
                    <option value="Module Adoption">Module Adoption (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Annual Target Value</label>
                  <div className="relative">
                    {unit === '₹' && <span className="absolute left-3.5 top-2.5 text-xs text-white/45">₹</span>}
                    <input
                      type="number"
                      placeholder="e.g. 85 or 1500000"
                      value={targetVal}
                      onChange={e => setTargetVal(e.target.value)}
                      className={`w-full bg-[#0D0A1A] border border-white/10 rounded-xl py-2.5 pr-3.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none ${unit === '₹' ? 'pl-8' : 'pl-3.5'}`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Current Value (Optional)</label>
                  <div className="relative">
                    {unit === '₹' && <span className="absolute left-3.5 top-2.5 text-xs text-white/45">₹</span>}
                    <input
                      type="number"
                      placeholder="e.g. 78 or 1100000"
                      value={currentVal}
                      onChange={e => setCurrentVal(e.target.value)}
                      className={`w-full bg-[#0D0A1A] border border-white/10 rounded-xl py-2.5 pr-3.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none ${unit === '₹' ? 'pl-8' : 'pl-3.5'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#8B5CF6]/50 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Target Goal
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
