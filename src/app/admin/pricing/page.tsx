"use client";

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Save, Loader2, CheckCircle, Home, Bus, Dumbbell, Pencil } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../lib/api';

interface PricingPlan {
  id: string;
  service_type: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
}

const SERVICE_TYPES = [
  { key: 'hostel', label: 'Hostel', icon: Home, color: '#6C2BD9' },
  { key: 'transit', label: 'Transit', icon: Bus, color: '#10B981' },
  { key: 'gym', label: 'Gym', icon: Dumbbell, color: '#F59E0B' },
];

export default function ServicePricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('hostel');

  // Form state
  const [form, setForm] = useState({
    service_type: 'hostel',
    name: '',
    description: '',
    price: 0,
    duration_days: 30,
    features: [] as string[],
    featureInput: '',
  });

  useEffect(() => {
    const profile = localStorage.getItem('iris_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setUser(parsed);
      loadPlans(parsed.institution_id || 'a0000000-0000-0000-0000-000000000001');
    }
  }, []);

  const loadPlans = async (instId: string) => {
    setLoading(true);
    try {
      const res = await apiGet(`/service-subscriptions/pricing/${instId}`);
      if (res.success) setPlans(res.pricing || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) {
      alert('Name and price are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiPost('/service-subscriptions/pricing', {
        institution_id: user?.institution_id || 'a0000000-0000-0000-0000-000000000001',
        service_type: form.service_type,
        name: form.name,
        description: form.description,
        price: form.price,
        duration_days: form.duration_days,
        features: form.features,
      });
      if (res.success) {
        setShowNewForm(false);
        setEditingPlan(null);
        resetForm();
        loadPlans(user?.institution_id || 'a0000000-0000-0000-0000-000000000001');
      } else {
        alert(res.error || 'Failed to save plan');
      }
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this pricing plan?')) return;
    try {
      await apiDelete(`/service-subscriptions/pricing/${id}`);
      loadPlans(user?.institution_id || 'a0000000-0000-0000-0000-000000000001');
    } catch {}
  };

  const resetForm = () => {
    setForm({ service_type: activeTab, name: '', description: '', price: 0, duration_days: 30, features: [], featureInput: '' });
  };

  const addFeature = () => {
    if (form.featureInput.trim()) {
      setForm(f => ({ ...f, features: [...f.features, f.featureInput.trim()], featureInput: '' }));
    }
  };

  const removeFeature = (idx: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const startEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setShowNewForm(false);
    setForm({
      service_type: plan.service_type,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      duration_days: plan.duration_days,
      features: plan.features || [],
      featureInput: '',
    });
  };

  const filteredPlans = plans.filter(p => p.service_type === activeTab);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
                <Tag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Service Pricing</h1>
                <p className="text-sm text-[#C4B5FD]/70">Configure subscription pricing for Hostel, Transit & Gym</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowNewForm(true); setEditingPlan(null); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" /> New Plan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Service Type Tabs */}
        <div className="flex gap-2 mb-6">
          {SERVICE_TYPES.map(st => {
            const Icon = st.icon;
            return (
              <button
                key={st.key}
                onClick={() => { setActiveTab(st.key); setShowNewForm(false); setEditingPlan(null); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === st.key
                    ? 'bg-white/10 border border-white/10 text-white'
                    : 'bg-white/5 border border-white/5 text-[#C4B5FD]/50 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" style={{ color: st.color }} />
                {st.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plans List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA] mx-auto" />
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/30 p-12 text-center">
                <Tag className="w-10 h-10 text-[#C4B5FD]/20 mx-auto mb-3" />
                <p className="text-sm text-[#C4B5FD]/50">No pricing plans for {activeTab} yet.</p>
                <button
                  onClick={() => { resetForm(); setShowNewForm(true); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#6C2BD9]/20 text-xs font-bold text-[#A78BFA] hover:bg-[#6C2BD9]/30 transition-all"
                >
                  Create First Plan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.map(plan => (
                  <div key={plan.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                      {plan.description && <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{plan.description}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-extrabold text-emerald-400">₹{plan.price.toLocaleString()}</span>
                        <span className="text-[10px] text-[#C4B5FD]/40">/ {plan.duration_days} days</span>
                      </div>
                      {plan.features?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {plan.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-[#C4B5FD]/60 border border-white/5">{f}</span>
                          ))}
                          {plan.features.length > 3 && (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-[#C4B5FD]/60">+{plan.features.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => startEdit(plan)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                        <Pencil className="w-3.5 h-3.5 text-[#C4B5FD]" />
                      </button>
                      <button onClick={() => handleDelete(plan.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create/Edit Form */}
          {(showNewForm || editingPlan) && (
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl sticky top-6">
                <h3 className="text-sm font-bold text-white mb-4">
                  {editingPlan ? 'Edit Plan' : 'New Pricing Plan'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1.5">Service Type</label>
                    <select
                      value={form.service_type}
                      onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    >
                      {SERVICE_TYPES.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1.5">Plan Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Monthly Hostel Stay"
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1.5">Description</label>
                    <input
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description"
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1.5">Price (INR)</label>
                      <input
                        type="number"
                        value={form.price || ''}
                        onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1.5">Duration (days)</label>
                      <input
                        type="number"
                        value={form.duration_days || ''}
                        onChange={e => setForm(f => ({ ...f, duration_days: Number(e.target.value) }))}
                        className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-1.5">Features</label>
                    <div className="flex gap-2">
                      <input
                        value={form.featureInput}
                        onChange={e => setForm(f => ({ ...f, featureInput: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        placeholder="Add feature"
                        className="flex-1 bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                      />
                      <button onClick={addFeature} className="px-3 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10">Add</button>
                    </div>
                    {form.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.features.map((f, i) => (
                          <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-[#C4B5FD]/80 flex items-center gap-1">
                            {f}
                            <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setShowNewForm(false); setEditingPlan(null); resetForm(); }}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex justify-center items-center gap-1.5"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingPlan ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
