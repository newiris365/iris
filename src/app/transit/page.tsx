"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Bus, MapPin, CreditCard, ChevronRight, User,
  AlertCircle, Clock, Loader2, CheckCircle, ShieldAlert, Navigation
} from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import Link from 'next/link';

// ─── Leaflet Map (dynamically imported — no SSR, avoids "window is not defined") ──
const TransitMap = dynamic(() => import('./TransitMap'), { ssr: false, loading: () => (
  <div className="w-full h-64 rounded-2xl bg-[#0D0A1A] border border-white/5 flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA]" />
  </div>
) });

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

interface DelayFactor {
  factor: string;
  weight: number;
}

interface PredictionData {
  success: boolean;
  predicted_delay_minutes: number;
  confidence_score: number;
  delay_factors?: DelayFactor[];
}

interface TripData {
  id: string;
  status: string;
  trip_type: string;
  passenger_count?: number;
  delay_minutes: number;
  notes?: string;
}

interface BusSubscription {
  id: string;
  route_id: string;
  stop_name: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  transaction_id?: string;
  bus_routes?: TransitRoute;
}

// ─── Component ──────────────────────────────────────────────────────────────────
export default function StudentTransitPage() {
  const [subscription, setSubscription] = useState<BusSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<TripData | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  // Subscription flow
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [selectedStop, setSelectedStop] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const loadTransitDetails = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      if (!studentId) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // 1. Check for active subscription
      const subRes = await apiGet(`/transit/subscriptions/student/${studentId}`);
      if (subRes.success && subRes.has_subscription) {
        setSubscription(subRes.subscription);
        const routeId = subRes.subscription.route_id;
        const busId = subRes.subscription?.bus_routes?.buses?.[0]?.id;

        const [predRes, tripRes] = await Promise.all([
          apiGet(`/transit/routes/${routeId}/predictive-arrival`),
          busId ? apiGet(`/transit/trips/${busId}`) : Promise.resolve({ success: false } as any),
        ]);
        if (predRes.success) setPrediction(predRes as unknown as PredictionData);
        if (tripRes.success && tripRes.trips?.length > 0) {
          setActiveTrip(tripRes.trips.find((t: TripData) => t.status === 'active') || tripRes.trips[0]);
        }
      } else {
        // 2. No subscription — load routes for purchase
        setSubscription(null);
        setRoutesLoading(true);
        try {
          const routesRes = await apiGet('/transit/routes');
          const liveRoutes = routesRes.success ? (routesRes.routes || []) : [];
          setRoutes(liveRoutes);
          if (liveRoutes.length > 0) {
            setSelectedRoute(liveRoutes[0]);
            setSelectedStop(liveRoutes[0]?.stops?.[0]?.name || '');
          }
        } catch (err) {
          console.error('Failed to load routes', err);
          setRoutes([]);
        } finally {
          setRoutesLoading(false);
        }
      }
    } catch {
      // API error or no subscription: clear active subscription and load routes for purchase
      setSubscription(null);
      setActiveTrip(null);
      setPrediction(null);
      setRoutesLoading(true);
      try {
        const routesRes = await apiGet('/transit/routes');
        const liveRoutes = routesRes.success ? (routesRes.routes || []) : [];
        setRoutes(liveRoutes);
        if (liveRoutes.length > 0) {
          setSelectedRoute(liveRoutes[0]);
          setSelectedStop(liveRoutes[0]?.stops?.[0]?.name || '');
        }
      } catch (err) {
        console.error('Failed to load routes', err);
        setRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransitDetails(); }, [loadTransitDetails]);

  const handleRouteSelect = (route: TransitRoute) => {
    setSelectedRoute(route);
    setSelectedStop(route.stops?.[0]?.name || '');
  };

  const handlePaymentSubmit = async () => {
    setPaying(true);
    try {
      if (!selectedRoute) return;
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || user?.id || '';

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

      const res = await apiPost('/transit/subscriptions', {
        student_id: studentId,
        route_id: selectedRoute.id,
        stop_name: selectedStop,
        start_date: startDate,
        end_date: endDate,
        amount_paid: selectedRoute.monthly_fee || 1200,
        transaction_id: 'TXN_TRANSIT_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });

      if (res.success) {
        setPaySuccess(true);
        setTimeout(async () => {
          setShowPaymentModal(false);
          setPaySuccess(false);
          setLoading(true);
          await loadTransitDetails();
        }, 1500);
      } else {
        throw new Error(res.error || 'Checkout failed');
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

  const bus = subscription?.bus_routes?.buses?.[0];
  const stops = subscription?.bus_routes?.stops || [];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
              <Bus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS Transit</h1>
              <p className="text-sm text-[#C4B5FD]/70">Real-Time GPS Tracking • Bus Schedules • Smart Subscriptions</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Link href="/transit/routes" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
              <ChevronRight className="w-4 h-4" /> Browse Routes
            </Link>
            {subscription && (
              <Link href="/transit/subscription" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-bold text-[#C4B5FD] transition-all flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> My Subscription
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">

        {/* ═══ NO SUBSCRIPTION — ROUTE SELECTION + MAP ═══════════════════ */}
        {!subscription ? (
          <div className="space-y-6">
            {/* Banner */}
            <div className="rounded-3xl border border-dashed border-white/10 p-5 flex items-center gap-4 bg-[#13102A]/20">
              <AlertCircle className="w-8 h-8 text-[#A78BFA] shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-white">No Active Bus Subscription</h2>
                <p className="text-xs text-[#C4B5FD]/60 mt-0.5">
                  Select a route below and buy a monthly pass to start riding.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Route list */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-sm font-bold text-white">Select Transit Route</h3>
                {routesLoading ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA] mx-auto" />
                    <p className="text-xs text-[#C4B5FD]/50 mt-2">Loading available routes...</p>
                  </div>
                ) : routes.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-2xl bg-[#13102A]/20">
                    <AlertCircle className="w-6 h-6 text-[#C4B5FD]/30 mx-auto" />
                    <p className="text-xs text-[#C4B5FD]/50 mt-2">No available bus routes found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {routes.map(route => {
                      const isSelected = selectedRoute?.id === route.id;
                      return (
                        <button
                          key={route.id}
                          onClick={() => handleRouteSelect(route)}
                          className={`text-left w-full p-4 rounded-2xl border transition-all ${
                            isSelected
                              ? 'border-[#6C2BD9] bg-[#1A1538] shadow-lg shadow-[#6C2BD9]/10'
                              : 'border-white/5 bg-[#13102A]/60 hover:bg-[#13102A]'
                          }`}
                        >
                          <span className="text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {route.route_number}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2">{route.name}</h4>
                          <div className="flex justify-between items-center text-[10px] text-[#C4B5FD]/50 mt-2">
                            <span>{route.stops?.length || 0} Stops • {route.distance_km} km</span>
                            <span className="text-emerald-400 font-bold">₹{route.monthly_fee}/mo</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Route details + map */}
              {selectedRoute && (
                <div className="lg:col-span-2 space-y-5">
                  {/* Leaflet Map showing stops */}
                  <div className="rounded-2xl overflow-hidden border border-white/5">
                    <TransitMap
                      stops={selectedRoute.stops || []}
                      center={{ lat: 26.2389, lng: 73.0243 }}
                    />
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
                    {/* Route header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedRoute.name}</h2>
                        <p className="text-xs text-[#C4B5FD]/50 mt-0.5">
                          {selectedRoute.route_number} • Est. {selectedRoute.duration_minutes} mins
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#C4B5FD]/40 uppercase block">Monthly fee</span>
                        <span className="text-xl font-extrabold text-emerald-400">₹{selectedRoute.monthly_fee}</span>
                      </div>
                    </div>

                    {/* Boarding stop selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">
                        Select Boarding Stop
                      </label>
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

                    {/* Stop timeline */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#A78BFA]" /> Stops Timeline
                      </h4>
                      <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                        {selectedRoute.stops?.map((stop: RouteStop, idx: number) => {
                          const isBoarding = stop.name === selectedStop;
                          return (
                            <div key={idx} className="flex gap-4 items-start relative pl-8 text-xs">
                              <div className={`absolute left-1.5 w-3 h-3 rounded-full border transform -translate-x-1/2 ${
                                isBoarding ? 'border-[#8B5CF6] bg-[#6C2BD9]' : 'border-white/25 bg-[#0D0A1A]'
                              }`} />
                              <div className="flex-1 flex justify-between">
                                <span className={isBoarding ? 'text-white font-bold' : 'text-[#C4B5FD]/85'}>
                                  {stop.name} {isBoarding && <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-1.5 py-0.5 rounded ml-1 uppercase font-extrabold">Boarding</span>}
                                </span>
                                <span className="text-[#C4B5FD]/45 font-mono shrink-0 ml-2">AM: {stop.scheduled_time_morning} • PM: {stop.scheduled_time_evening}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Buy button */}
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-xs font-bold transition-all shadow-lg flex justify-center items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" /> Buy Monthly Pass — ₹{selectedRoute.monthly_fee}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : (
          /* ═══ ACTIVE SUBSCRIPTION — LIVE MAP + TRIP STATUS ═══════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-5">

              {/* Live Map */}
              <div className="rounded-2xl overflow-hidden border border-[#6C2BD9]/30">
                <div className="bg-[#13102A]/80 px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Live Route Map</span>
                  <span className="ml-auto text-[10px] text-[#C4B5FD]/50">Jodhpur, Rajasthan</span>
                </div>
                <TransitMap
                  stops={stops}
                  center={{ lat: 26.2389, lng: 73.0243 }}
                  activeStopName={subscription?.stop_name}
                />
              </div>

              {/* Active Trip Card */}
              {activeTrip && activeTrip.status === 'active' ? (
                <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#1A1538] to-[#13102A] p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BD9]/10 rounded-full blur-3xl" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] uppercase tracking-wider">
                        Live Active Trip
                      </span>
                      <h2 className="text-xl font-extrabold text-white mt-3 leading-snug">Bus is currently on route</h2>
                      <p className="text-xs text-[#C4B5FD]/70 mt-1">
                        {activeTrip.trip_type === 'morning' ? 'Morning Pickup' : 'Evening Drop'}
                      </p>
                    </div>
                    {bus && (
                      <Link href={`/transit/track/${bus.id}`} className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md">
                        Full Tracker
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-5 text-xs">
                    <div>
                      <span className="text-[#C4B5FD]/40 block">Delay</span>
                      <span className={`font-bold ${activeTrip.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeTrip.delay_minutes > 0 ? `+${activeTrip.delay_minutes} Mins` : 'On Time'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#C4B5FD]/40 block">Passengers</span>
                      <span className="font-bold text-white">{activeTrip.passenger_count || 0} Boarded</span>
                    </div>
                    <div>
                      <span className="text-[#C4B5FD]/40 block">Your Stop</span>
                      <span className="font-bold text-white">{subscription.stop_name}</span>
                    </div>
                  </div>

                  {prediction && (
                    <div className="border-t border-white/5 pt-4 mt-4 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          ML Predictive ETA
                        </span>
                        <span className="text-[10px] text-[#C4B5FD]/50 font-semibold">Confidence: {prediction.confidence_score}%</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-white font-extrabold text-sm">Predicted Delay: {prediction.predicted_delay_minutes} mins</span>
                        <span className="text-[9px] text-[#C4B5FD]/60">Weather & traffic factored</span>
                      </div>
                      {prediction.delay_factors && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {prediction.delay_factors.map((df: DelayFactor, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-[8px] text-[#C4B5FD]/70 border border-white/10">
                              {df.factor} (+{df.weight}m)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTrip.notes && (
                    <p className="text-[10px] text-amber-300 bg-amber-400/5 border border-amber-400/10 p-2.5 rounded-lg mt-4 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {activeTrip.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 text-center py-10">
                  <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">No active trip right now</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-1">Morning pickups start at 07:00 AM. Evening drops start at 05:00 PM.</p>
                </div>
              )}

              {/* Route stops */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#A78BFA]" /> Route Stops
                </h3>
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  {stops.map((stop: RouteStop, idx: number) => {
                    const isYours = stop.name === subscription.stop_name;
                    return (
                      <div key={idx} className="flex gap-4 items-start relative pl-8">
                        <div className={`absolute left-1.5 w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 ${
                          isYours ? 'border-[#8B5CF6] bg-[#6C2BD9]' : 'border-white/20 bg-[#0D0A1A]'
                        }`} />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <h4 className={`font-semibold ${isYours ? 'text-white font-bold' : 'text-[#C4B5FD]/85'}`}>
                              {stop.name} {isYours && <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-1.5 py-0.5 rounded ml-2 uppercase font-extrabold">My Stop</span>}
                            </h4>
                            <span className="text-[10px] text-[#C4B5FD]/40 font-mono">AM: {stop.scheduled_time_morning} • PM: {stop.scheduled_time_evening}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar: Bus & Driver */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-5">
                <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Bus & Driver</h3>
                {bus ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Vehicle</p>
                      <h4 className="text-sm font-bold text-white mt-1">{bus.vehicle_number}</h4>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{bus.model || 'Tata 40-Seater'}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex gap-3.5 items-center">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[#C4B5FD]" />
                      </div>
                      <div className="text-xs">
                        <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Driver</p>
                        <h4 className="font-bold text-white mt-0.5">{bus.users?.name || 'Rajesh Kumar'}</h4>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{bus.users?.phone || '+91 98290 12347'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#C4B5FD]/30">No bus assigned yet.</p>
                )}
              </div>

              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Transit Guidelines</h3>
                <ul className="text-[10px] text-[#C4B5FD]/70 space-y-2.5 list-disc pl-4">
                  <li>Arrive at your boarding stop 5 minutes before scheduled pickup.</li>
                  <li>Tap your RFID card on boarding and alighting — mandatory.</li>
                  <li>Delays exceeding 10 minutes trigger automatic parent notifications.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Razorpay Modal ─────────────────────────────────────────────── */}
      {showPaymentModal && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/5 bg-[#13102A] p-6 shadow-2xl space-y-6">
            {paySuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Payment Successful!</h3>
                <p className="text-xs text-[#C4B5FD]/60 mt-1">Your monthly pass is now active.</p>
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
                    <span className="text-[#C4B5FD]/50">Route</span>
                    <span className="font-bold text-white text-right ml-4">{selectedRoute.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/50">Boarding Stop</span>
                    <span className="font-bold text-white">{selectedStop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C4B5FD]/50">Period</span>
                    <span className="font-bold text-white">Monthly Renewal</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-[#C4B5FD]/50">Total</span>
                    <span className="font-extrabold text-emerald-400 text-base">₹{selectedRoute.monthly_fee}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={paying}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex justify-center items-center gap-1.5"
                  >
                    {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ₹${selectedRoute.monthly_fee}`}
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
