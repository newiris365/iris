"use client";

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck, ArrowLeft, Plus, Utensils, X, Save,
  Clock, Check, Zap, Coffee, Sun, Moon
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

const PLAN_CONFIGS = [
  { type: 'Breakfast', icon: Coffee, emoji: '☀️', color: 'from-amber-500 to-orange-500', price_per_day: 40, description: 'Morning meals (8-10 AM)' },
  { type: 'Lunch', icon: Sun, emoji: '🌞', color: 'from-emerald-500 to-teal-500', price_per_day: 60, description: 'Afternoon meals (12-2 PM)' },
  { type: 'Dinner', icon: Moon, emoji: '🌙', color: 'from-blue-500 to-indigo-500', price_per_day: 55, description: 'Evening meals (7-9 PM)' },
  { type: 'Complete', icon: Utensils, emoji: '🍽️', color: 'from-[#6C2BD9] to-[#8B5CF6]', price_per_day: 140, description: 'All 3 meals daily' },
];

const MOCK_SUBSCRIPTIONS = [
  {
    id: 'sub-1', plan_type: 'Lunch', start_date: '2026-06-01', end_date: '2026-06-30',
    meals_remaining: 18, amount_paid: 1800,
    created_at: new Date(Date.now() - 604800000).toISOString()
  },
  {
    id: 'sub-2', plan_type: 'Complete', start_date: '2026-05-01', end_date: '2026-05-31',
    meals_remaining: 0, amount_paid: 4340,
    created_at: new Date(Date.now() - 2592000000).toISOString()
  },
];

export default function StudentSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState(MOCK_SUBSCRIPTIONS);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    let studentId = '00000000-0000-0000-0000-000000000000';
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('iris_user_profile');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) studentId = user.id;
        } catch (e) {}
      }
    }
    try {
      const res = await apiGet(`/canteen/subscriptions/${studentId}`);
      if (res.success && res.subscriptions) setSubscriptions(res.subscriptions);
    } catch (err) { console.log('Using mock subscriptions'); }
  };

  const handleCreate = async (form: any) => {
    let studentId = '00000000-0000-0000-0000-000000000000';
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('iris_user_profile');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) studentId = user.id;
        } catch (e) {}
      }
    }
    try {
      await apiPost('/canteen/subscriptions', {
        ...form,
        student_id: studentId
      });
    } catch (err) {}

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const meals = form.plan_type === 'Complete' ? days * 3 : days;

    setSubscriptions(prev => [{
      id: `sub-${Date.now()}`, ...form, meals_remaining: meals,
      created_at: new Date().toISOString()
    }, ...prev]);
    setShowCreate(false);
  };

  const activeSubs = subscriptions.filter(s => s.meals_remaining > 0);
  const expiredSubs = subscriptions.filter(s => s.meals_remaining === 0);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <a href="/student/canteen" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="font-extrabold text-2xl text-white">Meal Plans</h1>
              <p className="text-xs text-[#C4B5FD]/70">Subscribe for hassle-free daily meals</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all"
          >
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>

        {/* Plan Cards (Browse) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_CONFIGS.map(plan => {
            const PlanIcon = plan.icon;
            return (
              <div key={plan.type} className="glass-panel rounded-2xl border border-white/5 p-5 hover:border-[#6C2BD9]/30 transition-all group text-center">
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-lg mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  {plan.emoji}
                </div>
                <h3 className="text-sm font-bold text-white">{plan.type}</h3>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{plan.description}</p>
                <p className="text-lg font-extrabold text-white mt-2">
                  ₹{plan.price_per_day}<span className="text-[10px] text-[#C4B5FD]/40 font-normal">/day</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Subscriptions */}
        {activeSubs.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> Active Plans
            </h2>
            {activeSubs.map(sub => {
              const config = PLAN_CONFIGS.find(p => p.type === sub.plan_type) || PLAN_CONFIGS[0];
              const start = new Date(sub.start_date);
              const end = new Date(sub.end_date);
              const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              const totalMeals = sub.plan_type === 'Complete' ? totalDays * 3 : totalDays;
              const usedMeals = totalMeals - sub.meals_remaining;
              const progress = Math.round((usedMeals / totalMeals) * 100);

              return (
                <div key={sub.id} className="glass-panel rounded-2xl border border-white/5 p-5 hover:border-[#6C2BD9]/20 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-lg shadow-lg`}>
                        {config.emoji}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{sub.plan_type} Plan</h3>
                        <p className="text-[10px] text-[#C4B5FD]/50">
                          {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-[#C4B5FD]/50 mb-1">
                      <span>{usedMeals} meals used</span>
                      <span>{sub.meals_remaining} remaining</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${config.color} transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#C4B5FD]/40">
                    <span>Paid: ₹{sub.amount_paid.toLocaleString()}</span>
                    <span>Cost/meal: ₹{Math.round(sub.amount_paid / totalMeals)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expired Subscriptions */}
        {expiredSubs.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-base text-[#C4B5FD]/50">Past Plans</h2>
            {expiredSubs.map(sub => {
              const config = PLAN_CONFIGS.find(p => p.type === sub.plan_type) || PLAN_CONFIGS[0];
              return (
                <div key={sub.id} className="glass-panel rounded-2xl border border-white/5 p-5 opacity-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-sm">
                        {config.emoji}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{sub.plan_type} Plan</h3>
                        <p className="text-[10px] text-[#C4B5FD]/40">
                          {new Date(sub.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(sub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">₹{sub.amount_paid}</p>
                      <span className="text-[10px] text-[#C4B5FD]/30">Completed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {subscriptions.length === 0 && (
          <div className="py-16 text-center">
            <CalendarCheck className="w-12 h-12 text-[#6C2BD9]/20 mx-auto mb-3" />
            <p className="text-sm text-[#C4B5FD]/40">No meal subscriptions yet. Choose a plan above!</p>
          </div>
        )}

        {/* Create Modal */}
        {showCreate && <CreateSubModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      </div>
    </main>
  );
}

function CreateSubModal({ onSave, onClose }: { onSave: (d: any) => void; onClose: () => void }) {
  const [plan, setPlan] = useState('Lunch');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const config = PLAN_CONFIGS.find(p => p.type === plan)!;
  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalCost = days * config.price_per_day;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || days <= 0) return;
    onSave({
      plan_type: plan,
      start_date: startDate,
      end_date: endDate,
      amount_paid: totalCost
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">Subscribe to Meal Plan</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-2">
            {PLAN_CONFIGS.map(p => (
              <button
                key={p.type}
                type="button"
                onClick={() => setPlan(p.type)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  plan === p.type
                    ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white'
                    : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:border-white/20'
                }`}
              >
                <span className="text-base">{p.emoji}</span>
                <div className="text-left">
                  <p className={plan === p.type ? 'text-white' : ''}>{p.type}</p>
                  <p className="text-[9px] opacity-60">₹{p.price_per_day}/day</p>
                </div>
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Start Date</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">End Date</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
          </div>

          {/* Cost Preview */}
          {days > 0 && (
            <div className="p-4 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#C4B5FD]/70">{days} days × ₹{config.price_per_day}</span>
                <span className="font-bold text-white">₹{totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#C4B5FD]/50">{plan === 'Complete' ? days * 3 : days} total meals</span>
                <span className="text-[#C4B5FD]/50">₹{Math.round(totalCost / (plan === 'Complete' ? days * 3 : days))}/meal</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#C4B5FD]/70 hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={days <= 0} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Subscribe • ₹{totalCost || '—'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
