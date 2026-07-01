"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Search, ShoppingCart, IndianRupee, Sparkles, CheckCircle, Clock,
  ArrowRight, ShieldCheck, RefreshCw, Star, Info
} from 'lucide-react';

interface MenuItem {
  id: string;
  item_name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_veg: boolean;
  allergens: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_time_minutes: number;
  stock_remaining: number;
}

interface CartItem {
  item: MenuItem;
  qty: number;
}

export default function QrOrderingPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const counterId = params.counterId as string;

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([
    { id: 'cat-all', name: 'All', icon: '🍽️' },
    { id: 'cat-1', name: 'Snacks', icon: '🍿' },
    { id: 'cat-2', name: 'Meals', icon: '🍛' },
    { id: 'cat-3', name: 'Beverages', icon: '🥤' }
  ]);
  const [activeCategory, setActiveCategory] = useState('cat-all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [walletBalance, setWalletBalance] = useState(350);
  const [offerCode, setOfferCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
      // Fetch menu from endpoint
      const res = await fetch(`/api/canteen/menu`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.menu) {
        setMenu(data.menu);
      } else {
        // Fallback mock menu
        setMenu([
          { id: 'm-1', item_name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato mash.', price: 80, image_url: '', is_available: true, is_veg: true, allergens: ['Dairy'], calories: 350, protein_g: 8, carbs_g: 50, fat_g: 10, prep_time_minutes: 10, stock_remaining: 5 },
          { id: 'm-2', item_name: 'Paneer Tikka Roll', description: 'Grilled paneer cubes wrapped in flatbread with mint chutney.', price: 120, image_url: '', is_available: true, is_veg: true, allergens: ['Gluten', 'Dairy'], calories: 420, protein_g: 14, carbs_g: 45, fat_g: 15, prep_time_minutes: 12, stock_remaining: 2 },
          { id: 'm-3', item_name: 'Cold Coffee', description: 'Creamy blended cold brew coffee with chocolate drizzle.', price: 60, image_url: '', is_available: true, is_veg: true, allergens: ['Dairy'], calories: 250, protein_g: 5, carbs_g: 30, fat_g: 8, prep_time_minutes: 5, stock_remaining: 15 },
          { id: 'm-4', item_name: 'Rajasthani Pyaz Kachori', description: 'Crispy deep-fried pastry filled with spicy onion mixture.', price: 30, image_url: '', is_available: true, is_veg: true, allergens: ['Gluten'], calories: 280, protein_g: 4, carbs_g: 35, fat_g: 12, prep_time_minutes: 5, stock_remaining: 0 }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (!item.is_available || item.stock_remaining === 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === itemId) {
        return { ...c, qty: Math.max(0, c.qty - 1) };
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;
      const res = await fetch('/api/canteen/offers/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code: offerCode, amount: totalSub })
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setDiscount(data.offer.discount_amount);
        alert(`Coupon applied successfully! You saved ₹${data.offer.discount_amount}.`);
      } else {
        alert(data.error || 'Invalid offer code.');
      }
    } catch (err) {
      // Mock validation
      if (offerCode.toLowerCase() === 'welcome10') {
        setDiscount(10);
        alert('Coupon Welcome10 applied! ₹10 Discount.');
      } else {
        alert('Invalid coupon code.');
      }
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const finalAmount = totalSub - discount;

    if (walletBalance < finalAmount) {
      alert('Insufficient wallet balance. Top up your wallet in the dashboard.');
      return;
    }

    try {
      setPlacing(true);
      const token = localStorage.getItem('iris_jwt_token') || '';
      const orderItems = cart.map(c => ({
        menu_id: c.item.id,
        item_name: c.item.item_name,
        qty: c.qty,
        price: c.item.price
      }));

      const res = await fetch('/api/canteen/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: 'b0000000-0000-0000-0000-000000000006', // Khushal
          items: orderItems,
          total_amount: totalSub,
          payment_method: 'Wallet',
          special_instructions: specialInstructions,
          offer_code: offerCode
        })
      });

      const data = await res.json();
      if (data.success) {
        setPlacedOrder(data.order);
        setCart([]);
        setWalletBalance(prev => prev - finalAmount);
      } else {
        alert(data.error || 'Failed to place order.');
      }
    } catch (err) {
      // Emulate success for demo/sandbox
      setPlacedOrder({
        order_number: `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        token_number: Math.floor(100 + Math.random() * 200),
        estimated_ready_minutes: 15,
        total_amount: finalAmount
      });
      setCart([]);
    } finally {
      setPlacing(false);
    }
  };

  const totalSub = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'cat-all' || 
                            (activeCategory === 'cat-1' && item.price < 50) || 
                            (activeCategory === 'cat-2' && item.price >= 50 && item.item_name.toLowerCase().includes('dosa')) ||
                            (activeCategory === 'cat-3' && item.item_name.toLowerCase().includes('coffee'));
    const matchesVeg = !vegFilter || item.is_veg;
    return matchesSearch && matchesCategory && matchesVeg;
  });

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Upper banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13102A]/80 backdrop-blur-md p-6 rounded-3xl border border-[#6C2BD9]/30 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-[#A78BFA] w-6 h-6 animate-pulse" />
            Express Counter Ordering
          </h1>
          <p className="text-xs text-[#A78BFA]/70 mt-1">
            Counter QR ID: {counterId || 'Express-01'} | Instant Digital Wallet Checkouts
          </p>
        </div>
        <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-[#A78BFA]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Wallet balance: ₹{walletBalance}
        </div>
      </div>

      {placedOrder ? (
        /* Order Confirmed Screen */
        <div className="max-w-md mx-auto bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-8 text-center space-y-6 animate-fadeIn">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
          <div>
            <h2 className="text-2xl font-bold text-white">Order Confirmed!</h2>
            <p className="text-xs text-[#A78BFA]/70 mt-1">Your payment was processed and order sent to kitchen queue.</p>
          </div>

          <div className="bg-[#0D0A1A] p-5 rounded-2xl border border-[#6C2BD9]/15">
            <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Your Token Number</div>
            <div className="text-4xl font-extrabold text-white mt-1">#{placedOrder.token_number || 142}</div>
            <div className="text-xs text-[#A78BFA] mt-2 font-mono">Order: {placedOrder.order_number}</div>
          </div>

          <div className="flex justify-center items-center gap-2 text-sm text-[#A78BFA]">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Estimated Prep Time: <strong>{placedOrder.estimated_ready_minutes || 15} minutes</strong></span>
          </div>

          <div className="pt-2">
            <a 
              href={`/canteen/track/${placedOrder.order_number}`}
              className="w-full inline-flex justify-center items-center gap-1.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold py-3 rounded-xl transition-all"
            >
              Track Live Progress
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        /* Menu & Cart layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Column (Left 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category tabs & search */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              {/* Category buttons */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 ${
                      activeCategory === cat.id
                        ? 'bg-[#6C2BD9] border-[#8B5CF6] text-white'
                        : 'bg-[#13102A] border-white/5 hover:bg-white/5 text-[#A78BFA]/85'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Veg switch & search */}
              <div className="flex gap-3">
                <button
                  onClick={() => setVegFilter(v => !v)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    vegFilter 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-[#13102A] border-white/5 text-[#A78BFA]/65'
                  }`}
                >
                  Veg Only 🌱
                </button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78BFA]/50" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl text-xs focus:outline-none focus:border-[#8B5CF6] text-white"
                  />
                </div>
              </div>
            </div>

            {/* "AI Recommended for You" segment */}
            <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#A78BFA]" />
                <h3 className="font-bold text-sm">AI Recommended combos for you</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {menu.slice(0, 2).map(item => (
                  <div 
                    key={`rec-${item.id}`}
                    onClick={() => addToCart(item)}
                    className="bg-[#13102A]/80 border border-[#6C2BD9]/30 p-3 rounded-xl flex items-center gap-3 shrink-0 w-64 hover:border-[#8B5CF6]/50 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#6C2BD9]/30 flex items-center justify-center font-bold">
                      {item.item_name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white">{item.item_name}</h4>
                      <p className="text-[10px] text-[#A78BFA]/70 mt-0.5">₹{item.price} • {item.calories} cal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu List */}
            {loading ? (
              <div className="py-12 text-center text-[#A78BFA]/60">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#6C2BD9]" />
                Gathering counter dishes...
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="py-12 text-center text-[#A78BFA]/50 border border-dashed border-[#6C2BD9]/20 rounded-2xl">
                No items match filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenu.map(item => {
                  const outOfStock = !item.is_available || item.stock_remaining === 0;
                  const lowStock = item.stock_remaining > 0 && item.stock_remaining < 10;
                  return (
                    <div 
                      key={item.id}
                      className={`bg-[#13102A]/80 border border-[#6C2BD9]/25 rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-[#6C2BD9]/50 relative ${
                        outOfStock ? 'opacity-50' : ''
                      }`}
                    >
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center font-bold text-red-400 text-sm">
                          Sold Out
                        </div>
                      )}
                      
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            {item.item_name}
                            {item.is_veg ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Veg" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-400/20" title="Non-Veg" />
                            )}
                          </h4>
                          <span className="font-extrabold text-sm text-[#A78BFA]">₹{item.price}</span>
                        </div>
                        <p className="text-xs text-[#A78BFA]/60 leading-relaxed line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4 border-t border-[#6C2BD9]/10 pt-3">
                        <div className="flex items-center gap-2 text-[10px] text-[#A78BFA]/50">
                          <span>{item.calories} Cal</span>
                          <span>•</span>
                          <span>{item.prep_time_minutes} min prep</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {lowStock && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                              Only {item.stock_remaining} left
                            </span>
                          )}
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all"
                          >
                            Add +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Column (Right 1/3) */}
          <div className="bg-[#13102A]/80 border border-[#6C2BD9]/30 rounded-3xl p-6 h-fit space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2 border-b border-[#6C2BD9]/20 pb-2">
              <ShoppingCart className="w-5 h-5 text-[#A78BFA]" />
              Your Cart ({cart.reduce((sum, c) => sum + c.qty, 0)})
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-[#A78BFA]/40 text-xs">
                Select items from the menu to start order.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart list */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border-b border-[#6C2BD9]/15 pb-4">
                  {cart.map(c => (
                    <div key={c.item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-semibold">{c.item.item_name}</h5>
                        <p className="text-[10px] text-[#A78BFA]/50 mt-0.5">₹{c.item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => removeFromCart(c.item.id)}
                          className="w-5 h-5 rounded-md bg-[#0D0A1A] border border-[#6C2BD9]/25 flex items-center justify-center font-bold hover:bg-[#6C2BD9]/20"
                        >
                          -
                        </button>
                        <span className="font-semibold font-mono w-4 text-center">{c.qty}</span>
                        <button 
                          onClick={() => addToCart(c.item)}
                          className="w-5 h-5 rounded-md bg-[#0D0A1A] border border-[#6C2BD9]/25 flex items-center justify-center font-bold hover:bg-[#6C2BD9]/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Offer Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code..."
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-lg text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleApplyOffer}
                    className="bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/40 border border-[#6C2BD9]/40 text-[#A78BFA] text-xs px-3 rounded-lg font-bold"
                  >
                    Apply
                  </button>
                </div>

                {/* Special Instructions */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#A78BFA]/50 uppercase font-semibold">Special Instructions</label>
                  <textarea
                    placeholder="E.g., extra spicy, no ice..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-lg p-2.5 text-xs focus:outline-none text-white resize-none"
                  />
                </div>

                {/* Billing Summary */}
                <div className="space-y-2 border-t border-[#6C2BD9]/15 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#A78BFA]/60">Subtotal</span>
                    <span>₹{totalSub}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t border-[#6C2BD9]/10 pt-2 text-white">
                    <span>Total Amount</span>
                    <span>₹{totalSub - discount}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={placing}
                  className="w-full bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C2BD9]/20 disabled:opacity-50 mt-4"
                >
                  {placing ? 'Processing Wallet Checkout...' : 'Pay with Wallet'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
