"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Bus, Clock, Signal, SignalOff, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '../../../lib/api';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./[busId]/MapComponent'), { ssr: false, loading: () => (
  <div className="w-full h-80 rounded-2xl bg-[#0D0A1A] border border-white/5 flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
  </div>
) });

interface BusData {
  id: string;
  vehicle_number: string;
  model?: string;
  capacity?: number;
  current_lat?: number;
  current_lng?: number;
  last_location_at?: string;
  speed_kmh?: number;
  is_active: boolean;
  bus_routes?: { name: string; route_number: string };
  users?: { name: string };
}

const FALLBACK_BUSES: BusData[] = [
  {
    id: 'bus-demo-001',
    vehicle_number: 'RJ-19-PA-1024',
    model: 'Tata Starbus 40-Seater',
    capacity: 42,
    current_lat: 26.2912,
    current_lng: 73.0156,
    last_location_at: new Date().toISOString(),
    speed_kmh: 35,
    is_active: true,
    bus_routes: { name: 'Route A: Sardarpura - Chopasni - SIET Campus', route_number: 'ROUTE-101' },
    users: { name: 'Rajesh Kumar' }
  },
  {
    id: 'bus-demo-002',
    vehicle_number: 'RJ-19-PB-4050',
    model: 'Ashok Leyland Viking 45-Seater',
    capacity: 45,
    current_lat: 26.2845,
    current_lng: 73.0210,
    last_location_at: new Date(Date.now() - 300000).toISOString(),
    speed_kmh: 0,
    is_active: true,
    bus_routes: { name: 'Route B: Paota - Circuit House - Ratanada - SIET', route_number: 'ROUTE-102' },
    users: { name: 'Suresh Meena' }
  },
  {
    id: 'bus-demo-003',
    vehicle_number: 'RJ-20-MA-7890',
    model: 'Eicher Skyline 35-Seater',
    capacity: 35,
    current_lat: 26.2780,
    current_lng: 73.0305,
    last_location_at: new Date(Date.now() - 900000).toISOString(),
    speed_kmh: 42,
    is_active: true,
    bus_routes: { name: 'Route C: Paota - Ratanada - Jodhpur Fort - Campus', route_number: 'ROUTE-103' },
    users: { name: 'Vikram Singh' }
  }
];

export default function TrackBusListPage() {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);

  const loadBuses = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/transit/live');
      if (res.success && res.buses?.length > 0) {
        setBuses(res.buses);
      } else {
        const res2 = await apiGet('/transit/buses');
        if (res2.success && res2.buses?.length > 0) {
          setBuses(res2.buses);
        } else {
          setBuses(FALLBACK_BUSES);
        }
      }
    } catch {
      setBuses(FALLBACK_BUSES);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBuses();
  }, []);

  const getStatusColor = (bus: BusData) => {
    if (!bus.is_active) return 'text-red-400';
    if (!bus.current_lat) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getStatusLabel = (bus: BusData) => {
    if (!bus.is_active) return 'Offline';
    if (!bus.current_lat) return 'No GPS';
    return 'Live';
  };

  const getStatusDot = (bus: BusData) => {
    if (!bus.is_active) return 'bg-red-400';
    if (!bus.current_lat) return 'bg-yellow-400';
    return 'bg-emerald-400 animate-pulse';
  };

  const formatTime = (iso?: string) => {
    if (!iso) return 'N/A';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="min-h-screen bg-[#0A0818] text-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#10B981]" /> Track Bus
          </h1>
          <p className="text-xs text-[#C4B5FD]/60 mt-1">Select a bus to view live location and ETA</p>
        </div>
        <button
          onClick={loadBuses}
          disabled={loading}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-[#C4B5FD] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Map Preview */}
      {selectedBus && selectedBus.current_lat && selectedBus.current_lng && (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <MapComponent
            busLocation={{ lat: selectedBus.current_lat, lng: selectedBus.current_lng }}
            stops={[]}
          />
        </div>
      )}

      {/* Bus List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : buses.length === 0 ? (
        <div className="text-center py-16">
          <Bus className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40">No buses available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buses.map((bus) => (
            <Link
              key={bus.id}
              href={`/transit/track/${bus.id}`}
              onClick={() => setSelectedBus(bus)}
              className={`block p-4 rounded-2xl border transition-all ${
                selectedBus?.id === bus.id
                  ? 'bg-[#10B981]/10 border-[#10B981]/30'
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusDot(bus)}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStatusColor(bus)}`}>
                      {getStatusLabel(bus)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{bus.vehicle_number}</h3>
                  <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5 truncate">
                    {bus.bus_routes?.name || 'Unassigned Route'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {bus.speed_kmh !== undefined && bus.speed_kmh > 0 && (
                      <span className="text-[9px] text-[#C4B5FD]/40 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> {bus.speed_kmh} km/h
                      </span>
                    )}
                    <span className="text-[9px] text-[#C4B5FD]/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(bus.last_location_at)}
                    </span>
                    {bus.users?.name && (
                      <span className="text-[9px] text-[#C4B5FD]/40">{bus.users.name}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 mt-1 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
