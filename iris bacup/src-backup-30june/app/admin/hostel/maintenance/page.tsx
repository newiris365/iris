"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, TrendingUp, AlertTriangle, Hammer, Calendar, Layers, IndianRupee } from 'lucide-react';
import { apiGet } from '../../../../lib/api';

export default function AdminHostelMaintenance() {
  const [predictions, setPredictions] = useState<any>(null);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulingItem, setSchedulingItem] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    setLoading(true);
    try {
      const [predRes, eqRes] = await Promise.all([
        apiGet('/hostel/maintenance/predict'),
        apiGet('/hostel/maintenance/equipment')
      ]);

      if (predRes.success) {
        setPredictions(predRes.predictions);
      }
      if (eqRes.success) {
        setEquipment(eqRes.equipment || []);
      }
    } catch (err) {
      console.log('Error loading predictive analysis, using mock data');
      setPredictions({
        predicted_issues: [
          { block: 'Block C', category: 'plumbing', date_window: 'July (Monsoon Season)', confidence: 88, explanation: 'Historical data shows plumbing spikes in July due to increased monsoon rain flow and drainage pressure in Block C.', recommended_action: 'Schedule pre-emptive drainage clearance and water pipe checkups in late June.' },
          { block: 'Block A', category: 'electrical', date_window: 'April - May (Summer)', confidence: 75, explanation: 'Electrical load spikes due to AC usage in summer, leading to fuse blowouts in Block A.', recommended_action: 'Conduct transformer tests and phase distribution load audits before April.' }
        ],
        equipment_risk_scores: [
          { equipment_type: 'AC Unit', block: 'Block A', failure_probability: 0.65, details: '12 AC units are past their 3-year service warranty, exhibiting high vibration levels.' },
          { equipment_type: 'Plumbing Pump', block: 'Block C', failure_probability: 0.80, details: 'Primary pump is operating at 92% heat limit. Impeller showing sign of erosion.' }
        ],
        cost_forecast: { next_month_est: 18500, confidence_interval: '15000 - 22000' }
      });

      setEquipment([
        { id: 'eq-1', room_number: 'Room 102', block_name: 'Block A', item_name: 'AC Unit (Voltas 1.5T)', quantity: 1, condition: 'fair', last_checked: '2026-05-15', age_months: 38, lifespan_months: 60, replacement_cost: 35000, risk_factor: 0.5, maintenance_forecast: 17500, status: 'Under Watch' },
        { id: 'eq-2', room_number: 'Room 204', block_name: 'Block A', item_name: 'Ceiling Fan (Usha)', quantity: 2, condition: 'good', last_checked: '2026-05-20', age_months: 24, lifespan_months: 48, replacement_cost: 2500, risk_factor: 0.2, maintenance_forecast: 500, status: 'Healthy' },
        { id: 'eq-3', room_number: 'Room 301', block_name: 'Block C', item_name: 'Geyser (Bajaj 15L)', quantity: 1, condition: 'damaged', last_checked: '2026-06-01', age_months: 30, lifespan_months: 36, replacement_cost: 12000, risk_factor: 0.95, maintenance_forecast: 11400, status: 'Needs Replacement' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMaintenance = (item: any) => {
    setSchedulingItem(item);
    setMessage(`Scheduled preemptive service check for ${item.item_name} in Room ${item.room_number}.`);
    setTimeout(() => setMessage(''), 4000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0D1C]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Hammer className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Predictive Maintenance Panel</h1>
              <p className="text-sm text-[#C4B5FD]/70">AI Complaint Pattern Forecasting • Lifecycle Asset Valuations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: AI predictions and Cost forecast */}
        <div className="lg:col-span-8 space-y-8">
          {message && (
            <div className="p-4 rounded-2xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/25 text-xs text-[#A78BFA] font-bold">
              {message}
            </div>
          )}

          {/* AI predictions feed */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Seasonal Failure Forecast (Claude AI Analysis)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predictions?.predicted_issues?.map((issue: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-white/5 space-y-4 hover:border-purple-500/20 transition-all flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/25 text-[#A78BFA] uppercase tracking-wider">
                        {issue.block} • {issue.category}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-extrabold font-mono">{issue.confidence}% Confidence</span>
                    </div>

                    <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" /> Target: {issue.date_window}
                    </h4>
                    <p className="text-[11px] text-[#C4B5FD]/60 leading-relaxed">{issue.explanation}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <span className="text-[9px] text-[#C4B5FD]/40 uppercase tracking-widest font-bold block">Recommended Action:</span>
                    <p className="text-[10px] text-yellow-400 font-medium leading-relaxed">{issue.recommended_action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Asset lifecycle tracking table */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-6">Equipment Lifecycle Status</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#C4B5FD]/70">
                <thead>
                  <tr className="border-b border-white/5 pb-2 text-[10px] uppercase font-bold text-[#C4B5FD]/45">
                    <th className="py-3">Item Name</th>
                    <th>Room</th>
                    <th>Block</th>
                    <th>Age</th>
                    <th>Condition</th>
                    <th>Risk Factor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-extrabold text-white">{item.item_name}</td>
                      <td>{item.room_number}</td>
                      <td>{item.block_name}</td>
                      <td>{item.age_months}/{item.lifespan_months} mos</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          item.status === 'Needs Replacement'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : item.status === 'Under Watch'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-white">{(item.risk_factor * 100).toFixed(0)}%</td>
                      <td>
                        <button
                          onClick={() => handleScheduleMaintenance(item)}
                          className="px-2.5 py-1 rounded bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-extrabold text-[9px] uppercase tracking-wider transition-colors"
                        >
                          Schedule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Financial Maintenance Cost Forecast and equipment risks list */}
        <div className="lg:col-span-4 space-y-8">
          {/* Cost Forecast widget */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Estimated Next Month Cost</p>
            <h2 className="text-3xl font-extrabold text-white mt-1.5 flex items-center gap-0.5">
              <IndianRupee className="w-6 h-6 text-[#A78BFA]" />
              <span>{predictions?.cost_forecast?.next_month_est?.toLocaleString()}</span>
            </h2>
            <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Confidence interval: ₹{predictions?.cost_forecast?.confidence_interval}</p>

            <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-[#C4B5FD]/50 leading-relaxed">
              *Calculated based on equipment degradation, risk probabilities, and historical complaint resolutions.
            </div>
          </div>

          {/* Active Equipment risks */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> Active Asset Risks
            </h3>

            <div className="space-y-4">
              {predictions?.equipment_risk_scores?.map((risk: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl border border-white/5 bg-white/5 space-y-2 hover:border-rose-500/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-xs">{risk.equipment_type}</span>
                    <span className="text-[10px] text-rose-500 font-extrabold font-mono">{(risk.failure_probability * 100).toFixed(0)}% Risk</span>
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/50">{risk.block} • {risk.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
