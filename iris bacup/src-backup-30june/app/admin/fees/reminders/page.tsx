"use client";

import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminFeeRemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await apiGet('campusCore/fee-escalations');
      if (res.success) setReminders(res.escalations || res.reminders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSendReminders = async () => {
    setSending(true);
    try {
      await apiPost('campusCore/fees/reminder/trigger', {});
      alert('Reminders triggered successfully!');
      fetchReminders();
    } catch (err) {
      console.error(err);
      alert('Failed to trigger reminders.');
    } finally { setSending(false); }
  };

  const filtered = reminders.filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare size={24} className="text-amber-400" />
          Fee Reminders
          {reminders.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-sm px-2 py-0.5 rounded-full">{reminders.length}</span>
          )}
        </h1>
        <div className="flex gap-2">
          <button onClick={fetchReminders}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleSendReminders} disabled={sending}
            className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm disabled:opacity-50 flex items-center gap-1">
            <Send size={14} /> {sending ? 'Sending...' : 'Send Reminders'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'sent', 'pending', 'failed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading reminders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
          <p>No reminders found.</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-slate-400">Student</th>
                <th className="text-left p-3 text-slate-400">Fee</th>
                <th className="text-right p-3 text-slate-400">Amount</th>
                <th className="text-center p-3 text-slate-400">Channel</th>
                <th className="text-center p-3 text-slate-400">Status</th>
                <th className="text-left p-3 text-slate-400">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id || i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div>
                      <p className="text-white font-medium">{r.student_name || r.students?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{r.roll_number || r.students?.roll_number || ''}</p>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300">{r.fee_name || '—'}</td>
                  <td className="p-3 text-right text-white">₹{(r.amount || r.amount_overdue || 0).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded">{r.channel || 'whatsapp'}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : r.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {r.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    {r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
