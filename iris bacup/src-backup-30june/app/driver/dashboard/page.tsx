"use client";

import React, { useState, useEffect } from 'react';
import {
  Bus, PlayCircle, StopCircle, MapPin, Users, Clock, AlertTriangle, Navigation
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

export default function DriverDashboard() {
  const [assignments, setAssignments] = useState<any>(null);
  const [todayTrip, setTodayTrip] = useState<any>(null);
  const [headcount, setHeadcount] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<'inactive' | 'active' | 'error'>('inactive');

  useEffect(() => {
    const load = async () => {
      try {
        const [assignRes, tripRes, hcRes] = await Promise.all([
          apiGet('campusCore/driver/assignments'),
          apiGet('campusCore/driver/today-trip'),
          apiGet('campusCore/driver/headcount'),
        ]);
        if (assignRes.success) setAssignments(assignRes.assignments?.[0] || null);
        if (tripRes.success) setTodayTrip(tripRes.trip || null);
        if (hcRes.success) setHeadcount(hcRes.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleStartTrip = async () => {
    if (!assignments) return;
    const res = await apiPost('campusCore/driver/trip/start', {
      bus_id: assignments.bus_id,
      route_id: assignments.route_id,
      trip_type: new Date().getHours() < 12 ? 'morning' : 'evening',
    });
    if (res.success) {
      setTodayTrip({ trip_id: res.trip_id, status: 'active' });
    }
  };

  const handleEndTrip = async () => {
    if (!todayTrip) return;
    const res = await apiPut(`campusCore/driver/trip/${todayTrip.trip_id}/end`, {});
    if (res.success) {
      setTodayTrip({ ...todayTrip, status: 'completed' });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-orange-400 animate-pulse text-lg">Loading...</div></div>;
  }

  const boardedCount = headcount.filter(s => s.has_boarded).length;
  const expectedCount = headcount.length;
  const isTripActive = todayTrip?.status === 'active';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Bus size={24} className="text-orange-400" />
        My Bus
      </h1>

      {/* Bus Info Card */}
      {assignments ? (
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{assignments.vehicle_number}</p>
              <p className="text-sm text-slate-300 mt-1">{assignments.bus_name || assignments.bus_model}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Route</p>
              <p className="text-lg font-semibold text-orange-400">{assignments.route_number}</p>
              <p className="text-xs text-slate-400">{assignments.route_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-orange-500/20">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{assignments.capacity}</p>
              <p className="text-xs text-slate-400">Capacity</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{assignments.distance_km || '—'}</p>
              <p className="text-xs text-slate-400">KM</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{assignments.duration_minutes || '—'}</p>
              <p className="text-xs text-slate-400">Minutes</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <Bus size={48} className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-400">No bus assigned. Contact admin.</p>
        </div>
      )}

      {/* Trip Status */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <PlayCircle size={18} className={isTripActive ? 'text-emerald-400' : 'text-slate-400'} />
            Trip Status
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTripActive ? 'bg-emerald-500/20 text-emerald-400' :
            todayTrip?.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {isTripActive ? 'Active' : todayTrip?.status === 'completed' ? 'Completed' : 'No Trip Today'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-slate-400">Boarded</p>
            <p className="text-2xl font-bold text-emerald-400">{boardedCount}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-slate-400">Expected</p>
            <p className="text-2xl font-bold text-white">{expectedCount}</p>
          </div>
        </div>

        {!isTripActive && todayTrip?.status !== 'completed' && assignments ? (
          <button onClick={handleStartTrip}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl text-lg font-bold hover:bg-emerald-500 flex items-center justify-center gap-3">
            <PlayCircle size={24} /> START TRIP
          </button>
        ) : isTripActive ? (
          <button onClick={handleEndTrip}
            className="w-full py-4 bg-red-600 text-white rounded-xl text-lg font-bold hover:bg-red-500 flex items-center justify-center gap-3">
            <StopCircle size={24} /> END TRIP
          </button>
        ) : null}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <a href="/driver/stops" className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
          <MapPin size={20} className="text-blue-400 mb-2" />
          <p className="text-sm font-medium text-white">Stop Schedule</p>
          <p className="text-xs text-slate-400">View & mark stops</p>
        </a>
        <a href="/driver/headcount" className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
          <Users size={20} className="text-violet-400 mb-2" />
          <p className="text-sm font-medium text-white">Headcount</p>
          <p className="text-xs text-slate-400">{boardedCount}/{expectedCount} boarded</p>
        </a>
        <a href="/driver/emergency" className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
          <AlertTriangle size={20} className="text-red-400 mb-2" />
          <p className="text-sm font-medium text-white">Report Emergency</p>
          <p className="text-xs text-slate-400">Breakdown, accident</p>
        </a>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <Navigation size={20} className={`mb-2 ${gpsStatus === 'active' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <p className="text-sm font-medium text-white">GPS Tracking</p>
          <p className={`text-xs ${gpsStatus === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {gpsStatus === 'active' ? 'Broadcasting' : 'Inactive'}
          </p>
        </div>
      </div>
    </div>
  );
}
