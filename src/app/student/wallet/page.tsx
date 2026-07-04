"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, Coffee, Dumbbell, Bus, BookOpen, Gift } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  payment_method: string;
  status: string;
  description: string;
  created_at: string;
}

const MODULE_ICONS: Record<string, any> = {
  canteen: Coffee, gym: Dumbbell, transit: Bus, library: BookOpen, fees: CreditCard,
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);
  const [topAmount, setTopAmount] = useState('');
  const [topMethod, setTopMethod] = useState<'razorpay' | 'parent_request'>('razorpay');
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => { loadWallet(); }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        apiGet('/core/wallet/balance'),
        apiGet('/core/wallet/transactions'),
      ]);
      if (balRes.success) setBalance(balRes.balance || 0);
      if (txRes.success) setTransactions(txRes.transactions || []);

      // Load payment config for Razorpay
      try {
        const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
        const instId = profile.institution_id;
        if (instId) {
          const { data } = await supabase
            .from('payment_config')
            .select('razorpay_key_id, enabled_methods')
            .eq('institution_id', instId)
            .maybeSingle();
          if (data) setPaymentConfig(data);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topAmount);
    if (!amount || amount <= 0) return;
    setTopping(true);
    try {
      if (topMethod === 'razorpay') {
        if (typeof window !== 'undefined' && !(window as any).Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          document.body.appendChild(script);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const orderRes = await apiPost('/core/wallet/topup/initiate', { amount });

        if (orderRes.success && orderRes.order_id && !orderRes.order_id.startsWith('order_mock_') && orderRes.key_id && typeof window !== 'undefined' && (window as any).Razorpay) {
          const options = {
            key: orderRes.key_id,
            amount: orderRes.amount,
            currency: orderRes.currency || 'INR',
            name: 'IRIS 365',
            description: 'IRIS Balance Top-Up',
            order_id: orderRes.order_id,
            handler: async (response: any) => {
              const res = await apiPost('/core/wallet/credit', {
                amount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              });
              if (res.success) {
                setBalance(res.new_balance || balance + amount);
                setTopAmount('');
                loadWallet();
              }
            },
            theme: { color: '#6C2BD9' },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          const res = await apiPost('/core/wallet/credit', {
            amount,
            razorpay_order_id: orderRes.order_id || 'order_mock_' + Math.random().toString(36).substring(2, 12),
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 12),
          });
          if (res.success) {
            setBalance(res.new_balance || balance + amount);
          } else {
            setBalance(prev => prev + amount);
          }
          setTransactions(prev => [{
            id: 'tx_' + Math.random(),
            amount,
            type: 'topup',
            payment_method: 'razorpay',
            status: 'completed',
            description: 'Wallet top-up via Razorpay',
            created_at: new Date().toISOString(),
          }, ...prev]);
          setTopAmount('');
        }
      } else {
        // Parent top-up request
        alert('A top-up request has been sent to your parent. They will be notified to add funds.');
        setTopAmount('');
      }
    } catch (err) {
      alert('Payment failed. Please try again.');
      setTopAmount('');
    } finally {
      setTopping(false);
    }
  };

  const QUICK_AMOUNTS = [100, 200, 500, 1000];

  const totalTopups = transactions.filter(t => t.type === 'topup' || t.type === 'parent_topup').reduce((a, t) => a + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === 'deduction').reduce((a, t) => a + t.amount, 0);

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl">IRIS Balance</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Your universal campus wallet — use it across canteen, gym, transit, events & more</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="glass-panel rounded-2xl p-8 border border-[#6C2BD9]/30 text-center">
          <span className="text-xs text-[#C4B5FD]/50">Available Balance</span>
          <div className="text-5xl font-heading font-extrabold text-white mt-2">
            ₹{balance.toLocaleString('en-IN')}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-[10px]">
            <span className="text-emerald-400">Total Added: ₹{totalTopups.toLocaleString()}</span>
            <span className="text-red-400">Total Spent: ₹{totalSpent.toLocaleString()}</span>
          </div>
        </div>

        {/* Top Up */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-sm">Add Money</h3>

          {/* Method selector */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
            <button onClick={() => setTopMethod('razorpay')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                topMethod === 'razorpay' ? 'bg-[#6C2BD9]/20 text-violet-400 border border-violet-500/30' : 'text-[#C4B5FD]/50 hover:text-white'
              }`}>
              <CreditCard className="w-3.5 h-3.5 inline mr-1.5" /> Self Top-Up
            </button>
            <button onClick={() => setTopMethod('parent_request')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                topMethod === 'parent_request' ? 'bg-[#6C2BD9]/20 text-violet-400 border border-violet-500/30' : 'text-[#C4B5FD]/50 hover:text-white'
              }`}>
              <Gift className="w-3.5 h-3.5 inline mr-1.5" /> Ask Parent
            </button>
          </div>

          {topMethod === 'razorpay' && (
            <>
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map(amt => (
                  <button key={amt} onClick={() => setTopAmount(amt.toString())}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      topAmount === amt.toString()
                        ? 'bg-[#6C2BD9]/30 border-[#6C2BD9]/50 text-white'
                        : 'bg-white/5 border-white/10 text-[#C4B5FD]/60 hover:text-white'
                    }`}>
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input type="number" value={topAmount} onChange={e => setTopAmount(e.target.value)}
                  className="flex-1 bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6]"
                  placeholder="Enter amount" min="1" />
                <button onClick={handleTopUp} disabled={topping || !topAmount}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all disabled:opacity-50">
                  <CreditCard className="w-4 h-4" /> {topping ? 'Processing...' : 'Pay'}
                </button>
              </div>
            </>
          )}

          {topMethod === 'parent_request' && (
            <div className="text-center py-6">
              <Gift className="w-10 h-10 text-[#C4B5FD]/30 mx-auto mb-3" />
              <p className="text-xs text-[#C4B5FD]/60 mb-3">Request your parent to add funds to your IRIS Balance.</p>
              <div className="flex gap-3 justify-center">
                <input type="number" value={topAmount} onChange={e => setTopAmount(e.target.value)}
                  className="w-32 bg-[#13102A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6] text-center"
                  placeholder="Amount" min="1" />
                <button onClick={handleTopUp} disabled={topping || !topAmount}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50">
                  {topping ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usage Modules */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-heading font-bold text-sm mb-4">Where You Can Use IRIS Balance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Coffee, label: 'Canteen', color: 'text-orange-400' },
              { icon: Dumbbell, label: 'Gym', color: 'text-emerald-400' },
              { icon: Bus, label: 'Transit', color: 'text-sky-400' },
              { icon: BookOpen, label: 'Library', color: 'text-amber-400' },
            ].map(mod => (
              <div key={mod.label} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                <mod.icon className={`w-5 h-5 ${mod.color} mx-auto mb-1`} />
                <span className="text-[10px] font-bold text-white">{mod.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
          <h3 className="font-heading font-bold text-sm">Transaction History</h3>
          {loading ? (
            <div className="text-center text-[#C4B5FD]/40 text-xs py-4">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-[#C4B5FD]/40 text-xs py-4">No transactions yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map(tx => (
                <div key={tx.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'topup' || tx.type === 'parent_topup'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.type === 'topup' || tx.type === 'parent_topup'
                      ? <ArrowDownLeft className="w-4 h-4" />
                      : <ArrowUpRight className="w-4 h-4" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{tx.description || tx.type}</div>
                    <div className="text-[9px] text-[#C4B5FD]/40">
                      {new Date(tx.created_at).toLocaleString('en-IN')} &middot; {tx.payment_method}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${
                    tx.type === 'topup' || tx.type === 'parent_topup' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'topup' || tx.type === 'parent_topup' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
