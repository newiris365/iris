"use client";

import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, ArrowLeft, Trash2, X, Save, Percent,
  IndianRupee, Calendar, Users, Copy, CheckCircle2
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../../lib/api';

const MOCK_OFFERS = [
  { id: 'off-1', code: 'WELCOME50', title: 'Welcome Offer', description: 'Get 50% off on your first order', discount_type: 'percentage', discount_value: 50, min_order_amount: 100, max_discount: 75, usage_limit: 500, used_count: 234, valid_from: '2026-06-01', valid_until: '2026-06-30', is_active: true },
  { id: 'off-2', code: 'FLAT30', title: 'Flat ₹30 Off', description: 'Flat ₹30 off on orders above ₹150', discount_type: 'flat', discount_value: 30, min_order_amount: 150, max_discount: 30, usage_limit: 1000, used_count: 678, valid_from: '2026-06-01', valid_until: '2026-07-31', is_active: true },
  { id: 'off-3', code: 'COMBO20', title: 'Combo Deal', description: '20% off on combo meals', discount_type: 'percentage', discount_value: 20, min_order_amount: 200, max_discount: 50, usage_limit: 300, used_count: 299, valid_from: '2026-05-01', valid_until: '2026-05-31', is_active: false },
  { id: 'off-4', code: 'SNACK10', title: 'Snack Time', description: '10% off between 3-5 PM on snacks', discount_type: 'percentage', discount_value: 10, min_order_amount: 50, max_discount: 25, usage_limit: 200, used_count: 89, valid_from: '2026-06-01', valid_until: '2026-12-31', is_active: true },
];

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>(MOCK_OFFERS);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const res = await apiGet('/canteen/offers');
      if (res.success && res.offers?.length > 0) setOffers(res.offers);
    } catch (err) { console.log('Using mock offers'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    try { await apiDelete(`/canteen/offers/${id}`); } catch (err) {}
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreate = async (form: any) => {
    try { await apiPost('/canteen/offers', form); } catch (err) {}
    setOffers(prev => [...prev, { ...form, id: `new-${Date.now()}`, used_count: 0, is_active: true }]);
    setShowModal(false);
  };

  const activeOffers = offers.filter(o => o.is_active);
  const expiredOffers = offers.filter(o => !o.is_active);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <a href="/admin/canteen" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <h1 className="font-extrabold text-2xl text-white">Offers & Promotions</h1>
              <p className="text-xs text-[#C4B5FD]/70">Create discount codes and track redemption analytics</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Offer
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Offers', value: activeOffers.length, icon: Tag, color: 'text-emerald-400' },
            { label: 'Total Redemptions', value: offers.reduce((s, o) => s + o.used_count, 0), icon: Users, color: 'text-blue-400' },
            { label: 'Avg Discount', value: `₹${Math.round(offers.reduce((s, o) => s + (o.discount_type === 'flat' ? o.discount_value : o.max_discount || 0), 0) / Math.max(offers.length, 1))}`, icon: IndianRupee, color: 'text-amber-400' },
            { label: 'Expired', value: expiredOffers.length, icon: Calendar, color: 'text-red-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-xl font-extrabold text-white">{stat.value}</p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active Offers */}
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" /> Active Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} onDelete={handleDelete} onCopy={handleCopy} copiedCode={copiedCode} />
            ))}
            {activeOffers.length === 0 && (
              <p className="col-span-2 py-10 text-center text-xs text-[#C4B5FD]/40">No active offers. Create one to boost sales!</p>
            )}
          </div>
        </div>

        {/* Expired Offers */}
        {expiredOffers.length > 0 && (
          <div className="flex flex-col gap-4 opacity-60">
            <h2 className="font-bold text-base text-white">Expired / Inactive</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expiredOffers.map(offer => (
                <OfferCard key={offer.id} offer={offer} onDelete={handleDelete} onCopy={handleCopy} copiedCode={copiedCode} />
              ))}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && <CreateOfferModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
      </div>
    </main>
  );
}

function OfferCard({ offer, onDelete, onCopy, copiedCode }: any) {
  const usagePercent = Math.min(100, (offer.used_count / (offer.usage_limit || 1)) * 100);

  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-5 hover:border-[#6C2BD9]/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm text-white">{offer.title}</h3>
          <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{offer.description}</p>
        </div>
        <button onClick={() => onDelete(offer.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Code Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 border-dashed">
          <span className="text-sm font-mono font-extrabold text-[#A78BFA] tracking-widest">{offer.code}</span>
          <button onClick={() => onCopy(offer.code)} className="text-[#C4B5FD]/50 hover:text-white transition-colors">
            {copiedCode === offer.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
          offer.discount_type === 'percentage'
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
        </span>
      </div>

      {/* Usage Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-[#C4B5FD]/50 mb-1">
          <span>{offer.used_count} redeemed</span>
          <span>{offer.usage_limit} limit</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-400' : usagePercent > 60 ? 'bg-amber-400' : 'bg-[#6C2BD9]'}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-4 text-[10px] text-[#C4B5FD]/40">
        {offer.min_order_amount > 0 && <span>Min ₹{offer.min_order_amount}</span>}
        {offer.max_discount && <span>Max ₹{offer.max_discount}</span>}
        {offer.valid_until && <span>Until {new Date(offer.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
      </div>
    </div>
  );
}

function CreateOfferModal({ onSave, onClose }: { onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: '', title: '', description: '',
    discount_type: 'percentage', discount_value: '',
    min_order_amount: '', max_discount: '',
    usage_limit: '100', valid_until: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      code: form.code.toUpperCase(),
      discount_value: Number(form.discount_value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: Number(form.usage_limit),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">Create New Offer</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Promo Code *</label>
            <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SAVE20" className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white font-mono uppercase outline-none focus:border-[#6C2BD9]/50" />
          </div>
          <div>
            <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
          </div>
          <div>
            <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Discount Type</label>
              <div className="flex gap-2">
                {['percentage', 'flat'].map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, discount_type: t })}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                      form.discount_type === t ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white' : 'bg-white/5 border-white/10 text-[#C4B5FD]/50'
                    }`}
                  >
                    {t === 'percentage' ? <><Percent className="w-3 h-3" /> %</> : <><IndianRupee className="w-3 h-3" /> Flat</>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Value *</label>
              <input required type="number" min="1" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Min Order (₹)</label>
              <input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Max Discount (₹)</label>
              <input type="number" value={form.max_discount} onChange={e => setForm({ ...form, max_discount: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider mb-1 block">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-[#C4B5FD]/70 hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all">
              <Save className="w-3.5 h-3.5" /> Create Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
