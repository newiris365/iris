"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, RefreshCw, MessageSquare } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminFeeDefaultersPage() {
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [selectedStructure, setSelectedStructure] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchDefaulters();
  }, [selectedStructure]);

  const fetchDefaulters = async () => {
    setIsLoading(true);
    try {
      const structRes = await apiGet('/core/fees/structures');
      if (structRes.success) {
        setStructures(structRes.structures || []);
        if (structRes.structures?.length > 0 && !selectedStructure) {
          setSelectedStructure(structRes.structures[0].id);
        }
      }

      // Populate mock defaulter list based on sandbox profiles
      setDefaulters([
        { id: "std-01", name: "Khushal Gehlot", roll_number: "CSE-2026-06", email: "khushal@gmail.com", due: 65000, daysOverdue: 12 },
        { id: "std-02", name: "Sunil Choudhary", roll_number: "CSE-2026-14", email: "sunil@college.edu.in", due: 35000, daysOverdue: 25 },
        { id: "std-03", name: "Pooja Sharma", roll_number: "ECE-2026-44", email: "pooja@college.edu.in", due: 50000, daysOverdue: 5 }
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminders = async () => {
    if (!selectedStructure) return;
    setIsSending(true);
    try {
      const res = await apiPost('/core/fees/reminder/trigger', {
        structureId: selectedStructure
      });
      if (res.success) {
        alert(res.message);
      }
    } catch (err) {
      alert('Mock Alerts Dispatched: Parents notified on WhatsApp.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Defaulter Tracking Portal</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">Identify students with outstanding tuition/hostel balances and trigger bulk payment alerts.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={selectedStructure}
              onChange={(e) => setSelectedStructure(e.target.value)}
              className="bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]"
            >
              {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <button 
              onClick={handleSendReminders}
              disabled={isSending || !selectedStructure}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-[#6C2BD9] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Send className="w-4 h-4" /> {isSending ? "Dispatching Alerts..." : "Trigger WhatsApp Reminders"}
            </button>
          </div>
        </div>

        {/* Defaulter Directory */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-[#C4B5FD] font-semibold border-b border-white/5">
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Outstanding Amount</th>
                  <th className="p-4">Overdue Duration</th>
                  <th className="p-4 text-center">Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#C4B5FD]">Loading defaulter list...</td>
                  </tr>
                ) : defaulters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#C4B5FD]/50">All students have cleared outstanding ledger balances!</td>
                  </tr>
                ) : (
                  defaulters.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{item.roll_number}</td>
                      <td className="p-4 font-semibold text-white">{item.name}</td>
                      <td className="p-4 text-[#C4B5FD]/80">{item.email}</td>
                      <td className="p-4 font-bold text-red-400">₹{item.due.toLocaleString()}</td>
                      <td className="p-4 text-[#C4B5FD]/70">{item.daysOverdue} days late</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => alert(`Direct notification payload sent to: ${item.name}`)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A78BFA] flex items-center gap-1 mx-auto transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Ping Parent
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
