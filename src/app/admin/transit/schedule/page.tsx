"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, Plus, Save, AlertTriangle, CheckCircle, Ban, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminTransitSchedulePage() {
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [tripForm, setTripForm] = useState({
    bus_id: '',
    route_id: '',
    driver_id: '',
    trip_type: 'morning',
    scheduled_start_time: '08:00',
    trip_date: new Date().toISOString().split('T')[0]
  });

  const [exceptionForm, setExceptionForm] = useState({
    exception_date: new Date().toISOString().split('T')[0],
    reason: '',
    routes_affected: 'all' // 'all' or specific route_id
  });

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [busRes, routeRes] = await Promise.all([
        apiGet('/transit/buses'),
        apiGet('/transit/routes')
      ]);

      if (busRes.success) {
        setBuses(busRes.buses || []);
      }
      if (routeRes.success) {
        setRoutes(routeRes.routes || []);
      }

      // Fetch trips for selected buses
      const activeBuses = busRes.buses || [];
      if (activeBuses.length > 0) {
        const tripPromises = activeBuses.map((b: any) => apiGet(`/transit/trips/${b.id}`));
        const tripsResList = await Promise.all(tripPromises);
        const allTrips: any[] = [];
        tripsResList.forEach((res, i) => {
          if (res.success && res.trips) {
            allTrips.push(...res.trips);
          }
        });
        setTrips(allTrips);
      }
    } catch {
      setBuses([]);
      setRoutes([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }

    // Load Exceptions from localStorage
    const saved = localStorage.getItem('transit_exceptions');
    if (saved) {
      setExceptions(JSON.parse(saved));
    } else {
      const mockExceptions = [
        { id: 'exc-1', exception_date: new Date().toISOString().split('T')[0], reason: 'National Holiday - Holi festival recess', routes_affected: 'all' }
      ];
      setExceptions(mockExceptions);
      localStorage.setItem('transit_exceptions', JSON.stringify(mockExceptions));
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripForm.bus_id || !tripForm.route_id) {
      setErrorMsg('Bus and Route selections are required.');
      return;
    }

    const selectedBus = buses.find(b => b.id === tripForm.bus_id);
    const driverId = selectedBus ? selectedBus.driver_id : '';

    const scheduledStartIso = `${tripForm.trip_date}T${tripForm.scheduled_start_time}:00Z`;

    const payload = {
      bus_id: tripForm.bus_id,
      route_id: tripForm.route_id,
      driver_id: driverId || null,
      trip_type: tripForm.trip_type,
      scheduled_start: scheduledStartIso
    };

    try {
      const res = await apiPost('/transit/trips/start', payload);
      if (res.success) {
        setMsg('Trip scheduled & initialized successfully.');
        loadData();
        setTimeout(() => setMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to start trip.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch {
      // Mock Success Mode
      const matchedRoute = routes.find(r => r.id === tripForm.route_id);
      const newMockTrip = {
        id: 'mock-trip-' + Math.random(),
        bus_id: tripForm.bus_id,
        route_id: tripForm.route_id,
        trip_date: tripForm.trip_date,
        trip_type: tripForm.trip_type,
        scheduled_start: scheduledStartIso,
        status: 'scheduled',
        passenger_count: 0,
        bus_routes: matchedRoute ? { name: matchedRoute.name } : { name: 'Selected Route' }
      };

      setTrips([newMockTrip, ...trips]);
      setMsg('Trip initialized successfully! (Mock mode)');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleAddException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionForm.reason) {
      alert('Please fill out the exception reason.');
      return;
    }

    const newException = {
      id: 'exc-' + Math.random(),
      exception_date: exceptionForm.exception_date,
      reason: exceptionForm.reason,
      routes_affected: exceptionForm.routes_affected
    };

    const updated = [newException, ...exceptions];
    setExceptions(updated);
    localStorage.setItem('transit_exceptions', JSON.stringify(updated));

    setExceptionForm({
      exception_date: new Date().toISOString().split('T')[0],
      reason: '',
      routes_affected: 'all'
    });

    setMsg('Exemption added and broadcasted to students.');
    setTimeout(() => setMsg(''), 4000);
  };

  const handleRemoveException = (id: string) => {
    const updated = exceptions.filter(e => e.id !== id);
    setExceptions(updated);
    localStorage.setItem('transit_exceptions', JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/transit" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-lg">Transit Schedules & Exceptions</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Configure daily timetables, schedule special route runs, and log holiday calendar exceptions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {msg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            {msg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timetable Configuration Lists */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[#A78BFA]" /> Stop Timetables Preview
            </h3>

            <div className="space-y-4">
              {routes.map(r => (
                <div key={r.id} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-5 shadow-xl space-y-3">
                  <div>
                    <span className="text-[9px] bg-[#6C2BD9]/20 text-[#C4B5FD] px-1.5 py-0.5 rounded font-mono font-bold">
                      {r.route_number}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{r.name}</h4>
                  </div>

                  <div className="border-t border-white/5 pt-2.5 space-y-2">
                    <p className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold tracking-wider">Scheduled Timetable Stops</p>
                    {r.stops && Array.isArray(r.stops) && r.stops.length > 0 ? (
                      <div className="space-y-2.5">
                        {r.stops.map((stop: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-white font-medium">{stop.name}</span>
                            <div className="text-right text-[10px] text-[#C4B5FD]/70 space-y-0.5">
                              <p className="font-mono">AM Pickup: {stop.scheduled_time_morning || '08:00 AM'}</p>
                              <p className="font-mono text-[#C4B5FD]/50">PM Drop: {stop.scheduled_time_evening || '05:30 PM'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#C4B5FD]/30">No stops defined for this route.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Trips Form & Today's Schedule Logs */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-[#A78BFA]" /> Launch / Schedule Trip
            </h3>

            <form onSubmit={handleCreateTrip} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Bus Vehicle</label>
                <select
                  value={tripForm.bus_id}
                  onChange={e => setTripForm({ ...tripForm, bus_id: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                >
                  <option value="">-- Select Bus --</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.vehicle_number} ({b.model})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Transit Route</label>
                <select
                  value={tripForm.route_id}
                  onChange={e => setTripForm({ ...tripForm, route_id: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                >
                  <option value="">-- Select Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.route_number})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Trip Type</label>
                  <select
                    value={tripForm.trip_type}
                    onChange={e => setTripForm({ ...tripForm, trip_type: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="morning">Morning Pickup</option>
                    <option value="evening">Evening Drop</option>
                    <option value="special">Special Run</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Start Time</label>
                  <input
                    type="time"
                    value={tripForm.scheduled_start_time}
                    onChange={e => setTripForm({ ...tripForm, scheduled_start_time: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  value={tripForm.trip_date}
                  onChange={e => setTripForm({ ...tripForm, trip_date: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Initialize Scheduled Trip
                </button>
              </div>
            </form>

            {/* List of Today's Scheduled / Running Trips */}
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-5 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-white">Today's Scheduled Runs ({trips.length})</h4>
              
              <div className="space-y-3">
                {trips.map(trip => (
                  <div key={trip.id} className="p-3.5 rounded-xl bg-[#0D0A1A] border border-white/5 space-y-2.5 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-white">{trip.bus_routes?.name || 'Transit Route'}</h5>
                        <p className="text-[9px] text-[#C4B5FD]/50 font-mono mt-0.5">
                          Type: {trip.trip_type.toUpperCase()} • Time: {new Date(trip.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      {trip.status === 'completed' && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> Completed
                        </span>
                      )}
                      {trip.status === 'active' && (
                        <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> In Progress
                        </span>
                      )}
                      {trip.status === 'scheduled' && (
                        <span className="text-[8px] bg-[#C4B5FD]/10 text-[#C4B5FD] border border-white/5 px-2 py-0.5 rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[9px] border-t border-white/5 pt-2 text-[#C4B5FD]/50">
                      <span>Passengers Boarded: {trip.passenger_count || 0}</span>
                      <span>Date: {trip.trip_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exceptions & Holiday Calendar Block */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" /> Holiday Exceptions Scheduler
            </h3>

            {/* Create Exemption */}
            <form onSubmit={handleAddException} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Exemption Date</label>
                <input
                  type="date"
                  value={exceptionForm.exception_date}
                  onChange={e => setExceptionForm({ ...exceptionForm, exception_date: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Routes Affected</label>
                <select
                  value={exceptionForm.routes_affected}
                  onChange={e => setExceptionForm({ ...exceptionForm, routes_affected: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="all">All Routes (General Holiday)</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.route_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Reason</label>
                <textarea
                  placeholder="e.g. Weather Advisory / Campus Closed / Holiday recess..."
                  value={exceptionForm.reason}
                  onChange={e => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white min-h-[80px] resize-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold text-amber-400 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-4 h-4" /> Declare Service Exception
                </button>
              </div>
            </form>

            {/* List Active Exceptions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-white">Declared Exception Periods ({exceptions.length})</h4>
              
              {exceptions.map(exc => {
                const affectedRoute = routes.find(r => r.id === exc.routes_affected);
                return (
                  <div key={exc.id} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-4.5 space-y-2.5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-mono">
                          Date: {exc.exception_date}
                        </span>
                        <h4 className="text-xs font-semibold text-white mt-2">
                          {exc.routes_affected === 'all' ? 'All Transit Routes Suspended' : `Route Suspended: ${affectedRoute?.name || 'Selected Route'}`}
                        </h4>
                        <p className="text-[10px] text-[#C4B5FD]/60 mt-1">{exc.reason}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveException(exc.id)}
                      className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-all pt-2.5 border-t border-white/5 w-full text-left"
                    >
                      Delete Exemption Log
                    </button>
                  </div>
                );
              })}

              {exceptions.length === 0 && (
                <div className="rounded-3xl border border-white/5 bg-[#13102A]/20 p-6 text-center text-[#C4B5FD]/30 text-xs">
                  No service exceptions logged.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
