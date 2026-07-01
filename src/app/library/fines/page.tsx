"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, CheckCircle, Clock, AlertTriangle, IndianRupee } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';

export default function StudentFinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingFine, setPayingFine] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const res = await apiGet(`/library/fines/${studentId}`);
      if (res.success) {
        setFines(res.fines || []);
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Mock Fallbacks
      setFines([
        {
          id: 'f1',
          amount: 50,
          reason: 'Overdue book fine (5 days)',
          status: 'unpaid',
          payment_date: null,
          book_issues: {
            book_id: 'b1',
            books: { title: 'Introduction to Algorithms' }
          }
        },
        {
          id: 'f2',
          amount: 150,
          reason: 'Cover page torn damage fee',
          status: 'paid',
          payment_date: '2026-05-20',
          payment_method: 'wallet',
          transaction_id: 'TXN-LIB-827163',
          book_issues: {
            book_id: 'b2',
            books: { title: 'Design Patterns' }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySimulate = async () => {
    if (!payingFine) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const txnId = 'TXN-LIB-' + Math.floor(Math.random() * 900000 + 100000);
      const res = await apiPost(`/library/fines/${payingFine.id}/pay`, {
        payment_method: 'wallet',
        transaction_id: txnId
      });

      if (res.success) {
        setSuccessMsg(`Payment of ₹${payingFine.amount} successful via Campus Wallet! Transaction ID: ${txnId}`);
        setPayingFine(null);
        loadFines();
      } else {
        setErrorMsg(res.error || 'Payment failed.');
      }
    } catch {
      // Mock Success
      const txnId = 'TXN-LIB-' + Math.floor(Math.random() * 900000 + 100000);
      setFines(
        fines.map(f =>
          f.id === payingFine.id
            ? { ...f, status: 'paid', payment_date: new Date().toISOString().split('T')[0], payment_method: 'wallet', transaction_id: txnId }
            : f
        )
      );
      setSuccessMsg(`Payment of ₹${payingFine.amount} successful! (Mock Mode) Transaction ID: ${txnId}`);
      setPayingFine(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/library" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-xl">Fines & Penalties Ledger</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Monitor overdue penalties, damage logs, and complete transactions</p>
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

        {/* Pay simulation modal */}
        {payingFine && (
          <div className="fixed inset-0 bg-[#0D0A1A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-3xl border border-white/10 bg-[#13102A] p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
              <h3 className="text-lg font-bold text-white">Confirm Fine Payment</h3>
              
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#C4B5FD]/50">Reason</span>
                  <span className="font-bold text-white text-right max-w-[60%]">{payingFine.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C4B5FD]/50">Book</span>
                  <span className="font-bold text-white text-right max-w-[60%]">{payingFine.book_issues?.books?.title}</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex justify-between text-sm font-extrabold">
                  <span className="text-white">Fine Amount</span>
                  <span className="text-red-400">₹{payingFine.amount}</span>
                </div>
              </div>

              <div className="text-[10px] text-[#C4B5FD]/40 leading-relaxed text-center">
                Completing this simulates a deduction from your pre-loaded IRIS Campus Wallet card balance.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPayingFine(null)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaySimulate}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" /> Pay via Wallet
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
              <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fines.length === 0 ? (
            <div className="text-center py-20 text-[#C4B5FD]/30 text-xs">
              No library fines recorded on your ledger.
            </div>
          ) : (
            fines.map(fine => (
              <div key={fine.id} className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{fine.reason}</h3>
                    {fine.status === 'unpaid' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase">
                        Unpaid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/50">
                    Book: <span className="font-semibold text-[#A78BFA]">{fine.book_issues?.books?.title}</span>
                  </p>
                  {fine.status === 'paid' && (
                    <p className="text-[10px] text-[#C4B5FD]/40 font-mono">
                      TXN: {fine.transaction_id} • Paid: {new Date(fine.payment_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end">
                  <div className="text-xs">
                    <p className="text-[#C4B5FD]/40 uppercase tracking-wider text-[9px] font-bold">Fine Amount</p>
                    <p className="font-extrabold text-white mt-0.5 flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3 text-red-400" />
                      <span>{fine.amount}</span>
                    </p>
                  </div>

                  {fine.status === 'unpaid' ? (
                    <button
                      onClick={() => setPayingFine(fine)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Pay Fine
                    </button>
                  ) : (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Settled
                    </span>
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
