"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, Clock, Wallet, IndianRupee } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function VendorSalesPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      setIsLoading(true);
      try {
        const res = await apiGet('campusCore/vendor/sales', { date });
        if (res.success) setSales(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSales();
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={24} className="text-blue-400" />
          Daily Sales Report
        </h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading sales data...</div>
      ) : !sales ? (
        <div className="text-center py-12 text-slate-400">No data available.</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: sales.total_orders || 0, icon: TrendingUp, color: 'text-blue-400' },
              { label: 'Total Revenue', value: `₹${sales.total_revenue || 0}`, icon: IndianRupee, color: 'text-emerald-400' },
              { label: 'Wallet Payments', value: `₹${sales.wallet_total || 0}`, icon: Wallet, color: 'text-violet-400' },
              { label: 'Avg Order Value', value: `₹${sales.avg_order_value || 0}`, icon: Clock, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <s.icon size={20} className={s.color} />
                  <div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Items */}
          {sales.top_items && sales.top_items.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Top Selling Items</h2>
              <div className="space-y-2">
                {sales.top_items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.quantity_sold} sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">₹{item.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly Breakdown */}
          {sales.hourly_breakdown && sales.hourly_breakdown.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Hourly Orders</h2>
              <div className="flex items-end gap-1 h-32">
                {sales.hourly_breakdown.map((h: any) => {
                  const maxOrders = Math.max(...sales.hourly_breakdown.map((x: any) => x.order_count), 1);
                  const height = (h.order_count / maxOrders) * 100;
                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-slate-400">{h.order_count}</span>
                      <div className="w-full bg-blue-500/40 rounded-t" style={{ height: `${Math.max(height, 4)}%` }} />
                      <span className="text-xs text-slate-500">{h.hour}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
