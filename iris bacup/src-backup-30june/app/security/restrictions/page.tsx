"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Plus, Search, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const RESTRICTION_TYPES = [
  { value: 'suspended', label: 'Suspended', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'expelled', label: 'Expelled', color: 'bg-red-500/20 text-red-400' },
  { value: 'banned', label: 'Banned', color: 'bg-red-600/20 text-red-300' },
  { value: 'no_campus_access', label: 'No Campus Access', color: 'bg-red-500/20 text-red-400' },
  { value: 'disciplinary', label: 'Disciplinary', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'other', label: 'Other', color: 'bg-slate-500/20 text-slate-400' },
];

export default function SecurityRestrictionsPage() {
  const [restrictions, setRestrictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    person_type: 'student', person_id: '', restriction_type: 'suspended',
    reason: '', valid_until: '',
  });
  const [persons, setPersons] = useState<any[]>([]);
  const [personSearch, setPersonSearch] = useState('');

  useEffect(() => { fetchRestrictions(); }, []);

  const fetchRestrictions = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/gate/restrictions');
      if (res.success) setRestrictions(res.restrictions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPersons = async (query: string) => {
    if (query.length < 2) { setPersons([]); return; }
    const res = await apiGet(`campusCore/gate/verify/${encodeURIComponent(query)}`);
    if (res.success) setPersons(res.persons || []);
  };

  const handleCreate = async () => {
    if (!form.person_id || !form.reason) return;
    const res = await apiPost('campusCore/gate/restrictions', form);
    if (res.success) {
      setShowForm(false);
      setForm({ person_type: 'student', person_id: '', restriction_type: 'suspended', reason: '', valid_until: '' });
      setPersons([]);
      setPersonSearch('');
      fetchRestrictions();
    }
  };

  const filtered = restrictions.filter(r =>
    !searchQuery || r.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.restriction_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert size={24} className="text-red-400" />
          Access Restrictions / Blacklist
        </h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Add Restriction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {RESTRICTION_TYPES.slice(0, 3).map(t => (
          <div key={t.value} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">
              {restrictions.filter(r => r.restriction_type === t.value).length}
            </p>
            <p className="text-xs text-slate-400">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add Access Restriction</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Person Type</label>
                <select value={form.person_type}
                  onChange={e => setForm({...form, person_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Search Person *</label>
                <input type="text" value={personSearch}
                  onChange={e => {
                    setPersonSearch(e.target.value);
                    searchPersons(e.target.value);
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Search by name, roll number, or email..." />
                {persons.length > 0 && (
                  <div className="mt-1 bg-slate-700 border border-slate-600 rounded-lg max-h-40 overflow-y-auto">
                    {persons.map((p: any) => (
                      <button key={p.user_id}
                        onClick={() => {
                          setForm({...form, person_id: p.user_id});
                          setPersonSearch(p.full_name);
                          setPersons([]);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 ${
                          form.person_id === p.user_id ? 'bg-violet-600 text-white' : 'text-slate-300'
                        }`}>
                        {p.full_name} — {p.role} {p.student_roll ? `(${p.student_roll})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Restriction Type *</label>
                <select value={form.restriction_type}
                  onChange={e => setForm({...form, restriction_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  {RESTRICTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Reason *</label>
                <textarea value={form.reason}
                  onChange={e => setForm({...form, reason: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-20"
                  placeholder="Reason for restriction..." />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Valid Until (optional)</label>
                <input type="date" value={form.valid_until}
                  onChange={e => setForm({...form, valid_until: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm">Add Restriction</button>
                <button onClick={() => { setShowForm(false); setPersons([]); setPersonSearch(''); }}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search restrictions..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm" />
      </div>

      {/* Restrictions List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ShieldAlert size={40} className="mx-auto mb-3 opacity-50" />
          <p>No active restrictions. Campus is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const typeInfo = RESTRICTION_TYPES.find(t => t.value === r.restriction_type) || RESTRICTION_TYPES[5];
            return (
              <div key={r.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-white capitalize">
                        {r.person_type} — {r.restriction_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-400">{r.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {r.valid_until && (
                      <p className="text-xs text-slate-400 mt-1">Until: {r.valid_until}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      By: {r.restricted_by_name || '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
