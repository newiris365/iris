"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, ShieldAlert, Award, FileText, CheckCircle, RefreshCcw, Trash2 } from 'lucide-react';
import { apiGet, apiDelete } from '../../../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BusDriver {
  name: string;
  phone: string;
}

interface BusInfo {
  id?: string;
  vehicle_number: string;
  model?: string;
  users?: BusDriver;
}

interface RouteStop {
  name: string;
  scheduled_time_morning: string;
  scheduled_time_evening: string;
}

interface TransitRoute {
  id: string;
  name: string;
  route_number: string;
  monthly_fee: number;
  distance_km: number;
  duration_minutes: number;
  stops: RouteStop[];
  buses?: BusInfo[];
}

interface BusSubscription {
  id: string;
  route_id: string;
  stop_name: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  transaction_id?: string;
  status: string;
  bus_routes?: TransitRoute;
}

export default function SubscriptionDetailPage() {
  const [subscription, setSubscription] = useState<BusSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      if (!studentId) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const res = await apiGet(`/transit/subscriptions/student/${studentId}`);
      if (res.success && res.has_subscription) {
        setSubscription(res.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Failed to load subscription details', err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSub = async () => {
    if (!subscription) return;
    if (!confirm('Are you sure you want to cancel your monthly bus subscription?')) return;
    setCancelling(true);
    try {
      const res = await apiDelete(`/transit/subscriptions/${subscription.id}`);
      if (res.success) {
        setMsg('Subscription successfully cancelled. Access will end on expiration date.');
        await loadSubscription();
      } else {
        alert(res.error || 'Failed to cancel subscription.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Cancellation failed. Please try again.';
      alert(errorMsg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/transit" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-lg">My Transit Subscription</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Verify invoice statements, transfer routes, or cancel passes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        {msg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            {msg}
          </div>
        )}

        {!subscription ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center bg-[#13102A]/20">
            <h3 className="text-sm font-bold text-white">No active subscription found</h3>
            <p className="text-xs text-[#C4B5FD]/50 mt-1 mb-6">Please browse available routes to enroll.</p>
            <Link href="/transit/routes" className="px-5 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md">
              Browse Available Routes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Left Info Column */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                      subscription.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      {subscription.status}
                    </span>
                    <h3 className="text-base font-bold text-white mt-3">{subscription.bus_routes?.name}</h3>
                    <p className="text-xs text-[#C4B5FD]/50 mt-0.5">Route Code: {subscription.bus_routes?.route_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#C4B5FD]/40 uppercase block">Amount Paid</span>
                    <span className="text-lg font-extrabold text-emerald-400">₹{subscription.amount_paid}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
                  <div>
                    <span className="text-[#C4B5FD]/40 block">Boarding Point</span>
                    <span className="font-bold text-white">{subscription.stop_name}</span>
                  </div>
                  <div>
                    <span className="text-[#C4B5FD]/40 block">Transaction ID</span>
                    <span className="font-mono text-[#A78BFA] font-bold">{subscription.transaction_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#C4B5FD]/40 block">Start Date</span>
                    <span className="font-semibold text-white">{new Date(subscription.start_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[#C4B5FD]/40 block">End Date</span>
                    <span className="font-semibold text-white">{new Date(subscription.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action Column */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Subscription Actions</h3>
                
                {subscription.status === 'active' && (
                  <button
                    disabled={cancelling}
                    onClick={handleCancelSub}
                    className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 text-red-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                )}

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-[#C4B5FD]/50 space-y-2">
                  <p className="font-semibold text-white">Billing Info:</p>
                  <p>Subscriptions automatically renew every 30 days unless cancelled.</p>
                  <p>Cancellation stops future billing but active pass benefits continue until the end date.</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
