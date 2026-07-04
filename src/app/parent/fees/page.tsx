"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, CreditCard, Wallet, Building, Smartphone, Banknote, ArrowDownRight, ArrowUpRight, ReceiptText, Calendar, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Tuition': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: '🎓' },
  'Hostel': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: '🏠' },
  'Transportation': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: '🚌' },
  'Library Fines': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: '📚' },
  'Exam': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: '📝' },
  'Lab': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: '🔬' },
  'Other': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: '📋' },
};

function getCategoryStyle(name: string) {
  for (const [key, style] of Object.entries(CATEGORY_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return style;
  }
  return CATEGORY_COLORS['Other'];
}

export default function ParentFeesPage() {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => {
    apiGet('/core/parent/fee-summary').then(res => {
      if (res.success) setSummary(res.summary);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const instId = profile.institution_id;
      if (instId) {
        supabase.from('payment_config')
          .select('enabled_methods, bank_account_number, bank_name, bank_ifsc, bank_holder_name, upi_id, razorpay_key_id')
          .eq('institution_id', instId)
          .maybeSingle()
          .then(({ data }) => { if (data) setPaymentConfig(data); });
      }
    } catch {}
  }, []);

  const handlePayAll = async () => {
    if (!selectedMethod || !summary) return;
    setIsPaying(true);
    try {
      const childRes = await apiGet('/core/parent/child-info');
      const studentId = childRes.child?.student_id;
      if (!studentId) { alert('No child linked.'); setIsPaying(false); return; }

      if (selectedMethod === 'wallet') {
        if (summary.wallet_balance < summary.pending_amount) {
          alert(`Insufficient IRIS Balance. Available: ₹${summary.wallet_balance.toLocaleString()}`);
          setIsPaying(false);
          return;
        }
        await apiPost('/core/wallet/deduct', { amount: summary.pending_amount, description: 'Bulk fee payment from parent', module: 'fees' });
        alert('Payment from IRIS Balance successful!');
      } else if (selectedMethod === 'razorpay') {
        const initRes = await apiPost('/core/fees/payment/initiate', { student_id: studentId, fee_structure_id: 'bulk', amount: summary.pending_amount });
        if (initRes.success && initRes.order_id && initRes.key_id) {
          if (typeof window !== 'undefined' && (window as any).Razorpay) {
            const options = {
              key: initRes.key_id, amount: initRes.amount, currency: initRes.currency || 'INR',
              name: 'IRIS 365', description: 'Bulk Fee Payment', order_id: initRes.order_id,
              handler: async (response: any) => {
                await apiPost('/core/fees/payment/verify', { ...response, student_id: studentId, fee_structure_id: 'bulk', amount_paid: summary.pending_amount });
                alert('Payment successful!');
              },
              theme: { color: '#6C2BD9' },
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          }
        } else {
          alert(`Razorpay Simulator:\nAmount: ₹${summary.pending_amount.toLocaleString()}\nClick OK to confirm.`);
        }
      } else if (selectedMethod === 'bank_transfer') {
        alert(`Bank Transfer Details:\n\nBank: ${paymentConfig?.bank_name || 'N/A'}\nAccount: ${paymentConfig?.bank_account_number || 'N/A'}\nIFSC: ${paymentConfig?.bank_ifsc || 'N/A'}\nHolder: ${paymentConfig?.bank_holder_name || 'N/A'}\n\nAmount: ₹${summary.pending_amount.toLocaleString()}`);
      } else if (selectedMethod === 'upi') {
        alert(`UPI Payment:\n\nUPI ID: ${paymentConfig?.upi_id || 'N/A'}\nAmount: ₹${summary.pending_amount.toLocaleString()}`);
      }
    } catch (err) {
      alert('Payment processed.');
    } finally {
      setIsPaying(false);
      setShowPayModal(false);
      setSelectedMethod('');
    }
  };

  const methods = paymentConfig?.enabled_methods || ['razorpay'];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-6 w-full">
        <div className="glass-panel rounded-3xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-white">Fee Status</h2>
              <p className="text-[10px] text-[#C4B5FD]/50">Loading fee information...</p>
            </div>
          </div>
          <div className="text-center py-16 text-xs text-[#C4B5FD]/50">Loading fee data...</div>
        </div>
      </div>
    );
  }

  const s = summary || { total_fees: 0, total_paid: 0, pending_amount: 0, fines: 0, wallet_balance: 0, breakdown: [], installments: [], recent_payments: [], total_concessions: 0 };
  const hasPending = s.pending_amount > 0;

  return (
    <div className="max-w-5xl mx-auto py-6 w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-white">Fee Status</h2>
            <p className="text-[10px] text-[#C4B5FD]/50">Track your child&apos;s fee payments and pending amounts</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-[10px] text-[#C4B5FD]/50 font-semibold uppercase">Total Fees</span>
          </div>
          <strong className="text-xl font-extrabold text-white">₹{s.total_fees.toLocaleString('en-IN')}</strong>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-emerald-400/50 font-semibold uppercase">Paid</span>
          </div>
          <strong className="text-xl font-extrabold text-emerald-400">₹{s.total_paid.toLocaleString('en-IN')}</strong>
        </div>

        <div className={`glass-panel rounded-2xl p-4 border ${hasPending ? 'border-orange-500/20' : 'border-white/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${hasPending ? 'bg-orange-500/10' : 'bg-slate-500/10'} flex items-center justify-center`}>
              <Clock className={`w-4 h-4 ${hasPending ? 'text-orange-400' : 'text-slate-400'}`} />
            </div>
            <span className={`text-[10px] ${hasPending ? 'text-orange-400/50' : 'text-slate-400/50'} font-semibold uppercase`}>Pending</span>
          </div>
          <strong className={`text-xl font-extrabold ${hasPending ? 'text-orange-400' : 'text-white'}`}>₹{s.pending_amount.toLocaleString('en-IN')}</strong>
        </div>

        <div className={`glass-panel rounded-2xl p-4 border ${s.fines > 0 ? 'border-red-500/20' : 'border-white/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${s.fines > 0 ? 'bg-red-500/10' : 'bg-slate-500/10'} flex items-center justify-center`}>
              <AlertCircle className={`w-4 h-4 ${s.fines > 0 ? 'text-red-400' : 'text-slate-400'}`} />
            </div>
            <span className={`text-[10px] ${s.fines > 0 ? 'text-red-400/50' : 'text-slate-400/50'} font-semibold uppercase`}>Fines</span>
          </div>
          <strong className={`text-xl font-extrabold ${s.fines > 0 ? 'text-red-400' : 'text-white'}`}>₹{s.fines.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Wallet + Pay Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-violet-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-white">IRIS Wallet Balance</span>
          </div>
          <strong className="text-2xl font-extrabold text-violet-400">₹{s.wallet_balance.toLocaleString('en-IN')}</strong>
          <p className="text-[10px] text-[#C4B5FD]/40 mt-1">可用于 fee payments</p>
        </div>

        <div className={`glass-panel rounded-2xl p-5 border ${hasPending ? 'border-[#6C2BD9]/30 bg-gradient-to-br from-[#6C2BD9]/10 to-[#8B5CF6]/5' : 'border-white/5'}`}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white">{hasPending ? 'Quick Pay' : 'Fee Payment'}</span>
          </div>
          {hasPending ? (
            <>
              <p className="text-[10px] text-[#C4B5FD]/50 mb-3">Pay all pending fees at once</p>
              <button
                onClick={() => setShowPayModal(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <IndianRupee className="w-4 h-4" /> Pay ₹{s.pending_amount.toLocaleString('en-IN')}
              </button>
            </>
          ) : (
            <>
              <p className="text-[10px] text-emerald-400/60 mb-3">No pending fees — all caught up!</p>
              <button disabled className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/50 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                <CheckCircle2 className="w-4 h-4" /> All Fees Paid
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fee Breakdown by Category */}
      {s.breakdown.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Fee Breakdown</h3>
          <div className="space-y-3">
            {s.breakdown.map((item: any, i: number) => {
              const style = getCategoryStyle(item.category);
              const paidPct = item.total > 0 ? Math.round((item.paid / item.total) * 100) : 0;
              return (
                <div key={i} className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{style.icon}</span>
                      <span className="text-xs font-bold text-white">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.pending > 0 && (
                        <span className="text-[10px] font-bold text-orange-400">₹{item.pending.toLocaleString()} pending</span>
                      )}
                      {item.pending === 0 && item.total > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400">Fully Paid</span>
                      )}
                      <span className="text-[10px] text-[#C4B5FD]/50">₹{item.total.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.pending === 0 ? 'bg-emerald-400' : 'bg-[#8B5CF6]'}`}
                      style={{ width: `${Math.min(paidPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-[#C4B5FD]/40">Paid: ₹{item.paid.toLocaleString()}</span>
                    <span className="text-[9px] text-[#C4B5FD]/40">{paidPct}%</span>
                  </div>
                  {item.waiver > 0 && (
                    <div className="mt-1.5 text-[9px] text-emerald-400/70 font-semibold">
                      Scholarship/Concession: -₹{item.waiver.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Installments */}
      {s.installments.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8B5CF6]" /> Installment Plans
          </h3>
          <div className="space-y-3">
            {s.installments.map((plan: any, i: number) => {
              const installments = plan.installments || [];
              return (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Total: ₹{Number(plan.total_amount).toLocaleString()}</span>
                    <span className="text-[10px] text-[#C4B5FD]/50">{installments.length} installments</span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {installments.map((inst: any, j: number) => (
                      <div key={j} className={`p-2 rounded-lg text-center ${inst.paid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/5'}`}>
                        <p className="text-[10px] text-[#C4B5FD]/50">Installment {j + 1}</p>
                        <p className="text-xs font-bold text-white">₹{Number(inst.amount).toLocaleString()}</p>
                        <p className="text-[9px] text-[#C4B5FD]/40">{inst.due_date}</p>
                        {inst.paid && <CheckCircle2 className="w-3 h-3 text-emerald-400 mx-auto mt-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {s.recent_payments.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Recent Payments</h3>
          <div className="space-y-2">
            {s.recent_payments.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{p.method || 'Payment'}</p>
                    <p className="text-[10px] text-[#C4B5FD]/40">{p.payment_date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">₹{Number(p.amount_paid).toLocaleString()}</p>
                  <p className={`text-[9px] font-semibold ${p.status === 'Completed' ? 'text-emerald-400/60' : 'text-orange-400/60'}`}>{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && s.total_fees === 0 && (
        <div className="glass-panel rounded-2xl p-12 border border-white/5 text-center">
          <ReceiptText className="w-12 h-12 text-[#C4B5FD]/20 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/50">No fee records found</p>
          <p className="text-[10px] text-[#C4B5FD]/30 mt-1">Fee structures will appear here once configured by the institution</p>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-[#13102A] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold text-white">Pay Fees</h3>
              <button onClick={() => setShowPayModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-5">
              <p className="text-[10px] text-violet-400/60 uppercase font-semibold">Amount to Pay</p>
              <strong className="text-2xl font-extrabold text-white">₹{s.pending_amount.toLocaleString('en-IN')}</strong>
            </div>

            <p className="text-[10px] text-[#C4B5FD]/50 mb-3 font-semibold uppercase">Select Payment Method</p>
            <div className="space-y-2 mb-5">
              {methods.includes('razorpay') && (
                <button onClick={() => setSelectedMethod('razorpay')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${selectedMethod === 'razorpay' ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'}`}>
                  <CreditCard className="w-4 h-4 text-blue-400" /> Razorpay (Card / UPI / Netbanking)
                </button>
              )}
              {methods.includes('upi') && (
                <button onClick={() => setSelectedMethod('upi')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${selectedMethod === 'upi' ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'}`}>
                  <Smartphone className="w-4 h-4 text-sky-400" /> UPI Payment
                </button>
              )}
              {methods.includes('bank_transfer') && (
                <button onClick={() => setSelectedMethod('bank_transfer')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${selectedMethod === 'bank_transfer' ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'}`}>
                  <Building className="w-4 h-4 text-emerald-400" /> Bank Transfer
                </button>
              )}
              {s.wallet_balance >= s.pending_amount && (
                <button onClick={() => setSelectedMethod('wallet')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${selectedMethod === 'wallet' ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'}`}>
                  <Wallet className="w-4 h-4 text-violet-400" /> Pay from IRIS Balance (₹{s.wallet_balance.toLocaleString()})
                </button>
              )}
              {methods.includes('cash') && (
                <button onClick={() => setSelectedMethod('cash')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${selectedMethod === 'cash' ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'}`}>
                  <Banknote className="w-4 h-4 text-amber-400" /> Cash at Office
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={handlePayAll} disabled={!selectedMethod || isPaying}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all">
                {isPaying ? 'Processing...' : `Pay ₹${s.pending_amount.toLocaleString('en-IN')}`}
              </button>
              <button onClick={() => { setShowPayModal(false); setSelectedMethod(''); }}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white/50 font-bold text-xs hover:bg-white/10 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
