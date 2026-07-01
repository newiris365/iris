"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, CheckCircle, Clock, AlertTriangle, IndianRupee, Tag } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StudentFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingFee, setPayingFee] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiGet(`/hostel/fees?studentId=${studentId}`);
      if (res.success) {
        setFees(res.fees || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock data fallbacks
      setFees([
        {
          id: 'f1',
          month: '2026-06-01',
          amount: 6500,
          penalty: 0,
          due_date: '2026-06-15',
          payment_status: 'pending',
          paid_date: null,
          transaction_id: null
        },
        {
          id: 'f2',
          month: '2026-05-01',
          amount: 6500,
          penalty: 150,
          due_date: '2026-05-15',
          payment_status: 'paid',
          paid_date: '2026-05-18T10:30:00Z',
          transaction_id: 'TXN-RAZOR-927184'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySimulate = async () => {
    if (!payingFee) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const txnId = 'TXN-RAZOR-' + Math.floor(Math.random() * 900000 + 100000);
      const res = await apiPost('/hostel/fees/pay', {
        fee_id: payingFee.id,
        transaction_id: txnId
      });

      if (res.success) {
        setSuccessMsg(`Payment of ₹${payingFee.amount + payingFee.penalty} successful! Transaction ID: ${txnId}`);
        setPayingFee(null);
        loadFees();
      } else {
        setErrorMsg(res.error || 'Payment transaction failed.');
      }
    } catch {
      // Mock flow
      const txnId = 'TXN-RAZOR-' + Math.floor(Math.random() * 900000 + 100000);
      setFees(
        fees.map(f =>
          f.id === payingFee.id
            ? { ...f, payment_status: 'paid', paid_date: new Date().toISOString(), transaction_id: txnId }
            : f
        )
      );
      setSuccessMsg(`Payment of ₹${payingFee.amount + payingFee.penalty} successful! (Mock Mode) Transaction ID: ${txnId}`);
      setPayingFee(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const getMonthName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hostel" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Rents & Fees Ledger</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Monitor monthly room rent, penalties, and transactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-6">
            {errorMsg}
          </div>
        )}

        {/* Payment Confirmation Modal Overlay */}
        {payingFee && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <h3 className="text-lg font-bold text-white">Confirm Rent Payment</h3>
              
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#C4B5FD]/50">Month</span>
                  <span className="font-bold text-white">{getMonthName(payingFee.month)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#C4B5FD]/50">Base Rent</span>
                  <span className="font-bold text-white">₹{payingFee.amount}</span>
                </div>
                {payingFee.penalty > 0 && (
                  <div className="flex justify-between text-xs text-red-400">
                    <span>Late Fine/Penalty</span>
                    <span>+ ₹{payingFee.penalty}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-3 flex justify-between text-sm font-extrabold">
                  <span className="text-white">Total Amount</span>
                  <span className="text-emerald-400">₹{payingFee.amount + payingFee.penalty}</span>
                </div>
              </div>

              <div className="text-[10px] text-[#C4B5FD]/40 leading-relaxed">
                By completing this checkout, you will simulate a Razorpay transaction gateway capture and receive an instant fee status clearance.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPayingFee(null)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaySimulate}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#6C2BD9]/30"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" /> Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fees.length === 0 ? (
            <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
              No bills found in your fee register.
            </div>
          ) : (
            fees.map((fee) => (
              <div key={fee.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 space-y-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{getMonthName(fee.month)}</h3>
                    {fee.payment_status === 'pending' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                        <CheckCircle className="w-2.5 h-2.5" /> Settled
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/50">
                    Due Date: {new Date(fee.due_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-xs">
                    <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">Rent Amount</p>
                    <p className="font-extrabold text-white mt-0.5 flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3 text-[#A78BFA]" />
                      <span>{fee.amount}</span>
                    </p>
                  </div>

                  {fee.penalty > 0 && (
                    <div className="text-xs">
                      <p className="text-red-400/50 uppercase tracking-wider text-[9px] font-bold">Penalty</p>
                      <p className="font-bold text-red-400 mt-0.5 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>+{fee.penalty}</span>
                      </p>
                    </div>
                  )}

                  {fee.payment_status === 'paid' ? (
                    <div className="text-xs font-mono text-left md:text-right">
                      <p className="text-[#C4B5FD]/40 uppercase font-sans tracking-wider text-[9px] font-bold">Paid details</p>
                      <p className="text-[10px] text-[#C4B5FD]/80 mt-0.5">{fee.transaction_id}</p>
                      <p className="text-[9px] text-[#C4B5FD]/40">{new Date(fee.paid_date).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPayingFee(fee)}
                      className="px-4 py-2 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md shadow-[#6C2BD9]/25 flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Pay Rent
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
