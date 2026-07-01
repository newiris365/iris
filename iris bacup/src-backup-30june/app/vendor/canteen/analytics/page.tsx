"use client";

import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Sparkles, AlertTriangle, 
  IndianRupee, ShoppingBag, ArrowUpRight, CloudSun, CalendarCheck 
} from 'lucide-react';

const MOCK_HOURLY_DATA = [
  { time: '08:00', orders: 15, revenue: 1200 },
  { time: '09:00', orders: 12, revenue: 980 },
  { time: '10:00', orders: 25, revenue: 2100 },
  { time: '11:00', orders: 35, revenue: 2950 },
  { time: '12:00', orders: 65, revenue: 5800 },
  { time: '13:00', orders: 50, revenue: 4200 },
  { time: '14:00', orders: 20, revenue: 1500 },
  { time: '15:00', orders: 10, revenue: 750 },
  { time: '16:00', orders: 30, revenue: 2400 },
  { time: '17:00', orders: 18, revenue: 1350 },
];

const FORECASTS = [
  { day: 'Tomorrow (Thursday)', event: 'Sports Meet Selection', tempFactor: 'High (38°C)', forecast: 'Energy drinks, fresh juices & sandwiches will spike by +45%. Recommended: pre-slice extra 5kg paneer & prep 30 extra juice bottles.', status: 'attention' },
  { day: 'Friday', event: 'Normal Academic Day', tempFactor: 'Mild (32°C)', forecast: 'Stable meal plan lunch volume expected (~120 thalis). Normal raw inventory levels recommended.', status: 'stable' },
  { day: 'Saturday', event: 'Weekend Hostel Special', tempFactor: 'Warm (35°C)', forecast: 'Hostellers stay in. Evening snacks (Pyaz Kachori, samosas) projected to spike +30% around 5 PM. Recommended: increase potato stock by 10kg.', status: 'opportunity' }
];

export default function VendorAnalyticsPage() {
  const [hourlyData] = useState(MOCK_HOURLY_DATA);
  const [forecasts] = useState(FORECASTS);

  const maxOrders = Math.max(...hourlyData.map(h => h.orders));
  const totalRev = hourlyData.reduce((s, h) => s + h.revenue, 0);
  const totalOrders = hourlyData.reduce((s, h) => s + h.orders, 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Bar */}
      <div className="flex items-center gap-3 bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Canteen Sales & Demand Forecasts</h2>
          <p className="text-xs text-[#A78BFA]/70 mt-0.5">Track kitchen revenue trends and review predictive inventory insights.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Today's Total Sales</div>
          <div className="text-3xl font-black text-white mt-1.5 flex items-center gap-1">
            <IndianRupee className="w-6 h-6 text-[#A78BFA]" />
            {totalRev.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +15% vs yesterday
          </p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">Total Orders Processed</div>
          <div className="text-3xl font-black text-white mt-1.5 flex items-center gap-1.5">
            <ShoppingBag className="w-6 h-6 text-[#A78BFA]" />
            {totalOrders}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8% avg volume
          </p>
        </div>

        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold">AI Load Efficiency</div>
          <div className="text-3xl font-black text-white mt-1.5">94.2%</div>
          <p className="text-[10px] text-[#A78BFA]/60 mt-1">Waste reduction optimization index</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Hourly Volume Chart */}
        <div className="lg:col-span-3 glass-panel border border-white/5 p-6 rounded-2xl">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#A78BFA]" /> Today's Hourly Transaction Stream
          </h3>
          
          <div className="flex items-end gap-3 h-56 mt-4">
            {hourlyData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <span className="text-[8px] font-mono text-[#C4B5FD]/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{h.revenue}
                </span>
                <div 
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#6C2BD9] to-[#8B5CF6] group-hover:to-[#A78BFA] transition-all"
                  style={{ height: `${(h.orders / maxOrders) * 120}px`, minHeight: '6px' }}
                />
                <span className="text-[9px] text-[#C4B5FD]/50 font-mono rotate-45 sm:rotate-0 mt-1">{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Box */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-[#13102A]/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold flex items-center gap-2 shrink-0">
            <Sparkles className="text-[#A78BFA] w-4.5 h-4.5 animate-pulse" />
            AI Demand Forecast & Stock Optimizer
          </h3>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {forecasts.map((f, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                  f.status === 'attention' ? 'bg-amber-500/5 border-amber-500/20' : 
                  f.status === 'opportunity' ? 'bg-[#6C2BD9]/5 border-[#6C2BD9]/20' : 
                  'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-white">{f.day}</span>
                  <span className={`px-2 py-0.5 rounded ${
                    f.status === 'attention' ? 'bg-amber-500/10 text-amber-400' :
                    f.status === 'opportunity' ? 'bg-[#6C2BD9]/10 text-[#A78BFA]' :
                    'bg-white/10 text-[#C4B5FD]/60'
                  }`}>
                    {f.event}
                  </span>
                </div>
                
                <p className="text-[11px] text-[#C4B5FD]/75 leading-relaxed font-medium">
                  {f.forecast}
                </p>

                <div className="flex items-center gap-3 text-[9px] text-[#C4B5FD]/45 mt-1 border-t border-white/5 pt-2">
                  <span className="flex items-center gap-0.5"><CloudSun className="w-3.5 h-3.5" /> Temp: {f.tempFactor}</span>
                  <span className="flex items-center gap-0.5"><CalendarCheck className="w-3.5 h-3.5" /> Verified by Core</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
