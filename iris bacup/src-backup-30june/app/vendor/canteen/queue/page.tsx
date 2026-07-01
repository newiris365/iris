"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Play, CheckCircle2, ChevronRight, Volume2, 
  Sparkles, Coffee, ChefHat, AlertCircle, ShoppingBag
} from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

interface QueueOrder {
  id: string;
  order_number: string;
  token_number: number;
  status: 'Received' | 'Preparing' | 'Ready' | 'Delivered';
  total_amount: number;
  items: { item_name: string; qty: number }[];
  special_instructions?: string;
  created_at: string;
}

const MOCK_QUEUE: QueueOrder[] = [
  { id: '1', order_number: 'ORD-K8Z2M', token_number: 142, status: 'Received', total_amount: 220, items: [{ item_name: 'Masala Dosa', qty: 2 }, { item_name: 'Cold Coffee', qty: 1 }], special_instructions: 'Less sugar in coffee', created_at: new Date(Date.now() - 60000).toISOString() },
  { id: '2', order_number: 'ORD-J7Y1L', token_number: 143, status: 'Preparing', total_amount: 130, items: [{ item_name: 'Veg Biryani', qty: 1 }], special_instructions: 'Extra raita', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: '3', order_number: 'ORD-H6X0K', token_number: 144, status: 'Ready', total_amount: 40, items: [{ item_name: 'Pyaz Kachori (2pc)', qty: 1 }], created_at: new Date(Date.now() - 600000).toISOString() },
];

export default function VendorQueuePage() {
  const [orders, setOrders] = useState<QueueOrder[]>(MOCK_QUEUE);
  const [activeCounter, setActiveCounter] = useState('Counter-01');
  const [counterOpen, setCounterOpen] = useState(true);
  
  const prevOrderCountRef = useRef(orders.length);

  // Play audio alarm on new order (simulated with Web Audio API)
  const playNewOrderSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadQueue();
    const poll = setInterval(() => {
      loadQueue();
    }, 8000);
    return () => clearInterval(poll);
  }, []);

  const loadQueue = async () => {
    try {
      const res = await apiGet('/canteen/orders/queue');
      if (res.success && res.queue) {
        setOrders(res.queue);
        if (res.queue.length > prevOrderCountRef.current) {
          playNewOrderSound();
        }
        prevOrderCountRef.current = res.queue.length;
      }
    } catch (err) {
      // Periodic simulated new order injector for testing/demo
      if (Math.random() > 0.8) {
        injectRandomMockOrder();
      }
    }
  };

  const injectRandomMockOrder = () => {
    const dishes = ['Samosa (2pc)', 'Cold Coffee', 'Gulab Jamun', 'Paneer Tikka Roll'];
    const mockOrder: QueueOrder = {
      id: `m-${Date.now()}`,
      order_number: `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      token_number: Math.floor(100 + Math.random() * 900),
      status: 'Received',
      total_amount: 90,
      items: [{ item_name: dishes[Math.floor(Math.random() * dishes.length)], qty: 1 }],
      created_at: new Date().toISOString()
    };

    setOrders(prev => {
      const updated = [mockOrder, ...prev];
      playNewOrderSound();
      prevOrderCountRef.current = updated.length;
      return updated;
    });
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: 'Received' | 'Preparing' | 'Ready' | 'Delivered' = 'Received';
    if (currentStatus === 'Received') nextStatus = 'Preparing';
    else if (currentStatus === 'Preparing') nextStatus = 'Ready';
    else if (currentStatus === 'Ready') nextStatus = 'Delivered';

    try {
      const res = await apiPut(`/canteen/orders/${orderId}/status`, { status: nextStatus });
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o).filter(o => o.status !== 'Delivered'));
      } else {
        updateLocalState(orderId, nextStatus);
      }
    } catch (err) {
      updateLocalState(orderId, nextStatus);
    }
  };

  const updateLocalState = (orderId: string, nextStatus: 'Received' | 'Preparing' | 'Ready' | 'Delivered') => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o).filter(o => o.status !== 'Delivered'));
  };

  const receivedOrders = orders.filter(o => o.status === 'Received');
  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready');

  return (
    <div className="flex flex-col gap-6">
      
      {/* Upper Status strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/25 p-5 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ChefHat className="text-[#A78BFA] w-5 h-5 animate-pulse" />
            Kitchen Order Stream
          </h2>
          <p className="text-xs text-[#A78BFA]/70 mt-1">
            Active Counter: {activeCounter} | Realtime Socket Broadcast Status Board
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={injectRandomMockOrder}
            className="flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-[#C4B5FD]/70 hover:text-white"
          >
            <Volume2 className="w-3.5 h-3.5" /> Force Simulate Order
          </button>
          
          <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-white">Counter Open Status</span>
            <button 
              onClick={() => setCounterOpen(!counterOpen)}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                counterOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {counterOpen ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Received */}
        <div className="flex flex-col gap-4 bg-[#13102A]/35 border border-white/5 p-4 rounded-2xl min-h-[500px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Incoming Orders</span>
            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold px-2 py-0.5 rounded text-[10px]">{receivedOrders.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {receivedOrders.map(order => (
              <div key={order.id} className="glass-panel border border-[#6C2BD9]/15 rounded-xl p-4 space-y-3 hover:border-[#6C2BD9]/45 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-[#A78BFA]">{order.order_number}</span>
                  <span className="text-sm font-extrabold text-white">#{order.token_number}</span>
                </div>
                
                <div className="space-y-1">
                  {order.items.map((it, i) => (
                    <div key={i} className="text-xs text-white">
                      <span className="font-bold text-[#A78BFA]">{it.qty}×</span> {it.item_name}
                    </div>
                  ))}
                </div>

                {order.special_instructions && (
                  <p className="text-[10px] text-amber-300 leading-snug bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                    📝 {order.special_instructions}
                  </p>
                )}

                <button 
                  onClick={() => handleUpdateStatus(order.id, order.status)}
                  className="w-full bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Start Preparation
                </button>
              </div>
            ))}
            {receivedOrders.length === 0 && (
              <div className="text-center py-10 text-[11px] text-[#C4B5FD]/30">No new incoming orders.</div>
            )}
          </div>
        </div>

        {/* COLUMN 2: Preparing */}
        <div className="flex flex-col gap-4 bg-[#13102A]/35 border border-white/5 p-4 rounded-2xl min-h-[500px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">In Preparation</span>
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">{preparingOrders.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {preparingOrders.map(order => (
              <div key={order.id} className="glass-panel border border-amber-500/20 rounded-xl p-4 space-y-3 hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-amber-400">{order.order_number}</span>
                  <span className="text-sm font-extrabold text-white">#{order.token_number}</span>
                </div>
                
                <div className="space-y-1">
                  {order.items.map((it, i) => (
                    <div key={i} className="text-xs text-white">
                      <span className="font-bold text-amber-400">{it.qty}×</span> {it.item_name}
                    </div>
                  ))}
                </div>

                {order.special_instructions && (
                  <p className="text-[10px] text-amber-300 leading-snug bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                    📝 {order.special_instructions}
                  </p>
                )}

                <button 
                  onClick={() => handleUpdateStatus(order.id, order.status)}
                  className="w-full bg-[#8B5CF6] hover:bg-[#A78BFA] text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Order Completed
                </button>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <div className="text-center py-10 text-[11px] text-[#C4B5FD]/30">No orders actively in preparation.</div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Ready for Pickup */}
        <div className="flex flex-col gap-4 bg-[#13102A]/35 border border-white/5 p-4 rounded-2xl min-h-[500px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ready for Pickup</span>
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">{readyOrders.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {readyOrders.map(order => (
              <div key={order.id} className="glass-panel border border-emerald-500/25 rounded-xl p-4 space-y-3 hover:border-emerald-500/50 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-emerald-400">{order.order_number}</span>
                  <span className="text-sm font-extrabold text-white">#{order.token_number}</span>
                </div>
                
                <div className="space-y-1">
                  {order.items.map((it, i) => (
                    <div key={i} className="text-xs text-white">
                      <span className="font-bold text-emerald-400">{it.qty}×</span> {it.item_name}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleUpdateStatus(order.id, order.status)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Pickup
                </button>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center py-10 text-[11px] text-[#C4B5FD]/30">No orders waiting for pickup.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
