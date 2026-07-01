"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Clock, Check, Minus, Plus, Trash2, Leaf } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Skeleton from '../../../components/Skeleton';

interface MenuItem {
  id: string;
  item_name: string;
  category: string;
  price: number;
  is_veg: boolean;
  calories: number;
  description: string;
}

interface CartItem extends MenuItem {
  qty: number;
  instructions: string;
}

interface PreOrder {
  id: string;
  order_number: string;
  scheduled_date: string;
  scheduled_slot: string;
  total_amount: number;
  status: string;
  items: { item_name: string; qty: number; price: number }[];
  created_at: string;
}

const MOCK_MENU: MenuItem[] = [
  { id: '1', item_name: 'Masala Dosa', category: 'Meals', price: 80, is_veg: true, calories: 350, description: 'Crispy rice crepe with spiced potato filling' },
  { id: '2', item_name: 'Cold Coffee', category: 'Beverages', price: 60, is_veg: true, calories: 180, description: 'Chilled coffee blended with ice cream' },
  { id: '3', item_name: 'Veg Biryani', category: 'Meals', price: 130, is_veg: true, calories: 520, description: 'Fragrant basmati rice with vegetables' },
  { id: '4', item_name: 'Samosa (2pc)', category: 'Snacks', price: 30, is_veg: true, calories: 260, description: 'Crispy fried pastry with spiced filling' },
  { id: '5', item_name: 'Paneer Tikka Roll', category: 'Snacks', price: 120, is_veg: true, calories: 380, description: 'Grilled paneer wrapped in rumali roti' },
  { id: '6', item_name: 'Chicken Biryani', category: 'Meals', price: 180, is_veg: false, calories: 620, description: 'Dum-cooked aromatic rice with chicken' },
  { id: '7', item_name: 'Fresh Lime Soda', category: 'Beverages', price: 40, is_veg: true, calories: 80, description: 'Sweet or salty fresh lime with soda' },
  { id: '8', item_name: 'Gulab Jamun', category: 'Desserts', price: 50, is_veg: true, calories: 290, description: 'Warm milk dumplings in sweet syrup' },
  { id: '9', item_name: 'Chicken Tikka', category: 'Starters', price: 150, is_veg: false, calories: 320, description: 'Marinated grilled chicken pieces' },
  { id: '10', item_name: 'Spring Rolls', category: 'Starters', price: 70, is_veg: true, calories: 200, description: 'Crispy rolls stuffed with vegetables' },
  { id: '11', item_name: 'Butter Naan', category: 'Sides', price: 35, is_veg: true, calories: 250, description: 'Soft tandoor-baked flatbread with butter' },
  { id: '12', item_name: 'Raita', category: 'Sides', price: 25, is_veg: true, calories: 60, description: 'Yogurt with cucumber and spices' },
];

const MOCK_ORDERS: PreOrder[] = [
  { id: 'po-1', order_number: 'PRE-K8Z2M', scheduled_date: '2026-06-12', scheduled_slot: 'Lunch', total_amount: 210, status: 'Confirmed', items: [{ item_name: 'Masala Dosa', qty: 1, price: 80 }, { item_name: 'Cold Coffee', qty: 1, price: 60 }, { item_name: 'Gulab Jamun', qty: 1, price: 50 }], created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'po-2', order_number: 'PRE-J7Y1L', scheduled_date: '2026-06-11', scheduled_slot: 'Breakfast', total_amount: 120, status: 'Delivered', items: [{ item_name: 'Samosa (2pc)', qty: 2, price: 60 }, { item_name: 'Cold Coffee', qty: 1, price: 60 }], created_at: new Date(Date.now() - 86400000).toISOString() },
];

const SLOTS = [
  { id: 'breakfast', label: 'Breakfast', time: '7 - 9 AM', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', time: '12 - 2 PM', icon: '☀️' },
  { id: 'dinner', label: 'Dinner', time: '7 - 9 PM', icon: '🌙' },
];

export default function PreOrderPage() {
  const [menu, setMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [walletBalance, setWalletBalance] = useState(0);
  const [previousOrders, setPreviousOrders] = useState<PreOrder[]>(MOCK_ORDERS);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const studentId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('iris_user_profile') || '{}').id || 's0000000-0000-0000-0000-000000000001'
    : 's0000000-0000-0000-0000-000000000001';

  const dates = useMemo(() => {
    const result: { label: string; value: string; day: string }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      result.push({
        value: iso,
        label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        day: i === 0 ? 'Today' : days[d.getDay()],
      });
    }
    return result;
  }, []);

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].value);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuRes, walletRes, ordersRes] = await Promise.all([
        apiGet('/canteen/menu'),
        apiGet(`/canteen/wallet/${studentId}`),
        apiGet(`/canteen/preorders/${studentId}`),
      ]);
      if (menuRes.success && menuRes.menu?.length > 0) setMenu(menuRes.menu);
      if (walletRes.success && walletRes.balance != null) setWalletBalance(walletRes.balance);
      if (ordersRes.success && ordersRes.orders?.length > 0) setPreviousOrders(ordersRes.orders);
    } catch {
      console.log('Using mock pre-order data');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(i => i.category)));
    return ['All', ...cats];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    if (activeCategory === 'All') return menu;
    return menu.filter(i => i.category === activeCategory);
  }, [menu, activeCategory]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, instructions: '' }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const clearCart = () => setCart([]);

  const updateInstructions = (id: string, text: string) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, instructions: text } : c));
  };

  const placeOrder = async () => {
    if (!selectedDate || !selectedSlot || cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await apiPost('/canteen/preorders', {
        student_id: studentId,
        items: cart.map(c => ({ item_id: c.id, item_name: c.item_name, qty: c.qty, price: c.price, instructions: c.instructions })),
        total_amount: cartTotal,
        scheduled_date: selectedDate,
        scheduled_slot: selectedSlot,
        special_instructions: specialInstructions,
      });
      if (res.success) {
        setOrderSuccess(true);
        setCart([]);
        setSpecialInstructions('');
        loadData();
      }
    } catch {
      setOrderSuccess(true);
      setCart([]);
    } finally {
      setPlacing(false);
    }
  };

  const getQty = (id: string) => cart.find(c => c.id === id)?.qty || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-3 w-72" /></div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">

      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOrderSuccess(false)}>
          <div className="bg-[#13102A] border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Pre-Order Placed!</h3>
            <p className="text-xs text-[#C4B5FD]/60">Your meal has been reserved. You can track it from your order history.</p>
            <button onClick={() => setOrderSuccess(false)} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white">Done</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/canteen" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-extrabold text-xl md:text-2xl text-white">Pre-Order Meals</h1>
          <p className="text-xs text-[#C4B5FD]/60">Reserve your meals in advance and skip the queue</p>
        </div>
        <div className="bg-[#13102A]/60 border border-[#6C2BD9]/20 rounded-xl px-4 py-2 text-right">
          <p className="text-[9px] text-[#C4B5FD]/50 uppercase tracking-wider">Wallet</p>
          <p className="text-sm font-extrabold text-emerald-400">₹{walletBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[#13102A]/40 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold mb-3">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dates.map(d => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                selectedDate === d.value
                  ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30 border border-[#8B5CF6]'
                  : 'bg-white/5 text-[#C4B5FD]/60 border border-white/5 hover:border-[#6C2BD9]/30'
              }`}
            >
              <span className="text-[9px] uppercase">{d.day}</span>
              <span className="font-bold mt-0.5">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#13102A]/40 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider font-semibold mb-3">Select Time Slot</p>
        <div className="grid grid-cols-3 gap-3">
          {SLOTS.map(slot => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all ${
                selectedSlot === slot.id
                  ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/20'
                  : 'bg-white/[0.02] border-white/5 text-[#C4B5FD]/60 hover:border-[#6C2BD9]/30'
              }`}
            >
              <span className="text-xl">{slot.icon}</span>
              <span className="text-xs font-bold">{slot.label}</span>
              <span className="text-[10px] text-[#C4B5FD]/50 flex items-center gap-1"><Clock className="w-3 h-3" />{slot.time}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30'
                    : 'bg-[#13102A] text-[#C4B5FD]/70 border border-white/5 hover:border-[#6C2BD9]/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMenu.map(item => {
              const qty = getQty(item.id);
              return (
                <div key={item.id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-[#6C2BD9]/30 transition-all">
                  <div className="h-28 bg-gradient-to-br from-[#6C2BD9]/15 to-[#13102A] flex items-center justify-center relative">
                    <span className="text-3xl opacity-30">🍽️</span>
                    <div className="absolute top-2 left-2">
                      {item.is_veg ? (
                        <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <Leaf className="w-3 h-3 text-emerald-400" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[8px] font-bold text-red-400">NV</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 text-[9px] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-[#C4B5FD]/70">
                      {item.calories} kcal
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-bold text-white">{item.item_name}</h3>
                        <p className="text-[10px] text-[#C4B5FD]/50">{item.category}</p>
                      </div>
                      <span className="text-sm font-extrabold text-white">₹{item.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#C4B5FD]/40 line-clamp-1 flex-1 mr-2">{item.description}</p>
                      {qty === 0 ? (
                        <button onClick={() => addToCart(item)} className="px-3 py-1.5 rounded-lg bg-[#6C2BD9] text-[10px] font-bold text-white hover:bg-[#8B5CF6] transition-all">
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">{qty}</span>
                          <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-md bg-[#6C2BD9] flex items-center justify-center text-white hover:bg-[#8B5CF6] transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <div className="glass-panel rounded-2xl border border-white/5 p-5 sticky top-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#A78BFA]" /> Your Cart
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Clear All</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-[#C4B5FD]/30 text-xs">Your cart is empty</div>
            ) : (
              <>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">{item.item_name}</p>
                          <p className="text-[10px] text-[#C4B5FD]/50">₹{item.price} × {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">₹{item.price * item.qty}</span>
                          <button onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))} className="text-red-400/60 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <input
                        value={item.instructions}
                        onChange={e => updateInstructions(item.id, e.target.value)}
                        placeholder="Special instructions..."
                        className="w-full px-2 py-1 bg-[#0D0A1A] border border-white/5 rounded-lg text-[10px] text-white placeholder:text-[#C4B5FD]/20 outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2">
                  <textarea
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="General instructions for the kitchen..."
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none"
                  />
                </div>

                <div className="border-t border-white/5 pt-3 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#C4B5FD]/60">Items ({cartCount})</span>
                    <span className="font-bold text-white">₹{cartTotal}</span>
                  </div>
                  {walletBalance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[#C4B5FD]/60">Wallet Balance</span>
                      <span className="font-bold text-emerald-400">₹{walletBalance.toLocaleString()}</span>
                    </div>
                  )}
                  <button
                    onClick={placeOrder}
                    disabled={placing || !selectedDate || !selectedSlot || cart.length === 0 || cartTotal > walletBalance}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {placing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Place Pre-Order · ₹{cartTotal}
                      </>
                    )}
                  </button>
                  {cartTotal > walletBalance && (
                    <p className="text-[10px] text-red-400 text-center">Insufficient wallet balance</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {previousOrders.length > 0 && (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-bold text-sm text-white">Previous Pre-Orders</h3>
          </div>
          <div className="divide-y divide-white/5">
            {previousOrders.map(order => (
              <div key={order.id} className="px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6C2BD9]/15 border border-[#6C2BD9]/30 flex items-center justify-center font-bold text-xs text-[#A78BFA]">
                    {order.order_number.slice(-3)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{order.order_number}</p>
                    <p className="text-[10px] text-[#C4B5FD]/45">{order.scheduled_date} · {order.scheduled_slot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-11 sm:ml-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    order.status === 'Confirmed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>{order.status}</span>
                  <span className="text-xs font-bold text-white">₹{order.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
