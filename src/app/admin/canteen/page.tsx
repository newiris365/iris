"use client";

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, TrendingUp, ShoppingBag, Star, Clock,
  ArrowUpRight, ArrowDownRight, IndianRupee, Flame, Users
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

// Mock data for demo
const MOCK_ANALYTICS = {
  today_revenue: 24750,
  today_orders: 142,
  pending_orders: 8,
  avg_rating: 4.3,
  active_subscriptions: 56
};

const MOCK_TOP_ITEMS = [
  { name: 'Masala Dosa', orders: 34, revenue: 2720, trend: 12 },
  { name: 'Cold Coffee', orders: 28, revenue: 1680, trend: 8 },
  { name: 'Veg Biryani', orders: 22, revenue: 2860, trend: -3 },
  { name: 'Samosa (2pc)', orders: 19, revenue: 570, trend: 15 },
  { name: 'Paneer Tikka Roll', orders: 16, revenue: 1920, trend: 5 },
];

const MOCK_HOURLY = [
  { hour: '8AM', orders: 12 }, { hour: '9AM', orders: 8 },
  { hour: '10AM', orders: 18 }, { hour: '11AM', orders: 22 },
  { hour: '12PM', orders: 38 }, { hour: '1PM', orders: 28 },
  { hour: '2PM', orders: 15 }, { hour: '3PM', orders: 10 },
  { hour: '4PM', orders: 20 }, { hour: '5PM', orders: 14 },
];

const MOCK_RECENT_ORDERS = [
  { id: 'ORD-K8Z2M', student: 'Aarav Sharma', items: 3, total: 285, status: 'Preparing', time: '2m ago' },
  { id: 'ORD-J7Y1L', student: 'Priya Patel', items: 1, total: 60, status: 'Ready', time: '5m ago' },
  { id: 'ORD-H6X0K', student: 'Rohan Kumar', items: 2, total: 180, status: 'Received', time: '8m ago' },
  { id: 'ORD-G5W9J', student: 'Anisha Das', items: 4, total: 420, status: 'Delivered', time: '12m ago' },
  { id: 'ORD-F4V8I', student: 'Karan Singh', items: 2, total: 150, status: 'Delivered', time: '18m ago' },
];

const statusColors: Record<string, string> = {
  Received: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Delivered: 'bg-[#6C2BD9]/10 text-[#A78BFA] border-[#6C2BD9]/30',
  Cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function AdminCanteenDashboard() {
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/canteen/analytics');
      if (res.success && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.log('Using mock analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const maxOrders = Math.max(...MOCK_HOURLY.map(h => h.orders));

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white tracking-tight">Canteen Command Center</h1>
              <p className="text-xs text-[#C4B5FD]/70 mt-0.5">Real-time order analytics, revenue tracking & kitchen metrics</p>
            </div>
          </div>

          <div className="flex gap-2">
            <a href="/admin/canteen/menu" className="px-4 py-2.5 rounded-xl bg-[#13102A] border border-[#6C2BD9]/30 text-xs font-semibold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all">
              Menu Manager
            </a>
            <a href="/admin/canteen/orders" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all">
              Live Kitchen →
            </a>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Today's Revenue",
              value: `₹${analytics.today_revenue.toLocaleString()}`,
              icon: IndianRupee, color: 'from-emerald-500/20 to-emerald-500/5',
              iconColor: 'text-emerald-400', trend: '+18%', up: true
            },
            {
              label: 'Total Orders',
              value: analytics.today_orders,
              icon: ShoppingBag, color: 'from-blue-500/20 to-blue-500/5',
              iconColor: 'text-blue-400', trend: '+12%', up: true
            },
            {
              label: 'Pending Queue',
              value: analytics.pending_orders,
              icon: Clock, color: 'from-amber-500/20 to-amber-500/5',
              iconColor: 'text-amber-400', trend: null, up: false
            },
            {
              label: 'Avg Rating',
              value: analytics.avg_rating,
              icon: Star, color: 'from-yellow-500/20 to-yellow-500/5',
              iconColor: 'text-yellow-400', trend: '+0.2', up: true
            },
            {
              label: 'Active Subs',
              value: analytics.active_subscriptions,
              icon: Users, color: 'from-[#6C2BD9]/20 to-[#6C2BD9]/5',
              iconColor: 'text-[#A78BFA]', trend: '+5', up: true
            }
          ].map((kpi, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-[#6C2BD9]/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
                </div>
                {kpi.trend && (
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend}
                  </span>
                )}
              </div>
              <p className="text-xl lg:text-2xl font-extrabold text-white">{kpi.value}</p>
              <p className="text-[10px] text-[#C4B5FD]/60 mt-1 uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Middle Row: Chart + Top Items ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Hourly Order Volume */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5">
            <h2 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A78BFA]" />
              Hourly Order Volume
            </h2>
            <div className="flex items-end gap-2 h-44">
              {MOCK_HOURLY.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-[#C4B5FD]/50">{h.orders}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#6C2BD9] to-[#8B5CF6] transition-all hover:from-[#8B5CF6] hover:to-[#A78BFA]"
                    style={{ height: `${(h.orders / maxOrders) * 100}%`, minHeight: '8px' }}
                  />
                  <span className="text-[9px] text-[#C4B5FD]/50">{h.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h2 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Top Sellers Today
            </h2>
            <div className="flex flex-col gap-3">
              {MOCK_TOP_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-white/5 text-[#C4B5FD]/50'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-[#C4B5FD]/50">{item.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">₹{item.revenue}</p>
                    <span className={`text-[9px] font-mono ${item.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.trend > 0 ? '+' : ''}{item.trend}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Orders ──────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#A78BFA]" />
              Recent Orders
            </h2>
            <a href="/admin/canteen/orders" className="text-[10px] text-[#A78BFA] hover:text-white transition-colors font-semibold">
              View All →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left pb-3 font-medium">Order ID</th>
                  <th className="text-left pb-3 font-medium">Student</th>
                  <th className="text-center pb-3 font-medium">Items</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_ORDERS.map((order, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-xs font-mono font-bold text-[#A78BFA]">{order.id}</td>
                    <td className="py-3 text-xs text-white">{order.student}</td>
                    <td className="py-3 text-xs text-center text-[#C4B5FD]/70">{order.items}</td>
                    <td className="py-3 text-xs text-right font-semibold text-white">₹{order.total}</td>
                    <td className="py-3 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-[10px] text-right text-[#C4B5FD]/50">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
