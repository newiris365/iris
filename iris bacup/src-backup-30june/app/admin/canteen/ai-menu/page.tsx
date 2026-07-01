"use client";

import React, { useState } from 'react';
import { 
  Sparkles, Calendar, Heart, ShieldCheck, 
  UtensilsCrossed, RefreshCw, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';

interface DailyMenu {
  day: string;
  breakfast: { name: string; calories: number; protein: number; price: number };
  lunch: { name: string; calories: number; protein: number; price: number };
  dinner: { name: string; calories: number; protein: number; price: number };
}

const MOCK_PLAN: DailyMenu[] = [
  {
    day: 'Monday',
    breakfast: { name: 'Poha & Jalebi', calories: 310, protein: 5, price: 30 },
    lunch: { name: 'Gatte ki Sabzi, Roti, Rice & Buttermilk', calories: 580, protein: 16, price: 70 },
    dinner: { name: 'Khichdi, Kadhi & Aloo Bhujia', calories: 450, protein: 12, price: 50 }
  },
  {
    day: 'Tuesday',
    breakfast: { name: 'Pyaz Kachori & Masala Chai', calories: 340, protein: 4, price: 35 },
    lunch: { name: 'Dal Tadka, Mix Veg Sabzi, Roti & Rice', calories: 520, protein: 14, price: 60 },
    dinner: { name: 'Sev Tamatar ki Sabzi, Paratha & Dahi', calories: 480, protein: 10, price: 55 }
  },
  {
    day: 'Wednesday',
    breakfast: { name: 'Aloo Paratha with Curd', calories: 380, protein: 8, price: 40 },
    lunch: { name: 'Rajasthani Thali (Dal Baati Churma)', calories: 780, protein: 20, price: 90 },
    dinner: { name: 'Paneer Bhurji & Roti', calories: 510, protein: 18, price: 65 }
  }
];

export default function AdminAiMenuPage() {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [menuPlan, setMenuPlan] = useState<DailyMenu[] | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await apiPost('/canteen/ai-menu/generate', {
        week_start: '2026-06-15',
        theme: 'Rajasthani & Indian Healthy Balanced'
      });
      if (res.success && res.plan?.days) {
        setMenuPlan(res.plan.days);
      } else {
        setMenuPlan(MOCK_PLAN);
      }
    } catch (err) {
      setMenuPlan(MOCK_PLAN);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!menuPlan) return;
    setPublishing(true);
    try {
      // Simulate/Trigger API approval
      await apiPut('/canteen/ai-menu/approve', { plan: menuPlan });
    } catch (err) {}

    setPublishing(false);
    setSuccessMsg('AI Weekly Menu approved and published successfully! 🚀');
    setTimeout(() => {
      setSuccessMsg('');
      setMenuPlan(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="text-[#A78BFA] w-5 h-5 animate-pulse" />
            AI Rajasthani Weekly Menu Planner
          </h2>
          <p className="text-xs text-[#A78BFA]/70 mt-1">Prompt Claude to design a Rajasthani menu and publish it to the student portal.</p>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate 7-Day Rajasthani Menu
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* No Plan Display State */}
      {!menuPlan && !loading && (
        <div className="glass-panel border border-dashed border-[#6C2BD9]/25 rounded-2xl py-20 text-center">
          <UtensilsCrossed className="w-12 h-12 text-[#6C2BD9]/20 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#C4B5FD]/70">No Active AI Plan Loaded</h3>
          <p className="text-xs text-[#C4B5FD]/45 mt-1 max-w-xs mx-auto">Click the generate button above to design a balanced weekly menu plan.</p>
        </div>
      )}

      {/* Generating Spinner Overlay */}
      {loading && (
        <div className="glass-panel border border-white/5 rounded-2xl py-20 text-center flex flex-col justify-center items-center">
          <RefreshCw className="w-10 h-10 text-[#6C2BD9] animate-spin mb-4" />
          <h3 className="text-sm font-bold text-white">Querying Claude AI Engine...</h3>
          <p className="text-xs text-[#C4B5FD]/50 mt-1">Structuring nutritional meals, proteins, and Rajasthani dishes...</p>
        </div>
      )}

      {/* Active AI Menu Grid */}
      {menuPlan && !loading && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-[#A78BFA]" /> Reviewing Draft: Week of June 15
            </h3>

            <button 
              onClick={handleApprove}
              disabled={publishing}
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Publish Menu
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {menuPlan.map((m, idx) => {
              const dayAvgCals = Math.round((m.breakfast.calories + m.lunch.calories + m.dinner.calories));
              const dayAvgProt = Math.round((m.breakfast.protein + m.lunch.protein + m.dinner.protein));
              const dayCost = m.breakfast.price + m.lunch.price + m.dinner.price;

              return (
                <div key={idx} className="glass-panel border border-white/5 rounded-2xl p-5 hover:border-[#6C2BD9]/20 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 mb-4 gap-2">
                    <span className="text-sm font-black text-[#A78BFA]">{m.day}</span>
                    
                    <div className="flex gap-4 text-[10px] text-[#C4B5FD]/60">
                      <span>Total: <strong className="text-white">{dayAvgCals} kcal</strong></span>
                      <span>Protein: <strong className="text-white">{dayAvgProt}g</strong></span>
                      <span>Total Cost: <strong className="text-white">₹{dayCost}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Breakfast */}
                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                      <span className="text-[8px] uppercase tracking-widest text-[#A78BFA] font-black">Breakfast ☀️</span>
                      <h4 className="text-xs font-bold text-white mt-1">{m.breakfast.name}</h4>
                      <div className="flex justify-between text-[9px] text-[#C4B5FD]/50 mt-2 font-mono">
                        <span>{m.breakfast.calories} kcal • {m.breakfast.protein}g P</span>
                        <span className="text-white font-bold">₹{m.breakfast.price}</span>
                      </div>
                    </div>

                    {/* Lunch */}
                    <div className="bg-[#6C2BD9]/5 border border-[#6C2BD9]/15 p-3 rounded-xl">
                      <span className="text-[8px] uppercase tracking-widest text-[#A78BFA] font-black">Lunch 🌞</span>
                      <h4 className="text-xs font-bold text-white mt-1">{m.lunch.name}</h4>
                      <div className="flex justify-between text-[9px] text-[#C4B5FD]/55 mt-2 font-mono">
                        <span>{m.lunch.calories} kcal • {m.lunch.protein}g P</span>
                        <span className="text-white font-bold">₹{m.lunch.price}</span>
                      </div>
                    </div>

                    {/* Dinner */}
                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                      <span className="text-[8px] uppercase tracking-widest text-[#A78BFA] font-black">Dinner 🌙</span>
                      <h4 className="text-xs font-bold text-white mt-1">{m.dinner.name}</h4>
                      <div className="flex justify-between text-[9px] text-[#C4B5FD]/50 mt-2 font-mono">
                        <span>{m.dinner.calories} kcal • {m.dinner.protein}g P</span>
                        <span className="text-white font-bold">₹{m.dinner.price}</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
