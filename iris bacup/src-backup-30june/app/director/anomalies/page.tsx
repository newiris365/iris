"use client";

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Eye, Filter, RefreshCw
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';

export default function DirectorAnomaliesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = async () => {
    try {
      const res = await apiGet('director/anomalies');
      if (res.success) setData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleResolve = async (id: string) => {
    const notes = prompt('Resolution notes:');
    if (notes === null) return;
    await apiPut(`director/anomalies/${id}/resolve`, { resolution_notes: notes });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Scanning for anomalies...</div></div>;

  const stats = data?.stats || {};
  const recent = data?.recent || [];
  const byType = data?.by_type || [];

  const filtered = typeFilter === 'all' ? recent : recent.filter((a: any) => a.anomaly_type === typeFilter);

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const typeLabels: Record<string, string> = {
    geo_fence_violation: 'Geo-Fence Violation',
    duplicate_attendance: 'Duplicate Attendance',
    rapid_wallet_txn: 'Rapid Wallet Txn',
    unusual_hours: 'Unusual Hours',
    dual_presence: 'Dual Presence',
    new_device_login: 'New Device Login',
    bulk_action: 'Bulk Action',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert size={24} className="text-red-400" />
          System Anomalies
          {stats.total_unresolved > 0 && (
            <span className="bg-red-500/20 text-red-400 text-sm px-2 py-0.5 rounded-full animate-pulse">
              {stats.total_unresolved} unresolved
            </span>
          )}
        </h1>
        <button onClick={fetchData}
          className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 text-sm flex items-center gap-1">
          <RefreshCw size={14} /> Re-scan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Critical', value: stats.critical || 0, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'High', value: stats.high || 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Medium', value: stats.medium || 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Low', value: stats.low || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Unresolved', value: stats.total_unresolved || 0, color: 'text-white', bg: 'bg-white/5' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-white/5`}>
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Anomaly Type Breakdown */}
      {byType.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">By Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {byType.map((t: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-slate-400">{typeLabels[t.anomaly_type] || t.anomaly_type}</p>
                <p className="text-xl font-bold text-white">{t.count}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${severityColors[t.severity] || ''}`}>{t.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs ${typeFilter === 'all' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          All ({recent.length})
        </button>
        {byType.map((t: any) => (
          <button key={t.anomaly_type} onClick={() => setTypeFilter(t.anomaly_type)}
            className={`px-3 py-1.5 rounded-lg text-xs ${typeFilter === t.anomaly_type ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {typeLabels[t.anomaly_type] || t.anomaly_type} ({t.count})
          </button>
        ))}
      </div>

      {/* Anomaly List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400 opacity-50" />
          <p>No anomalies detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a.id} className={`rounded-xl p-4 border ${severityColors[a.severity] || 'bg-white/5 border-white/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded">{a.severity}</span>
                    <span className="text-xs text-slate-400">{typeLabels[a.anomaly_type] || a.anomaly_type}</span>
                    <span className="text-xs text-slate-500">· {a.module}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    {a.person_name && <span>Person: {a.person_name}</span>}
                    <span>{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => handleResolve(a.id)}
                  className="px-3 py-1.5 bg-emerald-600/50 text-emerald-300 rounded text-xs hover:bg-emerald-600 ml-3 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
