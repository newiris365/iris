"use client";

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface MealSub {
  student_id: string;
  student_name: string;
  roll_number: string;
  room_number: string;
  plan_name: string;
  meals_total: number;
  meals_used: number;
  meals_remaining: number;
  subscription_status: string;
  start_date: string;
  end_date: string;
}

export default function WardenMealsPage() {
  const [subscriptions, setSubscriptions] = useState<MealSub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await apiGet('hostel/blocks');
      if (res.success) {
        setBlocks(res.blocks || []);
        if (res.blocks?.length > 0) setSelectedBlock(res.blocks[0].id);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedBlock) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await apiGet('campusCore/hostel/meal-subscriptions', { blockId: selectedBlock });
        if (res.success) setSubscriptions(res.subscriptions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedBlock]);

  const totalMeals = subscriptions.reduce((acc, s) => acc + s.meals_total, 0);
  const usedMeals = subscriptions.reduce((acc, s) => acc + s.meals_used, 0);
  const lowMeals = subscriptions.filter(s => s.meals_remaining <= 3 && s.meals_remaining > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <UtensilsCrossed size={24} className="text-orange-400" />
        Meal Subscriptions
      </h1>

      <select value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)}
        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
        <option value="">Select Block</option>
        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
          <p className="text-xs text-slate-400">Active Subscriptions</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-2xl font-bold text-orange-400">{usedMeals}/{totalMeals}</p>
          <p className="text-xs text-slate-400">Meals Used / Total</p>
        </div>
        <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-400">{lowMeals.length}</p>
          <p className="text-xs text-slate-400">Low Meal Balance</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-50" />
          <p>No active meal subscriptions for this block.</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10 bg-white/5">
                <th className="p-3">Student</th>
                <th className="p-3">Room</th>
                <th className="p-3">Plan</th>
                <th className="p-3 text-center">Meals Used</th>
                <th className="p-3 text-center">Remaining</th>
                <th className="p-3">Valid Till</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(s => (
                <tr key={s.student_id} className={`border-b border-white/5 ${s.meals_remaining <= 3 ? 'bg-amber-500/5' : ''}`}>
                  <td className="p-3">
                    <p className="text-white font-medium">{s.student_name}</p>
                    <p className="text-xs text-slate-400">{s.roll_number}</p>
                  </td>
                  <td className="p-3 text-slate-300">{s.room_number}</td>
                  <td className="p-3 text-slate-300">{s.plan_name || 'Standard'}</td>
                  <td className="p-3 text-center text-slate-300">{s.meals_used}/{s.meals_total}</td>
                  <td className="p-3 text-center">
                    <span className={`font-semibold ${
                      s.meals_remaining <= 3 ? 'text-red-400' : s.meals_remaining <= 10 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {s.meals_remaining}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">{s.end_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
