"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ClipboardList, TrendingUp, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function VendorDashboard() {
  const [sales, setSales] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [salesRes, ordersRes] = await Promise.all([
          apiGet('campusCore/vendor/sales'),
          apiGet('campusCore/vendor/orders'),
        ]);
        if (salesRes.success) setSales(salesRes);
        if (ordersRes.success) setOrders(ordersRes.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-orange-400 animate-pulse">Loading...</div></div>;
  }

  const activeOrders = orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <LayoutDashboard size={24} className="text-orange-400" />
        Canteen Dashboard
      </h1>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: sales?.total_orders || 0, icon: ClipboardList, color: 'text-blue-400' },
          { label: 'Revenue', value: `₹${sales?.total_revenue || 0}`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Active Orders', value: activeOrders.length, icon: Clock, color: 'text-amber-400' },
          { label: 'Ready to Pick', value: readyOrders.length, icon: CheckCircle2, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Live Orders', href: '/vendor/orders', color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
          { label: 'Menu Mgmt', href: '/vendor/menu', color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
          { label: 'Daily Sales', href: '/vendor/sales', color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
          { label: 'Prep List', href: '/vendor/prep', color: 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' },
        ].map(a => (
          <a key={a.label} href={a.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 transition-colors ${a.color}`}>
            <span className="text-sm font-medium">{a.label}</span>
          </a>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-slate-400 text-sm">No orders today.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{o.order_number || o.id?.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">{o.student_name || '—'} — ₹{o.total_amount}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  o.status === 'placed' ? 'bg-blue-500/20 text-blue-400' :
                  o.status === 'preparing' ? 'bg-amber-500/20 text-amber-400' :
                  o.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
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
