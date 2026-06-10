"use client";

import React, { useState, useEffect } from 'react';
import { Bus, MapPin, ShieldAlert, CreditCard, ChevronRight, User, AlertCircle, Clock } from 'lucide-react';
import { apiGet } from '../../lib/api';
import Link from 'next/link';

export default function StudentTransitPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<any>(null);

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

        // 2. Fetch active trip if bus exists
        if (subRes.subscription?.bus_routes?.buses?.length > 0) {
          const busId = subRes.subscription.bus_routes.buses[0].id;
          const tripRes = await apiGet(`/transit/trips/${busId}`);
          if (tripRes.success && tripRes.trips?.length > 0) {
            const currentTrip = tripRes.trips.find((t: any) => t.status === 'active') || tripRes.trips[0];
            setActiveTrip(currentTrip);
          }
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
    } finally {
      setLoading(false);
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
          <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center max-w-lg mx-auto mt-12 bg-[#13102A]/20">
            <AlertCircle className="w-12 h-12 text-[#A78BFA] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white">No Active Bus Subscription</h2>
            <p className="text-xs text-[#C4B5FD]/60 mt-1 mb-6">
              You are currently not enrolled in any campus transport route. Select a route to buy a monthly pass.
            </p>
            <Link href="/transit/routes" className="px-5 py-3 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold transition-all shadow-md">
              Browse Available Routes
            </Link>
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
    </main>
  );
}
