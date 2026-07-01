"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bus, CreditCard, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
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
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
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

export default function BrowseRoutesPage() {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [selectedStop, setSelectedStop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await apiGet('/transit/routes');
      if (res.success) {
        const liveRoutes = res.routes || [];
        setRoutes(liveRoutes);
        if (liveRoutes.length > 0) {
          setSelectedRoute(liveRoutes[0]);
          if (liveRoutes[0].stops?.length > 0) {
            setSelectedStop(liveRoutes[0].stops[0].name);
          }
        }
      } else {
        setRoutes([]);
      }
    } catch (err) {
      console.error('Failed to load routes', err);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: TransitRoute) => {
    setSelectedRoute(route);
    if (route.stops?.length > 0) {
      setSelectedStop(route.stops[0].name);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaying(true);
    try {
      if (!selectedRoute) return;
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      if (!studentId) {
        alert('Student session not found.');
        return;
      }

      // 1. Initiate subscription payment
      const initRes = await apiPost('/transit/subscriptions/initiate', {
        student_id: studentId,
        route_id: selectedRoute.id,
        stop_name: selectedStop,
      });

      if (!initRes.success) {
        throw new Error(initRes.error || 'Failed to initiate payment.');
      }

      // 2. Trigger Razorpay checkout
      if (initRes.order_id && !initRes.order_id.startsWith('order_mock_') && initRes.key_id && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: initRes.key_id,
          amount: initRes.amount,
          currency: initRes.currency || 'INR',
          name: 'IRIS 365',
          description: `Transit Pass: ${selectedRoute.name}`,
          order_id: initRes.order_id,
          handler: async (response: any) => {
            setPaying(true);
            try {
              const verifyRes = await apiPost('/transit/subscriptions/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                student_id: studentId,
                route_id: selectedRoute.id,
                stop_name: selectedStop,
                amount_paid: selectedRoute.monthly_fee || 1200,
              });

              if (verifyRes.success) {
                setShowPaymentModal(false);
                router.push('/transit');
              } else {
                alert(verifyRes.error || 'Verification failed');
              }
            } catch (err: unknown) {
              const errorMsg = err instanceof Error ? err.message : 'Verification failed. Please try again.';
              alert(errorMsg);
            } finally {
              setPaying(false);
            }
          },
          theme: { color: '#6C2BD9' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setPaying(false);
      } else {
        // Razorpay simulator fallback
        alert(`Razorpay Simulator:\nOrder ID: ${initRes.order_id}\nAmount: ₹${initRes.amount / 100}\nClick OK to confirm payment.`);
        
        const verifyRes = await apiPost('/transit/subscriptions/verify', {
          razorpay_order_id: initRes.order_id,
          razorpay_payment_id: 'pay_rzp_' + Math.random().toString(36).substring(2, 12),
          razorpay_signature: 'sig_mock_verification_hash',
          student_id: studentId,
          route_id: selectedRoute.id,
          stop_name: selectedStop,
          amount_paid: selectedRoute.monthly_fee || 1200,
        });

        if (verifyRes.success) {
          setShowPaymentModal(false);
          router.push('/transit');
        } else {
          throw new Error(verifyRes.error || 'Verification failed');
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      alert(errorMsg);
    } finally {
      setPaying(false);
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
              <h1 className="font-extrabold text-lg">Browse Transport Routes</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Check schedules, monthly passes, and select boarding hubs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Available Routes List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-white">Select Transit Route</h3>
          {routes.length === 0 ? (
            <div className="text-center py-10 border border-white/5 rounded-2xl bg-[#13102A]/20">
              <Info className="w-6 h-6 text-[#C4B5FD]/30 mx-auto" />
              <p className="text-xs text-[#C4B5FD]/50 mt-2">No available bus routes found.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {routes.map(route => {
                const isSelected = selectedRoute?.id === route.id;
                return (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route)}
                    className={`text-left w-full p-4.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-[#6C2BD9] bg-[#1A1538] shadow-lg shadow-[#6C2BD9]/10'
                        : 'border-white/5 bg-[#13102A]/60 hover:bg-[#13102A]'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {route.route_number}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2.5">{route.name}</h4>
                    <div className="flex justify-between items-center text-[10px] text-[#C4B5FD]/50 mt-3">
                      <span>{route.stops?.length || 0} Stops • {route.distance_km} km</span>
                      <span className="text-emerald-400 font-bold">₹{route.monthly_fee}/mo</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Columns: Route stops details and Booking trigger */}
        {selectedRoute ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedRoute.name}</h2>
                  <p className="text-xs text-[#C4B5FD]/50 mt-0.5">Route Code: {selectedRoute.route_number} • Est: {selectedRoute.duration_minutes} Mins</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#C4B5FD]/40 uppercase block">Monthly fee</span>
                  <span className="text-xl font-extrabold text-emerald-400">₹{selectedRoute.monthly_fee}</span>
                </div>
              </div>

              {/* Boarding stop selection */}
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Select Boarding Stop</label>
                <select
                  value={selectedStop}
                  onChange={e => setSelectedStop(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6C2BD9]/50"
                >
                  {selectedRoute.stops?.map((stop: RouteStop, idx: number) => (
                    <option key={idx} value={stop.name}>
                      {stop.name} (AM: {stop.scheduled_time_morning})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stop arrival logs timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#A78BFA]" /> Stops timeline</h4>
                
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  {selectedRoute.stops?.map((stop: RouteStop, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start relative pl-8 text-xs">
                      <div className="absolute left-1.5 w-3 h-3 rounded-full border border-white/25 bg-[#0D0A1A] transform -translate-x-1/2" />
                      <div className="flex-1 flex justify-between">
                        <span className="text-[#C4B5FD]/85">{stop.name}</span>
                        <span className="text-[#C4B5FD]/45 font-mono">AM: {stop.scheduled_time_morning} • PM: {stop.scheduled_time_evening}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-lg flex justify-center items-center gap-2"
              >
                <CreditCard className="w-4.5 h-4.5" /> Subscribe Pass
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 rounded-3xl border border-dashed border-white/10 p-12 text-center bg-[#13102A]/20">
            <Info className="w-8 h-8 text-[#C4B5FD]/35 mx-auto mb-3" />
            <p className="text-xs text-[#C4B5FD]/50">Please select a route from the list to see stops and details.</p>
          </div>
        )}

      </div>

      {/* Razorpay Simulation Modal */}
      {showPaymentModal && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/5 bg-[#13102A] p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Razorpay Secure Checkout</h3>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">IRIS 365 Payment gateway</p>
            </div>

            <div className="space-y-3.5 text-xs border-y border-white/5 py-4">
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Selected Route</span>
                <span className="font-bold text-white text-right ml-4">{selectedRoute.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Boarding Point</span>
                <span className="font-bold text-white">{selectedStop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Validity</span>
                <span className="font-bold text-white">30 Days (Recurring)</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-3">
                <span className="text-[#C4B5FD]/50">Total Amount</span>
                <span className="font-black text-emerald-400">₹{selectedRoute.monthly_fee}</span>
              </div>
            </div>

            <div className="flex gap-3 text-xs">
              <button
                disabled={paying}
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={paying}
                onClick={handlePaymentSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all flex justify-center"
              >
                {paying ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
