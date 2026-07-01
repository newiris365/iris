"use client";

import React, { useState, useEffect } from 'react';
import { 
  Heart, Brain, Sun, AlertTriangle, Moon, Sparkles, CheckCircle2, RefreshCw, Award
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

interface WellnessCheckin {
  id: string;
  date: string;
  mood: number;
  stress_level: number;
  sleep_hours: number;
  energy_level: number;
  notes?: string;
  created_at: string;
}

export default function StudentWellnessPage() {
  const [mood, setMood] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(8);
  const [energy, setEnergy] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<WellnessCheckin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [counselorAlert, setCounselorAlert] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const res = await apiGet(`/fitzone/gym/wellness/${studentId}`);
      if (res.success && res.checkins) {
        setHistory(res.checkins);
        calculateStreak(res.checkins);
      }
    } catch (err) {
      console.log('Error loading wellness history, using mocks');
      // Mock history
      const mockHistory: WellnessCheckin[] = [
        { id: '1', date: '2026-06-09', mood: 4, stress_level: 2, sleep_hours: 7.5, energy_level: 4, notes: 'Feeling productive.', created_at: '2026-06-09T08:00:00Z' },
        { id: '2', date: '2026-06-08', mood: 3, stress_level: 4, sleep_hours: 6.0, energy_level: 3, notes: 'Stressed about exams.', created_at: '2026-06-08T08:00:00Z' },
        { id: '3', date: '2026-06-07', mood: 5, stress_level: 1, sleep_hours: 8.5, energy_level: 5, notes: 'Great weekend workout!', created_at: '2026-06-07T08:00:00Z' },
        { id: '4', date: '2026-06-06', mood: 2, stress_level: 5, sleep_hours: 5.0, energy_level: 2, notes: 'Poor sleep.', created_at: '2026-06-06T08:00:00Z' },
        { id: '5', date: '2026-06-05', mood: 2, stress_level: 4, sleep_hours: 5.5, energy_level: 2, notes: 'Tired and sore.', created_at: '2026-06-05T08:00:00Z' }
      ];
      setHistory(mockHistory);
      setStreakCount(3);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (logs: WellnessCheckin[]) => {
    if (!logs || logs.length === 0) {
      setStreakCount(0);
      return;
    }
    // Simple count of sequential logs
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort().reverse();
    
    // Check if the most recent log is today or yesterday
    if (uniqueDates[0] === todayStr || uniqueDates[0] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      streak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i]);
        const d2 = new Date(uniqueDates[i + 1]);
        const diffTime = Math.abs(d1.getTime() - d2.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else if (diffDays > 1) {
          break;
        }
      }
    }
    setStreakCount(streak);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCounselorAlert(false);
    setSuccessMessage('');

    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const res = await apiPost('/fitzone/gym/wellness/checkin', {
        student_id: studentId,
        mood,
        stress_level: stress,
        sleep_hours: sleep,
        energy_level: energy,
        notes: notes || undefined
      });

      if (res.success) {
        setSuccessMessage('Wellness check-in saved! +10 FitPoints awarded!');
        if (res.counselor_suggested) {
          setCounselorAlert(true);
        }
        setNotes('');
        loadData();
      } else {
        alert(res.error || 'Failed to submit check-in');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred during wellness logging');
    } finally {
      setSubmitting(false);
    }
  };

  const moodFaces = ['😭', '😞', '😐', '🙂', '🤩'];
  const moodLabels = ['Very Low', 'Low', 'Moderate', 'Good', 'Excellent'];

  // Format history for charts
  const chartData = [...history]
    .reverse()
    .map(log => ({
      date: new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      Mood: log.mood,
      Stress: log.stress_level,
      Sleep: log.sleep_hours,
      Energy: log.energy_level
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex justify-center items-center">
        <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C2BD9]/10 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl md:text-2xl text-white">Daily Wellness Check-In</h1>
            <p className="text-xs text-[#C4B5FD]/70">Track mood, stress, sleep, and maintain your habits streak.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 px-4 py-2 rounded-2xl">
          <Award className="w-5 h-5 text-[#A78BFA]" />
          <div>
            <span className="block text-[8px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Habit Streak</span>
            <span className="text-sm font-black text-white">{streakCount} Days</span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-white font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Counselor Warning Trigger */}
      {counselorAlert && (
        <div className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest block mb-0.5">Campus Counselor Alert</span>
            <p className="text-xs text-white leading-relaxed">
              We noticed your mood has been low for three days in a row. It is okay to not be okay. If you want to talk to someone, you can book a free, confidential chat with the campus counselor.
            </p>
            <button 
              onClick={() => alert("Redirecting to Counselor Booking Desk...")}
              className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-[10px] font-bold text-black rounded-lg transition-all"
            >
              Reach Out to Counselor
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Check-in Form (2/5 size) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="glass-panel border border-[#6C2BD9]/25 p-6 rounded-3xl space-y-6 bg-[#13102A]/80">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Brain className="w-5 h-5 text-[#A78BFA]" /> Log Today's Vitals
            </h3>

            {/* Mood selector buttons */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Current Mood</label>
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`flex-1 py-3 rounded-xl border text-center transition-all ${
                      mood === m 
                        ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] scale-105 shadow-md shadow-[#6C2BD9]/10' 
                        : 'bg-[#0D0A1A] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className="text-lg block">{moodFaces[m - 1]}</span>
                    <span className="text-[8px] text-[#C4B5FD]/60 mt-0.5 block">{moodLabels[m - 1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stress level slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold">
                <span>Stress Level</span>
                <span className="font-mono text-[#A78BFA]">{stress} / 5</span>
              </div>
              <input
                type="range"
                min="1" max="5"
                value={stress}
                onChange={e => setStress(Number(e.target.value))}
                className="w-full accent-[#6C2BD9] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-[#C4B5FD]/45">
                <span>Relaxed 🧘</span>
                <span>Highly Anxious ⚡</span>
              </div>
            </div>

            {/* Sleep hours slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold">
                <span>Sleep Hours</span>
                <span className="font-mono text-[#A78BFA]">{sleep} hrs</span>
              </div>
              <input
                type="range"
                min="0" max="15" step="0.5"
                value={sleep}
                onChange={e => setSleep(Number(e.target.value))}
                className="w-full accent-[#6C2BD9] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-[#C4B5FD]/45">
                <span>Insomnia 😴</span>
                <span>Well Rested 💤</span>
              </div>
            </div>

            {/* Energy level slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider font-bold">
                <span>Energy Level</span>
                <span className="font-mono text-[#A78BFA]">{energy} / 5</span>
              </div>
              <input
                type="range"
                min="1" max="5"
                value={energy}
                onChange={e => setEnergy(Number(e.target.value))}
                className="w-full accent-[#6C2BD9] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-[#C4B5FD]/45">
                <span>Exhausted 😩</span>
                <span>Hyperactive 🔋</span>
              </div>
            </div>

            {/* Daily note text */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block font-bold">Personal Notes / Symptoms</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Log physical details or how your workout affected you..."
                rows={2}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C2BD9]/25 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sun className="w-4 h-4" />}
              Save Wellness Check-In
            </button>
          </form>
        </div>

        {/* Right Side: Charts & Progress telemetry (3/5 size) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Chart 1: Mood & Energy progression */}
          <div className="glass-panel border border-white/5 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1">
              <Heart className="w-4 h-4 text-rose-400" /> Mood & Energy Progression (30 Days)
            </h3>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(108, 43, 217, 0.3)', borderRadius: 12 }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="Mood" stroke="#8B5CF6" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Energy" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-[#C4B5FD]/45">
                No logs recorded yet. Submit your check-in to begin tracking.
              </div>
            )}
          </div>

          {/* Chart 2: Sleep vs Stress Correlation */}
          <div className="glass-panel border border-white/5 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1">
              <Moon className="w-4 h-4 text-cyan-400" /> Sleep vs Stress Analysis
            </h3>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                    <YAxis yAxisId="left" stroke="#A78BFA" fontSize={9} label={{ value: 'Sleep (hrs)', angle: -90, position: 'insideLeft', fill: '#A78BFA', style: {fontSize: 8} }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#FBBF24" fontSize={9} domain={[1, 5]} label={{ value: 'Stress', angle: 90, position: 'insideRight', fill: '#FBBF24', style: {fontSize: 8} }} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(108, 43, 217, 0.3)', borderRadius: 12 }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="Sleep" stroke="#06B6D4" strokeWidth={2.5} />
                    <Line yAxisId="right" type="monotone" dataKey="Stress" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-[#C4B5FD]/45">
                Correlation analytics will appear after logging entries.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
