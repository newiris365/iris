"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, ArrowLeft, RefreshCw, Clock, CheckCircle2,
  Flame, Package, Truck, AlertCircle, Timer, User
} from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

const STATUS_FLOW = ['Received', 'Preparing', 'Ready', 'Delivered'] as const;

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  Received: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: AlertCircle, label: 'New' },
  Preparing: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Flame, label: 'Cooking' },
  Ready: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Package, label: 'Pickup' },
  Delivered: { color: 'text-[#A78BFA]', bg: 'bg-[#6C2BD9]/10', border: 'border-[#6C2BD9]/30', icon: CheckCircle2, label: 'Done' },
};

const MOCK_ORDERS = [
  { id: 'ord-1', order_number: 'ORD-K8Z2M', student_id: 's1', items: [{ item_name: 'Masala Dosa', qty: 2, price: 80 }, { item_name: 'Cold Coffee', qty: 1, price: 60 }], total_amount: 220, status: 'Received', order_time: new Date(Date.now() - 120000).toISOString(), special_instructions: 'Extra chutney please' },
  { id: 'ord-2', order_number: 'ORD-J7Y1L', student_id: 's2', items: [{ item_name: 'Veg Biryani', qty: 1, price: 130 }], total_amount: 130, status: 'Preparing', order_time: new Date(Date.now() - 480000).toISOString(), special_instructions: '' },
  { id: 'ord-3', order_number: 'ORD-H6X0K', student_id: 's3', items: [{ item_name: 'Samosa (2pc)', qty: 3, price: 30 }, { item_name: 'Fresh Lime Soda', qty: 3, price: 40 }], total_amount: 210, status: 'Received', order_time: new Date(Date.now() - 60000).toISOString(), special_instructions: '' },
  { id: 'ord-4', order_number: 'ORD-G5W9J', student_id: 's4', items: [{ item_name: 'Paneer Tikka Roll', qty: 1, price: 120 }, { item_name: 'Gulab Jamun', qty: 2, price: 50 }], total_amount: 220, status: 'Ready', order_time: new Date(Date.now() - 900000).toISOString(), special_instructions: 'Less spicy' },
  { id: 'ord-5', order_number: 'ORD-F4V8I', student_id: 's5', items: [{ item_name: 'Chicken Biryani', qty: 2, price: 180 }], total_amount: 360, status: 'Preparing', order_time: new Date(Date.now() - 600000).toISOString(), special_instructions: 'Add raita' },
];

function getTimeSince(isoString: string) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function AdminKitchenDisplay() {
  const [orders, setOrders] = useState<any[]>(MOCK_ORDERS);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [, forceUpdate] = useState(0); // For timer refresh

  useEffect(() => {
    loadOrders();
    // Refresh timer display every 10s
    const timer = setInterval(() => forceUpdate(n => n + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const loadOrders = async () => {
    try {
      const res = await apiGet('/canteen/orders/active');
      if (res.success && res.orders?.length > 0) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.log('Using mock order data');
    }
  };

  const advanceStatus = async (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = STATUS_FLOW.indexOf(o.status);
      if (idx >= STATUS_FLOW.length - 1) return o;
      const newStatus = STATUS_FLOW[idx + 1];
      return { ...o, status: newStatus };
    }));

    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const idx = STATUS_FLOW.indexOf(order.status);
        if (idx < STATUS_FLOW.length - 1) {
          await apiPut(`/canteen/orders/${orderId}/status`, { status: STATUS_FLOW[idx + 1] });
        }
      }
    } catch (err) {}
  };

  const filtered = activeFilter === 'all'
    ? orders.filter(o => o.status !== 'Delivered')
    : orders.filter(o => o.status === activeFilter);

  const counts = {
    all: orders.filter(o => o.status !== 'Delivered').length,
    Received: orders.filter(o => o.status === 'Received').length,
    Preparing: orders.filter(o => o.status === 'Preparing').length,
    Ready: orders.filter(o => o.status === 'Ready').length,
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin/canteen" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl text-white">Kitchen Display</h1>
                <p className="text-xs text-[#C4B5FD]/70">Live order queue • Click cards to advance status</p>
              </div>
            </div>
          </div>

          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13102A] border border-white/10 text-xs font-semibold text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* ── Status Filter Tabs ────────────────────────────── */}
        <div className="flex gap-3">
          {[
            { key: 'all', label: 'Active Queue', count: counts.all },
            { key: 'Received', label: 'New Orders', count: counts.Received },
            { key: 'Preparing', label: 'In Kitchen', count: counts.Preparing },
            { key: 'Ready', label: 'Ready', count: counts.Ready },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === tab.key
                  ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                  : 'bg-[#13102A] text-[#C4B5FD]/70 border border-white/5 hover:border-[#6C2BD9]/30'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeFilter === tab.key ? 'bg-white/20' : 'bg-white/5'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Order Cards Grid ──────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
            <p className="text-sm text-[#C4B5FD]/50">No orders in this queue. All clear! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(order => {
              const config = STATUS_CONFIG[order.status];
              const StatusIcon = config.icon;
              const canAdvance = STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1;
              const nextStatus = canAdvance ? STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] : null;
              const elapsed = getTimeSince(order.order_time);
              const elapsedMins = Math.floor((Date.now() - new Date(order.order_time).getTime()) / 60000);
              const isUrgent = elapsedMins > 10 && order.status !== 'Delivered';

              return (
                <div
                  key={order.id}
                  className={`glass-panel rounded-2xl border overflow-hidden transition-all hover:scale-[1.01] ${
                    isUrgent ? 'border-red-500/40 shadow-lg shadow-red-500/10' : `border-white/5 hover:${config.border}`
                  }`}
                >
                  {/* Card Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${config.bg}`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${isUrgent ? 'text-red-400' : 'text-[#C4B5FD]/50'}`}>
                        <Timer className="w-3 h-3" /> {elapsed}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#A78BFA]">
                        {order.order_number}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col gap-3">
                    {/* Items List */}
                    <div className="flex flex-col gap-1.5">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-white">
                            <span className="font-bold text-[#A78BFA]">{item.qty}×</span> {item.item_name}
                          </span>
                          <span className="text-[10px] text-[#C4B5FD]/50">₹{item.qty * item.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.special_instructions && (
                      <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300">
                        📝 {order.special_instructions}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-sm font-extrabold text-white">₹{order.total_amount}</span>

                      {canAdvance && (
                        <button
                          onClick={() => advanceStatus(order.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold transition-all hover:shadow-lg ${
                            order.status === 'Received'
                              ? 'bg-amber-500 text-black hover:shadow-amber-500/30'
                              : order.status === 'Preparing'
                              ? 'bg-emerald-500 text-black hover:shadow-emerald-500/30'
                              : 'bg-[#6C2BD9] text-white hover:shadow-[#6C2BD9]/30'
                          }`}
                        >
                          {order.status === 'Received' && <><Flame className="w-3 h-3" /> Start Cooking</>}
                          {order.status === 'Preparing' && <><Package className="w-3 h-3" /> Mark Ready</>}
                          {order.status === 'Ready' && <><Truck className="w-3 h-3" /> Delivered</>}
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
    </main>
  );
}
