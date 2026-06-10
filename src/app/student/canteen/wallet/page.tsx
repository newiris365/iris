"use client";

import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowLeft, ArrowUpRight, ArrowDownRight, Plus,
  IndianRupee, Clock, X, CreditCard, Smartphone, QrCode
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

const MOCK_WALLET = { balance: 1250.50, student_id: 's1' };

const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'debit', amount: 220, description: 'Order payment for 3 item(s)', reference_type: 'order_payment', balance_after: 1250.50, created_at: new Date(Date.now() - 480000).toISOString() },
  { id: 't2', type: 'credit', amount: 500, description: 'Wallet top-up of ₹500.00', reference_type: 'topup', balance_after: 1470.50, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 't3', type: 'debit', amount: 130, description: 'Order payment for 1 item(s)', reference_type: 'order_payment', balance_after: 970.50, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 't4', type: 'credit', amount: 30, description: 'Refund for cancelled order ORD-X1Y2Z', reference_type: 'refund', balance_after: 1100.50, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: 't5', type: 'debit', amount: 190, description: 'Order payment for 2 item(s)', reference_type: 'order_payment', balance_after: 1070.50, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 't6', type: 'credit', amount: 1000, description: 'Wallet top-up of ₹1000.00', reference_type: 'topup', balance_after: 1260.50, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 't7', type: 'debit', amount: 450, description: 'Meal subscription - Lunch Plan', reference_type: 'subscription', balance_after: 260.50, created_at: new Date(Date.now() - 259200000).toISOString() },
];

const TOPUP_AMOUNTS = [100, 250, 500, 1000, 2000];

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const refIcons: Record<string, string> = {
  topup: '💰', order_payment: '🛒', refund: '↩️', subscription: '📦'
};

export default function StudentWalletPage() {
  const [wallet, setWallet] = useState(MOCK_WALLET);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const mockStudentId = 's0000000-0000-0000-0000-000000000001';
    try {
      const res = await apiGet(`/canteen/wallet/${mockStudentId}`);
      if (res.success && res.wallet) setWallet(res.wallet);
      const txRes = await apiGet(`/canteen/wallet/${mockStudentId}/transactions`);
      if (txRes.success && txRes.transactions?.length > 0) setTransactions(txRes.transactions);
    } catch (err) { console.log('Using mock wallet data'); }
  };

  const handleTopup = async () => {
    const amount = customAmount ? Number(customAmount) : topupAmount;
    if (!amount || amount <= 0) return;

    try {
      await apiPost('/canteen/wallet/topup', {
        student_id: 's0000000-0000-0000-0000-000000000001',
        amount
      });
    } catch (err) {}

    // Update locally
    const newBalance = wallet.balance + amount;
    setWallet(prev => ({ ...prev, balance: newBalance }));
    setTransactions(prev => [{
      id: `t-${Date.now()}`, type: 'credit', amount,
      description: `Wallet top-up of ₹${amount.toFixed(2)}`,
      reference_type: 'topup', balance_after: newBalance,
      created_at: new Date().toISOString()
    }, ...prev]);
    setShowTopup(false);
    setCustomAmount('');
  };

  const totalSpent = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalLoaded = transactions.filter(t => t.type === 'credit' && t.reference_type === 'topup').reduce((s, t) => s + t.amount, 0);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 lg:p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/student/canteen" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4B5FD]/70 hover:text-white hover:border-[#6C2BD9]/40 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Canteen Wallet</h1>
            <p className="text-xs text-[#C4B5FD]/70">Manage your balance and view transactions</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6C2BD9] via-[#8B5CF6] to-[#A78BFA] p-6 shadow-2xl shadow-[#6C2BD9]/30">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-white/70" />
              <span className="text-xs text-white/70 font-medium uppercase tracking-wider">Available Balance</span>
            </div>

            <p className="text-4xl font-extrabold text-white mb-6">
              ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>

            <button
              onClick={() => setShowTopup(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm text-sm font-bold text-white hover:bg-white/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Money
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider">Total Spent</span>
            </div>
            <p className="text-xl font-extrabold text-white">₹{totalSpent.toLocaleString()}</p>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider">Total Loaded</span>
            </div>
            <p className="text-xl font-extrabold text-white">₹{totalLoaded.toLocaleString()}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A78BFA]" /> Transaction History
            </h2>
          </div>

          <div className="divide-y divide-white/5">
            {transactions.map(tx => (
              <div key={tx.id} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                    tx.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {refIcons[tx.reference_type] || '💳'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{tx.description}</p>
                    <p className="text-[10px] text-[#C4B5FD]/40 mt-0.5">{formatTime(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </p>
                  <p className="text-[9px] text-[#C4B5FD]/30 mt-0.5">Bal: ₹{tx.balance_after.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top-up Modal */}
        {showTopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowTopup(false)}>
            <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/10 p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">Add Money</h3>
                <button onClick={() => setShowTopup(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#C4B5FD]/50 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-3 gap-2">
                {TOPUP_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setTopupAmount(amt); setCustomAmount(''); }}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      topupAmount === amt && !customAmount
                        ? 'bg-[#6C2BD9]/20 border-[#6C2BD9] text-white'
                        : 'bg-white/5 border-white/10 text-[#C4B5FD]/60 hover:border-white/20'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C4B5FD]/40" />
                  <input
                    type="number"
                    min="10"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="Other"
                    className="w-full pl-8 pr-2 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white text-center outline-none focus:border-[#6C2BD9]/50"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-[10px] text-[#C4B5FD]/50 uppercase tracking-wider mb-2">Payment Method</p>
                <div className="flex gap-2">
                  {[
                    { icon: Smartphone, label: 'UPI' },
                    { icon: CreditCard, label: 'Card' },
                    { icon: QrCode, label: 'QR Pay' },
                  ].map((m, i) => (
                    <button key={i} className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold border transition-all ${
                      i === 0 ? 'bg-[#6C2BD9]/10 border-[#6C2BD9]/40 text-[#A78BFA]' : 'bg-white/5 border-white/10 text-[#C4B5FD]/50 hover:border-white/20'
                    }`}>
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTopup}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-sm font-bold text-white hover:shadow-lg hover:shadow-[#6C2BD9]/30 transition-all"
              >
                Add ₹{customAmount || topupAmount} to Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
