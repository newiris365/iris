"use client";

import React, { useState } from 'react';
import { 
  Package, Trash2, ArrowUpRight, Scale, 
  IndianRupee, ChevronRight, Check, AlertCircle 
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  min_required: number;
  cost_per_unit: number;
}

interface WasteLog {
  id: string;
  item_name: string;
  qty: number;
  unit: string;
  reason: string;
  cost: number;
  logged_at: string;
}

const INITIAL_STOCK: StockItem[] = [
  { id: '1', name: 'Fresh Paneer', qty: 12.5, unit: 'kg', min_required: 5.0, cost_per_unit: 320 },
  { id: '2', name: 'Potatoes (Aloo)', qty: 45.0, unit: 'kg', min_required: 15.0, cost_per_unit: 30 },
  { id: '3', name: 'Cow Milk', qty: 22.0, unit: 'liters', min_required: 8.0, cost_per_unit: 60 },
  { id: '4', name: 'Burger Buns', qty: 65, unit: 'pcs', min_required: 20, cost_per_unit: 8 },
  { id: '5', name: 'Basmati Rice', qty: 38.0, unit: 'kg', min_required: 10.0, cost_per_unit: 90 },
  { id: '6', name: 'Refined Oil', qty: 15.0, unit: 'liters', min_required: 5.0, cost_per_unit: 140 }
];

const INITIAL_WASTE: WasteLog[] = [
  { id: 'w-1', item_name: 'Fresh Paneer', qty: 1.2, unit: 'kg', reason: 'Spoiled (refrigerator power cut)', cost: 384, logged_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 'w-2', item_name: 'Cow Milk', qty: 2.0, unit: 'liters', reason: 'Sour/curdled', cost: 120, logged_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
];

export default function VendorInventoryPage() {
  const [stock, setStock] = useState<StockItem[]>(INITIAL_STOCK);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(INITIAL_WASTE);

  // Waste form states
  const [wasteItem, setWasteItem] = useState('1');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Spoiled');

  const handleUpdateStock = (id: string, newQty: number) => {
    setStock(prev => prev.map(s => s.id === id ? { ...s, qty: Math.max(0, newQty) } : s));
  };

  const handleReportWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stock.find(s => s.id === wasteItem);
    const qtyNum = Number(wasteQty);

    if (!targetItem || !qtyNum || qtyNum <= 0) return;

    // Deduct stock
    handleUpdateStock(wasteItem, targetItem.qty - qtyNum);

    const wasteCost = Math.round(qtyNum * targetItem.cost_per_unit);
    const newLog: WasteLog = {
      id: `w-${Date.now()}`,
      item_name: targetItem.name,
      qty: qtyNum,
      unit: targetItem.unit,
      reason: wasteReason,
      cost: wasteCost,
      logged_at: new Date().toISOString()
    };

    setWasteLogs(prev => [newLog, ...prev]);
    setWasteQty('');
    setWasteReason('Spoiled');
    alert(`Reported waste: ${qtyNum}${targetItem.unit} of ${targetItem.name}.`);
  };

  const totalWasteCost = wasteLogs.reduce((s, w) => s + w.cost, 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Bar */}
      <div className="flex items-center gap-3 bg-[#13102A]/80 border border-white/5 p-6 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Kitchen Inventory & Waste Records</h2>
          <p className="text-xs text-[#A78BFA]/70 mt-0.5">Audit raw materials stock, manage thresholds, and log kitchen wastage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2/3 width): Stock Levels Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#A78BFA]" /> Raw Material Stocks
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider border-b border-white/5 text-left">
                    <th className="pb-3 font-semibold">Ingredient</th>
                    <th className="pb-3 font-semibold">Available Qty</th>
                    <th className="pb-3 font-semibold">Min Alert Limit</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white">
                  {stock.map(s => {
                    const isLow = s.qty < s.min_required;
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-bold text-[#A78BFA]">{s.name}</td>
                        <td className="py-3">
                          <input 
                            type="number"
                            step="any"
                            value={s.qty}
                            onChange={(e) => handleUpdateStock(s.id, Number(e.target.value))}
                            className="w-20 bg-[#0D0A1A] border border-[#6C2BD9]/20 rounded px-2 py-1 outline-none focus:border-[#8B5CF6] text-white font-mono text-center font-bold"
                          />
                          <span className="text-[10px] text-[#C4B5FD]/50 ml-1.5">{s.unit}</span>
                        </td>
                        <td className="py-3 font-mono text-[#C4B5FD]/60">{s.min_required} {s.unit}</td>
                        <td className="py-3 text-center">
                          {isLow ? (
                            <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Adequate
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Log Waste Form */}
        <div className="flex flex-col gap-6">
          
          {/* Report Waste Card */}
          <div className="glass-panel border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-red-400">
              <Trash2 className="w-4 h-4" /> Report Cooking Waste
            </h3>

            <form onSubmit={handleReportWaste} className="space-y-4">
              <div>
                <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Select Ingredient</label>
                <select 
                  value={wasteItem}
                  onChange={(e) => setWasteItem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                >
                  {stock.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Waste Qty</label>
                  <input 
                    required
                    type="number"
                    step="any"
                    value={wasteQty}
                    onChange={(e) => setWasteQty(e.target.value)}
                    placeholder="e.g. 1.5"
                    className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-wider block mb-1.5 font-bold">Reason</label>
                  <select 
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                  >
                    <option value="Spoiled">Spoiled</option>
                    <option value="Spilled">Spilled</option>
                    <option value="Burnt">Burnt</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl hover:shadow-lg transition-all"
              >
                Log Waste Audit
              </button>
            </form>
          </div>

          {/* Waste Totals summary Card */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl" />
            <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold mb-1">Monthly Loss Estimations</div>
            <div className="text-2xl font-black text-white flex items-center gap-1">
              <IndianRupee className="w-5 h-5 text-red-400" />
              {totalWasteCost.toLocaleString('en-IN')}
            </div>
            <p className="text-[9px] text-[#C4B5FD]/50 mt-1 leading-snug">Calculated from raw material unit prices. Review hygiene parameters to reduce loss.</p>
          </div>
        </div>

      </div>

      {/* Waste Audit Log History */}
      <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-bold text-sm">Wastage Log History</h3>
        </div>
        <div className="divide-y divide-white/5">
          {wasteLogs.map(w => (
            <div key={w.id} className="px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/25 flex items-center justify-center font-bold text-xs text-red-400">
                  W
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{w.item_name} — {w.qty} {w.unit}</h4>
                  <p className="text-[10px] text-[#C4B5FD]/45 mt-0.5">Reason: {w.reason} | Logged: {new Date(w.logged_at).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-red-400">-₹{w.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
