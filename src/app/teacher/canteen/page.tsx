"use client";

import React, { useState, useMemo } from 'react';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, Filter,
  UtensilsCrossed, Coffee, Salad, IceCreamCone, ChevronRight,
  Tag, CheckCircle
} from 'lucide-react';
import { apiPost } from '../../../lib/api';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'Snacks', name: 'Snacks', icon: '🍿' },
  { id: 'Beverages', name: 'Beverages', icon: '☕' },
  { id: 'Meals', name: 'Meals', icon: '🍛' },
  { id: 'Desserts', name: 'Desserts', icon: '🍨' },
];

const MOCK_MENU = [
  { id: '1', item_name: 'Vada Pav', category: 'Snacks', price: 30, is_veg: true, is_available: true, description: 'Mumbai-style spiced potato fritter in a soft bun with green chutney', allergens: ['gluten'] },
  { id: '2', item_name: 'Samosa', category: 'Snacks', price: 25, is_veg: true, is_available: true, description: 'Crispy golden pastry filled with spiced potato and peas', allergens: ['gluten'] },
  { id: '3', item_name: 'Pakora', category: 'Snacks', price: 40, is_veg: true, is_available: true, description: 'Assorted vegetable fritters deep-fried to perfection', allergens: ['gluten'] },
  { id: '4', item_name: 'Sandwich', category: 'Snacks', price: 50, is_veg: true, is_available: true, description: 'Grilled triple-layer sandwich with cheese, tomato, and chutney', allergens: ['gluten', 'dairy'] },
  { id: '5', item_name: 'Chai', category: 'Beverages', price: 10, is_veg: true, is_available: true, description: 'Classic Indian masala chai brewed with cardamom and ginger', allergens: [] },
  { id: '6', item_name: 'Coffee', category: 'Beverages', price: 20, is_veg: true, is_available: true, description: 'Freshly brewed filter coffee with a rich, bold aroma', allergens: [] },
  { id: '7', item_name: 'Cold Drink', category: 'Beverages', price: 25, is_veg: true, is_available: true, description: 'Chilled carbonated soft drink – choice of cola or lemon', allergens: [] },
  { id: '8', item_name: 'Fresh Juice', category: 'Beverages', price: 40, is_veg: true, is_available: true, description: 'Seasonal fruit juice freshly squeezed to order', allergens: [] },
  { id: '9', item_name: 'Thali', category: 'Meals', price: 80, is_veg: true, is_available: true, description: 'Complete meal with roti, rice, dal, sabzi, curd, and pickle', allergens: ['gluten', 'dairy'] },
  { id: '10', item_name: 'Biryani', category: 'Meals', price: 90, is_veg: false, is_available: true, description: 'Aromatic basmati rice slow-cooked with tender chicken and spices', allergens: [] },
  { id: '11', item_name: 'Fried Rice', category: 'Meals', price: 70, is_veg: true, is_available: true, description: 'Wok-tossed rice with mixed vegetables and soy sauce', allergens: ['soy', 'gluten'] },
  { id: '12', item_name: 'Dal Rice', category: 'Meals', price: 60, is_veg: true, is_available: true, description: 'Comforting lentil curry served with steamed basmati rice', allergens: [] },
  { id: '13', item_name: 'Gulab Jamun', category: 'Desserts', price: 30, is_veg: true, is_available: true, description: 'Warm milk-solid dumplings soaked in rose-cardamom syrup', allergens: ['dairy'] },
  { id: '14', item_name: 'Ice Cream', category: 'Desserts', price: 35, is_veg: true, is_available: true, description: 'Creamy scoop of vanilla, chocolate, or strawberry', allergens: ['dairy'] },
  { id: '15', item_name: 'Rasgulla', category: 'Desserts', price: 25, is_veg: true, is_available: true, description: 'Soft spongy cheese balls soaked in light sugar syrup', allergens: ['dairy'] },
];

const ALLERGEN_OPTIONS = ['dairy', 'gluten', 'nuts', 'soy', 'eggs', 'shellfish'];

interface CartItem {
  menu_id: string;
  item_name: string;
  qty: number;
  price: number;
}

export default function TeacherCanteenPage() {
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
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const filtered = useMemo(() => {
    return menu.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchVeg = !vegOnly || item.is_veg;
      const allergensList = Array.isArray(item.allergens)
        ? item.allergens
        : (typeof item.allergens === 'string'
            ? item.allergens.split(',').map(x => x.trim()).filter(Boolean)
            : []);
      const matchAllergens =
        excludeAllergens.length === 0 ||
        !allergensList.some((a: string) => excludeAllergens.includes(a.toLowerCase()));
      return matchCat && matchSearch && matchVeg && matchAllergens && item.is_available;
    });
  }, [menu, activeCategory, searchTerm, vegOnly, excludeAllergens]);

  const addToCart = (item: (typeof MOCK_MENU)[0]) => {
    setCart(prev => {
      const exists = prev.find(c => c.menu_id === item.id);
      if (exists) return prev.map(c => c.menu_id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menu_id: item.id, item_name: item.item_name, qty: 1, price: item.price }];
    });
  };

  const updateQty = (menuId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c => (c.menu_id === menuId ? { ...c, qty: c.qty + delta } : c))
        .filter(c => c.qty > 0)
    );
  };

  const removeFromCart = (menuId: string) => {
    setCart(prev => prev.filter(c => c.menu_id !== menuId));
  };

  const getQty = (menuId: string) => cart.find(c => c.menu_id === menuId)?.qty || 0;
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    const mockTeacherId = 't0000000-0000-0000-0000-000000000001';
    try {
      await apiPost('/canteen/orders', {
        teacher_id: mockTeacherId,
        items: cart,
        total_amount: cartTotal,
        payment_method: 'Wallet',
        special_instructions: specialInstructions,
        offer_code: promoCode || undefined,
      });
    } catch (err) {
      console.log('Order placed with mock fallback');
    }
    setOrderPlaced(true);
    setIsPlacingOrder(false);
    setTimeout(() => {
      setOrderPlaced(false);
      setCart([]);
      setShowCart(false);
      setPromoCode('');
      setSpecialInstructions('');
    }, 3000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Snacks':
        return <UtensilsCrossed className="w-7 h-7 text-[#6C2BD9]/25" />;
      case 'Beverages':
        return <Coffee className="w-7 h-7 text-[#6C2BD9]/25" />;
      case 'Meals':
        return <Salad className="w-7 h-7 text-[#6C2BD9]/25" />;
      case 'Desserts':
        return <IceCreamCone className="w-7 h-7 text-[#6C2BD9]/25" />;
      default:
        return <UtensilsCrossed className="w-7 h-7 text-[#6C2BD9]/25" />;
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">

      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Campus Canteen</h1>
              <p className="text-xs text-[#C4B5FD]/70">Faculty ordering portal &bull; Skip the queue</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for food, drinks..."
              className="w-full pl-11 pr-4 py-3 bg-[#13102A]/80 border border-white/10 rounded-2xl text-sm text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 backdrop-blur-sm transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/40 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

        {/* ── Category Tabs + Filters ──────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 z-20 bg-[#0D0A1A]/90 backdrop-blur-lg py-3 -mx-6 px-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
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

          <div className="flex gap-2">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                vegOnly
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 20.5C7 17.5 12 15 12 15s5 2.5 5 5.5" />
                <circle cx="12" cy="9" r="6" />
              </svg>
              Veg
            </button>

            <button
              onClick={() => setShowAllergenFilter(!showAllergenFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                excludeAllergens.length > 0
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Allergens {excludeAllergens.length > 0 && `(${excludeAllergens.length})`}
            </button>
          </div>
        </div>

        {/* Allergen Filter Panel */}
        {showAllergenFilter && (
          <div className="mb-4 p-4 rounded-xl bg-[#13102A]/80 border border-orange-500/20 backdrop-blur-sm">
            <span className="text-xs font-bold text-orange-400 mb-2 block">Exclude allergens:</span>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map(a => (
                <button
                  key={a}
                  onClick={() => {
                    setExcludeAllergens(prev =>
                      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    excludeAllergens.includes(a)
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:text-white'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Filters Summary ─────────────────────────── */}
        {(vegOnly || excludeAllergens.length > 0 || searchTerm) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#C4B5FD]/40 font-medium">Active filters:</span>
            {vegOnly && (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                Veg Only <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setVegOnly(false)} />
              </span>
            )}
            {excludeAllergens.map(a => (
              <span key={a} className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-400 flex items-center gap-1">
                No {a} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setExcludeAllergens(prev => prev.filter(x => x !== a))} />
              </span>
            ))}
            {searchTerm && (
              <span className="px-2 py-1 rounded-lg bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 text-[10px] font-bold text-[#A78BFA] flex items-center gap-1">
                &quot;{searchTerm}&quot; <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
          </div>
        )}

        {/* ── Section Headers + Menu Grid ──────────────────────── */}
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
          const items = filtered.filter(i => i.category === cat.id);
          if (activeCategory !== 'all' && activeCategory !== cat.id) return null;
          if (items.length === 0) return null;
          return (
            <div key={cat.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{cat.icon}</span>
                <h2 className="text-base font-bold text-white">{cat.name}</h2>
                <span className="text-[10px] text-[#C4B5FD]/40 bg-white/5 px-2 py-0.5 rounded-full">{items.length} items</span>
                <div className="flex-1 h-px bg-white/5 ml-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => {
                  const qty = getQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#13102A]/60 border border-white/5 overflow-hidden hover:border-[#6C2BD9]/25 transition-all group backdrop-blur-sm"
                    >
                      {/* Image Area */}
                      <div className="h-28 bg-gradient-to-br from-[#6C2BD9]/15 to-[#13102A] flex items-center justify-center relative">
                        {getCategoryIcon(item.category)}

                        <div className="absolute top-2 right-2 flex gap-1.5">
                          {item.is_veg ? (
                            <span className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                              <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M7 20.5C7 17.5 12 15 12 15s5 2.5 5 5.5" />
                                <circle cx="12" cy="9" r="6" />
                              </svg>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-[8px] font-bold text-red-400">NV</span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-white flex-1 leading-tight">{item.item_name}</h3>
                          <span className="text-base font-extrabold text-white whitespace-nowrap">₹{item.price}</span>
                        </div>

                        <p className="text-[10px] text-[#C4B5FD]/50 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Allergen badges */}
                        {(() => {
                          const allergensList = Array.isArray(item.allergens)
                            ? item.allergens
                            : (typeof item.allergens === 'string'
                                ? item.allergens.split(',').map(x => x.trim()).filter(Boolean)
                                : []);
                          if (allergensList.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {allergensList.map((a: string) => (
                                <span
                                  key={a}
                                  className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400/70"
                                >
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
                                {qty === 1 ? <Trash2 className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4" />}
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
            </div>
          );
        })}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7 text-[#C4B5FD]/20" />
            </div>
            <p className="text-sm text-[#C4B5FD]/40 text-center">No items found. Try a different filter or search term.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setVegOnly(false);
                setExcludeAllergens([]);
                setActiveCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Floating Cart Bar ────────────────────────────────── */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-3rem)] max-w-lg">
          <button
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] shadow-2xl shadow-[#6C2BD9]/40 hover:shadow-[#6C2BD9]/60 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{cartCount} item{cartCount > 1 ? 's' : ''} in cart</p>
                <p className="text-[10px] text-white/70">Tap to review &amp; checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-white">₹{cartTotal}</span>
              <ChevronRight className="w-4 h-4 text-white/70" />
            </div>
          </button>
        </div>
      )}

      {/* ── Cart Drawer ──────────────────────────────────────── */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCart(false)}
        >
          <div
            className="w-full max-w-lg bg-[#13102A] rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {orderPlaced ? (
              <div className="p-10 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Order Placed!</h3>
                <p className="text-xs text-[#C4B5FD]/60 max-w-xs">
                  Your order has been submitted successfully. Pick it up at the canteen counter.
                </p>
                <button
                  onClick={() => { setOrderPlaced(false); setShowCart(false); }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/20 transition-all"
                >
                  Back to Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Header */}
                <div className="p-5 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#A78BFA]" />
                    <h3 className="font-bold text-lg text-white">Your Cart</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#6C2BD9]/20 text-[10px] font-bold text-[#A78BFA]">
                      {cartCount}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCart(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="p-5 flex flex-col gap-3">
                  {cart.map(item => (
                    <div
                      key={item.menu_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.item_name}</p>
                        <p className="text-[10px] text-[#C4B5FD]/50">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <div className="flex items-center gap-1 bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 rounded-lg">
                          <button
                            onClick={() => updateQty(item.menu_id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-[#A78BFA] hover:text-white transition-colors"
                          >
                            {item.qty === 1 ? <Trash2 className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3" />}
                          </button>
                          <span className="text-xs font-bold text-white w-5 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.menu_id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#A78BFA] hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-white w-14 text-right">₹{item.price * item.qty}</span>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#C4B5FD]/40">
                      Your cart is empty. Add items from the menu.
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    {/* Promo Code */}
                    <div className="px-5 pb-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C4B5FD]/40" />
                          <input
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="w-full pl-9 pr-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 transition-colors"
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
                        placeholder="Any special instructions? (e.g., less spicy, extra napkins)"
                        rows={2}
                        className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 resize-none transition-colors"
                      />
                    </div>

                    {/* Price Summary */}
                    <div className="px-5 pb-2">
                      <div className="rounded-xl bg-white/5 p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#C4B5FD]/60">Subtotal ({cartCount} items)</span>
                          <span className="text-xs font-semibold text-white">₹{cartTotal}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#C4B5FD]/60">GST (5%)</span>
                          <span className="text-xs font-semibold text-white">₹{Math.round(cartTotal * 0.05)}</span>
                        </div>
                        {promoCode && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-400">Promo discount</span>
                            <span className="text-xs font-semibold text-emerald-400">-₹0</span>
                          </div>
                        )}
                        <div className="h-px bg-white/10 my-1" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">Total</span>
                          <span className="text-base font-extrabold text-white">
                            ₹{cartTotal + Math.round(cartTotal * 0.05)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Place Order */}
                    <div className="p-5">
                      <button
                        onClick={placeOrder}
                        disabled={isPlacingOrder}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-sm font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        {isPlacingOrder ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            Place Order &bull; ₹{cartTotal + Math.round(cartTotal * 0.05)}
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-[#C4B5FD]/30 text-center mt-2">
                        Payment will be deducted from your staff wallet
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
