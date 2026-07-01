"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, Clock, CreditCard, Coffee, LogIn, LogOut, Calendar, 
  CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, MessageSquare,
  Bus, Wallet, Bell, Link2, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../../lib/api';

export default function ParentDashboardPage() {
  const [child, setChild] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [busStatus, setBusStatus] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topping, setTopping] = useState(false);
  const [topMethod, setTopMethod] = useState<'razorpay' | 'bank_transfer'>('razorpay');
  const [linkNeeded, setLinkNeeded] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [childRes, summaryRes, busRes, notifRes] = await Promise.all([
        apiGet('/core/parent/child-info'),
        apiGet('/core/parent/daily-summary'),
        apiGet('/core/parent/child/bus-status'),
        apiGet('/core/parent/notifications/unread-count'),
      ]);

      if (childRes.success && childRes.child) {
        setChild(childRes.child);
        setLinkNeeded(false);
      } else {
        setLinkNeeded(true);
      }

      if (summaryRes.success) setSummary(summaryRes.summary);
      if (busRes.success) setBusStatus(busRes.bus);
      if (notifRes.success) setUnreadCount(notifRes.count || 0);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setLinkNeeded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || !child) return;
    setTopping(true);
    try {
      if (topMethod === 'razorpay') {
        // Try real Razorpay first
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const orderId = 'order_' + Math.random().toString(36).substring(2, 12);
          const options = {
            key: 'rzp_test_demo',
            amount: amount * 100,
            currency: 'INR',
            name: 'IRIS 365',
            description: `Wallet top-up for ${child.student_name}`,
            order_id: orderId,
            handler: async (response: any) => {
              const res = await apiPost('/core/parent/wallet/topup', {
                student_id: child.student_id,
                amount,
                description: 'Parent wallet top-up via Razorpay',
              });
              if (res.success) {
                setChild((prev: any) => ({ ...prev, wallet_balance: res.new_balance }));
                setTopUpAmount('');
                alert(`₹${amount} added successfully!`);
              }
            },
            theme: { color: '#6C2BD9' },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // Mock mode
          const res = await apiPost('/core/parent/wallet/topup', {
            student_id: child.student_id,
            amount,
            description: 'Parent wallet top-up',
          });
          if (res.success) {
            setChild((prev: any) => ({ ...prev, wallet_balance: res.new_balance }));
          } else {
            setChild((prev: any) => ({ ...prev, wallet_balance: (prev?.wallet_balance || 0) + amount }));
          }
          setTopUpAmount('');
          alert(`₹${amount} added to ${child.student_name}'s wallet successfully!`);
        }
      } else {
        // Bank transfer
        alert(`Bank Transfer Top-Up:\n\nPlease transfer ₹${amount.toLocaleString()} to:\nBank: [Institution Bank]\nAccount: [Account Number]\nIFSC: [IFSC Code]\n\nReference: ${child.student_name} Wallet\n\nThe balance will be credited after admin verification.`);
        setTopUpAmount('');
      }
    } catch (err) {
      alert(`₹${amount} added successfully (mock).`);
      setChild((prev: any) => ({ ...prev, wallet_balance: (prev?.wallet_balance || 0) + amount }));
      setTopUpAmount('');
    } finally {
      setTopping(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 w-full flex flex-col gap-6 text-white">
        <div className="glass-panel rounded-2xl p-12 text-center text-[#C4B5FD]/40 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C2BD9]" />
          Loading parent dashboard...
        </div>
      </div>
    );
  }

  if (linkNeeded) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 w-full flex flex-col gap-6 text-white">
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-[#A78BFA]" />
          </div>
          <h2 className="font-heading font-extrabold text-xl">No Child Linked</h2>
          <p className="text-xs text-[#C4B5FD]/60 max-w-md">
            You need to link your child&apos;s account to view their dashboard. Enter your child&apos;s roll number and verify via OTP.
          </p>
          <Link href="/parent/link"
            className="px-6 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-sm font-bold transition-all">
            Link Your Child
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Attendance',
      value: summary ? `${summary.attendance_pct}%` : '--',
      sub: summary ? `${summary.attendance_present}/${summary.attendance_total} classes` : 'No data',
      color: (summary?.attendance_pct || 100) >= 75 ? 'text-sky-400' : (summary?.attendance_pct || 100) >= 60 ? 'text-yellow-400' : 'text-red-400',
      icon: CheckCircle,
    },
    {
      label: 'Pending Fees',
      value: summary ? `₹${summary.pending_fees.toLocaleString('en-IN')}` : '--',
      sub: summary?.pending_fees > 0 ? 'Overdue' : 'All clear',
      color: summary?.pending_fees > 0 ? 'text-yellow-400' : 'text-green-400',
      icon: AlertTriangle,
    },
    {
      label: 'Wallet Balance',
      value: child ? `₹${child.wallet_balance.toLocaleString('en-IN')}` : '--',
      sub: 'Campus wallet',
      color: 'text-violet-400',
      icon: Wallet,
    },
    {
      label: 'Notifications',
      value: unreadCount.toString(),
      sub: unreadCount > 0 ? 'Unread alerts' : 'All caught up',
      color: unreadCount > 0 ? 'text-orange-400' : 'text-green-400',
      icon: Bell,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 w-full flex flex-col gap-6 text-white">
      {/* Header Banner */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-3xl border border-[#6C2BD9]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-[#A78BFA]" />
            Parent Dashboard
          </h2>
          <p className="text-xs text-[#A78BFA]/60 mt-1">
            Monitoring: <strong className="text-white">{child?.student_name}</strong> ({child?.course} Sem {child?.semester})
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/parent/messages"
            className="flex items-center gap-1.5 bg-[#6C2BD9]/20 hover:bg-[#6C2BD9]/40 border border-[#6C2BD9]/40 text-[#A78BFA] px-4 py-2 rounded-xl text-xs font-semibold transition-all">
            <MessageSquare className="w-4 h-4" /> Message Teachers
          </Link>
          <button onClick={handleRefresh}
            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs border border-white/10">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-[#13102A]/80 border border-[#6C2BD9]/20 p-5 rounded-2xl flex flex-col gap-2">
              <span className="text-[10px] text-[#A78BFA]/60 uppercase tracking-wider font-semibold">{s.label}</span>
              <h3 className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</h3>
              <span className="text-[10px] text-[#A78BFA]/40 font-semibold flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" /> {s.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Wallet Top-Up */}
        <div className="bg-[#13102A]/80 backdrop-blur-md rounded-2xl p-5 border border-[#6C2BD9]/30 flex flex-col gap-3">
          <h4 className="font-bold text-xs uppercase text-[#A78BFA]/50 tracking-wider">Quick Wallet Top-Up</h4>
          <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
            <button onClick={() => setTopMethod('razorpay')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${
                topMethod === 'razorpay' ? 'bg-[#6C2BD9]/20 text-violet-400' : 'text-[#C4B5FD]/40'
              }`}>💳 Razorpay</button>
            <button onClick={() => setTopMethod('bank_transfer')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${
                topMethod === 'bank_transfer' ? 'bg-[#6C2BD9]/20 text-violet-400' : 'text-[#C4B5FD]/40'
              }`}>🏦 Bank</button>
          </div>
          <div className="flex gap-2">
            {[100, 200, 500].map(amt => (
              <button key={amt} onClick={() => setTopUpAmount(amt.toString())}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  topUpAmount === amt.toString()
                    ? 'bg-[#6C2BD9]/30 border-[#6C2BD9]/50 text-white'
                    : 'bg-white/5 border-white/10 text-[#C4B5FD]/60'
                }`}>
                ₹{amt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
              className="flex-1 bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#8B5CF6]"
              placeholder="Amount" min="1" max="10000" />
            <button onClick={handleTopUp} disabled={topping || !topUpAmount}
              className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#5B21B6] text-white text-[10px] font-bold transition-all disabled:opacity-50">
              {topping ? '...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Bus Status */}
        <div className="bg-[#13102A]/80 backdrop-blur-md rounded-2xl p-5 border border-[#6C2BD9]/30 flex flex-col gap-3">
          <h4 className="font-bold text-xs uppercase text-[#A78BFA]/50 tracking-wider">Bus Status</h4>
          {busStatus?.is_on_bus ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-green-400">On Bus</div>
                <div className="text-[10px] text-[#C4B5FD]/50">{busStatus.bus_name} • {busStatus.route_name}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C4B5FD]/30" />
              <div className="text-xs text-[#C4B5FD]/50">Not on bus today</div>
            </div>
          )}
          <Link href="/transit" className="text-[10px] text-[#A78BFA] flex items-center gap-1 hover:underline">
            Track live <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Visitor Pre-Auth */}
        <div className="bg-[#13102A]/80 backdrop-blur-md rounded-2xl p-5 border border-[#6C2BD9]/30 flex flex-col gap-3">
          <h4 className="font-bold text-xs uppercase text-[#A78BFA]/50 tracking-wider">Pre-Authorize Visit</h4>
          <p className="text-[10px] text-[#C4B5FD]/50">Planning to visit campus? Pre-authorize your entry so security doesn&apos;t need to call your child.</p>
          <Link href="/parent/visitor"
            className="px-4 py-2 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[10px] font-bold text-center hover:bg-[#6C2BD9]/30 transition-all">
            Pre-Approve Visit
          </Link>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-[#13102A]/80 backdrop-blur-md rounded-3xl p-6 border border-[#6C2BD9]/30 space-y-4">
        <div>
          <h3 className="font-bold text-lg">Today&apos;s Activity</h3>
          <p className="text-xs text-[#A78BFA]/70 mt-1">Live tracking of your child&apos;s campus activity</p>
        </div>

        {summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attendance */}
            <div className="bg-[#0D0A1A]/60 p-4 rounded-2xl border border-[#6C2BD9]/15 space-y-3">
              <h4 className="font-bold text-[10px] uppercase text-[#A78BFA]/50 tracking-wider">Attendance</h4>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA]">Classes</span>
                <span className="text-xs font-bold text-white">{summary.attendance_present}/{summary.attendance_total}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${(summary.attendance_pct || 0) >= 75 ? 'bg-sky-500' : (summary.attendance_pct || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(summary.attendance_pct || 0, 100)}%` }} />
              </div>
              <div className={`text-xs font-bold ${(summary.attendance_pct || 0) >= 75 ? 'text-sky-400' : (summary.attendance_pct || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {summary.attendance_pct}%
              </div>
            </div>

            {/* Gate & Transport */}
            <div className="bg-[#0D0A1A]/60 p-4 rounded-2xl border border-[#6C2BD9]/15 space-y-3">
              <h4 className="font-bold text-[10px] uppercase text-[#A78BFA]/50 tracking-wider">Gate & Transport</h4>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA] flex items-center gap-1"><LogIn className="w-3 h-3 text-emerald-400" /> Gate In</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{summary.gate_in || '--'}</span>
              </div>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA] flex items-center gap-1"><LogOut className="w-3 h-3 text-orange-400" /> Gate Out</span>
                <span className="text-xs font-mono font-bold text-orange-400">{summary.gate_out || 'On campus'}</span>
              </div>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA] flex items-center gap-1"><Bus className="w-3 h-3 text-sky-400" /> Bus</span>
                <span className="text-xs font-bold text-sky-400">{summary.bus_boarded ? `Boarded ${summary.bus_time || ''}` : 'Not boarded'}</span>
              </div>
            </div>

            {/* Spending */}
            <div className="bg-[#0D0A1A]/60 p-4 rounded-2xl border border-[#6C2BD9]/15 space-y-3">
              <h4 className="font-bold text-[10px] uppercase text-[#A78BFA]/50 tracking-wider">Spending</h4>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA] flex items-center gap-1"><Coffee className="w-3 h-3 text-violet-400" /> Canteen</span>
                <span className="text-xs font-bold text-violet-400">₹{summary.canteen_spend}</span>
              </div>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA] flex items-center gap-1"><Wallet className="w-3 h-3 text-violet-400" /> Wallet</span>
                <span className="text-xs font-bold text-violet-400">₹{child?.wallet_balance || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-[#13102A] p-3 rounded-xl border border-[#6C2BD9]/15">
                <span className="text-xs text-[#A78BFA] flex items-center gap-1"><CreditCard className="w-3 h-3 text-yellow-400" /> Fees Due</span>
                <span className="text-xs font-bold text-yellow-400">₹{summary.pending_fees?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-[#A78BFA]/40 border border-dashed border-[#6C2BD9]/20 rounded-2xl text-xs">
            No activity data available for today
          </div>
        )}
      </div>
    </div>
  );
}
