"use client";

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, TrendingUp, ShoppingBag, Clock, IndianRupee, RefreshCw
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

const statusColors: Record<string, string> = {
  placed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  confirmed: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  delivered: 'bg-[#6C2BD9]/10 text-[#A78BFA] border-[#6C2BD9]/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function AdminCanteenPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, menuRes, salesRes] = await Promise.all([
          apiGet('campusCore/vendor/orders'),
          apiGet('campusCore/canteen-menu'),
          apiGet('campusCore/vendor/sales'),
        ]);
        if (ordersRes.success) setOrders(ordersRes.orders || []);
        if (menuRes.success) setMenu(menuRes.menu || []);
        if (salesRes.success) setAnalytics(salesRes);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const todayOrders = orders.length;
  const pendingOrders = orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)).length;
  const todayRevenue = analytics?.total_revenue || orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-orange-400 animate-pulse">Loading canteen data...</div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <UtensilsCrossed size={24} className="text-orange-400" />
        Canteen Management
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today Revenue', value: `₹${todayRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-400' },
          { label: 'Total Orders', value: todayOrders, icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'Pending', value: pendingOrders, icon: Clock, color: 'text-amber-400' },
          { label: 'Menu Items', value: menu.length, icon: UtensilsCrossed, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Orders (KOT)', href: '/admin/canteen/orders', color: 'bg-orange-500/20 text-orange-400' },
          { label: 'Menu', href: '/admin/canteen/menu', color: 'bg-emerald-500/20 text-emerald-400' },
          { label: 'Wallets', href: '/admin/canteen/wallets', color: 'bg-violet-500/20 text-violet-400' },
          { label: 'Reports', href: '/admin/canteen/reports', color: 'bg-blue-500/20 text-blue-400' },
        ].map(a => (
          <a key={a.label} href={a.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 ${a.color} hover:opacity-80 transition-all`}>
            <span className="text-sm font-medium">{a.label}</span>
          </a>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-slate-400 text-sm">No orders today.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 8).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{o.order_number || o.id?.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">{o.student_name || 'Student'} — ₹{o.total_amount}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[o.status] || 'bg-slate-500/10 text-slate-400'}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
