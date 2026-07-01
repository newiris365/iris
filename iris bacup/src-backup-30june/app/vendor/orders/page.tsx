"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, CheckCircle2, Clock, ArrowRight, Filter, RefreshCw
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface Order {
  id: string;
  order_number: string;
  items: any[];
  total_amount: number;
  status: string;
  payment_status: string;
  special_instructions: string;
  order_time: string;
  student_name: string;
  roll_number: string;
  token_number: number;
}

const STATUS_FLOW = ['placed', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  preparing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  delivered: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchOrders = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter === 'active') {
        // Fetch all active statuses
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await apiGet('campusCore/vendor/orders', params);
      if (res.success) setOrders(res.orders || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const res = await apiPut(`campusCore/vendor/orders/${orderId}/status`, { status: newStatus });
    if (res.success) fetchOrders();
  };

  const filtered = orders.filter(o => {
    if (statusFilter === 'active') return ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status);
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const activeCount = orders.filter(o => ['placed', 'confirmed', 'preparing'].includes(o.status)).length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList size={24} className="text-orange-400" />
          Kitchen Order Tickets
          {activeCount > 0 && (
            <span className="bg-orange-500/20 text-orange-400 text-sm px-2 py-0.5 rounded-full animate-pulse">
              {activeCount} active
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Updated {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchOrders}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'active', label: `Active (${activeCount})` },
          { key: 'ready', label: `Ready (${readyCount})` },
          { key: 'placed', label: 'Placed' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'preparing', label: 'Preparing' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'all', label: 'All' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm ${
              statusFilter === tab.key ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
          <p>No {statusFilter === 'active' ? 'active' : statusFilter} orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => (
            <div key={order.id}
              className={`rounded-xl border p-4 transition-all ${
                STATUS_COLORS[order.status] || 'bg-white/5 border-white/10'
              }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono font-bold text-white text-lg">
                    #{order.order_number || order.id?.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {order.student_name || '—'} ({order.roll_number || '—'})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">₹{order.total_amount}</p>
                  <p className="text-xs text-slate-400">
                    {order.order_time ? new Date(order.order_time).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-white">
                      {item.quantity || 1}x {item.name || item.item_name || 'Item'}
                    </span>
                    {item.price && (
                      <span className="text-slate-400">₹{item.price * (item.quantity || 1)}</span>
                    )}
                  </div>
                ))}
              </div>

              {order.special_instructions && (
                <div className="bg-amber-500/10 rounded-lg p-2 mb-3">
                  <p className="text-xs text-amber-400">📝 {order.special_instructions}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
                {STATUS_FLOW.filter(s => s !== order.status && s !== 'cancelled').map(status => {
                  const currentIdx = STATUS_FLOW.indexOf(order.status);
                  const targetIdx = STATUS_FLOW.indexOf(status);
                  // Only show next logical step or skip
                  if (targetIdx !== currentIdx + 1 && status !== 'cancelled') return null;
                  return (
                    <button key={status}
                      onClick={() => handleStatusUpdate(order.id, status)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        status === 'ready' ? 'bg-emerald-600 text-white hover:bg-emerald-500' :
                        status === 'confirmed' ? 'bg-violet-600 text-white hover:bg-violet-500' :
                        status === 'preparing' ? 'bg-amber-600 text-white hover:bg-amber-500' :
                        status === 'delivered' ? 'bg-slate-600 text-white hover:bg-slate-500' :
                        'bg-white/10 text-white hover:bg-white/20'
                      }`}>
                      {status === 'confirmed' && '✓ Confirm'}
                      {status === 'preparing' && '🔥 Preparing'}
                      {status === 'ready' && '✅ Ready'}
                      {status === 'delivered' && '📦 Delivered'}
                    </button>
                  );
                })}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-red-600/50 text-red-300 hover:bg-red-600 ml-auto">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
