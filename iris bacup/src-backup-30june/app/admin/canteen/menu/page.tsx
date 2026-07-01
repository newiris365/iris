"use client";

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Search, ToggleLeft, ToggleRight, IndianRupee, Package } from 'lucide-react';
import { apiGet, apiPut } from '../../../../lib/api';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Specials', 'Combos'];

export default function AdminMenuManagement() {
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/canteen-menu');
        if (res.success) setMenu(res.menu || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    await apiPut(`campusCore/vendor/menu/${id}/availability`, { is_available: !current });
    setMenu(menu.map(m => m.id === id ? { ...m, is_available: !current } : m));
  };

  const handlePriceUpdate = async (id: string, price: number) => {
    await apiPut(`campusCore/vendor/menu/${id}/price`, { price });
    setMenu(menu.map(m => m.id === id ? { ...m, price } : m));
  };

  const handleStockUpdate = async (id: string, delta: number) => {
    const item = menu.find(m => m.id === id);
    if (!item) return;
    const newStock = Math.max(0, (item.stock_quantity || 0) + delta);
    await apiPut(`campusCore/vendor/menu/${id}/stock`, { stock: newStock });
    setMenu(menu.map(m => m.id === id ? { ...m, stock_quantity: newStock } : m));
  };

  const filtered = menu.filter(m =>
    (activeCategory === 'All' || m.category === activeCategory) &&
    (!searchTerm || m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <UtensilsCrossed size={24} className="text-emerald-400" />
        Menu Management
      </h1>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            placeholder="Search menu items..." />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeCategory === c ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading menu...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No menu items found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id}
              className={`bg-white/5 rounded-xl p-4 border transition-all ${item.is_available ? 'border-white/10' : 'border-red-500/30 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                    {item.is_vegetarian && <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded">Veg</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <IndianRupee size={12} className="text-slate-400" />
                  <input type="number" value={item.price}
                    onChange={e => handlePriceUpdate(item.id, parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs w-16 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex items-center gap-1">
                  <Package size={12} className="text-slate-400" />
                  <span className="text-xs text-white">{item.stock_quantity || 0}</span>
                  <button onClick={() => handleStockUpdate(item.id, -1)} className="w-5 h-5 rounded bg-white/10 text-white text-xs hover:bg-white/20">-</button>
                  <button onClick={() => handleStockUpdate(item.id, 1)} className="w-5 h-5 rounded bg-white/10 text-white text-xs hover:bg-white/20">+</button>
                </div>
              </div>

              <button onClick={() => handleToggle(item.id, item.is_available)}
                className={`w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                  item.is_available ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}>
                {item.is_available ? <><ToggleRight size={14} /> Available</> : <><ToggleLeft size={14} /> Unavailable</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
