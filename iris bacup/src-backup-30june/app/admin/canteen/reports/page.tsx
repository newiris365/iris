"use client";

import React, { useState } from 'react';
import { 
  FileSpreadsheet, Calendar, Download, RefreshCw, 
  IndianRupee, ShoppingBag, Trash2, PieChart, Info 
} from 'lucide-react';

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-10');
  const [counter, setCounter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Aggregated reports mock stats
  const [stats, setStats] = useState({
    totalRevenue: 142580,
    totalOrders: 954,
    averageBill: 149.45,
    walletRatio: 72, // 72% wallet payments, 28% cash/UPI
    wasteLoss: 1450,
    topDish: 'Masala Dosa (248 sales)'
  });

  const handleRunReport = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Shuffle stats slightly for visual dynamic changes on run
      setStats({
        totalRevenue: Math.floor(130000 + Math.random() * 30000),
        totalOrders: Math.floor(800 + Math.random() * 200),
        averageBill: Number((130 + Math.random() * 30).toFixed(2)),
        walletRatio: Math.floor(65 + Math.random() * 15),
        wasteLoss: Math.floor(1000 + Math.random() * 800),
        topDish: Math.random() > 0.5 ? 'Masala Dosa (265 sales)' : 'Cold Coffee (222 sales)'
      });
    }, 1200);
  };

  const handleExportCSV = () => {
    // Generate a downloadable CSV spreadsheet
    const headers = "Metrics Summary,Value\n";
    const data = [
      `Date Range,${startDate} to ${endDate}`,
      `Selected Counter,${counter}`,
      `Total Revenue,₹${stats.totalRevenue}`,
      `Total Orders,${stats.totalOrders}`,
      `Average Order Value,₹${stats.averageBill}`,
      `Wallet Payment Ratio,${stats.walletRatio}%`,
      `Estimated Wastage Loss,₹${stats.wasteLoss}`,
      `Top Selling Dish,${stats.topDish}`
    ].map(row => row).join('\n');

    const blob = new Blob([headers + data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canteen_sales_report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex items-center gap-3 bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Canteen Financial Reports & Audits</h2>
          <p className="text-xs text-[#A78BFA]/70 mt-0.5">Filter sales by counter, export payment statements, and review wastage cost logs.</p>
        </div>
      </div>

      {/* Date selector Form */}
      <form onSubmit={handleRunReport} className="glass-panel border border-[#6C2BD9]/20 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
          <div>
            <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78BFA]/50" />
              <input 
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78BFA]/50" />
              <input 
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Counter Selector</label>
            <select 
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50 h-[38px]"
            >
              <option value="all">All Counter Streams</option>
              <option value="counter-01">Counter 01 (Meals)</option>
              <option value="counter-02">Counter 02 (Snacks)</option>
              <option value="counter-03">Counter 03 (Beverages)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Filter Sales'}
          </button>
        </div>
      </form>

      {/* Report Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total revenue */}
        <div className="glass-panel border border-[#6C2BD9]/35 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5" /> Total Sales Revenue
          </div>
          <div className="text-3xl font-black text-white mt-1.5 font-mono">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[9px] text-[#C4B5FD]/50 mt-1">Net gross payments processed</p>
        </div>

        {/* Total orders */}
        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Orders Audited
          </div>
          <div className="text-3xl font-black text-white mt-1.5 font-mono">
            {stats.totalOrders}
          </div>
          <p className="text-[9px] text-[#C4B5FD]/50 mt-1">Average bill size: ₹{stats.averageBill}</p>
        </div>

        {/* Waste loss */}
        <div className="glass-panel border border-white/5 rounded-2xl p-5 relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl" />
          <div className="text-[10px] text-red-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Total Wastage Loss
          </div>
          <div className="text-3xl font-black text-red-400 mt-1.5 font-mono">
            -₹{stats.wasteLoss.toLocaleString()}
          </div>
          <p className="text-[9px] text-[#C4B5FD]/50 mt-1">Deducted from raw material stock logs</p>
        </div>

      </div>

      {/* Detailed metrics breakdown */}
      <div className="glass-panel border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4 shrink-0">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <PieChart className="w-4.5 h-4.5 text-[#A78BFA]" /> Report Performance Metrics
          </h3>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[#C4B5FD]/60 hover:text-white hover:border-[#6C2BD9]/30 transition-all font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Export Report (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[#C4B5FD]/60 font-medium">Top Selling Dish</span>
              <span className="font-bold text-white text-right">{stats.topDish}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[#C4B5FD]/60 font-medium">Digital Wallet Checkout Ratio</span>
              <span className="font-bold text-white">{stats.walletRatio}% payments</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[#C4B5FD]/60 font-medium">UPI / Cash Desk Checkout Ratio</span>
              <span className="font-bold text-white">{100 - stats.walletRatio}% payments</span>
            </div>
          </div>

          <div className="bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-[#A78BFA] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-[#C4B5FD]/80">
              <strong>Audit verification</strong>: Canteen wallet balances are fully isolated on Supabase. Manual ledger credits have matching reference notes to prevent fraud logs.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
