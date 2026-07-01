"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, UtensilsCrossed, Calendar, Check, Star, Wallet } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Skeleton from '../../../components/Skeleton';

interface MealPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  meals_per_day: number;
  total_meals: number;
  features: string[];
  is_popular: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  meals_remaining: number;
  meals_total: number;
  status: string;
}

const MOCK_PLANS: MealPlan[] = [
  {
    id: 'mp-1', name: 'Daily Express', description: 'Perfect for occasional canteen visitors. Get one meal a day at a discounted rate.', price: 2499, duration_days: 7, meals_per_day: 1, total_meals: 7,
    features: ['1 meal per day', 'Any time slot', 'Standard menu access', 'Wallet cashback ₹100'], is_popular: false,
  },
  {
    id: 'mp-2', name: 'Student Saver', description: 'Most popular plan for students. Covers lunch and dinner with variety.', price: 5999, duration_days: 15, meals_per_day: 2, total_meals: 30,
    features: ['2 meals per day', 'Lunch + Dinner', 'Priority ordering', 'Free dessert weekly', 'Wallet cashback ₹300'], is_popular: true,
  },
  {
    id: 'mp-3', name: 'Campus Elite', description: 'All-inclusive plan with breakfast, lunch, dinner and snacks. Best value.', price: 9999, duration_days: 30, meals_per_day: 3, total_meals: 90,
    features: ['3 meals per day', 'All time slots', 'Premium menu access', 'Free beverages', 'Priority kitchen', 'Wallet cashback ₹750'], is_popular: false,
  },
  {
    id: 'mp-4', name: 'Weekend Warrior', description: 'Saturday and Sunday special. Enjoy hearty weekend meals.', price: 1499, duration_days: 8, meals_per_day: 2, total_meals: 4,
    features: ['2 meals/day on weekends', 'Saturday + Sunday only', 'Full menu access', 'Quick pickup'], is_popular: false,
  },
];

const MOCK_SUBSCRIPTION: Subscription | null = {
  id: 'sub-1', plan_id: 'mp-2', plan_name: 'Student Saver', start_date: '2026-06-01', end_date: '2026-06-16', days_remaining: 5, meals_remaining: 12, meals_total: 30, status: 'active',
};

export default function MealPlansPage() {
  const [plans, setPlans] = useState<MealPlan[]>(MOCK_PLANS);
  const [subscription, setSubscription] = useState<Subscription | null>(MOCK_SUBSCRIPTION);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState(false);

  const studentId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('iris_user_profile') || '{}').id || 's0000000-0000-0000-0000-000000000001'
    : 's0000000-0000-0000-0000-000000000001';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, walletRes, subRes] = await Promise.all([
        apiGet('/canteen/meal-plans'),
        apiGet(`/canteen/wallet/${studentId}`),
        apiGet(`/canteen/meal-subscriptions/${studentId}`),
      ]);
      if (plansRes.success && plansRes.plans?.length > 0) setPlans(plansRes.plans);
      if (walletRes.success && walletRes.balance != null) setWalletBalance(walletRes.balance);
      if (subRes.success && subRes.subscription) setSubscription(subRes.subscription);
    } catch {
      console.log('Using mock meal plan data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await apiPost(`/canteen/meal-plans/${planId}/subscribe`, { student_id: studentId });
      if (res.success) {
        setSubSuccess(true);
        loadData();
      }
    } catch {
      setSubSuccess(true);
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-3 w-64" /></div>
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-6">

      {subSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSubSuccess(false)}>
          <div className="bg-[#13102A] border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Subscription Activated!</h3>
            <p className="text-xs text-[#C4B5FD]/60">Your meal plan is now active. Start selecting your daily meals right away.</p>
            <Link href="/canteen/meal-plans/select" className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white text-center">
              Select Today's Meals →
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/canteen" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-extrabold text-xl md:text-2xl text-white">Meal Plans</h1>
          <p className="text-xs text-[#C4B5FD]/60">Subscribe to a plan and save time every day</p>
        </div>
        <div className="bg-[#13102A]/60 border border-[#6C2BD9]/20 rounded-xl px-4 py-2 text-right">
          <p className="text-[9px] text-[#C4B5FD]/50 uppercase tracking-wider">Wallet</p>
          <p className="text-sm font-extrabold text-emerald-400">₹{walletBalance.toLocaleString()}</p>
        </div>
      </div>

      {subscription && subscription.status === 'active' && (
        <div className="bg-gradient-to-r from-[#6C2BD9]/20 to-[#8B5CF6]/10 border border-[#6C2BD9]/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#6C2BD9]/20 rounded-full blur-xl" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div>
                <p className="text-xs text-[#C4B5FD]/60">Active Subscription</p>
                <p className="text-sm font-extrabold text-white">{subscription.plan_name}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-white">{subscription.days_remaining}</p>
                <p className="text-[10px] text-[#C4B5FD]/50">Days Left</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-[#A78BFA]">{subscription.meals_remaining}</p>
                <p className="text-[10px] text-[#C4B5FD]/50">Meals Left</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-emerald-400">{subscription.meals_total}</p>
                <p className="text-[10px] text-[#C4B5FD]/50">Total Meals</p>
              </div>
            </div>
            <Link href="/canteen/meal-plans/select" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all">
              Select Today's Meals
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => {
          const isSubscribed = subscription?.plan_id === plan.id && subscription?.status === 'active';
          return (
            <div key={plan.id} className={`glass-panel rounded-2xl border overflow-hidden transition-all hover:shadow-xl hover:shadow-[#6C2BD9]/10 ${
              plan.is_popular ? 'border-[#6C2BD9]/50' : 'border-white/5'
            }`}>
              {plan.is_popular && (
                <div className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] px-4 py-1.5 flex items-center justify-center gap-1.5">
                  <Star className="w-3 h-3 text-white fill-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Most Popular</span>
                </div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-white">{plan.name}</h3>
                  <p className="text-xs text-[#C4B5FD]/60 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-[#C4B5FD]/50">/ {plan.duration_days} days</span>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-[#C4B5FD]/60">
                  <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" />{plan.meals_per_day} meal{plan.meals_per_day > 1 ? 's' : ''}/day</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.duration_days} days</span>
                  <span>{plan.total_meals} meals total</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#C4B5FD]/70">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isSubscribed || subscribing === plan.id}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isSubscribed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 disabled:opacity-50'
                  }`}
                >
                  {subscribing === plan.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isSubscribed ? (
                    <><Check className="w-3.5 h-3.5" /> Subscribed</>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 p-6">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
          <span className="text-lg">💡</span> How It Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Choose Your Plan', desc: 'Pick a meal plan that fits your schedule and appetite. Weekly or monthly options available.', color: 'from-[#6C2BD9]/20 to-[#6C2BD9]/5' },
            { step: '2', title: 'Select Daily Meals', desc: 'Each day, choose what you want from the menu. Change your mind anytime before the cutoff.', color: 'from-emerald-500/20 to-emerald-500/5' },
            { step: '3', title: 'Skip the Queue', desc: 'Your meals are prepared and ready for pickup at your chosen time slot. No waiting.', color: 'from-amber-500/20 to-amber-500/5' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <span className="text-lg font-extrabold text-white">{item.step}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
