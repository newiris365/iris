"use client";

import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle, Clock, Camera, MapPin, Filter, RefreshCw } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

interface LostFoundItem {
  id: string;
  item_name: string;
  category: string;
  description: string;
  photo_url: string | null;
  location_found: string;
  found_date: string;
  status: 'available' | 'claimed' | 'returned' | 'disposed';
  reported_by_name: string;
  claimed_by_name: string | null;
  claimed_at: string | null;
  created_at: string;
}

const CATEGORIES = ['All', 'Electronics', 'ID Card', 'Wallet', 'Keys', 'Bag', 'Books', 'Clothing', 'Accessories', 'Other'];
const STATUSES = ['All', 'available', 'claimed', 'returned'];

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ item_name: '', category: 'Other', description: '', location_found: '', photo_url: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/core/lost-found');
      if (res.success) setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load lost & found items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    try {
      const res = await apiPost('/core/lost-found', newItem);
      if (res.success) {
        setShowAdd(false);
        setNewItem({ item_name: '', category: 'Other', description: '', location_found: '', photo_url: '' });
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to add item', err);
    }
  };

  const handleClaim = async (itemId: string) => {
    try {
      const res = await apiPost(`/core/lost-found/${itemId}/claim`, {});
      if (res.success) fetchItems();
    } catch (err) {
      console.error('Failed to claim item', err);
    }
  };

  const filtered = items.filter(item => {
    if (search && !item.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'All' && item.category !== category) return false;
    if (status !== 'All' && item.status !== status) return false;
    return true;
  });

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'available').length,
    claimed: items.filter(i => i.status === 'claimed').length,
    returned: items.filter(i => i.status === 'returned').length,
  };

  const getStatusColor = (s: string) => {
    if (s === 'available') return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (s === 'claimed') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (s === 'returned') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-[#C4B5FD]/60 bg-white/5 border-white/10';
  };

  const getCategoryIcon = (cat: string) => {
    const map: Record<string, string> = {
      Electronics: '📱', 'ID Card': '🪪', Wallet: '👛', Keys: '🔑',
      Bag: '🎒', Books: '📚', Clothing: '👕', Accessories: '💎', Other: '📦',
    };
    return map[cat] || '📦';
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
              <Package className="w-6 h-6 text-[#A78BFA]" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl">Lost & Found</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Report and claim lost items on campus</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center gap-1.5 transition-all">
              + Report Item
            </button>
            <button onClick={fetchItems} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] text-xs font-bold flex items-center gap-1.5 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Items', value: stats.total, color: 'text-white' },
            { label: 'Available', value: stats.available, color: 'text-green-400' },
            { label: 'Claimed', value: stats.claimed, color: 'text-yellow-400' },
            { label: 'Returned', value: stats.returned, color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
              <span className="text-xs text-[#C4B5FD]/60">{s.label}</span>
              <span className={`text-3xl font-heading font-extrabold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="glass-panel rounded-2xl p-6 border border-[#6C2BD9]/30">
            <h3 className="font-heading font-bold text-sm mb-4">Report Found Item</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={newItem.item_name} onChange={e => setNewItem(n => ({ ...n, item_name: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Item name" />
              <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
                {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={newItem.location_found} onChange={e => setNewItem(n => ({ ...n, location_found: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Location found" />
              <input value={newItem.photo_url} onChange={e => setNewItem(n => ({ ...n, photo_url: e.target.value }))}
                className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
                placeholder="Photo URL (optional)" />
              <textarea value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))}
                className="col-span-2 bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6] h-20 resize-none"
                placeholder="Description" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAdd} className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-xs font-bold transition-all">
                Submit
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C4B5FD] text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C4B5FD]/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
              placeholder="Search items..." />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-3 glass-panel rounded-2xl p-8 text-center text-[#C4B5FD]/40 text-xs">No items found</div>
          ) : filtered.map(item => (
            <div key={item.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-3 hover:border-[#6C2BD9]/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                  <div>
                    <h4 className="font-heading font-bold text-sm">{item.item_name}</h4>
                    <span className="text-[10px] text-[#C4B5FD]/50">{item.category}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
              {item.description && <p className="text-xs text-[#C4B5FD]/70 line-clamp-2">{item.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-[#C4B5FD]/50">
                {item.location_found && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location_found}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.found_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                <span className="text-[10px] text-[#C4B5FD]/40">By {item.reported_by_name}</span>
                {item.status === 'available' && (
                  <button onClick={() => handleClaim(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold hover:bg-green-500/30 transition-all">
                    Claim
                  </button>
                )}
                {item.claimed_by_name && (
                  <span className="text-[10px] text-yellow-400">Claimed by {item.claimed_by_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
