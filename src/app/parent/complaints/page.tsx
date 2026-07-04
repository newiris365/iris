"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, MessageSquare } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function ParentComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'academic', subject: '', description: '' });

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('parent/complaints');
      if (res.success) setComplaints(res.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.description) return;
    const res = await apiPost('parent/complaints', form);
    if (res.success) {
      setShowForm(false);
      setForm({ category: 'academic', subject: '', description: '' });
      fetchComplaints();
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      academic: 'bg-blue-500/20 text-blue-400',
      transport: 'bg-amber-500/20 text-amber-400',
      canteen: 'bg-emerald-500/20 text-emerald-400',
      hostel: 'bg-purple-500/20 text-purple-400',
      other: 'bg-slate-500/20 text-slate-400',
    };
    return colors[cat] || colors.other;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertCircle size={24} className="text-pink-400" /> Complaints & Feedback
        </h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 text-sm flex items-center gap-2">
          <Plus size={16} /> File Complaint
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-3">New Complaint</h3>
          <div className="space-y-3">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              <option value="academic">Academic</option>
              <option value="transport">Transport</option>
              <option value="canteen">Canteen</option>
              <option value="hostel">Hostel</option>
              <option value="other">Other</option>
            </select>
            <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
              placeholder="Subject" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Describe your complaint in detail..." className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-24" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-500">Submit</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
          <p>No complaints filed yet. Everything looks good!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">{c.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                  <p className="text-[10px] text-slate-500 mt-2">Filed: {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(c.category)}`}>
                    {c.category}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                    c.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {c.status || 'pending'}
                  </span>
                </div>
              </div>
              {c.response && (
                <div className="mt-3 bg-white/[0.03] rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                    <MessageSquare size={10} /> Admin Response
                  </p>
                  <p className="text-xs text-slate-300">{c.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
