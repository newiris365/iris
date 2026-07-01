"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Dumbbell, Compass, RefreshCw, Save, 
  Flame, CheckCircle2, ChevronRight, Activity, MessageSquare 
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
}

interface DayPlan {
  exercises: Exercise[];
}

interface ActivePlan {
  id: string;
  goal: string;
  week_number: number;
  plan: {
    week: Record<string, Record<string, DayPlan>>;
  };
  last_adjusted?: string;
}

const MOCK_MOTIVATIONAL = [
  "Today's focus is legs. You last trained legs 5 days ago — perfect timing!",
  "Consistency beats intensity! Log your session today to maintain your 4-day streak.",
  "Excellent upper body progress detected! Focus on maintaining slow, controlled eccentric reps today."
];

export default function StudentAiTrainer() {
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  
  // Onboarding Form States
  const [goal, setGoal] = useState<'weight loss' | 'muscle gain' | 'stamina' | 'wellness'>('muscle gain');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [days, setDays] = useState(3);
  const [equip, setEquip] = useState<string[]>(['Dumbbells', 'Barbell', 'Cables']);
  const [restrictions, setRestrictions] = useState('');

  // Adjust Form States
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    loadActivePlan();
  }, []);

  const loadActivePlan = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/fitzone/gym/ai-plan/${studentId}/active`);
      if (res.success && res.plan) {
        setActivePlan(res.plan);
      }
    } catch (err) {
      console.log('Error loading active AI plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiPost('/fitzone/gym/ai-plan/generate', {
        student_id: studentId,
        goal,
        level,
        days,
        equipment_list: equip,
        restrictions: restrictions || undefined
      });

      if (res.success && res.plan) {
        setActivePlan(res.plan);
      } else {
        alert('Failed to compile workout plan.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred generating plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAdjust = async () => {
    if (!activePlan || !adjustNotes.trim()) return;
    setAdjusting(true);
    try {
      const res = await apiPost(`/fitzone/gym/ai-plan/${activePlan.id}/adjust`, {
        notes: adjustNotes
      });
      if (res.success && res.plan) {
        setActivePlan(res.plan);
        setAdjustNotes('');
        alert('Plan adjusted by AI coach successfully!');
      } else {
        alert(res.error || 'Failed to adjust plan.');
      }
    } catch (err: any) {
      alert(err.message || 'Adjustment request failed.');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex justify-center items-center">
        <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin" />
      </div>
    );
  }

  const hasPlan = activePlan !== null;

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl md:text-2xl text-white">IRIS AI Personal Trainer</h1>
            <p className="text-xs text-[#C4B5FD]/70">Custom weekly fitness routines, load progression, and injury prevention advice.</p>
          </div>
        </div>
      </div>

      {/* Coach Message Section */}
      <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 rounded-2xl p-4 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-[#A78BFA] shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] text-[#A78BFA] font-black uppercase tracking-widest block mb-0.5">AI Coach Motivational Alert</span>
          <p className="text-xs text-white leading-relaxed font-semibold">{MOCK_MOTIVATIONAL[hasPlan ? 0 : 1]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        
        {/* Left Columns (3/5 width): active workout plan OR onboarding */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          {hasPlan ? (
            /* ACTIVE WORKOUT PLAN VIEW */
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-[#13102A] border border-white/5 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-black">Active Goal Profile</span>
                  <h3 className="text-sm font-black text-white capitalize">{activePlan.goal} (Week {activePlan.week_number})</h3>
                </div>
                <button 
                  onClick={() => setActivePlan(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold hover:bg-white/10 transition-all text-[#C4B5FD]"
                >
                  Reset / Onboard
                </button>
              </div>

              {/* Day workouts cards */}
              {activePlan.plan?.week && Object.keys(activePlan.plan.week).map(weekKey => (
                <div key={weekKey} className="space-y-4">
                  {Object.keys(activePlan.plan.week[weekKey]).map(dayKey => {
                    const dayPlan = activePlan.plan.week[weekKey][dayKey];
                    return (
                      <div key={dayKey} className="glass-panel border border-white/5 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-black text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Activity className="w-4 h-4 text-emerald-400" /> {dayKey} Schedule
                        </h4>
                        
                        <div className="divide-y divide-white/5">
                          {dayPlan.exercises?.map((ex, i) => (
                            <div key={i} className="py-3 flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-white block">{ex.name}</span>
                                {ex.notes && <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">{ex.notes}</p>}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-bold text-[#A78BFA]">{ex.sets} Sets × {ex.reps} Reps</span>
                                <span className="text-[9px] text-[#C4B5FD]/40 block mt-0.5 font-mono">{ex.rest_seconds}s Rest</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            /* ONBOARDING FORM VIEW */
            <div className="glass-panel border border-[#6C2BD9]/25 p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Dumbbell className="w-5 h-5 text-[#A78BFA]" /> AI Goal Setting Onboarding
              </h3>

              <div className="space-y-4">
                {/* Fitness Goal */}
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-2 font-bold">Fitness Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'weight loss' as const, label: 'Weight Loss 🏃' },
                      { key: 'muscle gain' as const, label: 'Muscle Gain 💪' },
                      { key: 'stamina' as const, label: 'Stamina ⚡' },
                      { key: 'wellness' as const, label: 'Wellness 🧘' }
                    ].map(g => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setGoal(g.key)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                          goal === g.key ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white' : 'bg-[#13102A] border-white/5 text-[#C4B5FD]/50'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level + Days */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-2 font-bold">Current Level</label>
                    <select
                      value={level}
                      onChange={e => setLevel(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-2 font-bold">Days Per Week</label>
                    <input 
                      type="number"
                      min="1" max="7"
                      value={days}
                      onChange={e => setDays(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 font-mono text-center"
                    />
                  </div>
                </div>

                {/* Equipment list */}
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-2 font-bold">Available Equipment</label>
                  <div className="flex flex-wrap gap-2">
                    {['Dumbbells', 'Barbell', 'Cables', 'Machines', 'Resistance Bands', 'Bodyweight Only'].map(eq => {
                      const checked = equip.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => {
                            if (checked) setEquip(prev => prev.filter(e => e !== eq));
                            else setEquip(prev => [...prev, eq]);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                            checked ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' : 'bg-[#13102A] border-white/5 text-[#C4B5FD]/40'
                          }`}
                        >
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Restrictions */}
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Physical Restrictions / Injuries</label>
                  <input 
                    type="text"
                    value={restrictions}
                    onChange={e => setRestrictions(e.target.value)}
                    placeholder="e.g. Lower back pain, knee injury (optional)..."
                    className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 disabled:opacity-50"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate AI 4-Week Plan
              </button>
            </div>
          )}
        </div>

        {/* Right Column (2/5 width): AI Adjustment & Coach Tips */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* AI Plan Adjustment */}
          {hasPlan && (
            <div className="glass-panel border border-white/5 p-5 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA] mb-3 flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Weekly Plan Adjuster
              </h3>
              
              <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed mb-4">
                Submit progress feedback or injury issues. Claude will adjust weights/reps of the exercises in your plan.
              </p>

              <div className="space-y-4">
                <textarea 
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Chest exercises felt too easy, increase load, or shoulder is hurting..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
                />

                <button 
                  onClick={handleAdjust}
                  disabled={adjusting || !adjustNotes.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {adjusting ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Adjust Active Plan'}
                </button>
              </div>
            </div>
          )}

          {/* Injury Prevention / Coach advice */}
          <div className="glass-panel border border-[#6C2BD9]/15 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/5 rounded-full blur-xl -z-10" />
            <h4 className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-bold">Injury Prevention Shield</h4>
            
            <div className="my-auto py-2">
              <p className="text-xs text-white leading-relaxed font-semibold">Avoid 4 consecutive chest days.</p>
              <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-normal">Our system monitors workouts and triggers alerts to enforce rest days for safety.</p>
            </div>
            
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked by FitZone
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
