"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Leaf, ShoppingBag, UtensilsCrossed, Wallet, ChevronRight } from 'lucide-react';
import { apiGet } from '../../lib/api';
import Skeleton from '../../components/Skeleton';

interface WalletData {
  balance: number;
  total_spent: number;
}

const MOCK_WALLET: WalletData = { balance: 2450, total_spent: 3200 };

const FEATURES = [
  {
    title: 'Pre-Order Meals',
    description: 'Reserve meals in advance and skip the queue. Pick your date, time slot, and food.',
    href: '/canteen/pre-order',
    icon: Clock,
    color: 'from-[#6C2BD9]/20 to-[#6C2BD9]/5',
    iconColor: 'text-[#A78BFA]',
  },
  {
    title: 'Meal Plans',
    description: 'Subscribe to weekly or monthly plans. Save time and money with daily meal selections.',
    href: '/canteen/meal-plans',
    icon: UtensilsCrossed,
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Track Order',
    description: 'Follow your live order status with real-time kitchen updates and alerts.',
    href: '/canteen/track/order1',
    icon: ShoppingBag,
    color: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-400',
  },
  {
    title: 'Nutrition Tracker',
    description: 'Monitor your daily calories, protein, carbs and fats with AI-powered insights.',
    href: '/canteen/nutrition',
    icon: Leaf,
    color: 'from-sky-500/20 to-sky-500/5',
    iconColor: 'text-sky-400',
  },
  {
    title: 'Browse Menu',
    description: 'Explore the full canteen menu with categories, prices and nutritional info.',
    href: '/student/canteen',
    icon: UtensilsCrossed,
    color: 'from-pink-500/20 to-pink-500/5',
    iconColor: 'text-pink-400',
  },
];

export default function CanteenHubPage() {
  const [wallet, setWallet] = useState<WalletData>(MOCK_WALLET);
  const [loading, setLoading] = useState(true);

  const studentId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('iris_user_profile') || '{}').id || 's0000000-0000-0000-0000-000000000001'
    : 's0000000-0000-0000-0000-000000000001';

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/canteen/wallet/${studentId}`);
      if (res.success && res.balance != null) {
        setWallet({ balance: res.balance, total_spent: res.total_spent || 0 });
      }
    } catch {
      console.log('Using mock wallet data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
          <UtensilsCrossed className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl md:text-2xl text-white">IRIS Canteen</h1>
          <p className="text-xs text-[#C4B5FD]/60">Order food, track meals, and manage your canteen experience</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider">Canteen Wallet</p>
            {loading ? (
              <Skeleton className="h-6 w-24 mt-1" />
            ) : (
              <p className="text-xl font-extrabold text-emerald-400">₹{wallet.balance.toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-[#C4B5FD]/40">Total Spent</p>
            <p className="text-sm font-bold text-white">₹{wallet.total_spent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <div className="glass-panel rounded-2xl border border-white/5 p-5 hover:border-[#6C2BD9]/30 transition-all group cursor-pointer h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-[#C4B5FD]/30 group-hover:text-[#A78BFA] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 leading-relaxed">{feature.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
