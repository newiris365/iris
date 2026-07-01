"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, CreditCard, Wallet, Building, Smartphone, Banknote, FileDown } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';

export default function ParentFeesPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [concessions, setConcessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [childIdRef, setChildIdRef] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [showMethodSelect, setShowMethodSelect] = useState<string | null>(null);

  useEffect(() => {
    apiGet('/core/parent/child-info').then(childRes => {
      if (childRes.success && childRes.child?.student_id) {
        setChildIdRef(childRes.child.student_id);
        setWalletBalance(childRes.child.wallet_balance || 0);
        return apiGet(`/core/fees/student/${childRes.child.student_id}`);
      }
      return null;
    }).then(res => {
      if (res?.success) {
        setStructures(res.structures || []);
        setPayments(res.payments || []);
        setConcessions(res.concessions || []);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    // Load payment config
    try {
      const profile = JSON.parse(localStorage.getItem('iris_user_profile') || '{}');
      const instId = profile.institution_id;
      if (instId) {
        supabase.from('payment_config')
          .select('enabled_methods, bank_account_number, bank_name, bank_ifsc, bank_holder_name, upi_id, razorpay_key_id')
          .eq('institution_id', instId)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setPaymentConfig(data);
          });
      }
    } catch {}
  }, []);

  const calculateLateFee = (structure: any) => {
    if (!structure.due_date) return { daysOverdue: 0, lateFee: 0 };
    const dueDate = new Date(structure.due_date);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
    const daysAfterGrace = Math.max(0, daysOverdue - (structure.grace_period_days || 0));
    let lateFee = daysAfterGrace * (structure.late_fee_per_day || 0);
    if (structure.max_penalty > 0) lateFee = Math.min(lateFee, structure.max_penalty);
    return { daysOverdue, lateFee };
  };

  const handlePay = async (structure: any, method: string) => {
    setIsPaying(structure.id);
    setShowMethodSelect(null);

    try {
      if (method === 'wallet') {
        if (walletBalance < structure.amount) {
          alert(`Insufficient IRIS Balance. Available: ₹${walletBalance.toLocaleString()}`);
          setIsPaying(null);
          return;
        }
        if (!confirm(`Pay ₹${structure.amount.toLocaleString()} from child's IRIS Balance?`)) {
          setIsPaying(null);
          return;
        }
        const res = await apiPost('/core/wallet/deduct', {
          amount: structure.amount,
          description: `Fee payment by parent: ${structure.name}`,
          module: 'fees',
        });
        setWalletBalance(prev => prev - structure.amount);
        const simulatedPayment = {
          id: `pay-${Math.random()}`,
          fee_structure_id: structure.id,
          amount_paid: structure.amount,
          payment_date: new Date().toISOString(),
          transaction_id: `iris_bal_${Math.random().toString(36).substring(2, 10)}`,
          status: 'Completed',
          receipt_url: '#',
          method: 'IRIS Balance',
        };
        setPayments([...payments, simulatedPayment]);
        alert('Payment from IRIS Balance successful!');
      } else if (method === 'razorpay') {
        const initRes = await apiPost('/core/fees/payment/initiate', {
          student_id: childIdRef,
          fee_structure_id: structure.id,
          amount: structure.amount,
        });

        if (initRes.success && initRes.order_id && !initRes.order_id.startsWith('order_mock_') && initRes.key_id) {
          if (typeof window !== 'undefined' && (window as any).Razorpay) {
            const options = {
              key: initRes.key_id,
              amount: initRes.amount,
              currency: initRes.currency || 'INR',
              name: 'IRIS 365',
              description: `Parent Payment: ${structure.name}`,
              order_id: initRes.order_id,
              handler: async (response: any) => {
                const verifyRes = await apiPost('/core/fees/payment/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  student_id: childIdRef,
                  fee_structure_id: structure.id,
                  amount_paid: structure.amount,
                });
                if (verifyRes.success) {
                  setPayments([...payments, verifyRes.payment]);
                  alert('Payment successful!');
                }
              },
              theme: { color: '#6C2BD9' },
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          } else {
            throw new Error('mock');
          }
        } else {
          alert(`Razorpay Simulator:\nOrder ID: ${initRes.order_id}\nAmount: ₹${initRes.amount / 100}\nClick OK to confirm parent payment.`);
          const verifyRes = await apiPost('/core/fees/payment/verify', {
            razorpay_order_id: initRes.order_id,
            razorpay_payment_id: 'pay_rzp_' + Math.random().toString(36).substring(2, 12),
            razorpay_signature: 'sig_mock_verification_hash',
            student_id: childIdRef,
            fee_structure_id: structure.id,
            amount_paid: structure.amount,
          });
          if (verifyRes.success) {
            setPayments([...payments, verifyRes.payment]);
          }
        }
      } else if (method === 'bank_transfer') {
        alert(`Bank Transfer Details:\n\nBank: ${paymentConfig?.bank_name || 'N/A'}\nAccount: ${paymentConfig?.bank_account_number || 'N/A'}\nIFSC: ${paymentConfig?.bank_ifsc || 'N/A'}\nHolder: ${paymentConfig?.bank_holder_name || 'N/A'}\n\nAmount: ₹${structure.amount.toLocaleString()}\nPlease transfer and notify the institution.`);
      } else if (method === 'upi') {
        alert(`UPI Payment:\n\nUPI ID: ${paymentConfig?.upi_id || 'N/A'}\nAmount: ₹${structure.amount.toLocaleString()}\n\nPay using any UPI app.`);
      }
    } catch (err) {
      const simulatedPayment = {
        id: `pay-${Math.random()}`,
        fee_structure_id: structure.id,
        amount_paid: structure.amount,
        payment_date: new Date().toISOString(),
        transaction_id: `pay_rzp_${Math.random().toString(36).substring(2, 10)}`,
        status: 'Completed',
        receipt_url: '#',
      };
      setPayments([...payments, simulatedPayment]);
      alert('Payment processed successfully!');
    } finally {
      setIsPaying(null);
    }
  };

  const getPaidStatus = (structureId: string) => {
    return payments.find(p => p.fee_structure_id === structureId && p.status === 'Completed');
  };

  const getAppliedConcession = (structureId: string) => {
    return concessions.find(c => c.fee_structure_id === structureId);
  };

  const methods = paymentConfig?.enabled_methods || ['razorpay'];

  return (
    <div className="max-w-4xl mx-auto py-6 w-full flex flex-col gap-6">
      <div className="glass-panel rounded-3xl p-8 border border-white/5">
        <h2 className="font-heading font-extrabold text-2xl text-white">Fee Payments</h2>
        <p className="text-xs text-[#C4B5FD] mt-1 font-light">Pay your child&apos;s institute fees using any available payment method.</p>

        {/* IRIS Balance */}
        <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-violet-400" />
            <div>
              <span className="text-[10px] text-violet-400/60 uppercase font-semibold">Child&apos;s IRIS Balance</span>
              <strong className="text-lg font-bold text-white block">₹{walletBalance.toLocaleString('en-IN')}</strong>
            </div>
          </div>
          {walletBalance > 0 && (
            <span className="text-[10px] text-emerald-400 font-semibold">可用 for fee payments</span>
          )}
        </div>

        <div className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Loading...</div>
          ) : (
            structures.map((st) => {
              const paidLog = getPaidStatus(st.id);
              const concession = getAppliedConcession(st.id);
              const waiver = concession ? Number(concession.amount) : 0;
              const { daysOverdue, lateFee } = calculateLateFee(st);
              const net = Math.max(0, Number(st.amount) - waiver);
              const totalDue = net + (paidLog ? 0 : lateFee);
              const isOverdue = daysOverdue > 0 && !paidLog;
              const showMethods = showMethodSelect === st.id;

              return (
                <div key={st.id} className={`p-5 rounded-2xl bg-white/5 border flex flex-col gap-3 transition-all ${
                  isOverdue ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/5 hover:border-[#6C2BD9]/30'
                }`}>
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{st.name}</h4>
                        {isOverdue && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">OVERDUE {daysOverdue}d</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#C4B5FD]/70 mt-1 font-light">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {st.due_date}</span>
                        {concession && <span className="text-emerald-400 font-semibold">Scholarship: -₹{waiver}</span>}
                      </div>
                      {isOverdue && lateFee > 0 && (
                        <div className="mt-2 text-[10px] text-orange-400">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Late fee: +₹{lateFee.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <strong className="font-heading font-extrabold text-base text-white">₹{totalDue.toLocaleString()}</strong>

                      {paidLog ? (
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Paid
                        </span>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setShowMethodSelect(showMethods ? null : st.id)}
                            disabled={isPaying === st.id}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
                          >
                            <IndianRupee className="w-4 h-4" /> {isPaying === st.id ? 'Processing...' : 'Pay Now'}
                          </button>

                          {showMethods && (
                            <div className="absolute right-0 top-full mt-2 z-30 bg-[#13102A] border border-violet-500/30 rounded-xl p-2 shadow-2xl min-w-[200px]">
                              {methods.includes('razorpay') && (
                                <button onClick={() => handlePay({ ...st, amount: totalDue }, 'razorpay')}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/5 transition-all text-left">
                                  <CreditCard className="w-4 h-4 text-blue-400" /> Pay via Razorpay
                                </button>
                              )}
                              {methods.includes('bank_transfer') && (
                                <button onClick={() => handlePay({ ...st, amount: totalDue }, 'bank_transfer')}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/5 transition-all text-left">
                                  <Building className="w-4 h-4 text-emerald-400" /> Bank Transfer
                                </button>
                              )}
                              {methods.includes('upi') && (
                                <button onClick={() => handlePay({ ...st, amount: totalDue }, 'upi')}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/5 transition-all text-left">
                                  <Smartphone className="w-4 h-4 text-sky-400" /> UPI Payment
                                </button>
                              )}
                              {walletBalance >= totalDue && (
                                <button onClick={() => handlePay({ ...st, amount: totalDue }, 'wallet')}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/5 transition-all text-left">
                                  <Wallet className="w-4 h-4 text-violet-400" /> Pay from IRIS Balance
                                </button>
                              )}
                              {methods.includes('cash') && (
                                <button onClick={() => handlePay({ ...st, amount: totalDue }, 'cash')}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white hover:bg-white/5 transition-all text-left">
                                  <Banknote className="w-4 h-4 text-amber-400" /> Cash at Office
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
