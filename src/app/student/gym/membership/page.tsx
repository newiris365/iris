"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Zap, Sparkles, Check, Play, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

const MOCK_PLANS = [
  { id: 'p1', name: 'Monthly Basic', price: 599, duration_months: 1, max_sessions_per_week: 3, features: ['Gym Floor Access', 'Basic Equipment', 'Locker Room'] },
  { id: 'p2', name: 'Quarterly Prime', price: 1499, duration_months: 3, max_sessions_per_week: 5, features: ['Gym Floor Access', 'All Cardio Equipment', 'Locker Room + Shower', '1 Trainer Consultation'] },
  { id: 'p3', name: 'Annual Pro Elite', price: 4999, duration_months: 12, max_sessions_per_week: 7, features: ['24/7 Floor Access', 'All Equipment & Classes', 'Personal Locker Lock', 'Monthly Body Metrics', 'Unlimited Trainer Sessions', 'Free Kitbag'] }
];

export default function StudentGymMembership() {
  const [plans, setPlans] = useState<any[]>(MOCK_PLANS);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeFrom, setFreezeFrom] = useState('');
  const [freezeUntil, setFreezeUntil] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    loadMembershipAndPlans();
  }, []);

  const loadMembershipAndPlans = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      // Fetch plans
      const planRes = await apiGet('/fitzone/gym/membership-plans');
      if (planRes.success && planRes.plans?.length > 0) {
        setPlans(planRes.plans);
      }

      // Fetch active membership
      const membRes = await apiGet(`/fitzone/gym/memberships/${studentId}`);
      if (membRes.success && membRes.memberships?.length > 0) {
        const active = membRes.memberships.find((m: any) => m.status === 'active') || membRes.memberships[0];
        setMembership(active);
      }
    } catch (err) {
      console.log('Error loading membership data, using mock fallbacks');
      setMembership({
        id: 'memb123',
        plan: 'Annual Pro Elite',
        status: 'active',
        start_date: '2026-01-10',
        end_date: '2027-01-09',
        is_frozen: false,
        amount_paid: 4999
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: any) => {
    setSelectedPlan(plan);
    setPurchaseStatus('initiating');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      // Initiate order on backend
      const initRes = await apiPost('/fitzone/gym/memberships/purchase/initiate', {
        student_id: studentId,
        plan_id: plan.id
      });

      if (!initRes.success) {
        alert('Failed to initiate Razorpay payment: ' + initRes.error);
        setPurchaseStatus('');
        return;
      }

      // Simulation of Razorpay Payment Modal
      setPurchaseStatus('modal');
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
      setPurchaseStatus('');
    }
  };

  const simulatePaymentSuccess = async () => {
    setPurchaseStatus('verifying');
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const verifyRes = await apiPost('/fitzone/gym/memberships/purchase/verify', {
        student_id: studentId,
        plan_id: selectedPlan.id,
        razorpay_order_id: `order_sim_${Math.random().toString(36).substring(2, 9)}`,
        razorpay_payment_id: `pay_sim_${Math.random().toString(36).substring(2, 9)}`
      });

      if (verifyRes.success) {
        setPurchaseStatus('success');
        setTimeout(() => {
          setPurchaseStatus('');
          loadMembershipAndPlans();
        }, 2000);
      } else {
        alert('Payment verification failed: ' + verifyRes.error);
        setPurchaseStatus('');
      }
    } catch (err: any) {
      alert(err.message || 'Verification failed.');
      setPurchaseStatus('');
    }
  };

  const handleFreeze = async () => {
    if (!freezeFrom || !freezeUntil) return;
    try {
      const res = await apiPost(`/fitzone/gym/memberships/${membership.id}/freeze`, {
        frozen_from: freezeFrom,
        frozen_until: freezeUntil
      });
      if (res.success) {
        alert('Membership frozen successfully.');
        setShowFreezeModal(false);
        loadMembershipAndPlans();
      } else {
        alert(res.error || 'Failed to freeze membership.');
      }
    } catch (err: any) {
      alert(err.message || 'Error freezing membership.');
    }
  };

  const handleUnfreeze = async () => {
    try {
      const res = await apiPost(`/fitzone/gym/memberships/${membership.id}/unfreeze`, {});
      if (res.success) {
        alert('Membership unfrozen successfully.');
        loadMembershipAndPlans();
      } else {
        alert(res.error || 'Failed to unfreeze.');
      }
    } catch (err: any) {
      alert(err.message || 'Error unfreezing.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C2BD9]/30 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-[#A78BFA]" />
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">FitZone Membership</h1>
          </div>
          <p className="text-xs text-[#C4B5FD]/70">Access tier comparisons, billing history, and freeze privileges.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10">

        {/* 1. Active Membership Status Panel */}
        {membership && (
          <div className="glass-panel p-6 rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-tr from-[#13102A] to-[#1B1736] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#A78BFA] font-bold">Current Plan Status</span>
              <h2 className="text-xl font-extrabold text-white mt-1">{membership.plan}</h2>
              <p className="text-xs text-[#C4B5FD]/60 mt-1">Validity: {membership.start_date} to {membership.end_date}</p>
            </div>

            <div className="flex gap-3">
              {membership.is_frozen ? (
                <button
                  onClick={handleUnfreeze}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> Unfreeze Now
                </button>
              ) : (
                <button
                  onClick={() => setShowFreezeModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all"
                >
                  ❄️ Freeze Membership
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Plans & Features Grid */}
        <div>
          <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Choose A Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/50 flex flex-col justify-between hover:border-[#6C2BD9]/25 transition-all group"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-4 mb-6">
                    <span className="text-2xl font-extrabold text-white">₹{plan.price}</span>
                    <span className="text-xs text-[#C4B5FD]/50">/ {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                  </div>

                  <p className="text-xs text-[#C4B5FD]/60 mb-4">Max sessions: {plan.max_sessions_per_week} times/week</p>

                  <div className="flex flex-col gap-2.5 mb-8">
                    {plan.features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#C4B5FD]/80">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(plan)}
                  className="w-full py-3 rounded-xl bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 hover:bg-[#6C2BD9] hover:text-white text-xs font-bold text-[#A78BFA] transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Subscribe Now
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Freeze Membership Modal Overlay */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">❄️ Freeze Gym Membership</h3>
            <p className="text-xs text-[#C4B5FD]/60">Select freeze date range. Your validity end date will be extended accordingly.</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 block mb-1">Freeze From</label>
                <input
                  type="date"
                  value={freezeFrom}
                  onChange={e => setFreezeFrom(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#C4B5FD]/50 block mb-1">Freeze Until</label>
                <input
                  type="date"
                  value={freezeUntil}
                  onChange={e => setFreezeUntil(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleFreeze}
                className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] text-xs font-bold text-white shadow-lg"
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Simulated Checkout Overlay */}
      {purchaseStatus !== '' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#13102A] rounded-3xl border border-[#6C2BD9]/30 p-6 flex flex-col gap-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6C2BD9]/10 rounded-full blur-2xl" />

            {purchaseStatus === 'initiating' && (
              <div className="py-8 flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-[#A78BFA] animate-spin" />
                <p className="text-sm font-semibold">Initiating Razorpay Order...</p>
              </div>
            )}

            {purchaseStatus === 'modal' && (
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg mx-auto">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Razorpay Secure Checkout</h3>
                <p className="text-xs text-[#C4B5FD]/70">
                  Subscribe to <span className="font-extrabold text-white">{selectedPlan?.name}</span> for <span className="text-white font-extrabold">₹{selectedPlan?.price}</span>
                </p>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={simulatePaymentSuccess}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/20"
                  >
                    Simulate Payment Success
                  </button>
                  <button
                    onClick={() => setPurchaseStatus('')}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#C4B5FD]/50"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            )}

            {purchaseStatus === 'verifying' && (
              <div className="py-8 flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
                <p className="text-sm font-semibold">Verifying Signature Hash...</p>
              </div>
            )}

            {purchaseStatus === 'success' && (
              <div className="py-8 flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Payment Verified! 🎉</h3>
                  <p className="text-[11px] text-[#C4B5FD]/50 mt-1">Membership activated immediately.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </main>
  );
}
