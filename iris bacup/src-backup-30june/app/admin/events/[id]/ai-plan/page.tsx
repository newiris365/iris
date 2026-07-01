"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Calendar, DollarSign, Users, AlertTriangle, CheckCircle, Plus, Edit2, ListTodo, HelpCircle } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../../lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function AdminAiPlannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(200000);
  const [count, setCount] = useState(500);
  const [dates, setDates] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const res = await apiGet(`/events/events/${eventId}`);
      if (res.success) {
        setEvent(res.event);
        setDescription(`Plan a 2-day technical fest for ${res.event.max_participants || 500} students with coding competition, hackathon, and guest lecture.`);
        setBudget(res.event.ticket_price ? res.event.ticket_price * (res.event.max_participants || 500) : 200000);
        setCount(res.event.max_participants || 500);
        
        const start = new Date(res.event.start_datetime).toLocaleDateString('en-IN');
        const end = new Date(res.event.end_datetime).toLocaleDateString('en-IN');
        setDates(`${start} to ${end}`);
        
        if (res.event.ai_plan) {
          setPlan(res.event.ai_plan);
        }
      }
    } catch (err) {
      setError('Offline mode: Using mock event information.');
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError('');
    setPlan(null);
    try {
      const res = await apiPost('/events/events/ai-plan', {
        description,
        budget,
        dates,
        count,
        institutionName: 'IRIS Engineering College'
      });
      if (res.success) {
        setPlan(res.ai_plan);
      } else {
        throw new Error(res.error || 'Failed to generate plan.');
      }
    } catch (err: any) {
      setError(err.message || 'Claude API failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalizePlan = async () => {
    if (!plan) return;
    setFinalizing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiPut(`/events/events/${eventId}/ai-plan/finalize`, {
        ai_plan: plan
      });
      if (res.success) {
        setSuccess('AI Event Plan finalized! Budget lines and checklist tasks have been created.');
        setTimeout(() => {
          router.push(`/admin/events/${eventId}`);
        }, 1500);
      } else {
        throw new Error(res.error || 'Failed to finalize plan.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C2BD9]/10 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6 pt-8 relative z-10">
        <Link href={`/admin/events/${eventId}`} className="inline-flex items-center gap-2 text-xs font-bold text-[#C4B5FD]/50 hover:text-[#A78BFA] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Event Hub
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-[#C4B5FD] bg-clip-text text-transparent">AI Event Planner</h1>
              <p className="text-xs text-[#C4B5FD]/60 mt-0.5">Let Claude design the optimal timeline, budget breakdown, and tasks</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prompt inputs */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/80 p-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A78BFA]" /> Customize Planner Input
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#C4B5FD]/60 font-bold mb-1.5">What is the event about?</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe event details..."
                    className="w-full p-3 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-white outline-none focus:border-[#8B5CF6]/50 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[#C4B5FD]/60 font-bold mb-1.5">Total Budget (INR)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-white outline-none focus:border-[#8B5CF6]/50"
                  />
                </div>

                <div>
                  <label className="block text-[#C4B5FD]/60 font-bold mb-1.5">Expected Participants</label>
                  <input
                    type="number"
                    value={count}
                    onChange={e => setCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-white outline-none focus:border-[#8B5CF6]/50"
                  />
                </div>

                <div>
                  <label className="block text-[#C4B5FD]/60 font-bold mb-1.5">Dates Range</label>
                  <input
                    type="text"
                    value={dates}
                    onChange={e => setDates(e.target.value)}
                    placeholder="e.g. 20 June to 21 June"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0A1A] border border-[#6C2BD9]/20 text-white outline-none focus:border-[#8B5CF6]/50"
                  />
                </div>

                <button
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all shadow-lg shadow-[#6C2BD9]/20 flex items-center justify-center gap-2 mt-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Invoking Claude...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" /> Generate Event Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Plan Review */}
          <div className="lg:col-span-2">
            {!plan && !generating && (
              <div className="rounded-2xl border border-dashed border-white/10 py-32 text-center flex flex-col items-center justify-center">
                <Sparkles className="w-12 h-12 text-[#C4B5FD]/20 mb-3" />
                <h3 className="font-bold text-sm text-[#C4B5FD]/40">No plan generated yet.</h3>
                <p className="text-[11px] text-[#C4B5FD]/30 mt-1">Configure inputs on the left and hit generate.</p>
              </div>
            )}

            {generating && (
              <div className="rounded-2xl border border-white/5 bg-[#13102A]/40 p-12 text-center flex flex-col items-center justify-center py-32">
                <div className="w-12 h-12 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="font-bold text-sm text-[#C4B5FD]/80">Claude is drafting event templates...</h3>
                <p className="text-[11px] text-[#C4B5FD]/40 mt-1.5 max-w-xs leading-relaxed">Analyzing budgets breakdowns, timelines, marketing channels, and volunteer assignments.</p>
              </div>
            )}

            {plan && (
              <div className="flex flex-col gap-6">
                {/* Headline controls */}
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                  <div className="text-xs">
                    <h3 className="font-bold text-emerald-400">Event Plan Compiled</h3>
                    <p className="text-[#C4B5FD]/60 mt-0.5">Please review the structured timeline and allocations below before saving.</p>
                  </div>
                  <button
                    onClick={handleFinalizePlan}
                    disabled={finalizing}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    {finalizing ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Finalize & Apply'
                    )}
                  </button>
                </div>

                {/* Grid display of details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline */}
                  <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                    <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Schedule Timeline
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      {(plan.event_structure?.timeline || []).map((t: any, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="font-bold text-[#C4B5FD]/50 w-16 shrink-0 font-mono">D{t.day} {t.time}</div>
                          <div className="text-white font-medium">{t.activity}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget breakdown */}
                  <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                    <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Budget Allocations
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      {(plan.budget_breakdown || []).map((b: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-1 border-b border-white/5">
                          <span className="text-[#C4B5FD]/70">{b.category}</span>
                          <span className="font-extrabold text-white">₹{(b.estimated_amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Volunteer requirements */}
                  <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                    <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Volunteer Roles
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      {(plan.volunteer_roles || []).map((v: any, i: number) => (
                        <div key={i}>
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white">{v.role}</span>
                            <span className="text-[#A78BFA] font-mono">{v.count} slots</span>
                          </div>
                          <p className="text-[10px] text-[#C4B5FD]/50 mt-1 leading-relaxed">{v.responsibilities}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk mitigations */}
                  <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                    <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Risks & Mitigations
                    </h3>
                    <div className="space-y-3.5 text-xs">
                      {(plan.risk_mitigation || []).map((r: any, i: number) => (
                        <div key={i}>
                          <p className="font-bold text-rose-400">Risk: {r.risk}</p>
                          <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">Plan: {r.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Task Checklist */}
                <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5">
                  <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ListTodo className="w-4 h-4" /> Organizer Checklist
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {(plan.task_checklist || []).map((task: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                        <p className="font-semibold text-white leading-relaxed">{task.task}</p>
                        <div className="flex justify-between items-center mt-3 text-[10px] text-[#C4B5FD]/50">
                          <span>By: {task.assigned_to}</span>
                          <span className="font-bold text-[#A78BFA] font-mono">{task.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
