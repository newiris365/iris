"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, RefreshCw, MessageSquare, Download } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminFeeDefaultersPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => { fetchDefaulters(); }, []);

  const fetchDefaulters = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('campusCore/fees/defaulters');
      if (res.success) setDefaulters(res.defaulters || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = defaulters.filter(d =>
    riskFilter === 'all' || (d.risk_level && d.risk_level.toLowerCase() === riskFilter)
  );

  const handleSendReminders = async () => {
    setIsSending(true);
    try {
      await apiPost('campusCore/fees/reminder/trigger', {});
      alert('Reminders sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send reminders.');
    } finally {
      setIsSending(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'Roll', 'Email', 'Amount Due', 'Days Overdue', 'Risk Level'];
    const rows = filtered.map(d => [
      d.student_name || d.name, d.roll_number, d.email || '',
      d.overdue_amount || d.due, d.days_overdue || d.daysOverdue, d.risk_level || 'N/A',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fee_defaulters.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert size={24} className="text-red-400" />
          Fee Defaulters
          {filtered.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-sm px-2 py-0.5 rounded-full">{filtered.length}</span>
          )}
        </h1>
        <div className="flex gap-2">
          <button onClick={fetchDefaulters}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCsv}
            className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleSendReminders} disabled={isSending}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm disabled:opacity-50 flex items-center gap-1">
            <Send size={14} /> {isSending ? 'Sending...' : 'Send Reminders'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'high', 'medium', 'low'].map(r => (
          <button key={r} onClick={() => setRiskFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${riskFilter === r ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading defaulters...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ShieldAlert size={40} className="mx-auto mb-3 opacity-50" />
          <p>No fee defaulters found.</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-slate-400">Student</th>
                <th className="text-left p-3 text-slate-400">Roll No</th>
                <th className="text-right p-3 text-slate-400">Amount Due</th>
                <th className="text-right p-3 text-slate-400">Days Overdue</th>
                <th className="text-center p-3 text-slate-400">Risk</th>
                <th className="text-center p-3 text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id || i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">
                        {(d.student_name || d.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{d.student_name || d.name}</p>
                        <p className="text-xs text-slate-400">{d.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-300">{d.roll_number}</td>
                  <td className="p-3 text-right text-red-400 font-bold">₹{(d.overdue_amount || d.due || 0).toLocaleString()}</td>
                  <td className="p-3 text-right text-amber-400">{d.days_overdue || d.daysOverdue || 0}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${(d.risk_level || '').toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400' : (d.risk_level || '').toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {d.risk_level || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mx-auto">
                      <MessageSquare size={12} /> Remind
                    </button>
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
