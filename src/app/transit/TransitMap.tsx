"use client";

// Leaflet CSS must be imported inside the client component that loads it.
// Since this file is only ever loaded via next/dynamic with ssr:false,
// importing leaflet CSS here is safe (no SSR "window" errors).
import 'leaflet/dist/leaflet.css';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom purple marker for active/boarding stop
const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom blue marker for regular stops
const regularIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Stop {
  name: string;
  lat?: number;
  lng?: number;
  scheduled_time_morning?: string;
  scheduled_time_evening?: string;
}

interface TransitMapProps {
  stops: Stop[];
  center: { lat: number; lng: number };
  activeStopName?: string;
}

// Component to programmatically re-center map when center prop changes
function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 12);
  }, [center.lat, center.lng, map]);
  return null;
}

export default function TransitMap({ stops, center, activeStopName }: TransitMapProps) {
  // Filter only stops that have valid coordinates
  const mappableStops = stops.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number');

  // Build a polyline from stop coordinates to show the route path
  const routePath: [number, number][] = mappableStops.map(s => [s.lat!, s.lng!]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      style={{ height: '320px', width: '100%' }}
      scrollWheelZoom={false}
      className="z-0"
    >
      <MapController center={center} />

      {/* OpenStreetMap tiles — free, no API key */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route polyline */}
      {routePath.length > 1 && (
        <Polyline
          positions={routePath}
          color="#8B5CF6"
          weight={3}
          opacity={0.7}
          dashArray="6 4"
        />
      )}

      {/* Stop markers */}
      {mappableStops.map((stop, idx) => {
        const isActive = stop.name === activeStopName;
        return (
          <Marker
            key={idx}
            position={[stop.lat!, stop.lng!]}
            icon={isActive ? activeIcon : regularIcon}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif', fontSize: '12px', minWidth: '140px' }}>
                <strong style={{ color: '#6C2BD9' }}>{stop.name}</strong>
                {isActive && (
                  <div style={{ color: '#7C3AED', fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
                    ⭐ Your Boarding Stop
                  </div>
                )}
                {stop.scheduled_time_morning && (
                  <div style={{ color: '#555', marginTop: '4px', fontSize: '11px' }}>
                    🌅 AM: {stop.scheduled_time_morning}
                  </div>
                )}
                {stop.scheduled_time_evening && (
                  <div style={{ color: '#555', fontSize: '11px' }}>
                    🌇 PM: {stop.scheduled_time_evening}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
