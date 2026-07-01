"use client";

import React, { useState, useEffect } from 'react';
import { ChefHat, Calendar, Leaf, Drumstick, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function VendorPrepPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrep = async () => {
      setIsLoading(true);
      try {
        const res = await apiGet('campusCore/vendor/prep-list', { date });
        if (res.success) setItems(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrep();
  }, [date]);

  const vegItems = items.filter(i => i.is_vegetarian);
  const nonVegItems = items.filter(i => !i.is_vegetarian);
  const totalQty = items.reduce((sum, i) => sum + (i.quantity_needed || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ChefHat size={24} className="text-violet-400" />
          Today's Prep List
        </h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading prep list...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ChefHat size={40} className="mx-auto mb-3 opacity-50" />
          <p>No items to prepare today.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-white">{items.length}</p>
              <p className="text-xs text-slate-400">Total Items</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-emerald-400">{vegItems.length}</p>
              <p className="text-xs text-slate-400">Vegetarian</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-orange-400">{nonVegItems.length}</p>
              <p className="text-xs text-slate-400">Non-Vegetarian</p>
            </div>
          </div>

          {/* Prep Items Table */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-slate-400 font-medium">Item</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Category</th>
                    <th className="text-center p-3 text-slate-400 font-medium">Type</th>
                    <th className="text-center p-3 text-slate-400 font-medium">Qty Needed</th>
                    <th className="text-center p-3 text-slate-400 font-medium">Current Stock</th>
                    <th className="text-center p-3 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const shortage = (item.quantity_needed || 0) - (item.current_stock || 0);
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {item.is_vegetarian ? (
                              <Leaf size={14} className="text-green-400" />
                            ) : (
                              <Drumstick size={14} className="text-orange-400" />
                            )}
                            <span className="text-white font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{item.category}</td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded ${item.is_vegetarian ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {item.is_vegetarian ? 'Veg' : 'Non-Veg'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-white font-bold">{item.quantity_needed}</td>
                        <td className="p-3 text-center text-white">{item.current_stock}</td>
                        <td className="p-3 text-center">
                          {shortage > 0 ? (
                            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded flex items-center gap-1 inline-flex">
                              <AlertTriangle size={12} /> Need {shortage} more
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded">✓ Sufficient</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
