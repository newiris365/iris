"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function StaffLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
  const [leaveBalance, setLeaveBalance] = useState({ casual: 12, sick: 6, earned: 8 });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('staff/leaves');
      if (res.success) setLeaves(res.leaves || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date || !form.reason) return;
    const res = await apiPost('staff/leaves', form);
    if (res.success) {
      setShowForm(false);
      setForm({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={24} className="text-amber-400" /> Leave Application
        </h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(leaveBalance).map(([type, count]) => (
          <div key={type} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
            <p className="text-2xl font-bold text-white">{count}</p>
            <p className="text-xs text-slate-400 capitalize">{type} Leave</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h3 className="text-sm font-bold text-white mb-3">New Leave Application</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
            </select>
            <div />
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
              placeholder="Reason for leave" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm col-span-2 h-20" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-500">Submit</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-50" />
          <p>No leave applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(l => (
            <div key={l.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white capitalize">{l.leave_type} Leave</p>
                  <p className="text-xs text-slate-400">{l.start_date} to {l.end_date}</p>
                  <p className="text-xs text-slate-500 mt-1">{l.reason}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  l.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  l.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {l.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
