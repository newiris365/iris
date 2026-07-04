"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, X } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function ParentWalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [child, setChild] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(500);
  const [topping, setTopping] = useState(false);

  useEffect(() => { fetchWallet(); }, []);

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/parent/wallet');
      if (res.success) {
        setBalance(res.balance || 0);
        setTransactions(res.transactions || []);
        setChild(res.child || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (topUpAmount <= 0) return;
    setTopping(true);
    try {
      const childRes = await apiGet('/core/parent/child-info');
      if (!childRes.success || !childRes.child) {
        alert('No linked child found. Please link your child first.');
        setTopping(false);
        return;
      }
      const studentId = childRes.child.student_id;

      const res = await apiPost('/core/parent/wallet/topup', {
        student_id: studentId,
        amount: topUpAmount,
        description: `Parent top-up of ₹${topUpAmount}`,
      });
      if (res.success) {
        setShowTopUp(false);
        fetchWallet();
      } else {
        alert(res.error || 'Top-up failed. Please try again.');
      }
    } catch (err) {
      alert('Top-up failed. Please try again.');
    } finally {
      setTopping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 w-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h2 className="font-heading font-extrabold text-xl text-white">IRIS Wallet</h2>
          <p className="text-[10px] text-[#C4B5FD]/50">Manage your child&apos;s campus wallet</p>
        </div>
      </div>

      {child && (
        <p className="text-[10px] text-[#C4B5FD]/40">Wallet for: <span className="text-white font-medium">{child.name}</span></p>
      )}

      <div className="glass-panel rounded-2xl p-6 border border-pink-500/10">
        <p className="text-[10px] text-pink-400/60 uppercase font-semibold mb-1">Available Balance</p>
        <strong className="text-3xl font-extrabold text-white">₹{balance.toLocaleString('en-IN')}</strong>
        <button onClick={() => setShowTopUp(true)}
          className="mt-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Top Up
        </button>
      </div>

      {showTopUp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-[#13102A] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold text-white">Top Up Wallet</h3>
              <button onClick={() => setShowTopUp(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs">✕</button>
            </div>

            <p className="text-[10px] text-[#C4B5FD]/50 mb-3 font-semibold uppercase">Select Amount</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[200, 500, 1000, 2000].map(amt => (
                <button key={amt} onClick={() => setTopUpAmount(amt)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${topUpAmount === amt ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={topUpAmount}
              onChange={e => setTopUpAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-4 focus:outline-none focus:border-[#6C2BD9]/50"
              placeholder="Enter custom amount"
            />

            <div className="p-4 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#C4B5FD]/60">Top-up Amount</span>
                <strong className="text-lg font-extrabold text-white">₹{topUpAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleTopUp} disabled={topping || topUpAmount <= 0}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all">
                {topping ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Add ₹{topUpAmount.toLocaleString('en-IN')}
                  </>
                )}
              </button>
              <button onClick={() => setShowTopUp(false)}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white/50 font-bold text-xs hover:bg-white/10 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-bold text-white mb-4">Transaction History</h3>
        {isLoading ? (
          <div className="text-center py-16 text-xs text-[#C4B5FD]/50">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-[#C4B5FD]/10 mx-auto mb-3" />
            <p className="text-xs text-white/30">No transactions yet</p>
            <p className="text-[10px] text-[#C4B5FD]/20 mt-1">Top up your wallet to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: any, i: number) => {
              const isCredit = t.type === 'credit' || t.type === 'parent_topup' || t.type === 'wallet_topup';
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {isCredit
                        ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        : <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{t.description || t.reason || 'Transaction'}</p>
                      <p className="text-[10px] text-[#C4B5FD]/40">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCredit ? '+' : '-'}₹{(t.amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
