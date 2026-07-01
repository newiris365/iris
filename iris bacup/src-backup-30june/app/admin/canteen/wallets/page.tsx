"use client";

import React, { useState } from 'react';
import { Wallet, Search, IndianRupee, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminWalletsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmt, setAdjustAmt] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearching(true);
    try {
      const walletRes = await apiGet(`canteen/wallet/${query}`);
      if (walletRes.success && walletRes.wallet) {
        setSelectedStudent(walletRes.wallet);
        const txRes = await apiGet(`canteen/wallet/transactions/${query}`);
        if (txRes.success) setTxHistory(txRes.transactions || []);
      } else {
        setSelectedStudent(null);
        setTxHistory([]);
      }
    } catch (err) {
      setSelectedStudent(null);
      setTxHistory([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !adjustAmt || Number(adjustAmt) <= 0) return;
    setLoading(true);
    try {
      const amtNum = Number(adjustAmt);
      const finalAmt = adjustType === 'credit' ? amtNum : -amtNum;
      const res = await apiPost('canteen/wallet/adjust', {
        student_id: selectedStudent.student_id || selectedStudent.id,
        amount: finalAmt,
        reason: adjustReason || `Admin ${adjustType}`,
      });
      if (res.success) {
        setSelectedStudent({ ...selectedStudent, balance: res.balance });
        setAdjustAmt('');
        setAdjustReason('');
        const txRes = await apiGet(`canteen/wallet/transactions/${selectedStudent.student_id || selectedStudent.id}`);
        if (txRes.success) setTxHistory(txRes.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Wallet size={24} className="text-violet-400" />
        Wallet Management
      </h1>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            placeholder="Search by student ID or roll number..." />
        </div>
        <button onClick={handleSearch} disabled={searching}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm disabled:opacity-50">
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Info */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Wallet Balance</h2>
            <div className="bg-violet-500/10 rounded-xl p-6 text-center mb-4">
              <p className="text-3xl font-bold text-violet-400">₹{(selectedStudent.balance || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">Current Balance</p>
            </div>

            {/* Adjust Form */}
            <form onSubmit={handleAdjust} className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${adjustType === 'credit' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-300'}`}>
                  <ArrowUpRight size={14} className="inline mr-1" /> Credit
                </button>
                <button type="button" onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${adjustType === 'debit' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300'}`}>
                  <ArrowDownRight size={14} className="inline mr-1" /> Debit
                </button>
              </div>
              <input type="number" value={adjustAmt} onChange={e => setAdjustAmt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Amount" min="1" step="0.01" />
              <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Reason (optional)" />
              <button type="submit" disabled={loading || !adjustAmt}
                className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm disabled:opacity-50">
                {loading ? 'Processing...' : 'Apply Adjustment'}
              </button>
            </form>
          </div>

          {/* Transaction History */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <RefreshCw size={16} className="text-slate-400" /> Transaction History
            </h2>
            {txHistory.length === 0 ? (
              <p className="text-slate-400 text-sm">No transactions found.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {txHistory.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div>
                        <p className="text-xs text-white">{tx.reason || tx.reference_type}</p>
                        <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
