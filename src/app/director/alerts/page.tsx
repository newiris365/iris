"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Eye, 
  RefreshCw, ArrowLeft, ShieldAlert, CheckSquare, Settings 
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';
import Link from 'next/link';

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  module: string;
  data: any;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export default function DirectorAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setRefreshing(true);
    try {
      const res = await apiGet('/director/alerts');
      if (res.success) {
        setAlerts(res.alerts || []);
      }
    } catch {
      // Sandbox Fallbacks
      setAlerts([
        {
          id: 'a1',
          type: 'LOW_ATTENDANCE',
          severity: 'warning',
          title: 'Low Attendance Alert',
          message: 'Sophomore attendance rate stands at 72%, below threshold.',
          module: 'Attendance',
          data: { attendance_rate: 72 },
          is_read: false,
          is_resolved: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'a2',
          type: 'COMPLAINT_DELAY',
          severity: 'critical',
          title: 'Unresolved Infrastructure Delay',
          message: 'Wifi issues in Wing B hostel unresolved for over 48 hours.',
          module: 'Hostel',
          data: { hours_open: 52 },
          is_read: false,
          is_resolved: false,
          created_at: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: 'a3',
          type: 'FEE_DEFAULT_RISK',
          severity: 'info',
          title: 'Fee Collection Lag',
          message: 'Total collections are 5% behind weekly milestone targets.',
          module: 'Finance',
          data: { lag_percent: 5 },
          is_read: true,
          is_resolved: false,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'a4',
          type: 'BUS_DELAY',
          severity: 'warning',
          title: 'Transit Route Interrupted',
          message: 'Route 4 Bus is delayed by 25 minutes due to traffic bypass.',
          module: 'Transit',
          data: { delay_minutes: 25 },
          is_read: true,
          is_resolved: true,
          created_at: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await apiPut(`/director/alerts/${id}/read`, {});
      if (res.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      }
    } catch {
      // Sandbox fallback update
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      const res = await apiPut(`/director/alerts/${id}/resolve`, {});
      if (res.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_resolved: true, is_read: true } : a));
      }
    } catch {
      // Sandbox fallback update
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_resolved: true, is_read: true } : a));
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus === 'unread' && a.is_read) return false;
    if (filterStatus === 'unresolved' && a.is_resolved) return false;
    if (filterStatus === 'resolved' && !a.is_resolved) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/director" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Alerts Intelligence Center</h1>
              <p className="text-sm text-[#C4B5FD]/70">Review real-time operation exceptions, safety logs, and module breaches</p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Link 
              href="/director/settings" 
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <Settings className="w-4.5 h-4.5" /> Thresholds Settings
            </Link>
            <button 
              onClick={loadAlerts}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all flex items-center justify-center"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Filters */}
        <div className="bg-[#13102A]/60 p-4 rounded-2xl border border-white/5 flex flex-wrap gap-4 items-center justify-between shadow-xl">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold mb-1.5">Severity</label>
              <div className="flex rounded-lg bg-black/35 p-1 border border-white/5 text-xs font-semibold">
                {['all', 'critical', 'warning', 'info'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-3 py-1 rounded-md capitalize transition-all ${
                      filterSeverity === sev 
                        ? 'bg-[#6C2BD9] text-white shadow-md' 
                        : 'text-[#C4B5FD]/60 hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold mb-1.5">Status</label>
              <div className="flex rounded-lg bg-black/35 p-1 border border-white/5 text-xs font-semibold">
                {['all', 'unread', 'unresolved', 'resolved'].map((stat) => (
                  <button
                    key={stat}
                    onClick={() => setFilterStatus(stat)}
                    className={`px-3 py-1 rounded-md capitalize transition-all ${
                      filterStatus === stat 
                        ? 'bg-[#6C2BD9] text-white shadow-md' 
                        : 'text-[#C4B5FD]/60 hover:text-white'
                    }`}
                  >
                    {stat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#C4B5FD]/60 font-mono">
            Showing {filteredAlerts.length} anomaly incidents
          </div>
        </div>

        {/* Alerts Log Stream */}
        {loading ? (
          <div className="py-24 text-center text-xs text-white/30">
            Scanning campus telemetry for threshold limit incidents...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-24 bg-[#13102A]/40 rounded-3xl border border-white/5 text-center text-sm text-[#C4B5FD]/50">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 text-emerald-400/80" />
            No exceptions found matching active filter levels.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-5 rounded-3xl border ${getSeverityBg(alert.severity)} backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all relative overflow-hidden`}
              >
                {/* Visual Unread Glow */}
                {!alert.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6]" />
                )}

                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-xl bg-black/20 border border-white/5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">{alert.title}</h3>
                      <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60 font-mono">
                        {alert.module}
                      </span>
                      {alert.is_resolved && (
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#C4B5FD]/80 max-w-2xl">{alert.message}</p>
                    <div className="text-[9px] text-white/30 font-mono pt-1">
                      Triggered on {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto self-end md:self-center">
                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="px-3.5 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 transition-all rounded-xl text-xs font-bold text-[#C4B5FD] flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  )}
                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleMarkResolved(alert.id)}
                      className="px-3.5 py-1.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] transition-all rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Issue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
