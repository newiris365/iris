"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Heart, HelpCircle, AlertTriangle, TrendingDown, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from '../../../../lib/charts';

export default function AdminHostelWellness() {
  const [trends, setTrends] = useState<any[]>([]);
  const [blockAverages, setBlockAverages] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('b1');

  useEffect(() => {
    loadWellnessData();
  }, [selectedBlock]);

  const loadWellnessData = async () => {
    setLoading(true);
    try {
      const [trendsRes, alertsRes] = await Promise.all([
        apiGet(`/hostel/wellness/trends?blockId=${selectedBlock}`),
        apiGet('/hostel/wellness/alerts')
      ]);

      if (trendsRes.success) {
        setTrends(trendsRes.weekly_averages || []);
        setBlockAverages(trendsRes.block_averages || []);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.alerts || []);
      }
    } catch (err) {
      console.log('Error loading wellness metrics, using mock data');
      setTrends([]);
      setBlockAverages([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getMoodStatusLabel = (val: number) => {
    if (val >= 4.0) return { label: 'Excellent', color: 'text-emerald-400' };
    if (val >= 3.0) return { label: 'Healthy', color: 'text-purple-400' };
    return { label: 'Action Required', color: 'text-rose-500 font-extrabold' };
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Mental Wellness Console</h1>
              <p className="text-sm text-[#C4B5FD]/70">Anonymized Block Trends • Immediate Crisis Alerts • Counselor Referrals</p>
            </div>
          </div>

          <button 
            onClick={loadWellnessData}
            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Trends charts and Block summaries */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Chart Card */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-6">Aggregated Student Mood Curve</h2>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="week" stroke="#A78BFA" fontSize={10} />
                  <YAxis stroke="#A78BFA" fontSize={10} domain={[1, 5]} />
                  <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(108,43,217,0.3)', color: '#white' }} />
                  <Line type="monotone" dataKey="average_mood" name="Aggregated Mood Average" stroke="#8B5CF6" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Block-wise averages list */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Block-wise Mood Averages</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {blockAverages.map((item, idx) => {
                const status = getMoodStatusLabel(item.average_mood);
                return (
                  <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-white/5 space-y-2 relative overflow-hidden">
                    {item.average_mood < 3.0 && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
                    )}
                    <span className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold block">{item.block_name.split(' (')[0]}</span>
                    <h4 className="text-2xl font-black text-white">{item.average_mood}/5.0</h4>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${status.color}`}>{status.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Counselor Alerts list */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Active Counselor Referrals
            </h3>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border transition-all space-y-3 relative ${
                  alert.type === 'immediate_crisis'
                    ? 'border-rose-500/35 bg-rose-500/5'
                    : 'border-yellow-500/20 bg-yellow-500/5'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
                      alert.type === 'immediate_crisis'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {alert.type === 'immediate_crisis' ? 'CRISIS HELP' : 'LOW MOOD ALERT'}
                    </span>
                    <span className="text-[9px] text-[#C4B5FD]/40 font-mono">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-white text-xs">{alert.student_name}</h4>
                    <p className="text-[9px] text-[#C4B5FD]/50">Roll Number: {alert.roll_number}</p>
                  </div>

                  <div className="border-t border-white/5 pt-2 text-[10px] leading-relaxed">
                    <p className="text-[#C4B5FD]/70"><span className="font-extrabold text-white">Details:</span> {alert.notes || alert.details}</p>
                  </div>
                </div>
              ))}

              {alerts.length === 0 && (
                <div className="text-center py-12 text-xs text-[#C4B5FD]/40">
                  No active counseling escalations or low-mood referrals flagged.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
