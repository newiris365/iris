"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldAlert, Save, RefreshCw, ArrowLeft, 
  Bell, BellOff, CheckCircle2, ChevronRight, Sliders, Check
} from 'lucide-react';
import { apiGet, apiPut } from '../../../lib/api';
import Link from 'next/link';

interface Threshold {
  id?: string;
  alert_type: string;
  threshold_value: number;
  comparison: 'lt' | 'gt' | 'eq';
  is_enabled: boolean;
  notify_via: string[];
}

export default function DirectorSettingsPage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/director/alerts/thresholds');
      if (res.success) {
        setThresholds(res.thresholds || []);
      }
    } catch {
      // Sandbox Fallbacks
      setThresholds([
        {
          alert_type: 'attendance_low',
          threshold_value: 80,
          comparison: 'lt',
          is_enabled: true,
          notify_via: ['push', 'email']
        },
        {
          alert_type: 'complaint_overdue',
          threshold_value: 5,
          comparison: 'gt',
          is_enabled: true,
          notify_via: ['push']
        },
        {
          alert_type: 'library_overdue_surge',
          threshold_value: 50,
          comparison: 'gt',
          is_enabled: false,
          notify_via: ['email']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThreshold = async (type: string, updatedData: Partial<Threshold>) => {
    setSavingType(type);
    try {
      // Find current item to construct complete payload
      const current = thresholds.find(t => t.alert_type === type);
      if (!current) return;

      const payload = {
        threshold_value: updatedData.threshold_value !== undefined ? updatedData.threshold_value : current.threshold_value,
        comparison: updatedData.comparison !== undefined ? updatedData.comparison : current.comparison,
        is_enabled: updatedData.is_enabled !== undefined ? updatedData.is_enabled : current.is_enabled,
        notify_via: updatedData.notify_via !== undefined ? updatedData.notify_via : current.notify_via
      };

      const res = await apiPut(`/director/alerts/thresholds/${type}`, payload);
      if (res.success) {
        setThresholds(prev => prev.map(t => t.alert_type === type ? { ...t, ...res.threshold } : t));
        alert(`Successfully saved threshold parameters for: ${type}`);
      }
    } catch {
      // Sandbox mock save
      setThresholds(prev => prev.map(t => t.alert_type === type ? { ...t, ...updatedData } : t));
      alert(`Saved threshold parameters for: ${type} (MOCKED)`);
    } finally {
      setSavingType(null);
    }
  };

  const getFriendlyName = (type: string) => {
    switch (type) {
      case 'attendance_low':
        return 'Low Attendance Limit';
      case 'complaint_overdue':
        return 'Stale Hostel Complaints';
      case 'library_overdue_surge':
        return 'Library Unpaid Fines Index';
      default:
        return type.replace('_', ' ');
    }
  };

  const getFriendlyDesc = (type: string) => {
    switch (type) {
      case 'attendance_low':
        return 'Triggers a warning alert when institutional average present rate drops below target %';
      case 'complaint_overdue':
        return 'Triggers an anomaly warning when hostel tickets remain unresolved for more than X days';
      case 'library_overdue_surge':
        return 'Triggers a surge alert when the total sum of outstanding book fines index breaches standard limits';
      default:
        return 'Configures thresholds for campus diagnostics monitoring engines';
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-3">
            <Link href="/director" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white flex items-center gap-2">
                <Settings className="w-7 h-7 text-[#A78BFA]" /> Controls & Settings
              </h1>
              <p className="text-sm text-[#C4B5FD]/70">Configure alerts trigger boundaries, comparisons, and notifications pipelines</p>
            </div>
          </div>

          <button 
            onClick={loadThresholds}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all flex items-center self-end md:self-center"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-4.5 h-4.5 text-[#A78BFA]" /> Configure Alerts Trigger Limits
        </h3>

        {loading ? (
          <div className="py-24 text-center text-xs text-white/30">
            Fetching active thresholds parameters from system configuration registries...
          </div>
        ) : (
          <div className="space-y-6">
            {thresholds.map((thresh) => (
              <div 
                key={thresh.alert_type} 
                className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-6 backdrop-blur-md relative overflow-hidden"
              >
                {/* Header of threshold card */}
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-white capitalize">
                      {getFriendlyName(thresh.alert_type)}
                    </h4>
                    <p className="text-xs text-[#C4B5FD]/70 max-w-lg">{getFriendlyDesc(thresh.alert_type)}</p>
                  </div>
                  
                  {/* Enabled/Disabled toggle */}
                  <button
                    onClick={() => handleUpdateThreshold(thresh.alert_type, { is_enabled: !thresh.is_enabled })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      thresh.is_enabled 
                        ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400' 
                        : 'bg-white/5 border border-white/10 text-white/40'
                    }`}
                  >
                    {thresh.is_enabled ? (
                      <>
                        <Bell className="w-3.5 h-3.5" /> Monitoring Active
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5" /> Silenced
                      </>
                    )}
                  </button>
                </div>

                {/* Form fields for settings modification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  
                  {/* Limit input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold">Limit Value</label>
                    <input
                      type="number"
                      value={thresh.threshold_value}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setThresholds(prev => prev.map(t => t.alert_type === thresh.alert_type ? { ...t, threshold_value: isNaN(val) ? 0 : val } : t));
                      }}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono"
                    />
                  </div>

                  {/* Comparison operator */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold">Comparison logic</label>
                    <select
                      value={thresh.comparison}
                      onChange={(e) => {
                        const val = e.target.value as 'lt' | 'gt' | 'eq';
                        setThresholds(prev => prev.map(t => t.alert_type === thresh.alert_type ? { ...t, comparison: val } : t));
                      }}
                      className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2 text-white capitalize font-semibold"
                    >
                      <option value="lt">Less than ( &lt; )</option>
                      <option value="gt">Greater than ( &gt; )</option>
                      <option value="eq">Equal to ( == )</option>
                    </select>
                  </div>

                  {/* Notification channels checkboxes */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold">Dispatch channels</label>
                    <div className="flex gap-4 font-semibold text-[#C4B5FD] pt-1">
                      {['push', 'email'].map((ch) => {
                        const hasChannel = thresh.notify_via.includes(ch);
                        return (
                          <button
                            type="button"
                            key={ch}
                            onClick={() => {
                              const next = hasChannel 
                                ? thresh.notify_via.filter(x => x !== ch)
                                : [...thresh.notify_via, ch];
                              setThresholds(prev => prev.map(t => t.alert_type === thresh.alert_type ? { ...t, notify_via: next } : t));
                            }}
                            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white capitalize transition-all"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              hasChannel ? 'bg-[#6C2BD9] border-[#8B5CF6]' : 'border-white/20 bg-black/25'
                            }`}>
                              {hasChannel && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{ch}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Save button block */}
                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleUpdateThreshold(thresh.alert_type, {
                      threshold_value: thresh.threshold_value,
                      comparison: thresh.comparison,
                      notify_via: thresh.notify_via
                    })}
                    disabled={savingType === thresh.alert_type}
                    className="px-4 py-2 bg-[#6C2BD9] hover:bg-[#8B5CF6] disabled:bg-[#6C2BD9]/50 transition-all text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {savingType === thresh.alert_type ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save Changes
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
