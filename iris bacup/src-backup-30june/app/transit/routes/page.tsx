"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bus, CreditCard, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BrowseRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
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
        setRoutes(res.routes || []);
        if (res.routes?.length > 0) {
          setSelectedRoute(res.routes[0]);
          if (res.routes[0].stops?.length > 0) {
            setSelectedStop(res.routes[0].stops[0].name);
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
            { name: "Sardarpura 4th Road", scheduled_time_morning: "08:00 AM", scheduled_time_evening: "05:30 PM", latitude: 26.2912, longitude: 73.0156 },
            { name: "Shastri Nagar Circle", scheduled_time_morning: "08:15 AM", scheduled_time_evening: "05:15 PM", latitude: 26.2647, longitude: 73.0012 },
            { name: "Mogra Highway Stop", scheduled_time_morning: "08:30 AM", scheduled_time_evening: "05:00 PM", latitude: 26.1543, longitude: 73.0234 },
            { name: "SIET Campus Terminal", scheduled_time_morning: "08:45 AM", scheduled_time_evening: "04:45 PM", latitude: 26.1200, longitude: 73.0500 }
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
            { name: "Mandore Garden Stop", scheduled_time_morning: "07:50 AM", scheduled_time_evening: "05:40 PM", latitude: 26.3400, longitude: 73.0400 },
            { name: "Paota Circle Hub", scheduled_time_morning: "08:10 AM", scheduled_time_evening: "05:20 PM", latitude: 26.2990, longitude: 73.0390 },
            { name: "Basni Industrial Zone", scheduled_time_morning: "08:25 AM", scheduled_time_evening: "05:05 PM", latitude: 26.2410, longitude: 72.9990 },
            { name: "SIET Campus Terminal", scheduled_time_morning: "08:45 AM", scheduled_time_evening: "04:45 PM", latitude: 26.1200, longitude: 73.0500 }
          ],
          buses: [{ vehicle_number: 'RJ-19-PB-8820' }]
        }
      ];
      setRoutes(mockRoutes);
      setSelectedRoute(mockRoutes[0]);
      setSelectedStop(mockRoutes[0].stops[0].name);
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
      const endDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]; // 30 days validation

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
        router.push('/transit');
      } else {
        alert(res.error || 'Failed to complete checkout.');
      }
    } catch {
      // Offline fallback
      router.push('/transit');
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
        </div>

        {/* Right Columns: Route stops details and Booking trigger */}
        {selectedRoute && (
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

      {/* Razorpay Simulation Modal */}
      {showPaymentModal && (
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
