"use client";
import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, X, UtensilsCrossed, Coffee, Salad, IceCreamCone, CheckCircle } from 'lucide-react';
import { apiPost } from '../../../lib/api';

type Category = "Snacks" | "Beverages" | "Meals" | "Desserts";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  veg: boolean;
  icon: React.ReactNode;
  description: string;
  rating: number;
  prepTime: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const menuItems: MenuItem[] = [
  { id: "1", name: "Vada Pav", price: 30, category: "Snacks", veg: true, icon: <UtensilsCrossed size={20} />, description: "Mumbai's iconic spicy potato fritter in a bun", rating: 4.5, prepTime: "5 min" },
  { id: "2", name: "Samosa", price: 25, category: "Snacks", veg: true, icon: <UtensilsCrossed size={20} />, description: "Crispy pastry stuffed with spiced potatoes", rating: 4.3, prepTime: "8 min" },
  { id: "3", name: "Chicken Roll", price: 60, category: "Snacks", veg: false, icon: <UtensilsCrossed size={20} />, description: "Grilled chicken wrapped in paratha", rating: 4.6, prepTime: "10 min" },
  { id: "4", name: "Pani Puri", price: 20, category: "Snacks", veg: true, icon: <UtensilsCrossed size={20} />, description: "Crispy shells with tangy spiced water", rating: 4.7, prepTime: "5 min" },
  { id: "5", name: "Chai", price: 10, category: "Beverages", veg: true, icon: <Coffee size={20} />, description: "Classic Indian masala chai", rating: 4.8, prepTime: "3 min" },
  { id: "6", name: "Coffee", price: 20, category: "Beverages", veg: true, icon: <Coffee size={20} />, description: "Filter coffee with fresh milk", rating: 4.4, prepTime: "4 min" },
  { id: "7", name: "Mango Lassi", price: 35, category: "Beverages", veg: true, icon: <Coffee size={20} />, description: "Creamy yogurt blended with mango", rating: 4.6, prepTime: "5 min" },
  { id: "8", name: "Cold Coffee", price: 40, category: "Beverages", veg: true, icon: <Coffee size={20} />, description: "Iced blended coffee with chocolate", rating: 4.5, prepTime: "6 min" },
  { id: "9", name: "Thali", price: 80, category: "Meals", veg: true, icon: <Salad size={20} />, description: "Complete meal with dal, sabzi, rice, roti", rating: 4.7, prepTime: "15 min" },
  { id: "10", name: "Biryani", price: 90, category: "Meals", veg: false, icon: <Salad size={20} />, description: "Aromatic rice layered with spiced chicken", rating: 4.9, prepTime: "20 min" },
  { id: "11", name: "Paneer Butter Masala", price: 70, category: "Meals", veg: true, icon: <Salad size={20} />, description: "Creamy tomato gravy with cottage cheese", rating: 4.5, prepTime: "15 min" },
  { id: "12", name: "Dal Rice", price: 50, category: "Meals", veg: true, icon: <Salad size={20} />, description: "Comfort meal of lentils and steamed rice", rating: 4.2, prepTime: "10 min" },
  { id: "13", name: "Gulab Jamun", price: 30, category: "Desserts", veg: true, icon: <IceCreamCone size={20} />, description: "Soft milk dumplings in sugar syrup", rating: 4.6, prepTime: "5 min" },
  { id: "14", name: "Ice Cream", price: 35, category: "Desserts", veg: true, icon: <IceCreamCone size={20} />, description: "Vanilla scoop with chocolate drizzle", rating: 4.4, prepTime: "2 min" },
  { id: "15", name: "Rasgulla", price: 25, category: "Desserts", veg: true, icon: <IceCreamCone size={20} />, description: "Spongy cheese balls in syrup", rating: 4.3, prepTime: "3 min" },
  { id: "16", name: "Jalebi", price: 30, category: "Desserts", veg: true, icon: <IceCreamCone size={20} />, description: "Crispy spirals soaked in saffron syrup", rating: 4.5, prepTime: "8 min" },
];

const categories: { name: Category; icon: React.ReactNode }[] = [
  { name: "Snacks", icon: <UtensilsCrossed size={18} /> },
  { name: "Beverages", icon: <Coffee size={18} /> },
  { name: "Meals", icon: <Salad size={18} /> },
  { name: "Desserts", icon: <IceCreamCone size={18} /> },
];

export default function CanteenPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderHistory, setOrderHistory] = useState<{ id: string; items: CartItem[]; total: number; time: string; status: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesVeg = !vegOnly || item.veg;
      return matchesSearch && matchesCategory && matchesVeg;
    });
  }, [search, activeCategory, vegOnly]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      await apiPost("/canteen/orders", { items: cart, total: cartTotal });
    } catch {
      // fallback to local
    }
    const newOrder = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      items: [...cart],
      total: cartTotal,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "Placed",
    };
    setOrderHistory((prev) => [newOrder, ...prev]);
    setCart([]);
    setCartOpen(false);
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 3000);
  };

  const getCartQuantity = (id: string) => cart.find((c) => c.id === id)?.quantity ?? 0;

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white">
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1530] border border-[#0891B2]/30 rounded-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <CheckCircle size={64} className="text-[#0891B2]" />
            <h2 className="text-2xl font-bold text-white">Order Placed!</h2>
            <p className="text-gray-400">Your food is being prepared</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-[#0D0A1A]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0891B2]/20 flex items-center justify-center">
              <UtensilsCrossed size={22} className="text-[#0891B2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Canteen</h1>
              <p className="text-xs text-gray-500">Fuel your brain, HOD!</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showHistory ? "bg-[#0891B2] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2 rounded-xl bg-[#0891B2]/20 text-[#0891B2] hover:bg-[#0891B2]/30 transition-all"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#0891B2] text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showHistory ? (
          <section>
            <h2 className="text-lg font-semibold mb-4">Order History</h2>
            {orderHistory.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <UtensilsCrossed size={48} className="mx-auto mb-3 opacity-30" />
                <p>No orders yet. Time to eat!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div key={order.id} className="bg-[#1A1530] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-mono text-[#0891B2]">{order.id}</span>
                        <span className="text-gray-500 text-sm ml-3">{order.time}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-300">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-gray-400 text-sm">Total</span>
                      <span className="font-bold text-[#0891B2]">₹{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <div className="relative mb-6">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1A1530] border border-white/5 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#0891B2]/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory("All")}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === "All" ? "bg-[#0891B2] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.name ? "bg-[#0891B2] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
              <div className="ml-auto">
                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    vegOnly ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-sm border-2 ${vegOnly ? "bg-emerald-400 border-emerald-400" : "border-gray-500"}`} />
                  Veg Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenu.map((item) => {
                const qty = getCartQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="group bg-[#1A1530] border border-white/5 rounded-2xl p-4 hover:border-[#0891B2]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#0891B2]/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 flex items-center justify-center text-[#0891B2]">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-sm border ${
                                item.veg ? "border-emerald-400 bg-emerald-400" : "border-red-400 bg-red-400"
                              }`}
                            />
                            <span className="text-xs text-gray-500">{item.prepTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#0891B2]">₹{item.price}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < Math.floor(item.rating) ? "text-amber-400" : "text-gray-700"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{item.rating}</span>
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#0891B2]/20 text-[#0891B2] text-sm font-medium hover:bg-[#0891B2]/30 transition-all"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium w-5 text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#0891B2]/20 text-[#0891B2] flex items-center justify-center hover:bg-[#0891B2]/30 transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <UtensilsCrossed size={48} className="mx-auto mb-3 opacity-30" />
                <p>No items found. Try a different search.</p>
              </div>
            )}
          </>
        )}
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-[#1A1530] border-l border-white/5 h-full overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-[#1A1530] border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart size={20} className="text-[#0891B2]" />
                Your Cart
                {cartCount > 0 && (
                  <span className="text-sm font-normal text-gray-500">({cartCount} items)</span>
                )}
              </h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <ShoppingCart size={48} className="mb-3 opacity-30" />
                <p>Your cart is empty</p>
                <p className="text-sm text-gray-600 mt-1">Add some delicious items!</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-[#0D0A1A] rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 flex items-center justify-center text-[#0891B2] shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-[#0891B2] text-sm font-semibold">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#0891B2]/20 text-[#0891B2] flex items-center justify-center hover:bg-[#0891B2]/30 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sticky bottom-0 bg-[#1A1530] border-t border-white/5 px-6 py-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-xl font-bold text-[#0891B2]">₹{cartTotal}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="w-full py-3 rounded-xl bg-[#0891B2] text-white font-semibold hover:bg-[#0891B2]/90 transition-all active:scale-[0.98]"
                  >
                    Place Order — ₹{cartTotal}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 px-6 py-3 bg-[#0891B2] text-white rounded-2xl shadow-xl shadow-[#0891B2]/30 hover:bg-[#0891B2]/90 transition-all active:scale-[0.98]"
          >
            <ShoppingCart size={18} />
            <span className="font-medium">View Cart</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-lg text-sm font-bold">₹{cartTotal}</span>
          </button>
        </div>
      )}
    </div>
  );
}
