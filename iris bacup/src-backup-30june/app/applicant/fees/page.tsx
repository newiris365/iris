"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { 
  CreditCard, CheckCircle, Clock, AlertTriangle, Printer, Download, ArrowRight, Loader2
} from 'lucide-react';

interface FeeRecord {
  id: string;
  fee_type: string; // application, confirmation, enrollment
  amount: number;
  razorpay_order_id?: string;
  transaction_id?: string;
  status: string; // pending, paid, failed
  paid_at?: string;
  receipt_url?: string;
}

export default function CandidateFeesPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [applicantId, setApplicantId] = useState<string>('');
  
  const [showPaymentModal, setShowPaymentModal] = useState<FeeRecord | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function loadFeeLedger() {
    try {
      const res = await apiGet('/admissions/application/my');
      if (res.success && res.applicant) {
        setApplicantId(res.applicant.id);
        setFees(res.applicant.admission_fees || []);
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Offline fallback mock data
      setApplicantId('b0000000-0000-0000-0000-000000009999');
      const mockFees: FeeRecord[] = [
        {
          id: 'fee-1',
          fee_type: 'application',
          amount: 1000,
          razorpay_order_id: 'order_app_9920',
          transaction_id: 'pay_app_99182902',
          status: 'paid',
          paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          receipt_url: 'https://api.iris365.in/api/v1/admissions/receipt/pay_app_99182902.pdf'
        },
        {
          id: 'fee-2',
          fee_type: 'confirmation',
          amount: 10000,
          status: 'pending'
        },
        {
          id: 'fee-3',
          fee_type: 'enrollment',
          amount: 55000,
          status: 'pending'
        }
      ];
      setFees(mockFees);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeeLedger();
  }, []);

  const handleMockPayment = async () => {
    if (!showPaymentModal) return;
    setProcessing(true);

    setTimeout(async () => {
      try {
        const orderRes = await apiPost('/admissions/fees/pay/initiate', {
          applicant_id: applicantId,
          fee_type: showPaymentModal.fee_type,
          amount: showPaymentModal.amount
        });

        if (orderRes.success) {
          const verifyRes = await apiPost('/admissions/fees/pay/verify', {
            razorpay_order_id: orderRes.order_id,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
            razorpay_signature: 'sig_mock_validation_success_2026',
            applicant_id: applicantId,
            fee_type: showPaymentModal.fee_type,
            amount: showPaymentModal.amount
          });

          if (verifyRes.success) {
            setPaymentSuccess(true);
            await loadFeeLedger();
          } else {
            throw new Error(verifyRes.error);
          }
        }
      } catch {
        // Local simulation fallback
        setPaymentSuccess(true);
        setFees(prev => prev.map(f => {
          if (f.fee_type === showPaymentModal.fee_type) {
            return {
              ...f,
              status: 'paid',
              transaction_id: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
              paid_at: new Date().toISOString()
            };
          }
          return f;
        }));
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  const printMockReceipt = (fee: FeeRecord) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Payment Receipt - IRIS admissions</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; color: #333; line-height: 1.5; }
            .receipt { border: 2px dashed #999; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .bold { font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>SIN INSTITUTE OF ENGINEERING & TECH</h2>
              <h4>ADMISSIONS GATEWAY RECEIPT</h4>
            </div>
            <div class="row"><span class="bold">Receipt ID:</span> <span>REC-${fee.transaction_id?.toUpperCase() || 'MOCK'}</span></div>
            <div class="row"><span>Transaction Date:</span> <span>${fee.paid_at ? new Date(fee.paid_at).toLocaleString() : 'N/A'}</span></div>
            <div class="row"><span>Fee Head Category:</span> <span class="bold uppercase">${fee.fee_type} Fee</span></div>
            <div class="row"><span>Razorpay Order ID:</span> <span>${fee.razorpay_order_id || 'order_mock_0028'}</span></div>
            <div class="row"><span>Transaction Status:</span> <span class="bold">PAID</span></div>
            <hr />
            <div class="row bold" style="font-size: 18px;"><span>Total Amount Paid:</span> <span>INR ${fee.amount.toLocaleString()}</span></div>
            <div class="footer">
              This is a computer-generated transaction receipt and requires no manual signature.
              <br/>© 2026 SIN Education & Technology Pvt. Ltd.
            </div>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Loading Payment Ledger...</p>
      </div>
    );
  }

  const totalPaid = fees.filter(f => f.status === 'paid').reduce((acc, f) => acc + Number(f.amount), 0);
  const totalPending = fees.filter(f => f.status === 'pending').reduce((acc, f) => acc + Number(f.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#6C2BD9]/20 pb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#A78BFA]" />
          Fee Payment Ledger
        </h1>
        <p className="text-xs text-[#C4B5FD]/70 mt-1">Review transaction summaries, settle outstanding dues, and export print receipts.</p>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 tracking-wider">Total Fees Settled</span>
          <span className="text-3xl font-mono font-black text-emerald-400 mt-2">₹{totalPaid.toLocaleString()}</span>
        </div>
        <div className="p-6 rounded-3xl border border-white/5 bg-[#13102A]/40 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-[#C4B5FD]/40 tracking-wider">Pending Outstanding Dues</span>
          <span className="text-3xl font-mono font-black text-amber-400 mt-2">₹{totalPending.toLocaleString()}</span>
        </div>
      </div>

      {/* Ledgers list */}
      <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white mb-4">Fee Structure Installments</h3>
        
        <div className="space-y-3">
          {fees.map((fee) => (
            <div 
              key={fee.id} 
              className="p-5 rounded-2xl bg-[#0D0A1A]/60 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#6C2BD9]/20 transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-[#A78BFA] text-[9px] font-mono uppercase font-bold">
                  {fee.fee_type}
                </span>
                <h4 className="text-sm font-bold text-white mt-1 capitalize">{fee.fee_type} Fee Installment</h4>
                <p className="text-[10px] text-[#C4B5FD]/40 font-mono">
                  {fee.status === 'paid' && fee.paid_at 
                    ? `Paid on ${new Date(fee.paid_at).toLocaleString()} | TXN: ${fee.transaction_id}` 
                    : 'Awaiting payment verification'}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-base font-mono font-bold text-white">
                  ₹{Number(fee.amount).toLocaleString()}
                </span>

                <div className="flex gap-2">
                  {fee.status === 'paid' ? (
                    <button
                      onClick={() => printMockReceipt(fee)}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#C4B5FD] hover:text-white transition-all text-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Receipt
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowPaymentModal(fee); setPaymentSuccess(false); }}
                      className="py-2 px-4 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                    >
                      Pay Now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6]" />
            
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">Razorpay Secure Sandbox</span>
              <h3 className="font-heading font-extrabold text-xl text-white">Admissions Transaction Payment</h3>
            </div>

            {paymentSuccess ? (
              <div className="text-center space-y-4 py-4 animate-fade-in">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-white text-base">Payment Processed Successfully!</h4>
                  <p className="text-xs text-[#C4B5FD]/70 mt-1">
                    Your fee installment has been fully cleared. A receipt has been issued under your transaction logs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(null); setPaymentSuccess(false); loadFeeLedger(); }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold transition-all"
                >
                  Return to Ledger
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-[#0D0A1A] border border-white/5 text-xs space-y-3 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/50">Merchant Name:</span>
                    <span className="text-white">SIET ADMISSIONS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/50">Installment Category:</span>
                    <span className="text-white capitalize">{showPaymentModal.fee_type} Fee</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/5 text-[#A78BFA]">
                    <span>Amount Due:</span>
                    <span>INR {Number(showPaymentModal.amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleMockPayment}
                    disabled={processing}
                    className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Pay Securely</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
