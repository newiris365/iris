"use client";

import React, { useState, useEffect } from 'react';
import {
  Car, LogIn, LogOut, Search, Filter, Plus
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

const VEHICLE_TYPES = [
  { value: 'two_wheeler', label: 'Two-Wheeler', color: 'text-blue-400' },
  { value: 'four_wheeler', label: 'Four-Wheeler', color: 'text-violet-400' },
  { value: 'bus', label: 'Bus', color: 'text-amber-400' },
  { value: 'delivery', label: 'Delivery', color: 'text-emerald-400' },
  { value: 'emergency', label: 'Emergency', color: 'text-red-400' },
  { value: 'other', label: 'Other', color: 'text-slate-400' },
];

export default function SecurityVehiclesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: '', vehicle_type: 'four_wheeler', driver_name: '',
    driver_phone: '', purpose: '', gate_number: '1',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filter === 'today') params.today = 'true';
      const res = await apiGet('campusCore/gate/vehicle-logs', params);
      if (res.success) setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  const handleEntry = async () => {
    if (!form.vehicle_number) return;
    const res = await apiPost('campusCore/gate/vehicle/entry', form);
    if (res.success) {
      setShowEntryForm(false);
      setForm({ vehicle_number: '', vehicle_type: 'four_wheeler', driver_name: '', driver_phone: '', purpose: '', gate_number: '1' });
      fetchLogs();
    }
  };

  const handleExit = async (id: string) => {
    const res = await apiPut(`campusCore/gate/vehicle/${id}/exit`, {});
    if (res.success) fetchLogs();
  };

  const filtered = logs.filter(l =>
    !searchQuery || l.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.driver_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const insideCount = logs.filter(l => !l.exit_time).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Car size={24} className="text-blue-400" />
          Vehicle Logs
          {insideCount > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-sm px-2 py-0.5 rounded-full">{insideCount} inside</span>
          )}
        </h1>
        <button onClick={() => setShowEntryForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm flex items-center gap-2">
          <Plus size={16} /> Log Entry
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by vehicle or driver..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-white text-sm" />
        </div>
        {['today', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Log Vehicle Entry</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Vehicle Number *</label>
                <input type="text" value={form.vehicle_number}
                  onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  placeholder="MH 12 AB 1234" />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Vehicle Type</label>
                <select value={form.vehicle_type}
                  onChange={e => setForm({...form, vehicle_type: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                  {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Driver Name</label>
                  <input type="text" value={form.driver_name}
                    onChange={e => setForm({...form, driver_name: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Driver Phone</label>
                  <input type="tel" value={form.driver_phone}
                    onChange={e => setForm({...form, driver_phone: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Purpose</label>
                  <input type="text" value={form.purpose}
                    onChange={e => setForm({...form, purpose: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Delivery, Visit, etc." />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Gate</label>
                  <select value={form.gate_number}
                    onChange={e => setForm({...form, gate_number: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    {['1','2','3','Main'].map(g => <option key={g} value={g}>Gate {g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleEntry}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm">Log Entry</button>
                <button onClick={() => setShowEntryForm(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Logs Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Car size={40} className="mx-auto mb-3 opacity-50" />
          <p>No vehicle logs found.</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10 bg-white/5">
                <th className="p-3">Vehicle</th>
                <th className="p-3">Type</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Gate</th>
                <th className="p-3">Entry</th>
                <th className="p-3">Exit</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={`border-b border-white/5 ${!l.exit_time ? 'bg-amber-500/5' : ''}`}>
                  <td className="p-3 font-mono font-medium text-white">{l.vehicle_number}</td>
                  <td className="p-3 text-slate-300 capitalize">{l.vehicle_type?.replace('_', ' ')}</td>
                  <td className="p-3 text-slate-300">{l.driver_name || '—'}</td>
                  <td className="p-3 text-slate-400 text-xs">{l.purpose || '—'}</td>
                  <td className="p-3 text-slate-300">{l.gate_number}</td>
                  <td className="p-3 text-xs text-slate-400">{new Date(l.entry_time).toLocaleString()}</td>
                  <td className="p-3 text-xs text-slate-400">
                    {l.exit_time ? new Date(l.exit_time).toLocaleString() : (
                      <span className="text-amber-400 font-medium">Inside</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {!l.exit_time && (
                      <button onClick={() => handleExit(l.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500 flex items-center gap-1 mx-auto">
                        <LogOut size={12} /> Exit
                      </button>
                    )}
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
