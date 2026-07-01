"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed, ToggleLeft, ToggleRight, IndianRupee, Package, Plus, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  stock_quantity: number;
  is_vegetarian: boolean;
  allergens: string[];
  image_url: string;
}

const CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Specials', 'Combos', 'Side Dishes'
];

export default function VendorMenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchMenu = useCallback(async () => {
    try {
      const params: any = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await apiGet('campusCore/canteen-menu', params);
      if (res.success) setMenu(res.menu || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggleAvailability = async (id: string, current: boolean) => {
    await apiPut(`campusCore/vendor/menu/${id}/availability`, { is_available: !current });
    fetchMenu();
  };

  const handlePriceUpdate = async (id: string, newPrice: number) => {
    if (newPrice < 0) return;
    await apiPut(`campusCore/vendor/menu/${id}/price`, { price: newPrice });
    fetchMenu();
  };

  const handleStockUpdate = async (id: string, delta: number) => {
    const item = menu.find(m => m.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock_quantity + delta);
    await apiPut(`campusCore/vendor/menu/${id}/stock`, { stock: newStock });
    fetchMenu();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <UtensilsCrossed size={24} className="text-emerald-400" />
        Menu Management
      </h1>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm ${categoryFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          All ({menu.length})
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm ${categoryFilter === cat ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading menu...</div>
      ) : menu.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-50" />
          <p>No menu items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map(item => (
            <div key={item.id}
              className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all ${
                item.is_available ? 'border-white/10' : 'border-red-500/30 opacity-60'
              }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    {item.is_vegetarian && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded">Veg</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{item.description || 'No description'}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded">{item.category}</span>
                    {item.allergens && item.allergens.length > 0 && (
                      <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        ⚠ {item.allergens.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Stock */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <IndianRupee size={14} className="text-slate-400" />
                  <input type="number" value={item.price}
                    onChange={(e) => handlePriceUpdate(item.id, parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm w-20 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span className="text-sm text-white">{item.stock_quantity}</span>
                  <button onClick={() => handleStockUpdate(item.id, -1)}
                    className="w-6 h-6 rounded bg-white/10 text-white text-sm hover:bg-white/20">-</button>
                  <button onClick={() => handleStockUpdate(item.id, 1)}
                    className="w-6 h-6 rounded bg-white/10 text-white text-sm hover:bg-white/20">+</button>
                </div>
              </div>

              {/* Toggle Availability */}
              <button onClick={() => handleToggleAvailability(item.id, item.is_available)}
                className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                  item.is_available
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}>
                {item.is_available ? (
                  <><ToggleRight size={16} /> Available</>
                ) : (
                  <><ToggleLeft size={16} /> Unavailable</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
