"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, CheckCircle2, ShieldCheck, 
  ChefHat, Play, Volume2, AlertCircle, ShoppingBag, Sparkles
} from 'lucide-react';

interface OrderState {
  order_number: string;
  token_number: number;
  status: 'Received' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
  total_amount: number;
  items: { item_name: string; qty: number; price: number }[];
  special_instructions?: string;
  estimated_ready_minutes: number;
}

const STATUS_STEPS = ['Received', 'Preparing', 'Ready', 'Delivered'];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<OrderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track status for triggering sound alert only once on status change
  const prevStatusRef = useRef<string | null>(null);

  // Synthesize Ready double-chime alarm using Web Audio API
  const playReadySound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Chime 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      // Chime 2 (slight delay, higher pitch)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn("AudioContext failed to start or play", err);
    }
  };

  useEffect(() => {
    fetchOrder();
    
    // Set up polling interval for order progress updates
    const timer = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => clearInterval(timer);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('iris_jwt_token') || '';
      const res = await fetch(`/api/canteen/orders/track/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.order) {
        updateOrderState(data.order);
      } else {
        // Fallback mock logic for sandbox & local runs
        mockFetchFallback();
      }
    } catch (err) {
      mockFetchFallback();
    } finally {
      setLoading(false);
    }
  };

  const updateOrderState = (newOrder: OrderState) => {
    setOrder(newOrder);
    
    // Sound Trigger when transitioning to "Ready"
    if (newOrder.status === 'Ready' && prevStatusRef.current !== 'Ready') {
      playReadySound();
    }
    prevStatusRef.current = newOrder.status;
  };

  const mockFetchFallback = () => {
    // Generate simulated progress based on time elapsed since creation
    setOrder(prev => {
      if (prev) {
        let nextStatus = prev.status;
        if (prev.status === 'Received') nextStatus = 'Preparing';
        else if (prev.status === 'Preparing') nextStatus = 'Ready';
        else if (prev.status === 'Ready') nextStatus = 'Delivered';
        
        const updated = {
          ...prev,
          status: nextStatus,
          estimated_ready_minutes: Math.max(0, prev.estimated_ready_minutes - 3)
        };
        updateOrderState(updated);
        return updated;
      } else {
        const initialMock: OrderState = {
          order_number: orderId || 'ORD-K8Z2M',
          token_number: 142,
          status: 'Received',
          total_amount: 220,
          items: [
            { item_name: 'Masala Dosa', qty: 2, price: 80 },
            { item_name: 'Cold Coffee', qty: 1, price: 60 }
          ],
          special_instructions: 'Extra coconut chutney and less sweet coffee please.',
          estimated_ready_minutes: 12
        };
        prevStatusRef.current = 'Received';
        return initialMock;
      }
    });
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#8B5CF6] animate-spin" />
        <p className="mt-4 text-sm text-[#A78BFA]/70">Locating your transaction record...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="text-sm text-[#A78BFA]/60 mt-1 max-w-sm">We couldn't locate details for Order ID: {orderId}. Please check the receipt link.</p>
        <button 
          onClick={() => router.back()}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const activeStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-3xl mx-auto flex flex-col gap-6">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-extrabold text-xl md:text-2xl text-white">Live Kitchen Tracker</h1>
          <p className="text-xs text-[#C4B5FD]/60">Order ID: <span className="font-mono text-[#A78BFA] font-bold">{order.order_number}</span></p>
        </div>
      </div>

      {/* Main Status Showcase Panel */}
      <div className="glass-panel rounded-3xl border border-[#6C2BD9]/30 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#6C2BD9]/20 rounded-full blur-2xl" />

        <div className="text-center md:text-left space-y-2 relative z-10">
          <div className="text-xs font-semibold text-[#A78BFA] uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
            <ChefHat className="w-3.5 h-3.5" /> Present Status
          </div>
          <h2 className="text-3xl font-black tracking-wide text-white">
            {isCancelled ? 'Cancelled ❌' : order.status === 'Ready' ? 'Food is Ready! 🎉' : order.status === 'Delivered' ? 'Picked Up! 🍽️' : 'Preparing Order...'}
          </h2>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xs">
            {isCancelled ? 'Your order was cancelled and refunds credited.' : 
             order.status === 'Ready' ? 'Please present your token at the counter for pickup.' :
             order.status === 'Delivered' ? 'Thank you for dining with us!' : 
             'Our chefs are crafting your Rajasthani dishes fresh.'}
          </p>
        </div>

        {/* Highlighted Token Code */}
        <div className="bg-[#13102A] border border-[#6C2BD9]/45 px-8 py-5 rounded-2xl text-center shadow-xl w-full md:w-auto">
          <div className="text-[10px] text-[#A78BFA]/60 uppercase tracking-widest font-bold">Pick-up Token</div>
          <div className="text-4xl font-extrabold text-white mt-1">#{order.token_number}</div>
          <div className="text-[9px] text-[#A78BFA]/50 mt-1">Scan QR at counter</div>
        </div>
      </div>

      {/* Timeline Steps */}
      {!isCancelled && (
        <div className="glass-panel rounded-2xl border border-white/5 p-6 md:p-8">
          <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0 items-start md:items-center">
            
            {/* Horizontal Line Connector for Desktop */}
            <div className="hidden md:block absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-10" />

            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              const isPending = idx > activeStepIndex;
              
              return (
                <div key={step} className="flex md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto relative z-10">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all ${
                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                    isCurrent ? 'bg-[#6C2BD9] border-[#8B5CF6] text-white animate-pulse shadow-md shadow-[#6C2BD9]/30' :
                    'bg-[#13102A] border-white/10 text-[#C4B5FD]/40'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div className="text-left md:text-center">
                    <div className={`text-xs font-bold ${isCurrent ? 'text-[#A78BFA]' : isCompleted ? 'text-emerald-400' : 'text-[#C4B5FD]/40'}`}>
                      {step}
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] text-sky-400 mt-0.5 block font-semibold animate-pulse">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery / Prep Timing Estimate */}
      {!isCancelled && order.status !== 'Delivered' && (
        <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 rounded-2xl p-4 flex items-center gap-3.5">
          <Clock className="w-5 h-5 text-sky-400 shrink-0" />
          <div className="text-xs">
            {order.status === 'Ready' ? (
              <p className="text-white">Collect your food immediately from <strong>Counter 01</strong>.</p>
            ) : (
              <p className="text-white">
                Estimated pickup window: <strong>{order.estimated_ready_minutes} mins</strong> from now (approx. {new Date(Date.now() + order.estimated_ready_minutes * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Items Summary list */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#A78BFA]" />
            Order Receipt & Items Summary
          </h3>
          <span className="text-xs text-[#C4B5FD]/60">{order.items.reduce((s,i)=>s+i.qty, 0)} items</span>
        </div>
        
        <div className="divide-y divide-white/5 p-5 space-y-4">
          <div className="space-y-3">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-white">
                  <span className="font-bold text-[#A78BFA]">{it.qty}×</span> {it.item_name}
                </span>
                <span className="font-mono text-[#C4B5FD]/70">₹{it.price * it.qty}</span>
              </div>
            ))}
          </div>

          {order.special_instructions && (
            <div className="pt-4">
              <span className="text-[9px] uppercase tracking-wider text-[#A78BFA]/50 font-bold block mb-1">Special kitchen instructions</span>
              <p className="text-xs text-amber-300/95 leading-relaxed bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl">
                📝 {order.special_instructions}
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center text-sm font-bold text-white">
            <span>Amount Paid</span>
            <span className="text-[#A78BFA] font-mono">₹{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Manual sound trigger button for demo */}
      <div className="flex justify-center">
        <button 
          onClick={playReadySound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[#C4B5FD]/50 hover:text-white transition-all"
        >
          <Volume2 className="w-3.5 h-3.5" /> Test Synthesized Audio Alert
        </button>
      </div>

    </div>
  );
}
