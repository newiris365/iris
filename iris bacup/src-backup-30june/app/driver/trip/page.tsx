"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, StopCircle, Navigation, Wifi, WifiOff, Clock, MapPin, Users
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../lib/api';

export default function DriverTripPage() {
  const [assignments, setAssignments] = useState<any>(null);
  const [todayTrip, setTodayTrip] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<'inactive' | 'active' | 'error'>('inactive');
  const [lastGpsTime, setLastGpsTime] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      const [assignRes, tripRes] = await Promise.all([
        apiGet('campusCore/driver/assignments'),
        apiGet('campusCore/driver/today-trip'),
      ]);
      if (assignRes.success) setAssignments(assignRes.assignments?.[0] || null);
      if (tripRes.success) {
        const trip = tripRes.trip || null;
        setTodayTrip(trip);
        if (trip?.status === 'active') startGpsEmission();
      }
    };
    load();
    return () => { stopGpsEmission(); stopTimer(); };
  }, []);

  const emitGps = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setLastGpsTime(new Date().toLocaleTimeString());
        setGpsStatus('active');

        // Emit via API to server which broadcasts via Socket.io
        try {
          await apiPost('transit/location', {
            bus_id: assignments?.bus_id,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
          });
        } catch (err) {
          console.error('GPS emit failed:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [assignments]);

  const gpsWatchRef = useRef<number | null>(null);

  const startGpsEmission = () => {
    setGpsStatus('active');
    emitGps(); // immediate first fix

    // Use watchPosition for continuous real GPS tracking (more reliable than setInterval)
    if (navigator.geolocation) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, speed, heading } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          setLastGpsTime(new Date().toLocaleTimeString());
          setGpsStatus('active');

          try {
            await apiPost('transit/location', {
              bus_id: assignments?.bus_id,
              latitude,
              longitude,
              speed: speed || 0,
              heading: heading || 0,
            });
          } catch (err) {
            console.error('GPS emit failed:', err);
          }
        },
        (err) => {
          console.error('Geolocation watch error:', err);
          setGpsStatus('error');
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    // Start timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const stopGpsEmission = () => {
    if (gpsWatchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
    setGpsStatus('inactive');
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartTrip = async () => {
    if (!assignments) return;
    const res = await apiPost('campusCore/driver/trip/start', {
      bus_id: assignments.bus_id,
      route_id: assignments.route_id,
      trip_type: new Date().getHours() < 12 ? 'morning' : 'evening',
    });
    if (res.success) {
      setTodayTrip({ trip_id: res.trip_id, status: 'active' });
      startGpsEmission();
    }
  };

  const handleEndTrip = async () => {
    if (!todayTrip) return;
    const res = await apiPut(`campusCore/driver/trip/${todayTrip.trip_id}/end`, {});
    if (res.success) {
      setTodayTrip({ ...todayTrip, status: 'completed' });
      stopGpsEmission();
      stopTimer();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTripActive = todayTrip?.status === 'active';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <PlayCircle size={24} className="text-orange-400" />
        Trip Console
      </h1>

      {/* GPS Status Banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${
        gpsStatus === 'active' ? 'bg-emerald-500/10 border border-emerald-500/30' :
        gpsStatus === 'error' ? 'bg-red-500/10 border border-red-500/30' :
        'bg-slate-500/10 border border-slate-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {gpsStatus === 'active' ? <Wifi size={20} className="text-emerald-400" /> :
           gpsStatus === 'error' ? <WifiOff size={20} className="text-red-400" /> :
           <WifiOff size={20} className="text-slate-400" />}
          <div>
            <p className={`font-medium ${gpsStatus === 'active' ? 'text-emerald-400' : gpsStatus === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
              GPS {gpsStatus === 'active' ? 'Broadcasting' : gpsStatus === 'error' ? 'Error' : 'Inactive'}
            </p>
            {lastGpsTime && <p className="text-xs text-slate-400">Last update: {lastGpsTime}</p>}
          </div>
        </div>
        {gpsCoords && (
          <div className="text-right text-xs text-slate-400">
            <p>{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</p>
          </div>
        )}
      </div>

      {/* Trip Timer */}
      {isTripActive && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
          <p className="text-sm text-slate-400 mb-2">Trip Duration</p>
          <p className="text-5xl font-mono font-bold text-white">{formatTime(elapsed)}</p>
          <p className="text-xs text-slate-400 mt-2">
            Started at {todayTrip.actual_start ? new Date(todayTrip.actual_start).toLocaleTimeString() : '—'}
          </p>
        </div>
      )}

      {/* Big Action Button */}
      <div className="space-y-4">
        {!isTripActive && todayTrip?.status !== 'completed' && assignments ? (
          <button onClick={handleStartTrip}
            className="w-full py-6 bg-emerald-600 text-white rounded-2xl text-2xl font-bold hover:bg-emerald-500 flex items-center justify-center gap-4 shadow-lg shadow-emerald-500/20">
            <PlayCircle size={36} /> START TRIP
          </button>
        ) : isTripActive ? (
          <button onClick={handleEndTrip}
            className="w-full py-6 bg-red-600 text-white rounded-2xl text-2xl font-bold hover:bg-red-500 flex items-center justify-center gap-4 shadow-lg shadow-red-500/20">
            <StopCircle size={36} /> END TRIP
          </button>
        ) : (
          <div className="bg-slate-500/10 rounded-xl p-6 text-center border border-slate-500/30">
            <p className="text-slate-400">Today&apos;s trip is completed.</p>
          </div>
        )}
      </div>

      {/* Route Info */}
      {assignments && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" /> Route Info
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Bus</p>
              <p className="text-white font-mono">{assignments.vehicle_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Route</p>
              <p className="text-white">{assignments.route_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Distance</p>
              <p className="text-white">{assignments.distance_km || '—'} km</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Duration</p>
              <p className="text-white">{assignments.duration_minutes || '—'} min</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/driver/stops" className="bg-white/5 rounded-xl border border-white/10 p-4 text-center hover:bg-white/10">
          <MapPin size={20} className="mx-auto mb-2 text-blue-400" />
          <p className="text-sm text-white">Stops</p>
        </a>
        <a href="/driver/headcount" className="bg-white/5 rounded-xl border border-white/10 p-4 text-center hover:bg-white/10">
          <Users size={20} className="mx-auto mb-2 text-violet-400" />
          <p className="text-sm text-white">Headcount</p>
        </a>
      </div>
    </div>
  );
}
