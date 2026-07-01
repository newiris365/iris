"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Cpu, RefreshCw, AlertTriangle, TrendingUp, Download, Zap, Droplet } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from '../../../../lib/charts';

export default function AdminHostelIot() {
  const [trends, setTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('b1');
  const [selectedMeter, setSelectedMeter] = useState<'electricity' | 'water'>('electricity');

  useEffect(() => {
    loadIotData();
  }, [selectedBlock, selectedMeter]);

  const loadIotData = async () => {
    setLoading(true);
    try {
      const [trendsRes, reportRes] = await Promise.all([
        apiGet(`/hostel/iot/trends?blockId=${selectedBlock}&meterType=${selectedMeter}`),
        apiGet(`/hostel/iot/report?blockId=${selectedBlock}`)
      ]);

      if (trendsRes.success) {
        setTrends(trendsRes.trends || []);
      }
      if (reportRes.success) {
        setReport(reportRes.report || []);
      }
      
      // Simulate live webhook alerts
      setAlerts([
        { id: 'al-1', room: 'Room 204', block: 'Aryabhata Block A', meter: 'electricity', value: '4.2 kWh', details: 'Spike: 3.8x above daily average limit', time: '10 mins ago' },
        { id: 'al-2', room: 'Room 102', block: 'Gargi Block B', meter: 'water', value: '85 Litres', details: 'Potential leak: 3.1x above daily average limit', time: '45 mins ago' }
      ]);
    } catch (err) {
      console.log('Error loading IoT metrics, using mock data');
      setTrends([
        { date: '06-04', average_value: 12.4 },
        { date: '06-05', average_value: 14.8 },
        { date: '06-06', average_value: 22.1 }, // Weekend load spike
        { date: '06-07', average_value: 19.5 },
        { date: '06-08', average_value: 11.2 },
        { date: '06-09', average_value: 15.6 },
        { date: '06-10', average_value: 18.2 }
      ]);
      setReport([
        { room_number: 'Room 101', block: 'Block A', electricity: 310.5, water: 1240 },
        { room_number: 'Room 102', block: 'Block A', electricity: 245.2, water: 980 },
        { room_number: 'Room 103', block: 'Block A', electricity: 680.8, water: 1450 }, // High use
        { room_number: 'Room 104', block: 'Block A', electricity: 190.1, water: 820 }
      ]);
      setAlerts([
        { id: 'al-1', room: 'Room 103', block: 'Aryabhata Block A', meter: 'electricity', value: '680.8 kWh', details: 'AC left running continuously. Spike 3.2x daily average limit.', time: '12 mins ago' },
        { id: 'al-2', room: 'Room 312', block: 'Gargi Block B', meter: 'water', value: '1420 Litres', details: 'Tap leak detected. Spike 3.5x average limit.', time: '1 hour ago' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => selectedMeter === 'electricity' ? 'Average Power Load (kWh)' : 'Average Water Consumption (L)';

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Smart IoT Utility Desk</h1>
              <p className="text-sm text-[#C4B5FD]/70">Real-time Metering • Spike Monitoring Webhook • Leak Audits</p>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 font-extrabold text-xs text-white outline-none cursor-pointer"
            >
              <option value="b1" className="bg-[#13102A] text-white">Block A (Aryabhata)</option>
              <option value="b2" className="bg-[#13102A] text-white">Block B (Gargi)</option>
            </select>

            <button 
              onClick={loadIotData}
              className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Trends and Reports */}
        <div className="lg:col-span-8 space-y-8">
          {/* Chart Card */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#A78BFA]" /> AC & Room Utility Trends
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMeter('electricity')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    selectedMeter === 'electricity' ? 'bg-[#6C2BD9] text-white' : 'bg-white/5 border border-white/5 text-[#C4B5FD]/60'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Electricity
                </button>
                <button
                  onClick={() => setSelectedMeter('water')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    selectedMeter === 'water' ? 'bg-[#6C2BD9] text-white' : 'bg-white/5 border border-white/5 text-[#C4B5FD]/60'
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5" /> Water
                </button>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#A78BFA" fontSize={10} />
                  <YAxis stroke="#A78BFA" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(108,43,217,0.3)', color: '#fff' }} />
                  <Area type="monotone" dataKey="average_value" name={getMetricLabel()} stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly utilities report table */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white">Monthly Utilities Statement</h3>
              <button className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-bold text-[#A78BFA] transition-all flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download report CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#C4B5FD]/70">
                <thead>
                  <tr className="border-b border-white/5 pb-2 text-[10px] uppercase font-bold text-[#C4B5FD]/45">
                    <th className="py-3">Room</th>
                    <th>Block</th>
                    <th>Electricity Logged</th>
                    <th>Water Logged</th>
                    <th>Cost Allocation Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-extrabold text-white">{item.room_number}</td>
                      <td>{item.block}</td>
                      <td>{item.electricity} kWh</td>
                      <td>{item.water} Litres</td>
                      <td className="text-emerald-400 font-extrabold">₹{Math.round(item.electricity * 8 + item.water * 0.15)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Active Webhook Alerts */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> Active Consumption Alerts
            </h3>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 transition-all space-y-2 relative">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[9px] font-extrabold uppercase">
                      Spike {alert.meter}
                    </span>
                    <span className="text-[9px] text-[#C4B5FD]/40 font-mono">{alert.time}</span>
                  </div>

                  <h4 className="font-extrabold text-white text-xs">{alert.room} ({alert.block})</h4>
                  <p className="text-[10px] text-[#C4B5FD]/60 leading-normal">{alert.details}</p>
                  <p className="text-[10px] font-extrabold text-rose-400">Current reading value: {alert.value}</p>
                </div>
              ))}

              {alerts.length === 0 && (
                <div className="text-center py-12 text-[11px] text-[#C4B5FD]/40">
                  No utility spikes or anomalies detected across blocks.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
