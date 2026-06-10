"use client";

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Search, Leaf, Flame, Edit3,
  Trash2, Eye, EyeOff, X, Save, ArrowLeft, Star, Clock
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../../lib/api';

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'All', icon: '🍽️' },
  { id: 'cat-2', name: 'Snacks', icon: '🍿' },
  { id: 'cat-3', name: 'Beverages', icon: '☕' },
  { id: 'cat-4', name: 'Meals', icon: '🍛' },
  { id: 'cat-5', name: 'Desserts', icon: '🍨' },
  { id: 'cat-6', name: 'Combos', icon: '🎁' },
];

const MOCK_MENU: any[] = [
  { id: '1', item_name: 'Masala Dosa', category: 'Meals', price: 80, is_veg: true, is_available: true, calories: 350, prep_time_mins: 12, spice_level: 2, rating_avg: 4.5, description: 'Crispy rice crepe with spiced potato filling', image_url: '' },
  { id: '2', item_name: 'Cold Coffee', category: 'Beverages', price: 60, is_veg: true, is_available: true, calories: 180, prep_time_mins: 5, spice_level: 0, rating_avg: 4.7, description: 'Chilled coffee blended with ice cream', image_url: '' },
  { id: '3', item_name: 'Veg Biryani', category: 'Meals', price: 130, is_veg: true, is_available: true, calories: 520, prep_time_mins: 20, spice_level: 2, rating_avg: 4.2, description: 'Fragrant basmati rice with vegetables', image_url: '' },
  { id: '4', item_name: 'Samosa (2pc)', category: 'Snacks', price: 30, is_veg: true, is_available: true, calories: 260, prep_time_mins: 3, spice_level: 1, rating_avg: 4.8, description: 'Crispy fried pastry with spiced filling', image_url: '' },
  { id: '5', item_name: 'Paneer Tikka Roll', category: 'Snacks', price: 120, is_veg: true, is_available: true, calories: 380, prep_time_mins: 10, spice_level: 2, rating_avg: 4.4, description: 'Grilled paneer wrapped in rumali roti', image_url: '' },
  { id: '6', item_name: 'Chicken Biryani', category: 'Meals', price: 180, is_veg: false, is_available: true, calories: 620, prep_time_mins: 25, spice_level: 3, rating_avg: 4.6, description: 'Dum-cooked aromatic rice with chicken', image_url: '' },
  { id: '7', item_name: 'Fresh Lime Soda', category: 'Beverages', price: 40, is_veg: true, is_available: false, calories: 80, prep_time_mins: 3, spice_level: 0, rating_avg: 4.1, description: 'Sweet or salty fresh lime with soda', image_url: '' },
  { id: '8', item_name: 'Gulab Jamun', category: 'Desserts', price: 50, is_veg: true, is_available: true, calories: 290, prep_time_mins: 2, spice_level: 0, rating_avg: 4.3, description: 'Warm milk dumplings in sweet syrup', image_url: '' },
];

const spiceLevels = ['None', 'Mild', 'Medium', 'Hot'];
const spiceColors = ['text-gray-400', 'text-green-400', 'text-amber-400', 'text-red-400'];

export default function AdminMenuManagement() {
  const [menu, setMenu] = useState<any[]>(MOCK_MENU);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const res = await apiGet('/canteen/menu/all');
      if (res.success && res.menu?.length > 0) {
        setMenu(res.menu);
      }
    } catch (err) {
      console.log('Using mock menu data');
    }
  };

  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleToggle = async (id: string) => {
    try {
      await apiPut(`/canteen/menu/${id}/toggle`, {});
    } catch (err) {}
    setMenu(prev => prev.map(i => i.id === id ? { ...i, is_available: !i.is_available } : i));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await apiDelete(`/canteen/menu/${id}`);
    } catch (err) {}
    setMenu(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async (formData: any) => {
    try {
      if (editItem) {
        await apiPut(`/canteen/menu/${editItem.id}`, formData);
      } else {
        await apiPost('/canteen/menu', formData);
      }
    } catch (err) {}

    if (editItem) {
      setMenu(prev => prev.map(i => i.id === editItem.id ? { ...i, ...formData } : i));
    } else {
      setMenu(prev => [...prev, { ...formData, id: `new-${Date.now()}`, is_available: true, rating_avg: 0 }]);
    }
    setShowModal(false);
    setEditItem(null);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin/canteen" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="font-extrabold text-2xl text-white">Digital Menu Manager</h1>
              <p className="text-xs text-[#C4B5FD]/70">Add, edit, and manage your canteen's food inventory</p>
            </div>
          </div>

          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>

        {/* ── Category Tabs + Search ────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {MOCK_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.name
                    ? 'bg-[#6C2BD9] text-white shadow-lg shadow-[#6C2BD9]/30'
                    : 'bg-[#13102A] text-[#C4B5FD]/70 border border-white/5 hover:border-[#6C2BD9]/30'
                }`}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu..."
              className="pl-10 pr-4 py-2.5 bg-[#13102A] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#C4B5FD]/30 outline-none focus:border-[#6C2BD9]/50 w-56"
            />
          </div>
        </div>

        {/* ── Menu Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`glass-panel rounded-2xl border border-white/5 overflow-hidden group hover:border-[#6C2BD9]/30 transition-all ${
                !item.is_available ? 'opacity-50' : ''
              }`}
            >
              {/* Image Placeholder */}
              <div className="h-36 bg-gradient-to-br from-[#6C2BD9]/20 to-[#13102A] flex items-center justify-center relative">
                <UtensilsCrossed className="w-10 h-10 text-[#6C2BD9]/30" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {item.is_veg ? (
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Leaf className="w-3 h-3 text-emerald-400" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[8px] font-bold text-red-400">
                      NV
                    </span>
                  )}
                  {item.spice_level > 0 && (
                    <span className={`w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center`}>
                      <Flame className={`w-3 h-3 ${spiceColors[item.spice_level]}`} />
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditItem(item); setShowModal(true); }}
                    className="w-7 h-7 rounded-lg bg-[#13102A]/90 border border-white/10 flex items-center justify-center text-white hover:border-[#6C2BD9]/50 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="w-7 h-7 rounded-lg bg-[#13102A]/90 border border-white/10 flex items-center justify-center text-white hover:border-amber-500/50 transition-all"
                  >
                    {item.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-7 h-7 rounded-lg bg-[#13102A]/90 border border-white/10 flex items-center justify-center text-red-400 hover:border-red-500/50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!item.is_available && (
                  <div className="absolute inset-0 bg-[#0D0A1A]/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/30">UNAVAILABLE</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.item_name}</h3>
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{item.category}</p>
                  </div>
                  <span className="text-lg font-extrabold text-white">₹{item.price}</span>
                </div>

                {item.description && (
                  <p className="text-[10px] text-[#C4B5FD]/50 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                    <Star className="w-3 h-3 fill-yellow-400" /> {item.rating_avg}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#C4B5FD]/50">
                    <Clock className="w-3 h-3" /> {item.prep_time_mins}m
                  </span>
                  <span className="text-[10px] text-[#C4B5FD]/50">
                    {item.calories} kcal
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[#C4B5FD]/40 text-sm">
            No menu items found matching your criteria.
          </div>
        )}

        {/* ── Add/Edit Modal ────────────────────────────────── */}
        {showModal && (
          <MenuItemModal
            item={editItem}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditItem(null); }}
          />
        )}
      </div>
    </main>
  );
}

function MenuItemModal({ item, onSave, onClose }: { item: any; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    item_name: item?.item_name || '',
    category: item?.category || 'Snacks',
    price: item?.price || '',
    description: item?.description || '',
    calories: item?.calories || '',
    prep_time_mins: item?.prep_time_mins || 10,
    is_veg: item?.is_veg ?? true,
    spice_level: item?.spice_level || 0,
    allergens: item?.allergens || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      price: Number(form.price),
      calories: form.calories ? Number(form.calories) : null,
      prep_time_mins: Number(form.prep_time_mins),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">{item ? 'Edit Menu Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Item Name *</label>
              <input
                required
                value={form.item_name}
                onChange={e => setForm({ ...form, item_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              >
                {['Snacks', 'Beverages', 'Meals', 'Desserts', 'Combos'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Price (₹) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Calories</label>
              <input
                type="number"
                value={form.calories}
                onChange={e => setForm({ ...form, calories: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Prep Time (min)</label>
              <input
                type="number"
                min="1"
                value={form.prep_time_mins}
                onChange={e => setForm({ ...form, prep_time_mins: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>

            {/* Veg / Spice */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, is_veg: !form.is_veg })}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                    form.is_veg ? 'bg-emerald-500 border-emerald-400' : 'bg-red-500 border-red-400'
                  }`}
                >
                  {form.is_veg ? <Leaf className="w-3 h-3 text-white" /> : <span className="text-[8px] font-bold text-white">NV</span>}
                </div>
                <span className="text-[10px] text-[#C4B5FD]/70">{form.is_veg ? 'Vegetarian' : 'Non-Veg'}</span>
              </label>
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Spice Level</label>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({ ...form, spice_level: level })}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                      form.spice_level === level
                        ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white'
                        : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:border-white/20'
                    }`}
                  >
                    {spiceLevels[level]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#C4B5FD]/70 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> {item ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
