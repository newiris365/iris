"use client";

import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { 
  Award, Download, CheckCircle, XCircle, Clock, AlertCircle, ShieldCheck, Loader2
} from 'lucide-react';

interface OfferRecord {
  id: string;
  applicant_id: string;
  program_id: string;
  offer_letter_url: string;
  offered_at: string;
  expires_at: string;
  status: string; // sent, accepted, rejected, expired
  programs?: {
    name: string;
    code: string;
  };
}

export default function CandidateOfferPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [applicantId, setApplicantId] = useState<string>('');
  const [applicantStatus, setApplicantStatus] = useState<string>('');
  const [offer, setOffer] = useState<OfferRecord | null>(null);
  
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function loadOfferDetails() {
    try {
      const res = await apiGet('/admissions/application/my');
      if (res.success && res.applicant) {
        setApplicantId(res.applicant.id);
        setApplicantStatus(res.applicant.status);
        
        // Find latest offer if available
        const offers = res.applicant.admission_offers || [];
        if (offers.length > 0) {
          setOffer(offers[0]);
        }
      } else {
        throw new Error(res.error);
      }
    } catch {
      // Offline fallback mock data
      setApplicantId('b0000000-0000-0000-0000-000000009999');
      setApplicantStatus('offered'); // Simulate offered state
      
      const mockOffer: OfferRecord = {
        id: 'offer-1111-2222-3333-4444',
        applicant_id: 'b0000000-0000-0000-0000-000000009999',
        program_id: 'a1111111-1111-1111-1111-111111111111',
        offer_letter_url: 'https://api.iris365.in/assets/provisional_offer_letter.pdf',
        offered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent',
        programs: {
          name: 'Bachelor of Technology in Computer Science (B.Tech CSE)',
          code: 'BTECH-CSE'
        }
      };
      setOffer(mockOffer);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOfferDetails();
  }, []);

  const handleAccept = async () => {
    if (!offer) return;
    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiPost(`/admissions/offers/${offer.id}/accept`, {});
      if (res.success) {
        setSuccess(res.message || 'Offer accepted! Please complete seat confirmation fee.');
        // Show payment modal
        setShowPaymentModal(true);
        await loadOfferDetails();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      console.warn('Backend connection failed. Simulating local accept.');
      // Local fallback
      setOffer(prev => prev ? { ...prev, status: 'accepted' } : null);
      setSuccess('Offer accepted in mock sandbox environment.');
      setShowPaymentModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await apiPost(`/admissions/offers/${offer.id}/decline`, { reason: declineReason });
      if (res.success) {
        setSuccess('You have declined the offer. Your seat has been released.');
        setShowDeclineModal(false);
        await loadOfferDetails();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      console.warn('Backend connection failed. Simulating local decline.');
      setOffer(prev => prev ? { ...prev, status: 'rejected' } : null);
      setApplicantStatus('withdrawn');
      setShowDeclineModal(false);
      setSuccess('Offer declined locally in sandbox mode.');
    } finally {
      setProcessing(false);
    }
  };

  const handleMockPayment = async () => {
    if (!offer) return;
    setProcessing(true);
    
    // Simulate Razorpay payment gate
    setTimeout(async () => {
      try {
        const orderRes = await apiPost('/admissions/fees/pay/initiate', {
          applicant_id: applicantId,
          fee_type: 'confirmation',
          amount: 10000
        });

        if (orderRes.success) {
          const verifyRes = await apiPost('/admissions/fees/pay/verify', {
            razorpay_order_id: orderRes.order_id,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
            razorpay_signature: 'sig_mock_validation_success_2026',
            applicant_id: applicantId,
            fee_type: 'confirmation',
            amount: 10000
          });

          if (verifyRes.success) {
            setPaymentSuccess(true);
            setApplicantStatus('admitted');
            if (offer) {
              setOffer({ ...offer, status: 'accepted' });
            }
          } else {
            throw new Error(verifyRes.error);
          }
        }
      } catch {
        // Local simulation fallback
        setPaymentSuccess(true);
        setApplicantStatus('admitted');
        if (offer) {
          setOffer({ ...offer, status: 'accepted' });
        }
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6C2BD9]/30 border-t-[#6C2BD9] animate-spin"></div>
        <p className="text-sm text-[#C4B5FD]/70 font-mono">Checking Seat Allocation Status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#6C2BD9]/20 pb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-[#A78BFA]" />
          Admissions Offer Letter desk
        </h1>
        <p className="text-xs text-[#C4B5FD]/70 mt-1">Accept extended offers, download official letters, and secure seat confirmation.</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 animate-pulse" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" /> {error}
        </div>
      )}

      {/* Main offer details */}
      {!offer ? (
        <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-10 text-center space-y-6 max-w-xl mx-auto">
          <Clock className="w-12 h-12 text-[#A78BFA]/50 mx-auto animate-pulse" />
          <h3 className="font-bold text-white text-lg">Under Evaluation / Merit Waitlist</h3>
          <p className="text-xs text-[#C4B5FD]/70 leading-relaxed">
            Your admission application is currently under evaluation by the review desk. Provisional offer letters are extended dynamically following the publication of each merit round cutoff.
          </p>
          <div className="p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5 text-xs text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold block">Current Pipeline Status</span>
              <span className="text-[10px] text-[#C4B5FD]/50">Your active registration status is **{applicantStatus}**. We will update this tab as soon as seats are released.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Card */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Offer Letter Box */}
            <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-tr from-[#13102A]/90 to-[#22174C]/60 p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                    Offer Extended
                  </span>
                  <span className="block text-xs text-[#C4B5FD]/40 mt-3 font-mono">OFFER ID: {offer.id.substring(0, 13).toUpperCase()}...</span>
                </div>
                {offer.status === 'accepted' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> ACCEPTED
                  </span>
                )}
                {offer.status === 'rejected' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-400">
                    <XCircle className="w-4 h-4" /> DECLINED
                  </span>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-white mt-6">
                Provisional Offer of Admission
              </h2>
              <p className="text-xs text-[#C4B5FD]/70 mt-2 leading-relaxed">
                Congratulations! You have been provisionally selected for enrollment in the following course for the upcoming academic cycle.
              </p>

              <div className="mt-6 p-5 rounded-2xl bg-[#0D0A1A]/70 border border-white/5 space-y-3">
                <div className="flex justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-[#C4B5FD]/50">Offered Program:</span>
                  <span className="text-white font-bold">{offer.programs?.name}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-[#C4B5FD]/50">Program Code:</span>
                  <span className="text-white font-mono font-bold text-indigo-400">{offer.programs?.code}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-[#C4B5FD]/50">Issue Date:</span>
                  <span className="text-white font-semibold">{new Date(offer.offered_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-xs text-rose-400 font-semibold">
                  <span>Expiration Date:</span>
                  <span>{new Date(offer.expires_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action buttons */}
              {offer.status === 'sent' && (
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => setShowDeclineModal(true)}
                    className="py-3.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white hover:text-red-400 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    Decline Offer
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="py-3.5 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-[#6C2BD9]/20 flex items-center justify-center gap-1.5"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept & Proceed'}
                  </button>
                </div>
              )}

              {offer.status === 'accepted' && applicantStatus !== 'admitted' && (
                <div className="mt-8">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    Pay Seat Confirmation Fee (₹10,000)
                  </button>
                </div>
              )}

              {applicantStatus === 'admitted' && (
                <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-center font-bold text-emerald-400">
                  🎉 Congratulations! Your admission registration is fully verified and confirmed.
                </div>
              )}
            </div>
          </div>

          {/* Right Download / instructions */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-6">
              <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider">Downloads</h4>
              
              <a
                href={offer.offer_letter_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#A78BFA]" />
                Provisional Offer Letter
              </a>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-400" /> Instructions</h4>
              <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
                Acceptance of provisional offer is only verified once the **seat confirmation fee** has been processed successfully. Failure to complete fee payment before the expiration deadline results in automated offer revocation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleDecline} className="w-full max-w-sm bg-[#13102A] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-white">Decline Admission Offer</h3>
            <p className="text-xs text-[#C4B5FD]/70 leading-relaxed">
              Declining this offer will instantly release your seat to waitlisted candidates. This operation is **irreversible**.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#C4B5FD]/60">Reason for declining (Optional)</label>
              <textarea
                required
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Selected elsewhere / Financial reasons"
                rows={3}
                className="w-full bg-white/5 border border-white/10 py-2 px-3 rounded-xl text-xs text-white outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="w-1/2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20"
              >
                {processing ? 'Declining...' : 'Decline Seat'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Razorpay Mock Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6]" />
            
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA] font-bold">Razorpay Secure Sandbox</span>
              <h3 className="font-heading font-extrabold text-xl text-white">Admission Confirmation Billing</h3>
            </div>

            {paymentSuccess ? (
              <div className="text-center space-y-4 py-4 animate-fade-in">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-white text-base">Seat Secured Successfully!</h4>
                  <p className="text-xs text-[#C4B5FD]/70 mt-1">
                    Your confirmation fee has been registered and verified. Welcome to SIN Institute!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowPaymentModal(false); setPaymentSuccess(false); loadOfferDetails(); }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold transition-all"
                >
                  Return to Dashboard
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
                    <span className="text-[#C4B5FD]/50">Transaction Type:</span>
                    <span className="text-white">Confirmation Deposit</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/5 text-[#A78BFA]">
                    <span>Amount Due:</span>
                    <span>INR 10,000.00</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-xs transition-all"
                  >
                    Cancel Payment
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
                      <span>Proceed to Pay</span>
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
