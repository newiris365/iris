"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface BusPosition {
  bus_id: string;
  vehicle_number: string;
  latitude: number;
  longitude: number;
  speed?: number;
}

interface AdminMapProps {
  positions: BusPosition[];
  onMarkerClick: (busId: string) => void;
}

export default function AdminMapComponent({ positions, onMarkerClick }: AdminMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Fix default Leaflet icon marker assets issue in webpack builds
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize Leaflet Map centered on Jodhpur
    const map = L.map(mapContainerRef.current).setView([26.2912, 73.0156], 12);
    mapRef.current = map;

    // Load CARTO Dark Matter Tiles for consistent dark glassmorphic styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update multiple bus positions markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;

    // Add or update markers
    positions.forEach(pos => {
      const busIcon = L.divIcon({
        className: 'admin-bus-icon',
        html: `
          <div style="
            background-color: #6C2BD9; 
            border: 2px solid white; 
            border-radius: 50%; 
            width: 28px; 
            height: 28px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 0 10px #8B5CF6;
          ">
            <span style="font-size: 13px;">🚌</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (currentMarkers[pos.bus_id]) {
        // Update location
        currentMarkers[pos.bus_id].setLatLng([pos.latitude, pos.longitude]);
      } else {
        // Create new marker
        const marker = L.marker([pos.latitude, pos.longitude], { icon: busIcon })
          .addTo(map)
          .bindPopup(`<b>Bus ${pos.vehicle_number}</b>`)
          .on('click', () => onMarkerClick(pos.bus_id));
        currentMarkers[pos.bus_id] = marker;
      }
    });

    // Remove stale markers that are no longer active
    Object.keys(currentMarkers).forEach(busId => {
      const exists = positions.some(p => p.bus_id === busId);
      if (!exists) {
        currentMarkers[busId].remove();
        delete currentMarkers[busId];
      }
    });

  }, [positions, onMarkerClick]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[500px] rounded-3xl border border-white/5 shadow-2xl relative z-10" />;
}
