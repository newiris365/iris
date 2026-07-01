"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, FileText, Send, User, ShieldAlert, CheckCircle2,
  RefreshCw, MessageSquare, Sparkles
} from 'lucide-react';

interface LeaveBalance {
  id: string;
  type_name: string;
  code: string;
  entitled_days: number;
  used_days: number;
  remaining_days: number;
}

export default function EmployeeHrDashboard() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chatbot states
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hr/leave/balance/d0000000-0000-0000-0000-000000000003', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setBalances(data.balances);
      } else {
        setBalances(getDefaultBalances());
      }
    } catch (err) {
      console.error(err);
      setBalances(getDefaultBalances());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultBalances = (): LeaveBalance[] => [
    { id: 'b-1', type_name: 'Casual Leave (CL)', code: 'CL', entitled_days: 12, used_days: 3, remaining_days: 9 },
    { id: 'b-2', type_name: 'Earned Leave (EL)', code: 'EL', entitled_days: 18, used_days: 4, remaining_days: 14 },
    { id: 'b-3', type_name: 'Sick Leave (SL)', code: 'SL', entitled_days: 10, used_days: 2, remaining_days: 8 }
  ];

  useEffect(() => {
    loadData();
    // Welcome chat message
    setChatHistory([
      { sender: 'bot', text: 'Hello! I am your IRIS AI HR Advisor. Ask me anything about CL/EL leave policies, tax regimes, or payslips!' }
    ]);
  }, []);

  const handleSendChat = async () => {
    if (!chatPrompt.trim()) return;
    const userMsg = chatPrompt;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatPrompt('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/v1/hr/ai/chatbot', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt: userMsg })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { sender: 'bot', text: data.response }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: 'According to institute guidelines, Casual Leave (CL) is capped at 12 days annually and cannot carry forward.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Employee Self-Service Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">My HR Console</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Submit leave requests, check monthly attendance regularizations, and download payslips.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Stats Cards & Leave balances */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Quick attendance check */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold">Today's Punch</span>
              <span className="font-extrabold text-sm text-white">09:02 AM - Active</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold">Month Working Days</span>
              <span className="font-extrabold text-sm text-white">22 Days</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#13102A]/40 flex flex-col gap-2 col-span-2 md:col-span-1">
              <span className="text-[9px] uppercase tracking-wider text-[#C4B5FD]/50 font-bold">Tax Regime</span>
              <span className="font-extrabold text-sm text-emerald-400">New Regime (115BAC)</span>
            </div>
          </div>

          {/* Leave Balances Grid */}
          <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-3">My Leave Balances</h3>
            
            {loading ? (
              <div className="text-center py-6">
                <RefreshCw className="w-6 h-6 text-[#8B5CF6] animate-spin mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {balances.map(b => (
                  <div key={b.id} className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-[#6C2BD9]/15 flex flex-col gap-1 hover:border-[#6C2BD9]/35 transition-all">
                    <span className="text-[9px] uppercase text-[#A78BFA] font-mono font-bold">{b.code}</span>
                    <span className="font-extrabold text-xs text-white truncate">{b.type_name}</span>
                    <div className="flex justify-between text-xs mt-3 text-[#C4B5FD]/60 font-semibold">
                      <span>Available:</span>
                      <span className="text-white font-extrabold">{b.remaining_days} / {b.entitled_days}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI HR Chatbot Widget */}
        <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/20 flex flex-col gap-4 max-h-[400px]">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <span>AI Policy Advisor</span>
          </h3>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 text-xs">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[85%] leading-normal font-semibold ${
                  msg.sender === 'user'
                    ? 'bg-[#6C2BD9]/25 border border-[#8B5CF6]/30 self-end text-white'
                    : 'bg-[#0D0A1A]/85 border border-white/5 self-start text-[#C4B5FD]'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start p-3 rounded-xl bg-[#0D0A1A]/80 border border-white/5 text-[#C4B5FD] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking...
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-white/5 pt-3">
            <input
              type="text"
              placeholder="Ask about policy rules..."
              className="flex-1 bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              value={chatPrompt}
              onChange={e => setChatPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            />
            <button
              onClick={handleSendChat}
              className="p-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
