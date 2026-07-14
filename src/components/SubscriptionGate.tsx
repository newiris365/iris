"use client";

import React, { useState, useEffect } from 'react';
import { Lock, CreditCard, CheckCircle, Loader2, Home, Bus, Dumbbell } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';

interface PricingPlan {
  id: string;
  service_type: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
}

interface SubscriptionGateProps {
  serviceType: 'hostel' | 'transit' | 'gym';
  institutionId: string;
  studentId: string;
  children: React.ReactNode;
}

const SERVICE_ICONS: Record<string, any> = {
  hostel: Home,
  transit: Bus,
  gym: Dumbbell,
};

const SERVICE_COLORS: Record<string, string> = {
  hostel: '#6C2BD9',
  transit: '#10B981',
  gym: '#F59E0B',
};

export default function SubscriptionGate({ serviceType, institutionId, studentId, children }: SubscriptionGateProps) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');

  const Icon = SERVICE_ICONS[serviceType] || Home;
  const accentColor = SERVICE_COLORS[serviceType] || '#6C2BD9';

  useEffect(() => {
    checkSubscription();
  }, [studentId, serviceType]);

  const checkSubscription = async () => {
    if (!studentId) { setLoading(false); return; }
    try {
      const res = await apiGet(`/service-subscriptions/status/${studentId}`, { service_type: serviceType });
      if (res.success) {
        const hasSub = serviceType === 'hostel' ? res.has_hostel :
                       serviceType === 'transit' ? res.has_transit : res.has_gym;
        setHasSubscription(hasSub);
        if (hasSub && res.subscriptions?.[serviceType]) {
          setExpiryDate(res.subscriptions[serviceType].end_date);
        }
      } else {
        setHasSubscription(false);
      }
    } catch {
      setHasSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await apiGet(`/service-subscriptions/pricing/${institutionId}`, { service_type: serviceType });
      if (res.success && res.pricing?.length > 0) {
        setPlans(res.pricing);
        setSelectedPlan(res.pricing[0]);
      }
    } catch {}
  };

  const handleBuy = async () => {
    if (!selectedPlan) return;
    setPaying(true);
    try {
      const initRes = await apiPost('/service-subscriptions/initiate', {
        student_id: studentId,
        pricing_id: selectedPlan.id,
      });

      if (!initRes.success) throw new Error(initRes.error || 'Failed to initiate payment.');

      // Razorpay checkout
      if (initRes.order_id && !initRes.order_id.startsWith('order_mock_') && initRes.key_id && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: initRes.key_id,
          amount: initRes.amount,
          currency: initRes.currency || 'INR',
          name: 'IRIS 365',
          description: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Subscription: ${selectedPlan.name}`,
          order_id: initRes.order_id,
          handler: async (response: any) => {
            try {
              const verifyRes = await apiPost('/service-subscriptions/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                student_id: studentId,
                pricing_id: selectedPlan.id,
              });
              if (verifyRes.success) {
                setPaySuccess(true);
                setTimeout(() => {
                  setShowPayment(false);
                  setPaySuccess(false);
                  setHasSubscription(true);
                  setExpiryDate(verifyRes.end_date);
                }, 1500);
              } else {
                alert(verifyRes.error || 'Verification failed');
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Verification failed';
              alert(msg);
            } finally { setPaying(false); }
          },
          theme: { color: accentColor }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setPaying(false);
      } else {
        // Mock sandbox
        alert(`Razorpay Simulator:\nOrder: ${initRes.order_id}\nAmount: ₹${initRes.amount / 100}\nClick OK to confirm.`);
        const verifyRes = await apiPost('/service-subscriptions/verify', {
          razorpay_order_id: initRes.order_id,
          razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 12),
          razorpay_signature: 'sig_mock',
          student_id: studentId,
          pricing_id: selectedPlan.id,
        });
        if (verifyRes.success) {
          setPaySuccess(true);
          setTimeout(() => {
            setShowPayment(false);
            setPaySuccess(false);
            setHasSubscription(true);
            setExpiryDate(verifyRes.end_date);
          }, 1500);
        } else {
          throw new Error(verifyRes.error || 'Verification failed');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed';
      alert(msg);
    } finally { setPaying(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasSubscription) {
    return <>{children}</>;
  }

  // Not subscribed — show purchase UI
  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/20 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</h1>
              <p className="text-sm text-[#C4B5FD]/70">Subscription Required</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Lock Banner */}
        <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center bg-[#13102A]/30 mb-8">
          <Lock className="w-12 h-12 text-[#A78BFA] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white">Access Requires Subscription</h2>
          <p className="text-xs text-[#C4B5FD]/60 mt-2 max-w-md mx-auto">
            You need an active {serviceType} subscription to access this module. Choose a plan below to get started.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA] mx-auto" />
            <p className="text-xs text-[#C4B5FD]/50 mt-2">Loading available plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => { setSelectedPlan(plan); setShowPayment(true); }}
                  className={`text-left p-5 rounded-3xl border transition-all ${
                    isSelected
                      ? 'border-[#6C2BD9] bg-[#1A1538] shadow-lg shadow-[#6C2BD9]/10'
                      : 'border-white/5 bg-[#13102A]/60 hover:bg-[#13102A] hover:border-white/10'
                  }`}
                >
                  <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-[10px] text-[#C4B5FD]/50 mt-1">{plan.description}</p>
                  )}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-emerald-400">₹{plan.price.toLocaleString()}</span>
                    <span className="text-[10px] text-[#C4B5FD]/40">/ {plan.duration_days} days</span>
                  </div>
                  {plan.features?.length > 0 && (
                    <ul className="mt-4 space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-[10px] text-[#C4B5FD]/60 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white text-center flex items-center justify-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Subscribe Now
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/5 bg-[#13102A] p-6 shadow-2xl space-y-6">
            {paySuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Payment Successful!</h3>
                <p className="text-xs text-[#C4B5FD]/60 mt-1">Your subscription is now active.</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Razorpay Secure Checkout</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">IRIS 365 Payment Gateway</p>
                </div>

                <div className="space-y-3 text-xs border-y border-white/5 py-4">
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/50">Plan</span>
                    <span className="font-bold text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/50">Duration</span>
                    <span className="font-bold text-white">{selectedPlan.duration_days} days</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-[#C4B5FD]/50">Total</span>
                    <span className="font-extrabold text-emerald-400 text-base">₹{selectedPlan.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowPayment(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all">
                    Cancel
                  </button>
                  <button onClick={handleBuy} disabled={paying} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex justify-center items-center gap-1.5">
                    {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ₹${selectedPlan.price.toLocaleString()}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
