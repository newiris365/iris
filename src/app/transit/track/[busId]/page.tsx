"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Navigation, MapPin, ShieldAlert, Users, Compass } from 'lucide-react';
import Link from 'next/link';
import io from 'socket.io-client';
import dynamic from 'next/dynamic';
import { apiGet } from '../../../../lib/api';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

export default function TrackBusPage({ params }: { params: { busId: string } }) {
  const [telemetry, setTelemetry] = useState<any>({
    latitude: 26.2912,
    longitude: 73.0156,
    speed: 35,
    heading: 180,
    vehicle_number: 'RJ-19-PB-4050'
  });
  const [etas, setEtas] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  useEffect(() => {
    // 1. Fetch active route stops for mapping
    loadRouteDetails();

    // 2. Initialize Socket.io client connection to /transit namespace
    const socketUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'https://api.iris365.in';
    const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') : null;

    const socket = io(`${socketUrl}/transit`, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('subscribe_bus', params.busId);
    });

    socket.on('bus:location_updated', (data: any) => {
      if (data && data.bus_id === params.busId) {
        setTelemetry({
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          vehicle_number: data.vehicle_number
        });
        if (data.etas) {
          setEtas(data.etas);
        }
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('offline');
    });

    // 3. Mock telemetry coordinates drift fallback in case of connection failure
    let mockInterval: NodeJS.Timeout;
    const fallbackTimer = setTimeout(() => {
      if (connectionStatus !== 'connected') {
        setConnectionStatus('offline');
        let index = 0;
        const mockCoords = [
          { latitude: 26.2912, longitude: 73.0156, speed: 42, heading: 180 },
          { latitude: 26.2800, longitude: 73.0120, speed: 38, heading: 175 },
          { latitude: 26.2647, longitude: 73.0012, speed: 0, heading: 90 }, // At stop
          { latitude: 26.2300, longitude: 73.0150, speed: 50, heading: 220 },
          { latitude: 26.1543, longitude: 73.0234, speed: 45, heading: 195 }
        ];

        mockInterval = setInterval(() => {
          const currentMock = mockCoords[index];
          setTelemetry((prev: any) => ({
            ...prev,
            ...currentMock
          }));
          
          // Recompute mock ETAs
          if (stops.length > 0) {
            const calculatedEtas = stops.map((stop: any) => {
              // Simple planar distance approximation for mockup
              const d = Math.sqrt(Math.pow(currentMock.latitude - stop.latitude, 2) + Math.pow(currentMock.longitude - stop.longitude, 2)) * 111;
              const v = currentMock.speed > 5 ? currentMock.speed : 25;
              return {
                name: stop.name,
                distance_km: parseFloat(d.toFixed(2)),
                eta_minutes: Math.round((d / v) * 60)
              };
            });
            setEtas(calculatedEtas);
          }

          index = (index + 1) % mockCoords.length;
        }, 10000);
      }
    }, 4000);

    return () => {
      socket.disconnect();
      clearTimeout(fallbackTimer);
      if (mockInterval) clearInterval(mockInterval);
    };
  }, [stops.length]);

  const loadRouteDetails = async () => {
    try {
      const res = await apiGet(`/transit/buses`);
      if (res.success && res.buses) {
        const activeBus = res.buses.find((b: any) => b.id === params.busId);
        if (activeBus && activeBus.route_id) {
          const routeRes = await apiGet(`/transit/routes/${activeBus.route_id}`);
          if (routeRes.success && routeRes.route?.stops) {
            setStops(routeRes.route.stops);
          }
        }
      }
    } catch {
      // Mock stops sequence
      setStops([
        { name: "Sardarpura 4th Road", latitude: 26.2912, longitude: 73.0156, stop_index: 0 },
        { name: "Shastri Nagar Circle", latitude: 26.2647, longitude: 73.0012, stop_index: 1 },
        { name: "Mogra Highway Stop", latitude: 26.1543, longitude: 73.0234, stop_index: 2 },
        { name: "SIET Campus Terminal", latitude: 26.1200, longitude: 73.0500, stop_index: 3 }
      ]);
      setEtas([
        { name: "Sardarpura 4th Road", distance_km: 0.1, eta_minutes: 1 },
        { name: "Shastri Nagar Circle", distance_km: 2.4, eta_minutes: 6 },
        { name: "Mogra Highway Stop", distance_km: 11.2, eta_minutes: 20 },
        { name: "SIET Campus Terminal", distance_km: 15.6, eta_minutes: 32 }
      ]);
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

  // Find the closest stop with distance_km > 0
  const upcomingStop = etas.length > 0 ? etas.find(e => e.distance_km > 0.05) || etas[etas.length - 1] : null;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-12">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/transit" className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#C4B5FD]/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-extrabold text-lg flex items-center gap-2">
                Live Bus Tracker
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[9px] font-normal uppercase tracking-wider text-[#C4B5FD]/50">
                  {connectionStatus === 'connected' ? 'Connected Socket' : 'Offline Mode'}
                </span>
              </h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Active bus location updates streamed in real time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: ETA panel */}
        <div className="lg:col-span-1 space-y-6">
          {upcomingStop && (
            <div className="rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-br from-[#1A1538] to-[#13102A] p-5 shadow-xl">
              <span className="text-[9px] font-extrabold bg-[#6C2BD9]/20 border border-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Arrival ETA
              </span>
              <h3 className="text-sm font-bold text-white mt-3 leading-snug">
                Approaching Stop soon
              </h3>
              <p className="text-2xl font-black text-[#A78BFA] mt-1">
                ~{upcomingStop.eta_minutes} Mins
              </p>
              <p className="text-[10px] text-[#C4B5FD]/50 mt-1">
                Next stop: {upcomingStop.name} ({upcomingStop.distance_km} km remaining)
              </p>
            </div>
          )}

          {/* Telemetry info */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Vehicle Telemetry</h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[#C4B5FD]/40 block text-[9px] uppercase">Speed</span>
                <span className="font-bold text-white mt-1 block flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-[#A78BFA]" /> {telemetry.speed} km/h
                </span>
              </div>
              
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[#C4B5FD]/40 block text-[9px] uppercase">Heading</span>
                <span className="font-bold text-white mt-1 block flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#A78BFA]" /> {telemetry.heading}°
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex justify-between">
              <span className="text-[#C4B5FD]/50">Vehicle Plate</span>
              <span className="font-mono font-bold text-white">{telemetry.vehicle_number}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-3 space-y-6">
          <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
            <MapComponent
              latitude={telemetry.latitude}
              longitude={telemetry.longitude}
              stops={stops}
            />
          </div>

          {/* ETA List of Stops */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl">
            <h4 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-[#A78BFA]" /> Live Route Stops Sequence & ETA
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {etas.map((eta, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-[#C4B5FD]/40 uppercase tracking-wider font-bold">Stop {i + 1}</span>
                    <h5 className="text-xs font-bold text-white truncate">{eta.name}</h5>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-[10px]">
                    <span className="text-emerald-400 font-semibold">~{eta.eta_minutes} mins</span>
                    <span className="text-[#C4B5FD]/40 font-mono">{eta.distance_km} km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
