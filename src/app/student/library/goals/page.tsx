"use client";

import React, { useState, useEffect } from 'react';
import { Award, Zap, BookOpen, Trophy, Plus, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from '../../../../lib/charts';

export default function ReadingGoalsPage() {
  const [stats, setStats] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [targetBooks, setTargetBooks] = useState<number>(12);
  const [pagesReadInput, setPagesReadInput] = useState<string>('');
  const [completedBookCheckbox, setCompletedBookCheckbox] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadGoalData();
  }, []);

  const loadGoalData = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const [statsRes, leadRes] = await Promise.all([
        apiGet(`/library/goals/stats/${studentId}`),
        apiGet('/library/goals/leaderboard')
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setGoal(statsRes.goal);
        if (statsRes.goal) {
          setTargetBooks(statsRes.goal.target_books);
        }
      }
      if (leadRes.success) {
        setLeaderboard(leadRes.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
      setGoal(null);
      setStats(null);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentYear = new Date().getFullYear();
      const res = await apiPost('/library/goals', { year: currentYear, target_books: targetBooks });
      if (res.success) {
        setMessage({ type: 'success', text: `Annual reading target set to ${targetBooks} books!` });
        loadGoalData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update reading goal.' });
    }
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const pages = parseInt(pagesReadInput);
    if (isNaN(pages) || pages <= 0) return;

    try {
      const currentYear = new Date().getFullYear();
      const res = await apiPost('/library/goals/progress', {
        year: currentYear,
        pages_read: pages,
        completed_book: completedBookCheckbox
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Logged ${pages} pages! +${pages * 2 + (completedBookCheckbox ? 100 : 0)} Points earned!` });
        setPagesReadInput('');
        setCompletedBookCheckbox(false);
        loadGoalData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to log reading session.' });
    }
  };

  const currentYear = new Date().getFullYear();
  const colors = ['#6C2BD9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/10 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#F59E0B]/25">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Reading Challenge</h1>
              <p className="text-sm text-[#C4B5FD]/70">Set annual targets • Log pages read • Earn academic achievement points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-xl border mb-6 text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left and Mid Grid Column: Goal card, Progress form, Stats graphs */}
            <div className="lg:col-span-2 space-y-8">
              {/* Top Row: Dials and Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dial Card: Completed vs Target */}
                <div className="glass-panel p-6 rounded-3xl border border-[#F59E0B]/20 bg-[#13102A]/80 shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#F59E0B] font-bold">{currentYear} Goal Status</span>
                    <h3 className="text-2xl font-extrabold mt-1 text-white">
                      {goal ? `${goal.completed_books || 0} / ${goal.target_books} Books` : '0 Target Set'}
                    </h3>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mt-4 relative overflow-hidden">
                    <div
                      className="bg-[#F59E0B] h-2 rounded-full transition-all"
                      style={{ width: `${goal ? Math.min(100, ((goal.completed_books || 0) / goal.target_books) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#C4B5FD]/50 mt-2">
                    <span>{goal ? Math.round(((goal.completed_books || 0) / goal.target_books) * 100) : 0}% Completed</span>
                    <span>{goal ? goal.target_books - (goal.completed_books || 0) : 0} books left</span>
                  </div>
                </div>

                {/* Daily Streak */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">Daily Streak</span>
                    <h3 className="text-3xl font-extrabold mt-1 text-white flex items-center gap-1.5">
                      {stats?.streak || 0} <span className="text-xs font-medium text-[#C4B5FD]/60">Days</span>
                    </h3>
                    <p className="text-[10px] text-[#C4B5FD]/40 mt-1">Log page counts daily to maintain</p>
                  </div>
                  <Zap className="w-10 h-10 text-purple-400 fill-purple-400/20" />
                </div>

                {/* Bonus Points */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Library Points</span>
                    <h3 className="text-3xl font-extrabold mt-1 text-white flex items-center gap-1.5">
                      {stats?.points || 0} <span className="text-xs font-medium text-[#C4B5FD]/60">XP</span>
                    </h3>
                    <p className="text-[10px] text-[#C4B5FD]/40 mt-1">2 XP/page logged + 100 XP/book</p>
                  </div>
                  <Trophy className="w-10 h-10 text-emerald-400 fill-emerald-400/20" />
                </div>
              </div>

              {/* Middle Row: Forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form 1: Log Daily Progress */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#F59E0B]" /> Log Reading Session
                  </h3>
                  <form onSubmit={handleLogProgress} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">Pages Read</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 24"
                        value={pagesReadInput}
                        onChange={(e) => setPagesReadInput(e.target.value)}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B]/50"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                      <input
                        type="checkbox"
                        id="completed-book"
                        checked={completedBookCheckbox}
                        onChange={(e) => setCompletedBookCheckbox(e.target.checked)}
                        className="accent-[#F59E0B]"
                      />
                      <label htmlFor="completed-book" className="text-xs text-[#C4B5FD]/80 cursor-pointer">I finished reading the whole book!</label>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-xs font-bold text-white transition-all shadow-lg hover:brightness-110"
                    >
                      Log Progress
                    </button>
                  </form>
                </div>

                {/* Form 2: Goal Coordinator */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#F59E0B]" /> Challenge Target Coordinator
                  </h3>
                  <form onSubmit={handleSetGoal} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">Annual Goal Target</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 12"
                        value={targetBooks}
                        onChange={(e) => setTargetBooks(parseInt(e.target.value))}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#F59E0B]/50"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">
                      Setting an annual target challenges your academic development. Finishing book clubs awards extra 200 points to this scoreboard!
                    </p>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all"
                    >
                      Update Target
                    </button>
                  </form>
                </div>
              </div>

              {/* Genre Distribution Graph */}
              {stats?.genres?.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#A78BFA]" /> Reading Distribution by Genre
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.genres} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="genre" stroke="#8b5cf6" fontSize={9} tickLine={false} />
                        <YAxis stroke="#8b5cf6" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(108, 43, 217, 0.3)', borderRadius: '12px', fontSize: '10px' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {stats.genres.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Month Leaderboards */}
            <div className="glass-panel p-6 rounded-3xl border border-[#F59E0B]/20 bg-[#13102A]/80 shadow-xl flex flex-col gap-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F59E0B]" /> Campus Challenge Leaderboard
              </h2>
              <p className="text-[10px] text-[#C4B5FD]/50">
                Monthly leaderboard of pages/books read. Ranks are refreshed on the first day of every month.
              </p>

              <div className="space-y-4">
                {leaderboard.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-[#F59E0B] text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.students?.name || 'Anonymous Student'}</h4>
                        <span className="text-[8px] text-[#C4B5FD]/50">{item.students?.roll_number || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#F59E0B]">{item.points} XP</span>
                      <p className="text-[8px] text-[#C4B5FD]/40 mt-0.5">{item.pages_read_total} pages • {item.completed_books} books</p>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="py-12 text-center text-xs text-[#C4B5FD]/30">
                    No leaderboard logs logged for this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
