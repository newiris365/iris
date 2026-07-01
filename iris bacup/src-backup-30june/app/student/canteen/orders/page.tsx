"use client";

import React, { useState, useEffect } from 'react';
import {
  Package, Clock, CheckCircle2, Flame, Truck, AlertCircle,
  ArrowLeft, Star, MessageSquare, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

const STATUS_STEPS = ['Received', 'Preparing', 'Ready', 'Delivered'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; emoji: string }> = {
  Received: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: AlertCircle, emoji: '📋' },
  Preparing: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Flame, emoji: '👨‍🍳' },
  Ready: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Package, emoji: '✅' },
  Delivered: { color: 'text-[#A78BFA]', bg: 'bg-[#6C2BD9]/10', icon: CheckCircle2, emoji: '🎉' },
  Cancelled: { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle, emoji: '❌' },
};

const MOCK_ORDERS = [
  {
    id: 'ord-1', order_number: 'ORD-K8Z2M', status: 'Preparing',
    items: [{ item_name: 'Masala Dosa', qty: 2, price: 80 }, { item_name: 'Cold Coffee', qty: 1, price: 60 }],
    total_amount: 220, payment_method: 'Wallet',
    order_time: new Date(Date.now() - 480000).toISOString(), pickup_time: null,
    special_instructions: 'Extra chutney', discount_amount: 0
  },
  {
    id: 'ord-2', order_number: 'ORD-J7Y1L', status: 'Ready',
    items: [{ item_name: 'Veg Biryani', qty: 1, price: 130 }],
    total_amount: 130, payment_method: 'UPI',
    order_time: new Date(Date.now() - 900000).toISOString(), pickup_time: null,
    special_instructions: '', discount_amount: 0
  },
  {
    id: 'ord-3', order_number: 'ORD-G5W9J', status: 'Delivered',
    items: [{ item_name: 'Paneer Tikka Roll', qty: 1, price: 120 }, { item_name: 'Gulab Jamun', qty: 2, price: 50 }],
    total_amount: 220, payment_method: 'Wallet',
    order_time: new Date(Date.now() - 3600000).toISOString(), pickup_time: new Date(Date.now() - 2400000).toISOString(),
    special_instructions: 'Less spicy', discount_amount: 30
  },
  {
    id: 'ord-4', order_number: 'ORD-F4V8I', status: 'Delivered',
    items: [{ item_name: 'Samosa (2pc)', qty: 3, price: 30 }, { item_name: 'Mango Lassi', qty: 2, price: 50 }],
    total_amount: 190, payment_method: 'Wallet',
    order_time: new Date(Date.now() - 86400000).toISOString(), pickup_time: new Date(Date.now() - 85800000).toISOString(),
    special_instructions: '', discount_amount: 0
  },
];

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    let studentId = '00000000-0000-0000-0000-000000000000';
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('iris_user_profile');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) studentId = user.id;
        } catch (e) {}
      }
    }
    try {
      const res = await apiGet(`/canteen/orders/${studentId}`);
      if (res.success && res.orders) setOrders(res.orders);
    } catch (err) { console.log('Using mock orders'); }
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const pastOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

  const submitFeedback = async (orderId: string) => {
    let studentId = '00000000-0000-0000-0000-000000000000';
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('iris_user_profile');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) studentId = user.id;
        } catch (e) {}
      }
    }
    try {
      await apiPost('/canteen/feedback', {
        order_id: orderId,
        student_id: studentId,
        rating,
        comment: comment || undefined
      });
    } catch (err) {}
    setRatingOrder(null);
    setRating(0);
    setComment('');
    alert('Thank you for your feedback! 🙏');
  };

  const displayed = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/canteen" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">My Orders</h1>
            <p className="text-xs text-[#C4B5FD]/70">Track your current and past orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          {[
            { key: 'active' as const, label: 'Active', count: activeOrders.length },
            { key: 'past' as const, label: 'Past Orders', count: pastOrders.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                  : 'bg-[#13102A] text-[#C4B5FD]/60 border border-white/5 hover:border-[#6C2BD9]/30'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Orders */}
        {displayed.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-[#6C2BD9]/20 mx-auto mb-3" />
            <p className="text-sm text-[#C4B5FD]/40">
              {activeTab === 'active' ? 'No active orders right now' : 'No past orders yet'}
            </p>
            {activeTab === 'active' && (
              <a href="/student/canteen" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all">
                Browse Menu →
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayed.map(order => {
              const config = STATUS_CONFIG[order.status];
              const StatusIcon = config.icon;
              const isActive = order.status !== 'Delivered' && order.status !== 'Cancelled';
              const stepIdx = STATUS_STEPS.indexOf(order.status);
              const isExpanded = expandedId === order.id;

              return (
                <div key={order.id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-[#6C2BD9]/20 transition-all">

                  {/* Order Header */}
                  <div
                    className="p-5 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-lg`}>
                        {config.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#A78BFA]">{order.order_number}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} • {timeAgo(order.order_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-white">₹{order.total_amount}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C4B5FD]/40" /> : <ChevronDown className="w-4 h-4 text-[#C4B5FD]/40" />}
                    </div>
                  </div>

                  {/* Progress Bar (Active Orders) */}
                  {isActive && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center gap-1">
                        {STATUS_STEPS.map((step, i) => (
                          <React.Fragment key={step}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                              i <= stepIdx
                                ? 'bg-[#6C2BD9] border-[#6C2BD9] text-white'
                                : 'bg-transparent border-white/10 text-[#C4B5FD]/30'
                            }`}>
                              {i < stepIdx ? '✓' : i + 1}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 rounded ${
                                i < stepIdx ? 'bg-[#6C2BD9]' : 'bg-white/10'
                              }`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        {STATUS_STEPS.map(step => (
                          <span key={step} className="text-[8px] text-[#C4B5FD]/40 w-7 text-center">{step.slice(0, 4)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 flex flex-col gap-3">
                      {/* Items */}
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-white">
                            <span className="font-bold text-[#A78BFA]">{item.qty}×</span> {item.item_name}
                          </span>
                          <span className="text-[#C4B5FD]/50">₹{item.qty * item.price}</span>
                        </div>
                      ))}

                      {order.discount_amount > 0 && (
                        <div className="flex items-center justify-between text-xs text-emerald-400">
                          <span>Discount</span>
                          <span>-₹{order.discount_amount}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                        <span className="text-[#C4B5FD]/50">Paid via {order.payment_method}</span>
                        <span className="font-bold text-white">₹{order.total_amount}</span>
                      </div>

                      {order.special_instructions && (
                        <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300">
                          📝 {order.special_instructions}
                        </div>
                      )}

                      {/* Rate Button */}
                      {order.status === 'Delivered' && ratingOrder !== order.id && (
                        <button
                          onClick={() => setRatingOrder(order.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all self-start"
                        >
                          <Star className="w-3.5 h-3.5" /> Rate this Order
                        </button>
                      )}

                      {/* Rating Form */}
                      {ratingOrder === order.id && (
                        <div className="p-4 rounded-xl bg-white/5 flex flex-col gap-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button key={s} onClick={() => setRating(s)}>
                                <Star className={`w-6 h-6 transition-all ${
                                  s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                                }`} />
                              </button>
                            ))}
                          </div>
                          <input
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Add a comment (optional)"
                            className="w-full px-4 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setRatingOrder(null)} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-[#C4B5FD]/50">Cancel</button>
                            <button onClick={() => submitFeedback(order.id)} className="px-4 py-2 rounded-xl bg-[#6C2BD9] text-xs font-bold text-white">Submit</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
