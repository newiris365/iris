"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface IncrementRow {
  id: string;
  employee_name: string;
  designation: string;
  previous_basic: number;
  new_basic: number;
  increment_percent: number;
  reason: string;
}

export default function AdminIncrementsConsole() {
  const [increments, setIncrements] = useState<IncrementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock pending increments log
      setIncrements([
        { id: 'inc-1', employee_name: 'Prof. Satish Kumar', designation: 'Associate Professor', previous_basic: 45000, new_basic: 50400, increment_percent: 12, reason: 'Annual Appraisal rating outstanding review recommendation.' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcess = (id: string) => {
    setIncrements(prev => prev.filter(i => i.id !== id));
    alert('Increment processed. Salary structure basic values updated, effective from next cycle.');
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Arrears & Upgrades</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Increment Processing</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Audit approved increments recommendations, update employee basic structures, and generate new appointment notification letters.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading increments ledger...</p>
        </div>
      ) : (
        <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl overflow-hidden bg-[#13102A]/40">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-extrabold text-sm text-white">Recommended Increments Log</h3>
          </div>
          
          {increments.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#C4B5FD]/50">No pending increments to process.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Previous Basic</th>
                    <th className="py-4 px-6">Upgrade (%)</th>
                    <th className="py-4 px-6">New Basic</th>
                    <th className="py-4 px-6">Reason comments</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {increments.map(inc => (
                    <tr key={inc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs text-white">
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5 font-bold">
                          <span>{inc.employee_name}</span>
                          <span className="text-[10px] text-[#C4B5FD]/50">{inc.designation}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold">₹{inc.previous_basic.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 font-bold text-emerald-400">+{inc.increment_percent}%</td>
                      <td className="py-4 px-6 font-extrabold text-[#A78BFA]">₹{inc.new_basic.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-[#C4B5FD]/85 max-w-xs truncate font-medium" title={inc.reason}>{inc.reason}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleProcess(inc.id)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[10px] hover:brightness-110 transition-all flex items-center gap-1.5"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" /> Apply Increment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
