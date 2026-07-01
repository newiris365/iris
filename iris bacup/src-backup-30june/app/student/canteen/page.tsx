"use client";

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Search, Leaf, Flame, Star, Clock, ShoppingCart,
  Plus, Minus, X, Tag, ChevronRight, Sparkles, ArrowRight, AlertTriangle, Wallet
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'Snacks', name: 'Snacks', icon: '🍿' },
  { id: 'Beverages', name: 'Beverages', icon: '☕' },
  { id: 'Meals', name: 'Meals', icon: '🍛' },
  { id: 'Desserts', name: 'Desserts', icon: '🍨' },
];

const MOCK_MENU = [
  { id: '1', item_name: 'Masala Dosa', category: 'Meals', price: 80, is_veg: true, is_available: true, calories: 350, prep_time_mins: 12, spice_level: 2, rating_avg: 4.5, description: 'Crispy rice crepe with spiced potato filling, served with sambar & chutney', is_daily_special: true, allergens: ['gluten', 'dairy'] },
  { id: '2', item_name: 'Cold Coffee', category: 'Beverages', price: 60, is_veg: true, is_available: true, calories: 180, prep_time_mins: 5, spice_level: 0, rating_avg: 4.7, description: 'Chilled coffee blended with creamy ice cream', is_daily_special: false, allergens: ['dairy'] },
  { id: '3', item_name: 'Veg Biryani', category: 'Meals', price: 130, is_veg: true, is_available: true, calories: 520, prep_time_mins: 20, spice_level: 2, rating_avg: 4.2, description: 'Fragrant basmati rice with fresh vegetables and aromatic spices', is_daily_special: false, allergens: [] },
  { id: '4', item_name: 'Samosa (2pc)', category: 'Snacks', price: 30, is_veg: true, is_available: true, calories: 260, prep_time_mins: 3, spice_level: 1, rating_avg: 4.8, description: 'Crispy fried pastry with spiced potato-pea filling', is_daily_special: false, allergens: ['gluten'] },
  { id: '5', item_name: 'Paneer Tikka Roll', category: 'Snacks', price: 120, is_veg: true, is_available: true, calories: 380, prep_time_mins: 10, spice_level: 2, rating_avg: 4.4, description: 'Grilled paneer wrapped in rumali roti with mint chutney', is_daily_special: false, allergens: ['dairy', 'gluten'] },
  { id: '6', item_name: 'Chicken Biryani', category: 'Meals', price: 180, is_veg: false, is_available: true, calories: 620, prep_time_mins: 25, spice_level: 3, rating_avg: 4.6, description: 'Dum-cooked aromatic rice with tender chicken pieces', is_daily_special: false, allergens: [] },
  { id: '7', item_name: 'Gulab Jamun', category: 'Desserts', price: 50, is_veg: true, is_available: true, calories: 290, prep_time_mins: 2, spice_level: 0, rating_avg: 4.3, description: 'Warm milk dumplings soaked in rose-flavored sugar syrup', is_daily_special: false, allergens: ['dairy', 'nuts'] },
  { id: '8', item_name: 'Mango Lassi', category: 'Beverages', price: 50, is_veg: true, is_available: true, calories: 200, prep_time_mins: 3, spice_level: 0, rating_avg: 4.6, description: 'Creamy yogurt blended with fresh Alphonso mangoes', is_daily_special: false, allergens: ['dairy'] },
  { id: '9', item_name: 'Pav Bhaji', category: 'Meals', price: 90, is_veg: true, is_available: true, calories: 410, prep_time_mins: 15, spice_level: 2, rating_avg: 4.5, description: 'Spiced vegetable mash served with buttery toasted pav', is_daily_special: false, allergens: ['gluten'] },
  { id: '10', item_name: 'French Fries', category: 'Snacks', price: 60, is_veg: true, is_available: true, calories: 320, prep_time_mins: 8, spice_level: 1, rating_avg: 4.1, description: 'Golden crispy fries with peri-peri seasoning', is_daily_special: false, allergens: [] },
];

const spiceLabels = ['', '🌶️', '🌶️🌶️', '🌶️🌶️🌶️'];

interface CartItem {
  menu_id: string;
  item_name: string;
  qty: number;
  price: number;
}

export default function StudentCanteenMenu() {
  const [menu, setMenu] = useState(MOCK_MENU);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);
  const [showAllergenFilter, setShowAllergenFilter] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isHosteller, setIsHosteller] = useState(false);

  useEffect(() => {
    loadMenu();
    fetchHostellerStatus();
  }, []);

  const fetchHostellerStatus = async () => {
    try {
      // If the API call to get allocations returns something, they are a hosteller
      const res = await apiGet('/hostel/allocations');
      if (res && res.success && res.allocations && res.allocations.length > 0) {
        setIsHosteller(true);
      } else {
        // Mock default for prototype if API fails
        setIsHosteller(true);
      }
    } catch {
      setIsHosteller(true);
    }
  };

  const loadMenu = async () => {
    try {
      const res = await apiGet('/canteen/menu');
      if (res.success && res.menu?.length > 0) setMenu(res.menu);
    } catch (err) { console.log('Using mock menu'); }
  };

  const ALLERGEN_OPTIONS = ['dairy', 'gluten', 'nuts', 'soy', 'eggs', 'shellfish'];

  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVeg = !vegOnly || item.is_veg;
    const rawAllergens = item.allergens as any;
    const allergensList = Array.isArray(rawAllergens)
      ? rawAllergens
      : (typeof rawAllergens === 'string'
          ? rawAllergens.split(',').map(x => x.trim()).filter(Boolean)
          : []);
    const matchAllergens = excludeAllergens.length === 0 || !allergensList.some((a: string) => excludeAllergens.includes(a.toLowerCase()));
    return matchCat && matchSearch && matchVeg && matchAllergens && item.is_available;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const exists = prev.find(c => c.menu_id === item.id);
      if (exists) return prev.map(c => c.menu_id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menu_id: item.id, item_name: item.item_name, qty: 1, price: item.price }];
    });
  };

  const updateQty = (menuId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.menu_id === menuId ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const getQty = (menuId: string) => cart.find(c => c.menu_id === menuId)?.qty || 0;
  
  const getEffectivePrice = (menuId: string, originalPrice: number) => {
    return originalPrice;
  };

  const cartTotal = cart.reduce((s, c) => s + getEffectivePrice(c.menu_id, c.price) * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const placeOrder = async () => {
    let studentId = 'c0000000-0000-0000-0000-000000000006'; // Default valid UUID fallback
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
      const res = await apiPost('/canteen/orders', {
        student_id: studentId,
        items: cart,
        total_amount: cartTotal,
        payment_method: 'Wallet',
        special_instructions: specialInstructions,
        offer_code: promoCode || undefined
      });

      if (res && res.success) {
        setOrderPlaced(true);
        setTimeout(() => {
          setOrderPlaced(false);
          setCart([]);
          setShowCart(false);
          setPromoCode('');
          setSpecialInstructions('');
        }, 3000);
      } else {
        alert('Failed to place order: ' + (res?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('An error occurred while placing order.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">

      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Campus Canteen</h1>
                <p className="text-xs text-[#C4B5FD]/70">Fresh & delicious • Order ahead, skip the line</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/student/canteen/orders"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#6C2BD9]/50 text-xs font-semibold text-[#C4B5FD] hover:text-white transition-all shadow-md"
              >
                <Clock className="w-3.5 h-3.5" /> My Orders
              </a>
              <a
                href="/student/canteen/wallet"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#6C2BD9]/50 text-xs font-semibold text-[#C4B5FD] hover:text-white transition-all shadow-md"
              >
                <Wallet className="w-3.5 h-3.5" /> Canteen Wallet
              </a>
              <a
                href="/student/canteen/subscriptions"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#6C2BD9]/50 text-xs font-semibold text-[#C4B5FD] hover:text-white transition-all shadow-md"
              >
                <Tag className="w-3.5 h-3.5" /> Meal Plans
              </a>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for food, drinks..."
              className="w-full pl-11 pr-4 py-3 bg-[#13102A]/80 border border-white/10 rounded-2xl text-sm text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

        {/* ── Category Tabs + Veg Toggle ─────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 z-20 bg-[#0D0A1A]/90 backdrop-blur-lg py-3 -mx-6 px-6">
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30'
                    : 'bg-[#13102A] text-[#C4B5FD]/60 border border-white/5 hover:border-[#6C2BD9]/30'
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
              vegOnly
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" /> Veg Only
          </button>

          <button
            onClick={() => setShowAllergenFilter(!showAllergenFilter)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
              excludeAllergens.length > 0
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Allergens {excludeAllergens.length > 0 && `(${excludeAllergens.length})`}
          </button>
        </div>

        {/* Allergen Filter Panel */}
        {showAllergenFilter && (
          <div className="glass-panel rounded-xl p-4 border border-orange-500/20 flex flex-col gap-2">
            <span className="text-xs font-bold text-orange-400">Exclude allergens:</span>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map(a => (
                <button key={a} onClick={() => {
                  setExcludeAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
                }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    excludeAllergens.includes(a)
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:text-white'
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Menu Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-[#6C2BD9]/25 transition-all group">
                {/* Image Area */}
                <div className="h-32 bg-gradient-to-br from-[#6C2BD9]/15 to-[#13102A] flex items-center justify-center relative">
                  <UtensilsCrossed className="w-8 h-8 text-[#6C2BD9]/20" />

                  {/* Today's Special Badge */}
                  {item.is_daily_special && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-[9px] font-bold text-yellow-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Today&apos;s Special
                    </span>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1.5">
                    {item.is_veg ? (
                      <span className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-[8px] font-bold text-red-400">NV</span>
                    )}
                  </div>

                  {item.spice_level > 0 && (
                    <span className="absolute bottom-2 right-3 text-xs">{spiceLabels[item.spice_level]}</span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-white flex-1">{item.item_name}</h3>
                    <span className="text-base font-extrabold text-white ml-2">₹{item.price}</span>
                  </div>

                  <p className="text-[10px] text-[#C4B5FD]/50 line-clamp-2 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                      <Star className="w-3 h-3 fill-yellow-400" /> {item.rating_avg}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-[#C4B5FD]/40">
                      <Clock className="w-3 h-3" /> {item.prep_time_mins}m
                    </span>
                    <span className="text-[10px] text-[#C4B5FD]/40">{item.calories} kcal</span>
                  </div>

                  {/* Allergen badges */}
                  {(() => {
                    const rawAllergens = item.allergens as any;
                    const allergensList = Array.isArray(rawAllergens)
                      ? rawAllergens
                      : (typeof rawAllergens === 'string'
                          ? rawAllergens.split(',').map(x => x.trim()).filter(Boolean)
                          : []);
                    if (allergensList.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1">
                        {allergensList.map((a: string) => (
                          <span key={a} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400/70">
                            {a}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Add to Cart */}
                  <div className="mt-1">
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 rounded-xl px-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-extrabold text-white">{qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-[#C4B5FD]/40 text-sm">No items found. Try a different category or search term.</div>
        )}
      </div>

      {/* ── Floating Cart Bar ────────────────────────────────── */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-3rem)] max-w-lg">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] shadow-2xl shadow-[#6C2BD9]/40 hover:shadow-[#6C2BD9]/60 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{cartCount} item{cartCount > 1 ? 's' : ''} in cart</p>
                <p className="text-[10px] text-white/70">Tap to review & checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-white">₹{cartTotal}</span>
              <ArrowRight className="w-4 h-4 text-white/70" />
            </div>
          </button>
        </div>
      )}

      {/* ── Cart Drawer ──────────────────────────────────────── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)}>
          <div className="w-full max-w-lg bg-[#13102A] rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {orderPlaced ? (
              <div className="p-10 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Order Placed! 🎉</h3>
                <p className="text-xs text-[#C4B5FD]/60">Your food is being prepared. Track it in your orders.</p>
              </div>
            ) : (
              <>
                {/* Cart Header */}
                <div className="p-5 flex items-center justify-between border-b border-white/5">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#A78BFA]" /> Your Cart
                  </h3>
                  <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/50 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="p-5 flex flex-col gap-3">
                  {cart.map(item => (
                    <div key={item.menu_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{item.item_name}</p>
                        <p className="text-[10px] text-[#C4B5FD]/50">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 rounded-lg">
                          <button onClick={() => updateQty(item.menu_id, -1)} className="w-7 h-7 flex items-center justify-center text-[#A78BFA]">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white w-5 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.menu_id, 1)} className="w-7 h-7 flex items-center justify-center text-[#A78BFA]">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-white w-14 text-right">
                          ₹{getEffectivePrice(item.menu_id, item.price) * item.qty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code */}
                <div className="px-5 pb-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C4B5FD]/40" />
                      <input
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>
                    <button className="px-4 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all">
                      Apply
                    </button>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="px-5 pb-4">
                  <textarea
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="Any special instructions? (e.g., less spicy, extra sauce)"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none"
                  />
                </div>

                {/* Total & Checkout */}
                <div className="p-5 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#C4B5FD]/60">Subtotal ({cartCount} items)</span>
                    <span className="text-sm font-bold text-white">₹{cartTotal}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-sm font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all"
                  >
                    Place Order • ₹{cartTotal}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
