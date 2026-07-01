"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, RefreshCw, CheckCircle2, Flame, Package, AlertCircle
} from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

const STATUS_FLOW = ['placed', 'confirmed', 'preparing', 'ready', 'delivered'] as const;

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  placed: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: AlertCircle, label: 'Placed' },
  confirmed: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: CheckCircle2, label: 'Confirmed' },
  preparing: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Flame, label: 'Preparing' },
  ready: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Package, label: 'Ready' },
  delivered: { color: 'text-[#A78BFA]', bg: 'bg-[#6C2BD9]/10', border: 'border-[#6C2BD9]/30', icon: CheckCircle2, label: 'Delivered' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle, label: 'Cancelled' },
};

function getTimeSince(isoString: string) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function AdminKitchenDisplay() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiGet('campusCore/vendor/orders');
      if (res.success) setOrders(res.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);
  useEffect(() => {
    const timer = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const res = await apiPut(`campusCore/vendor/orders/${orderId}/status`, { status: newStatus });
    if (res.success) fetchOrders();
  };

  const filtered = orders.filter(o =>
    activeFilter === 'all' || o.status === activeFilter
  );

  const statusCounts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ChefHat size={24} className="text-orange-400" />
          Kitchen Order Tickets
        </h1>
        <button onClick={fetchOrders}
          className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          All ({orders.length})
        </button>
        {STATUS_FLOW.map(s => (
          <button key={s} onClick={() => setActiveFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeFilter === s ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {STATUS_CONFIG[s]?.label} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No orders found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
            const Icon = config.icon;
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
            return (
              <div key={order.id}
                className={`rounded-xl border p-4 ${config.bg} ${config.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={config.color} />
                    <span className="font-mono font-bold text-white">{order.order_number || order.id?.slice(0, 8)}</span>
                  </div>
                  <span className="text-xs text-slate-400">{getTimeSince(order.order_time)} ago</span>
                </div>

                <div className="space-y-1 mb-3">
                  {(order.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white">{item.quantity || 1}x {item.name || item.item_name}</span>
                      <span className="text-slate-400">₹{item.price}</span>
                    </div>
                  ))}
                </div>

                {order.special_instructions && (
                  <p className="text-xs text-amber-400 mb-3">📝 {order.special_instructions}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-sm font-bold text-white">₹{order.total_amount}</span>
                  <div className="flex gap-1">
                    {nextStatus && (
                      <button onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        className={`px-3 py-1 rounded text-xs font-medium ${config.color} bg-white/10 hover:bg-white/20`}>
                        → {STATUS_CONFIG[nextStatus]?.label}
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="px-3 py-1 rounded text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
