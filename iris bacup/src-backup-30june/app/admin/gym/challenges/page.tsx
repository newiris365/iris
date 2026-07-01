"use client";

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Plus, Calendar, Clock, RefreshCw, BarChart2, CheckCircle2, ShieldAlert, Award, FileText
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface Challenge {
  id: string;
  name: string;
  description?: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_value: number;
  unit: string;
  is_active: boolean;
  participants_count?: number;
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form States
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [challengeType, setChallengeType] = useState<string>('steps');
  const [targetValue, setTargetValue] = useState<number>(10000);
  const [unit, setUnit] = useState<string>('steps');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await apiGet('/fitzone/gym/challenges');
      if (res.success && res.challenges) {
        setChallenges(res.challenges);
      }
    } catch (err) {
      console.log('Error loading challenges, using mocks');
      setChallenges([
        {
          id: 'c1',
          name: '10K Daily Steps Marathon',
          description: 'Log steps daily. Walk your way to victory and earn points.',
          challenge_type: 'steps',
          start_date: '2026-06-01',
          end_date: '2026-06-15',
          target_value: 70000,
          unit: 'steps',
          is_active: true,
          participants_count: 42
        },
        {
          id: 'c2',
          name: 'FitZone Workout Streak Challenge',
          description: 'Complete 10 workouts at the campus gym during this challenge.',
          challenge_type: 'workouts',
          start_date: '2026-06-01',
          end_date: '2026-06-30',
          target_value: 10,
          unit: 'sessions',
          is_active: true,
          participants_count: 28
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await apiPost('/fitzone/gym/challenges', {
        name,
        description: description || undefined,
        challenge_type: challengeType,
        target_value: Number(targetValue),
        unit,
        start_date: startDate,
        end_date: endDate
      });

      if (res.success) {
        setSuccessMessage('Challenge created successfully and broadcasted to students!');
        // Reset form
        setName('');
        setDescription('');
        setTargetValue(10000);
        setUnit('steps');
        setStartDate('');
        setEndDate('');
        loadChallenges();
      } else {
        alert(res.error || 'Failed to create challenge');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred creating challenge');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex justify-center items-center">
        <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl md:text-2xl text-white">Campus Challenges Administrator</h1>
            <p className="text-xs text-[#C4B5FD]/70">Publish new fitness challenges, configure milestone goals, and view student engagement reports.</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-xs text-white font-semibold">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Create Challenge Form (2/5 size) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-panel border border-[#6C2BD9]/25 p-6 rounded-3xl space-y-5 bg-[#13102A]/80 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Plus className="w-5 h-5 text-[#A78BFA]" /> Create Challenge
            </h3>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Challenge Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Summer Cardio Splash"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Challenge criteria details and point terms..."
                rows={2}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>

            {/* Type + Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Activity Type</label>
                <select
                  value={challengeType}
                  onChange={e => setChallengeType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                >
                  <option value="steps">Steps 🏃</option>
                  <option value="workouts">Workouts 💪</option>
                  <option value="calories">Calories Burn ⚡</option>
                  <option value="water">Water Intake 💧</option>
                  <option value="yoga">Yoga Mins 🧘</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Target Value</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={targetValue}
                  onChange={e => setTargetValue(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 font-mono"
                />
              </div>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Target Unit</label>
              <input 
                type="text" 
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="e.g. steps, sessions, kcal"
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>

            {/* Start Date + End Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Start Date</label>
                <input 
                  type="date" 
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">End Date</label>
                <input 
                  type="date" 
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 font-mono"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-[#6C2BD9]/25 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Challenge Program'}
            </button>
          </form>
        </div>

        {/* Right Side: Active Challenges & reports (3/5 size) */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <FileText className="w-5 h-5 text-[#A78BFA]" /> Active Challenge Registry
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {challenges.map(c => (
              <div key={c.id} className="glass-panel border border-white/5 rounded-2xl bg-[#13102A]/40 p-5 shadow-xl flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[#C4B5FD] font-bold px-2 py-0.5 rounded uppercase font-mono">
                      {c.challenge_type}
                    </span>
                    {c.is_active ? (
                      <span className="text-emerald-400 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                        ● Active Campaign
                      </span>
                    ) : (
                      <span className="text-white/40 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                        Completed
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-white">{c.name}</h4>
                    <p className="text-[11px] text-[#C4B5FD]/50 leading-relaxed mt-1">{c.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex gap-4 text-[9px] text-[#C4B5FD]/40 font-mono">
                    <span>Target: {c.target_value} {c.unit}</span>
                    <span>Duration: {c.start_date} to {c.end_date}</span>
                  </div>
                </div>

                <div className="bg-[#6C2BD9]/15 border border-[#6C2BD9]/35 px-4 py-3 rounded-2xl text-center shrink-0 flex flex-col justify-center">
                  <span className="text-xs font-black text-white">{c.participants_count || 0}</span>
                  <span className="text-[8px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider mt-0.5">Enrolled</span>
                </div>
              </div>
            ))}

            {challenges.length === 0 && (
              <div className="py-12 text-center text-xs text-[#C4B5FD]/45">
                No challenges running on campus. Create one above!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
