"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude?: number;
  longitude?: number;
  busLocation?: { lat: number; lng: number };
  stops?: any[];
}

const DEFAULT_CENTER: [number, number] = [26.2389, 73.0243]; // Jodhpur

export default function MapComponent({ latitude, longitude, busLocation, stops = [] }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const lat = busLocation?.lat ?? latitude;
  const lng = busLocation?.lng ?? longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const center: [number, number] = hasCoords ? [lat!, lng!] : DEFAULT_CENTER;
    const map = L.map(mapContainerRef.current).setView(center, 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const stopCoords: L.LatLngExpression[] = [];
    stops.forEach((stop, index) => {
      const stopLat = stop.latitude ?? stop.lat;
      const stopLng = stop.longitude ?? stop.lng;
      if (typeof stopLat === 'number' && typeof stopLng === 'number') {
        L.marker([stopLat, stopLng])
          .addTo(map)
          .bindPopup(`<b>Stop ${index + 1}: ${stop.name}</b>`);
        stopCoords.push([stopLat, stopLng]);
      }
    });

    if (stopCoords.length > 1) {
      L.polyline(stopCoords, {
        color: '#8B5CF6',
        weight: 5,
        opacity: 0.75,
        dashArray: '5, 10'
      }).addTo(map);
    }

    if (hasCoords) {
      const busIcon = L.divIcon({
        className: 'custom-bus-marker-icon',
        html: `
          <div style="
            background-color: #6C2BD9; 
            border: 2px solid white; 
            border-radius: 50%; 
            width: 32px; 
            height: 32px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 0 12px #8B5CF6;
          ">
            <span style="font-size: 16px;">🚌</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const busMarker = L.marker([lat!, lng!], { icon: busIcon }).addTo(map);
      busMarkerRef.current = busMarker;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (busMarkerRef.current && hasCoords) {
      busMarkerRef.current.setLatLng([lat!, lng!]);
    }
  }, [lat, lng]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[450px] rounded-3xl border border-white/5 shadow-2xl relative z-10" />;
}
