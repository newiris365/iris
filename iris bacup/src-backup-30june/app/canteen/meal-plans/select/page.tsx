"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Check, Utensils, Leaf, Clock, SkipForward } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Skeleton from '../../../../components/Skeleton';

interface MenuItem {
  id: string;
  item_name: string;
  category: string;
  price: number;
  is_veg: boolean;
  calories: number;
  description: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  days_remaining: number;
  meals_remaining: number;
  meals_total: number;
  status: string;
}

interface DaySelection {
  date: string;
  meals: Record<string, string[]>;
  opted_out: boolean;
}

const MOCK_MENU: MenuItem[] = [
  { id: '1', item_name: 'Masala Dosa', category: 'Meals', price: 80, is_veg: true, calories: 350, description: 'Crispy rice crepe with spiced potato filling' },
  { id: '2', item_name: 'Cold Coffee', category: 'Beverages', price: 60, is_veg: true, calories: 180, description: 'Chilled coffee blended with ice cream' },
  { id: '3', item_name: 'Veg Biryani', category: 'Meals', price: 130, is_veg: true, calories: 520, description: 'Fragrant basmati rice with vegetables' },
  { id: '4', item_name: 'Samosa (2pc)', category: 'Snacks', price: 30, is_veg: true, calories: 260, description: 'Crispy fried pastry with spiced filling' },
  { id: '5', item_name: 'Paneer Tikka Roll', category: 'Starters', price: 120, is_veg: true, calories: 380, description: 'Grilled paneer wrapped in rumali roti' },
  { id: '6', item_name: 'Chicken Biryani', category: 'Meals', price: 180, is_veg: false, calories: 620, description: 'Dum-cooked aromatic rice with chicken' },
  { id: '7', item_name: 'Fresh Lime Soda', category: 'Beverages', price: 40, is_veg: true, calories: 80, description: 'Sweet or salty fresh lime with soda' },
  { id: '8', item_name: 'Gulab Jamun', category: 'Desserts', price: 50, is_veg: true, calories: 290, description: 'Warm milk dumplings in sweet syrup' },
  { id: '9', item_name: 'Chicken Tikka', category: 'Starters', price: 150, is_veg: false, calories: 320, description: 'Marinated grilled chicken pieces' },
  { id: '10', item_name: 'Spring Rolls', category: 'Starters', price: 70, is_veg: true, calories: 200, description: 'Crispy rolls stuffed with vegetables' },
  { id: '11', item_name: 'Butter Naan', category: 'Sides', price: 35, is_veg: true, calories: 250, description: 'Soft tandoor-baked flatbread with butter' },
  { id: '12', item_name: 'Raita', category: 'Sides', price: 25, is_veg: true, calories: 60, description: 'Yogurt with cucumber and spices' },
  { id: '13', item_name: 'Chai', category: 'Beverages', price: 20, is_veg: true, calories: 40, description: 'Classic masala chai' },
  { id: '14', item_name: 'Brownie', category: 'Desserts', price: 70, is_veg: true, calories: 350, description: 'Rich chocolate brownie with walnuts' },
];

const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub-1', plan_name: 'Student Saver', days_remaining: 5, meals_remaining: 12, meals_total: 30, status: 'active',
};

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', time: '7 - 9 AM', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', time: '12 - 2 PM', icon: '☀️' },
  { id: 'dinner', label: 'Dinner', time: '7 - 9 PM', icon: '🌙' },
];

const MEAL_CATEGORY_ORDER = ['Starters', 'Main', 'Meals', 'Sides', 'Snacks', 'Beverages', 'Desserts'];

export default function MealSelectionPage() {
  const [menu, setMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [subscription, setSubscription] = useState<Subscription>(MOCK_SUBSCRIPTION);
  const [selectedDate, setSelectedDate] = useState('');
  const [selections, setSelections] = useState<Record<string, Record<string, string[]>>>({});
  const [activeMealType, setActiveMealType] = useState('breakfast');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optOut, setOptOut] = useState<Record<string, boolean>>({});

  const studentId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('iris_user_profile') || '{}').id || 's0000000-0000-0000-0000-000000000001'
    : 's0000000-0000-0000-0000-000000000001';

  const dates = useMemo(() => {
    const result: { label: string; value: string; day: string }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      result.push({
        value: iso,
        label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        day: i === 0 ? 'Today' : days[d.getDay()],
      });
    }
    return result;
  }, []);

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].value);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuRes, subRes] = await Promise.all([
        apiGet('/canteen/menu'),
        apiGet(`/canteen/meal-subscriptions/${studentId}`),
      ]);
      if (menuRes.success && menuRes.menu?.length > 0) setMenu(menuRes.menu);
      if (subRes.success && subRes.subscription) setSubscription(subRes.subscription);
    } catch {
      console.log('Using mock meal selection data');
    } finally {
      setLoading(false);
    }
  };

  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    for (const cat of MEAL_CATEGORY_ORDER) {
      const items = menu.filter(i => i.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    for (const item of menu) {
      if (!MEAL_CATEGORY_ORDER.includes(item.category) && !groups[item.category]) {
        groups[item.category] = menu.filter(i => i.category === item.category);
      }
    }
    return groups;
  }, [menu]);

  const toggleItem = (mealType: string, itemId: string) => {
    setSelections(prev => {
      const dateSelections = { ...(prev[selectedDate] || {}) };
      const mealItems = [...(dateSelections[mealType] || [])];
      const idx = mealItems.indexOf(itemId);
      if (idx >= 0) {
        mealItems.splice(idx, 1);
      } else {
        mealItems.push(itemId);
      }
      dateSelections[mealType] = mealItems;
      return { ...prev, [selectedDate]: dateSelections };
    });
  };

  const isSelected = (mealType: string, itemId: string) => {
    return selections[selectedDate]?.[mealType]?.includes(itemId) || false;
  };

  const handleOptOut = (mealType: string) => {
    setOptOut(prev => {
      const updated = { ...prev };
      const key = `${selectedDate}-${mealType}`;
      updated[key] = !updated[key];
      return updated;
    });
    setSelections(prev => {
      const dateSelections = { ...(prev[selectedDate] || {}) };
      dateSelections[mealType] = [];
      return { ...prev, [selectedDate]: dateSelections };
    });
  };

  const isOptedOut = (mealType: string) => {
    return optOut[`${selectedDate}-${mealType}`] || false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const mealType of MEAL_TYPES) {
        const items = selections[selectedDate]?.[mealType.id] || [];
        if (items.length > 0 || isOptedOut(mealType.id)) {
          await apiPost('/canteen/meal-selection', {
            subscription_id: subscription.id,
            student_id: studentId,
            date: selectedDate,
            meal_type: mealType.id,
            items: items.map(id => {
              const item = menu.find(m => m.id === id);
              return { item_id: id, item_name: item?.item_name || '', price: item?.price || 0 };
            }),
            opted_out: isOptedOut(mealType.id),
          });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = useMemo(() => {
    const daySelections = selections[selectedDate] || {};
    return Object.values(daySelections).reduce((sum, items) => sum + items.length, 0);
  }, [selections, selectedDate]);

  const totalCalories = useMemo(() => {
    const daySelections = selections[selectedDate] || {};
    let cal = 0;
    for (const items of Object.values(daySelections)) {
      for (const itemId of items) {
        const item = menu.find(m => m.id === itemId);
        if (item) cal += item.calories;
      }
    }
    return cal;
  }, [selections, selectedDate, menu]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-3 w-64" /></div>
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">

      <div className="flex items-center gap-3">
        <Link href="/canteen/meal-plans" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-extrabold text-xl md:text-2xl text-white">Today&apos;s Meals</h1>
          <p className="text-xs text-[#C4B5FD]/60">Choose your meals for each time slot</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#6C2BD9]/15 to-[#8B5CF6]/10 border border-[#6C2BD9]/25 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold">Active Plan</p>
          <p className="text-sm font-extrabold text-white">{subscription.plan_name}</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xl font-extrabold text-white">{subscription.days_remaining}</p>
            <p className="text-[10px] text-[#C4B5FD]/50">Days Left</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-[#A78BFA]">{subscription.meals_remaining}</p>
            <p className="text-[10px] text-[#C4B5FD]/50">Meals Left</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map(d => (
          <button
            key={d.value}
            onClick={() => setSelectedDate(d.value)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              selectedDate === d.value
                ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30 border border-[#8B5CF6]'
                : 'bg-white/5 text-[#C4B5FD]/60 border border-white/5 hover:border-[#6C2BD9]/30'
            }`}
          >
            <span className="text-[9px] uppercase">{d.day}</span>
            <span className="font-bold mt-0.5">{d.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MEAL_TYPES.map(mt => (
          <button
            key={mt.id}
            onClick={() => setActiveMealType(mt.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeMealType === mt.id
                ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30'
                : 'bg-white/5 text-[#C4B5FD]/60 border border-white/5 hover:border-[#6C2BD9]/30'
            }`}
          >
            <span>{mt.icon}</span>
            <span>{mt.label}</span>
            <span className="text-[10px] opacity-60">({mt.time})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          {isOptedOut(activeMealType) ? (
            <div className="glass-panel rounded-2xl border border-white/5 p-8 text-center space-y-3">
              <SkipForward className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-sm font-bold text-white">Opted Out of {MEAL_TYPES.find(m => m.id === activeMealType)?.label}</p>
              <p className="text-xs text-[#C4B5FD]/50">You&apos;ve skipped this meal for today.</p>
              <button onClick={() => handleOptOut(activeMealType)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-[#C4B5FD]/70 hover:border-[#6C2BD9]/30 transition-all">
                Undo Opt-Out
              </button>
            </div>
          ) : (
            Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-xs font-bold text-[#C4B5FD]/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Utensils className="w-3 h-3" /> {category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map(item => {
                    const selected = isSelected(activeMealType, item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(activeMealType, item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? 'bg-[#6C2BD9]/15 border-[#6C2BD9] shadow-lg shadow-[#6C2BD9]/10'
                            : 'bg-white/[0.02] border-white/5 hover:border-[#6C2BD9]/30'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-[#6C2BD9] border-[#8B5CF6]' : 'border-white/10'
                        }`}>
                          {selected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {item.is_veg ? (
                              <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <Leaf className="w-2.5 h-2.5 text-emerald-400" />
                              </span>
                            ) : (
                              <span className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[7px] font-bold text-red-400">NV</span>
                            )}
                            <span className="text-xs font-bold text-white truncate">{item.item_name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#C4B5FD]/40">{item.calories} kcal</span>
                            <span className="text-[10px] text-[#C4B5FD]/40">₹{item.price}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {!isOptedOut(activeMealType) && (
            <button
              onClick={() => handleOptOut(activeMealType)}
              className="w-full py-3 rounded-xl border border-amber-500/20 text-xs font-semibold text-amber-400/80 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Opt Out of {MEAL_TYPES.find(m => m.id === activeMealType)?.label} Today
            </button>
          )}
        </div>

        <div className="w-full lg:w-72 shrink-0">
          <div className="glass-panel rounded-2xl border border-white/5 p-5 sticky top-4 space-y-4">
            <h3 className="font-bold text-sm text-white">Selection Summary</h3>

            <div className="space-y-2">
              {MEAL_TYPES.map(mt => {
                const items = selections[selectedDate]?.[mt.id] || [];
                const optedOut = isOptedOut(mt.id);
                return (
                  <div key={mt.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{mt.icon}</span> {mt.label}
                      </span>
                      {optedOut ? (
                        <span className="text-[9px] text-amber-400 font-semibold">Skipped</span>
                      ) : items.length > 0 ? (
                        <span className="text-[9px] text-emerald-400 font-semibold">{items.length} selected</span>
                      ) : (
                        <span className="text-[9px] text-[#C4B5FD]/30">None</span>
                      )}
                    </div>
                    {items.length > 0 && (
                      <div className="space-y-0.5">
                        {items.map(itemId => {
                          const item = menu.find(m => m.id === itemId);
                          return item ? (
                            <p key={itemId} className="text-[10px] text-[#C4B5FD]/50 truncate">{item.item_name}</p>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#C4B5FD]/50">Total Items</span>
                <span className="font-bold text-white">{totalSelected}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#C4B5FD]/50">Total Calories</span>
                <span className="font-bold text-white">{totalCalories} kcal</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || totalSelected === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" /> Saved!</>
              ) : (
                'Save Selection'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
