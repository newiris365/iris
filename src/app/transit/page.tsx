"use client";

import React, { useState, useEffect } from 'react';
import { Bus, MapPin, ShieldAlert, CreditCard, ChevronRight, User, AlertCircle, Clock, Loader2, CheckCircle, Info } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import Link from 'next/link';

export default function StudentTransitPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  // Subscription flow states
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [selectedStop, setSelectedStop] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    loadTransitDetails();
  }, []);

  const loadTransitDetails = async () => {
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      // 1. Fetch Subscription
      const subRes = await apiGet(`/transit/subscriptions/student/${studentId}`);
      if (subRes.success && subRes.has_subscription) {
        setSubscription(subRes.subscription);

        const routeId = subRes.subscription.route_id;
        const busId = subRes.subscription?.bus_routes?.buses?.[0]?.id;

        const [predRes, tripRes] = await Promise.all([
          apiGet(`/transit/routes/${routeId}/predictive-arrival`),
          busId ? apiGet(`/transit/trips/${busId}`) : Promise.resolve({ success: false } as any),
        ]);

        if (predRes.success) {
          setPrediction(predRes);
        }

        if (tripRes.success && tripRes.trips?.length > 0) {
          const currentTrip = tripRes.trips.find((t: any) => t.status === 'active') || tripRes.trips[0];
          setActiveTrip(currentTrip);
        }
      } else {
        // Load available routes for subscription
        setRoutesLoading(true);
        try {
          const routesRes = await apiGet('/transit/routes');
          if (routesRes.success) {
            setRoutes(routesRes.routes || []);
            if (routesRes.routes?.length > 0) {
              setSelectedRoute(routesRes.routes[0]);
              if (routesRes.routes[0].stops?.length > 0) {
                setSelectedStop(routesRes.routes[0].stops[0].name);
              }
            }
          }
        } catch {
          // Mock routes fallbacks
          const mockRoutes = [
            {
              id: '80000000-0000-0000-0000-000000000001',
              name: 'Jodhpur Central Route',
              route_number: 'ROUTE-101',
              monthly_fee: 1200.00,
              distance_km: 18.5,
              duration_minutes: 45,
              stops: [
                { name: "Sardarpura 4th Road", scheduled_time_morning: "08:00 AM", scheduled_time_evening: "05:30 PM" },
                { name: "Shastri Nagar Circle", scheduled_time_morning: "08:15 AM", scheduled_time_evening: "05:15 PM" },
                { name: "Mogra Highway Stop", scheduled_time_morning: "08:30 AM", scheduled_time_evening: "05:00 PM" },
                { name: "SIET Campus Terminal", scheduled_time_morning: "08:45 AM", scheduled_time_evening: "04:45 PM" }
              ],
              buses: [{ vehicle_number: 'RJ-19-PB-4050' }]
            },
            {
              id: '80000000-0000-0000-0000-000000000002',
              name: 'Mandore Outskirts Route',
              route_number: 'ROUTE-102',
              monthly_fee: 1500.00,
              distance_km: 24.2,
              duration_minutes: 55,
              stops: [
                { name: "Mandore Garden Stop", scheduled_time_morning: "07:50 AM", scheduled_time_evening: "05:40 PM" },
                { name: "Paota Circle Hub", scheduled_time_morning: "08:10 AM", scheduled_time_evening: "05:20 PM" },
                { name: "Basni Industrial Zone", scheduled_time_morning: "08:25 AM", scheduled_time_evening: "05:05 PM" },
                { name: "SIET Campus Terminal", scheduled_time_morning: "08:45 AM", scheduled_time_evening: "04:45 PM" }
              ],
              buses: [{ vehicle_number: 'RJ-19-PB-8820' }]
            }
          ];
          setRoutes(mockRoutes);
          setSelectedRoute(mockRoutes[0]);
          setSelectedStop(mockRoutes[0].stops[0].name);
        } finally {
          setRoutesLoading(false);
        }
      }
    } catch (err) {
      // Mock Fallbacks
      setSubscription({
        id: 'mock-sub-1',
        stop_name: 'Sardarpura 4th Road',
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        amount_paid: 1200.00,
        bus_routes: {
          id: 'mock-route-1',
          name: 'Jodhpur Central Route',
          route_number: 'ROUTE-101',
          distance_km: 18.5,
          duration_minutes: 45,
          stops: [
            { name: "Sardarpura 4th Road", scheduled_time_morning: "08:00 AM", scheduled_time_evening: "05:30 PM" },
            { name: "Shastri Nagar Circle", scheduled_time_morning: "08:15 AM", scheduled_time_evening: "05:15 PM" },
            { name: "Mogra Highway Stop", scheduled_time_morning: "08:30 AM", scheduled_time_evening: "05:00 PM" },
            { name: "SIET Campus Terminal", scheduled_time_morning: "08:45 AM", scheduled_time_evening: "04:45 PM" }
          ],
          buses: [
            {
              id: 'mock-bus-1',
              vehicle_number: 'RJ-19-PB-4050',
              capacity: 40,
              model: 'Tata Starbus 40-Seater',
              users: { name: 'Rajesh Kumar', phone: '+91 98290 12347' }
            }
          ]
        }
      });
      setActiveTrip({
        id: 'mock-trip-1',
        status: 'active',
        trip_type: 'morning',
        passenger_count: 24,
        delay_minutes: 5,
        notes: 'Slight traffic near Sardarpura bridge.'
      });
      setPrediction({
        predicted_delay_minutes: 8,
        confidence_score: 91,
        delay_factors: [
          { factor: 'Historical baseline avg', weight: 4 },
          { factor: 'Weather slowdown (Rain/Wet roads)', weight: 4 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
    if (route.stops?.length > 0) {
      setSelectedStop(route.stops[0].name);
    }
  };

  const handlePaymentSubmit = async () => {
    setPaying(true);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

      const res = await apiPost('/transit/subscriptions', {
        student_id: studentId,
        route_id: selectedRoute.id,
        stop_name: selectedStop,
        start_date: startDate,
        end_date: endDate,
        amount_paid: selectedRoute.monthly_fee || 1200.00,
        transaction_id: 'TXN_TRANSIT_' + Math.random().toString(36).substring(2, 10).toUpperCase()
      });

      if (res.success) {
        setShowPaymentModal(false);
        setLoading(true);
        await loadTransitDetails();
      } else {
        alert(res.error || 'Failed to complete checkout.');
      }
    } catch {
      // Mock fallback
      setSubscription({
        id: 'mock-sub-1',
        stop_name: selectedStop,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        amount_paid: selectedRoute?.monthly_fee || 1200.00,
        transaction_id: 'TXN_TRANSIT_MOCK_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        status: 'active',
        bus_routes: {
          name: selectedRoute?.name || 'Jodhpur Central Route',
          route_number: selectedRoute?.route_number || 'ROUTE-101'
        }
      });
      setShowPaymentModal(false);
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

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
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
        {!subscription ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center bg-[#13102A]/20">
              <AlertCircle className="w-10 h-10 text-[#A78BFA] mx-auto mb-2" />
              <h2 className="text-base font-bold text-white">No Active Bus Subscription</h2>
              <p className="text-xs text-[#C4B5FD]/60 mt-1">
                You are currently not enrolled in any campus transport route. Please select a route below to buy a monthly pass.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Routes selection list */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-sm font-bold text-white">Select Transit Route</h3>
                {routesLoading ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA] mx-auto" />
                    <p className="text-xs text-[#C4B5FD]/50 mt-2">Loading available routes...</p>
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
                            <span>{route.stops?.length || 0} Stops • {route.distance_km || 0} km</span>
                            <span className="text-emerald-400 font-bold">₹{route.monthly_fee}/mo</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Route Details and Boarding Stop */}
              {selectedRoute && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedRoute.name}</h2>
                        <p className="text-xs text-[#C4B5FD]/50 mt-0.5">Route Code: {selectedRoute.route_number} • Est: {selectedRoute.duration_minutes || 45} Mins</p>
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
                        {selectedRoute.stops?.map((stop: any, idx: number) => (
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
                        {selectedRoute.stops?.map((stop: any, idx: number) => (
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
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Live Trip Status Card */}
            <div className="lg:col-span-2 space-y-6">
              {activeTrip && activeTrip.status === 'active' ? (
                <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#1A1538] to-[#13102A] p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BD9]/10 rounded-full blur-3xl" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] uppercase tracking-wider">
                        Live Active Trip
                      </span>
                      <h2 className="text-xl font-extrabold text-white mt-3 leading-snug">
                        Bus is currently on route
                      </h2>
                      <p className="text-xs text-[#C4B5FD]/70 mt-1">
                        Type: {activeTrip.trip_type === 'morning' ? 'Morning Pickup' : 'Evening Drop'}
                      </p>
                    </div>

                    {bus && (
                      <Link href={`/transit/track/${bus.id}`} className="px-4 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white transition-all shadow-md">
                        Open Live Map
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 mt-6 text-xs">
                    <div>
                      <span className="text-[#C4B5FD]/40 block">Trip Delay</span>
                      <span className={`font-bold ${activeTrip.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeTrip.delay_minutes > 0 ? `+${activeTrip.delay_minutes} Mins` : 'On Time'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#C4B5FD]/40 block">Active Passenger Load</span>
                      <span className="font-bold text-white">{activeTrip.passenger_count || 0} Boarded</span>
                    </div>
                    <div>
                      <span className="text-[#C4B5FD]/40 block">Your Boarding Stop</span>
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
                        <span className="text-[9px] text-[#C4B5FD]/60">Weather & Exam traffic factored</span>
                      </div>
                      {prediction.delay_factors && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {prediction.delay_factors.map((df: any, idx: number) => (
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
                      <ShieldAlert className="w-3.5 h-3.5" /> Note: {activeTrip.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-[#13102A]/40 p-6 text-center py-10">
                  <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">No active trip right now</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                    Morning pickups start at 08:00 AM. Evening drops start at 04:45 PM.
                  </p>
                </div>
              )}

              {/* Route stop list */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#A78BFA]" /> Route Sequence stops
                </h3>
                
                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  {subscription.bus_routes?.stops?.map((stop: any, idx: number) => {
                    const isYourStop = stop.name === subscription.stop_name;
                    return (
                      <div key={idx} className="flex gap-4 items-start relative pl-8">
                        <div className={`absolute left-1.5 w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 flex items-center justify-center ${
                          isYourStop ? 'border-[#8B5CF6] bg-[#6C2BD9]' : 'border-white/20 bg-[#0D0A1A]'
                        }`} />
                        
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <h4 className={`font-semibold ${isYourStop ? 'text-white font-bold' : 'text-[#C4B5FD]/85'}`}>
                              {stop.name} {isYourStop && <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-1.5 py-0.5 rounded ml-2 uppercase font-extrabold">My Stop</span>}
                            </h4>
                            <span className="text-[10px] text-[#C4B5FD]/40 font-mono">
                              AM: {stop.scheduled_time_morning} • PM: {stop.scheduled_time_evening}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bus & Driver Profile Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-5">
                <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Bus & Driver Assets</h3>

                {bus ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Vehicle Details</p>
                      <h4 className="text-sm font-bold text-white mt-1">{bus.vehicle_number}</h4>
                      <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{bus.model || 'Tata 40-Seater'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex gap-3.5 items-center">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#C4B5FD]" />
                      </div>
                      <div className="text-xs">
                        <p className="text-[10px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Assigned Driver</p>
                        <h4 className="font-bold text-white mt-0.5">{bus.users?.name || 'Rajesh Kumar'}</h4>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Phone: {bus.users?.phone || '+91 98290 12347'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#C4B5FD]/30">No bus assigned to this route yet.</p>
                )}
              </div>

              {/* Quick Info Alerts */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-3.5">
                <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Transit Guidelines</h3>
                <ul className="text-[10px] text-[#C4B5FD]/70 space-y-2.5 list-disc pl-4.5">
                  <li>Please arrive at your designated boarding stop 5 minutes prior to the scheduled pickup time.</li>
                  <li>Tapping your RFID card is mandatory on boarding and alighting.</li>
                  <li>In case of routes changes or delays exceeding 10 minutes, notifications will be sent to parents automatically.</li>
                </ul>
              </div>
            </div>

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
                <span className="font-bold text-white">{selectedRoute.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Boarding Stop</span>
                <span className="font-bold text-white">{selectedStop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C4B5FD]/50">Cycle period</span>
                <span className="font-bold text-white">Monthly Renewal</span>
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
                {paying ? 'Processing...' : `Pay ₹${selectedRoute.monthly_fee}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
