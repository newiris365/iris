"use client";

import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, ArrowLeft, Mail, Phone, ExternalLink,
  Edit2, Trash2, CheckCircle, Clock, Trash
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  company_type?: string;
  hr_name?: string;
  hr_email?: string;
  hr_phone?: string;
  tier?: string;
  notes?: string;
  relationship_status?: string;
}

export default function TpoCompaniesCrm() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyType, setCompanyType] = useState<'product' | 'service' | 'startup' | 'mnc' | 'psu' | 'ngo'>('product');
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  const [tier, setTier] = useState<'dream' | 'core' | 'mass'>('core');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await apiGet('/placements/companies');
      if (res.success && res.companies) {
        setCompanies(res.companies);
      }
    } catch (err) {
      console.log('Error fetching companies list');
    }

    // fallback mock seed if empty
    if (companies.length === 0) {
      setCompanies([
        {
          id: 'c-1',
          name: 'Google India',
          website: 'https://google.com',
          industry: 'Technology',
          company_type: 'mnc',
          hr_name: 'Neha Sen',
          hr_email: 'neha.sen@google.com',
          hr_phone: '+91 99881 23456',
          tier: 'dream',
          relationship_status: 'active',
          notes: 'High relationship value. Recruits SWE trainees.'
        },
        {
          id: 'c-2',
          name: 'ZS Associates',
          website: 'https://zs.com',
          industry: 'Consulting',
          company_type: 'product',
          hr_name: 'Preeti Sharma',
          hr_email: 'preeti.sharma@zs.com',
          hr_phone: '+91 99290 12347',
          tier: 'core',
          relationship_status: 'active',
          notes: 'Regular visitor. Analytical roles.'
        }
      ]);
    }
    setLoading(false);
  };

  const handleEdit = (comp: Company) => {
    setEditingId(comp.id);
    setName(comp.name || '');
    setWebsite(comp.website || '');
    setIndustry(comp.industry || '');
    setCompanyType((comp.company_type as any) || 'product');
    setHrName(comp.hr_name || '');
    setHrEmail(comp.hr_email || '');
    setHrPhone(comp.hr_phone || '');
    setTier((comp.tier as any) || 'core');
    setNotes(comp.notes || '');
    setStatus(comp.relationship_status || 'active');
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setName('');
    setWebsite('');
    setIndustry('');
    setCompanyType('product');
    setHrName('');
    setHrEmail('');
    setHrPhone('');
    setTier('core');
    setNotes('');
    setStatus('active');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name, website, industry, company_type: companyType,
        hr_name: hrName, hr_email: hrEmail, hr_phone: hrPhone,
        tier, notes, relationship_status: status
      };

      if (editingId) {
        // Update company
        const res = await apiPut(`/placements/companies/${editingId}`, payload);
        if (res.success && res.company) {
          setCompanies(prev => prev.map(c => c.id === editingId ? res.company : c));
          setShowForm(false);
        }
      } else {
        // Create company
        const res = await apiPost('/placements/companies', payload);
        if (res.success && res.company) {
          setCompanies([...companies, res.company]);
          setShowForm(false);
        }
      }
    } catch (err) {
      console.log('Error saving company');
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[#A78BFA]" />
            <div>
              <h1 className="font-extrabold text-2xl text-white">Companies CRM</h1>
              <p className="text-xs text-[#C4B5FD]/70">Maintain contact indexes of recruiter representatives, tiers, and relations history.</p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-lg shadow-[#6C2BD9]/25 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Recruiter Company
            </button>
          )}
        </div>

        {showForm ? (
          /* Form display */
          <div className="p-6 rounded-2xl bg-[#13102A]/85 border border-[#6C2BD9]/20">
            <h2 className="text-sm font-bold text-white mb-4">
              {editingId ? 'Edit Recruiter Details' : 'Add Recruiter Company'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Company Name</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Industry Sector</label>
                  <input
                    placeholder="e.g. Technology, Finance, EdTech"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Company Type</label>
                  <select
                    value={companyType}
                    onChange={e => setCompanyType(e.target.value as any)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="product">Product-Based</option>
                    <option value="service">Services MNC</option>
                    <option value="startup">Growth Startup</option>
                    <option value="mnc">MNC</option>
                    <option value="psu">PSU / Gov</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Recruitment Tier</label>
                  <select
                    value={tier}
                    onChange={e => setTier(e.target.value as any)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="dream">Dream (₹10L+ LPA)</option>
                    <option value="core">Core (₹5L - ₹10L LPA)</option>
                    <option value="mass">Mass / Service (Below ₹5L)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Relationship Status</label>
                  <input
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-2">
                <span className="font-bold text-white mb-3 block">Primary Recruiter Contact (HR)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">HR Rep Name</label>
                    <input
                      value={hrName}
                      onChange={e => setHrName(e.target.value)}
                      className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">HR Email Address</label>
                    <input
                      type="email"
                      value={hrEmail}
                      onChange={e => setHrEmail(e.target.value)}
                      className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">HR Phone Contact</label>
                    <input
                      value={hrPhone}
                      onChange={e => setHrPhone(e.target.value)}
                      className="px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[9px] uppercase font-bold text-[#C4B5FD]/60">Relation Notes & Context</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-white outline-none focus:border-[#6C2BD9]/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold shadow-lg shadow-[#6C2BD9]/20"
                >
                  {saving ? 'Saving...' : 'Save Recruiter'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* CRM Table display */
          <div className="bg-[#13102A]/85 border border-[#6C2BD9]/20 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-xs text-[#C4B5FD]/40">Loading recruiter indexes...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D0A1A]/80 border-b border-white/5 text-[#C4B5FD]/50 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Sector</th>
                      <th className="p-4">Tier</th>
                      <th className="p-4">HR Lead</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(comp => (
                      <tr key={comp.id} className="border-b border-white/5 hover:bg-[#0D0A1A]/35 transition-colors">
                        <td className="p-4 font-bold text-white flex flex-col gap-0.5">
                          <span>{comp.name}</span>
                          {comp.website && (
                            <a href={comp.website} target="_blank" rel="noreferrer" className="text-[9px] text-[#A78BFA] flex items-center gap-0.5">
                              Website <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>
                        <td className="p-4 text-[#C4B5FD]/70">{comp.industry} • <span className="uppercase">{comp.company_type}</span></td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                            comp.tier === 'dream'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/25'
                              : comp.tier === 'core'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {comp.tier}
                          </span>
                        </td>
                        <td className="p-4 flex flex-col gap-0.5">
                          <span className="font-bold text-white">{comp.hr_name}</span>
                          <span className="text-[9px] text-[#C4B5FD]/50 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#A78BFA]" /> {comp.hr_email}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase">
                            {comp.relationship_status || 'active'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleEdit(comp)}
                            className="p-1.5 rounded bg-white/5 border border-white/10 text-[#C4B5FD]/70 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
