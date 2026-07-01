"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Flame, Award, Calendar, ChevronRight,
  TrendingUp, Activity, Check, Heart, ShieldCheck
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

interface DailyTotal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealLog {
  id: string;
  item_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

const MOCK_TOTALS: DailyTotal = {
  calories: 1420,
  protein: 58,
  carbs: 185,
  fat: 42
};

const TARGET_GOALS: DailyTotal = {
  calories: 2200,
  protein: 75,
  carbs: 250,
  fat: 65
};

const MOCK_MEALS: MealLog[] = [
  { id: '1', item_name: 'Paneer Tikka Roll', calories: 420, protein_g: 14, carbs_g: 45, fat_g: 15, created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
  { id: '1.5', item_name: 'Samosa (2pc)', calories: 260, protein_g: 4, carbs_g: 35, fat_g: 12, created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
  { id: '2', item_name: 'Masala Dosa', calories: 350, protein_g: 8, carbs_g: 50, fat_g: 10, created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: '3', item_name: 'Cold Coffee', calories: 250, protein_g: 5, carbs_g: 30, fat_g: 8, created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString() },
  { id: '4', item_name: 'Veg Biryani', calories: 520, protein_g: 12, carbs_g: 80, fat_g: 16, created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
];

export default function StudentNutritionPage() {
  const router = useRouter();
  const [totals, setTotals] = useState<DailyTotal>(MOCK_TOTALS);
  const [meals, setMeals] = useState<MealLog[]>(MOCK_MEALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNutrition();
  }, []);

  const loadNutrition = async () => {
    setLoading(true);
    const mockStudentId = 's0000000-0000-0000-0000-000000000001';
    try {
      const res = await apiGet(`/canteen/nutrition/${mockStudentId}`);
      if (res.success && res.nutrition) {
        setTotals(res.nutrition.totals || MOCK_TOTALS);
        setMeals(res.nutrition.meals || MOCK_MEALS);
      }
    } catch (err) {
      console.log('Using mock nutrition data');
    } finally {
      setLoading(false);
    }
  };

  const calPercentage = Math.min(100, Math.round((totals.calories / TARGET_GOALS.calories) * 100));
  const proteinPercentage = Math.min(100, Math.round((totals.protein / TARGET_GOALS.protein) * 100));
  const carbsPercentage = Math.min(100, Math.round((totals.carbs / TARGET_GOALS.carbs) * 100));
  const fatPercentage = Math.min(100, Math.round((totals.fat / TARGET_GOALS.fat) * 100));

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-extrabold text-xl md:text-2xl text-white">IRIS FitNutrition Tracker</h1>
          <p className="text-xs text-[#C4B5FD]/60">Daily caloric limits, protein levels, and historical meal diagnostics</p>
        </div>
      </div>

      {/* Main Calorie Ring Progress Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Calorie Card */}
        <div className="md:col-span-2 glass-panel rounded-3xl border border-[#6C2BD9]/30 p-6 flex flex-col sm:flex-row items-center justify-around gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#8B5CF6]/10 rounded-full blur-xl" />
          
          {/* Circular SVG Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle 
                cx="72" cy="72" r="62" 
                className="stroke-white/5 fill-none" 
                strokeWidth="12" 
              />
              <circle 
                cx="72" cy="72" r="62" 
                className="stroke-[#6C2BD9] fill-none transition-all duration-1000" 
                strokeWidth="12" 
                strokeDasharray={390}
                strokeDashoffset={390 - (390 * calPercentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
              <span className="text-2xl font-black mt-1">{totals.calories}</span>
              <span className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold tracking-wider">kcal logged</span>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-white">Daily Calorie Target</span>
                <span className="text-[#A78BFA]">{calPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all duration-1000"
                  style={{ width: `${calPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#C4B5FD]/40 mt-1">
                <span>0 kcal</span>
                <span>Goal: {TARGET_GOALS.calories} kcal</span>
              </div>
            </div>

            <div className="bg-[#13102A]/85 border border-[#6C2BD9]/15 rounded-xl p-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-[#C4B5FD]/75 leading-relaxed">
                {calPercentage > 85 ? 'You are close to your daily intake threshold.' : 'Excellent pacing! You have room for high-protein options.'}
              </span>
            </div>
          </div>
        </div>

        {/* Nutritional Score Card */}
        <div className="glass-panel rounded-3xl border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold">Safe</span>
          </div>
          <div>
            <div className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-widest font-semibold">Canteen Diet Rating</div>
            <div className="text-3xl font-black text-white mt-1">Balanced</div>
            <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-relaxed">Your orders suggest a healthy mix of vegetable grains and protein intake.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-[#C4B5FD]/40">
            <span>Verified by AI Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Macros breakdown */}
      <div className="glass-panel rounded-2xl border border-white/5 p-6">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#A78BFA]" /> Macro-nutrient Performance Dials
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Protein */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C4B5FD]/75 font-semibold">Protein (Muscle/Repair)</span>
              <span className="text-white font-bold">{totals.protein}g / {TARGET_GOALS.protein}g</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full" 
                style={{ width: `${proteinPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">{proteinPercentage}% Completed</span>
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C4B5FD]/75 font-semibold">Carbohydrates (Energy)</span>
              <span className="text-white font-bold">{totals.carbs}g / {TARGET_GOALS.carbs}g</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full" 
                style={{ width: `${carbsPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-yellow-400 font-semibold">{carbsPercentage}% Completed</span>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#C4B5FD]/75 font-semibold">Fats (Hormonal Balance)</span>
              <span className="text-white font-bold">{totals.fat}g / {TARGET_GOALS.fat}g</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400 rounded-full" 
                style={{ width: `${fatPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-red-400 font-semibold">{fatPercentage}% Completed</span>
          </div>
        </div>
      </div>

      {/* Historical logs */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#A78BFA]" /> Recent Dining Calorie Audits
          </h3>
          <span className="text-xs text-[#C4B5FD]/50">Past 48 Hours</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {meals.map((m, idx) => (
            <div key={idx} className="px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6C2BD9]/15 border border-[#6C2BD9]/30 flex items-center justify-center font-bold text-xs text-[#A78BFA]">
                  {m.item_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{m.item_name}</h4>
                  <p className="text-[10px] text-[#C4B5FD]/45 mt-0.5">
                    Logged: {new Date(m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:self-center ml-11 sm:ml-0">
                <div className="flex gap-3 text-[10px] text-[#C4B5FD]/60">
                  <span>P: <strong className="text-white">{m.protein_g}g</strong></span>
                  <span>C: <strong className="text-white">{m.carbs_g}g</strong></span>
                  <span>F: <strong className="text-white">{m.fat_g}g</strong></span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-orange-400">+{m.calories} kcal</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
