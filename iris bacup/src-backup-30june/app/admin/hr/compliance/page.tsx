"use client";

import React, { useState } from 'react';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface ComplianceItem {
  id: string;
  name: string;
  due_date: string;
  category: string;
  status: 'pending' | 'submitted';
}

export default function AdminComplianceCalendar() {
  const [items, setItems] = useState<ComplianceItem[]>([
    { id: 'c-1', name: 'Monthly EPF ECR Return Filing', due_date: '2026-07-15', category: 'Monthly PF', status: 'pending' },
    { id: 'c-2', name: 'Monthly ESIC Challan Deposit', due_date: '2026-07-15', category: 'Monthly ESI', status: 'pending' },
    { id: 'c-3', name: 'Professional Tax Return Filing', due_date: '2026-07-20', category: 'Monthly PT', status: 'submitted' },
    { id: 'c-4', name: 'Quarterly TDS Return Filing Form 24Q', due_date: '2026-07-31', category: 'Quarterly TDS', status: 'pending' }
  ]);

  const handleMarkSubmitted = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'submitted' } : item));
    alert('Compliance filing marked as completed.');
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Statutory Calendar</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Compliance Calendar</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Track filing deadlines for monthly EPF returns, ESIC challans, Professional Tax returns, and quarterly TDS Forms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(item => (
          <div key={item.id} className="glass-panel border border-[#6C2BD9]/20 bg-[#13102A]/40 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#8B5CF6]/5 to-transparent rounded-full -z-10"></div>
            
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono text-[#A78BFA] px-2.5 py-1 rounded bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 font-bold uppercase">
                {item.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                item.status === 'submitted' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {item.status}
              </span>
            </div>

            <h3 className="font-extrabold text-sm text-white leading-snug">
              {item.name}
            </h3>

            <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-3">
              <span className="text-xs text-[#C4B5FD]/60 flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                Due: {item.due_date}
              </span>
              
              {item.status === 'pending' && (
                <button
                  onClick={() => handleMarkSubmitted(item.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/45 border border-[#6C2BD9] text-[#A78BFA] text-[10px] font-bold transition-all"
                >
                  Mark Filed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
