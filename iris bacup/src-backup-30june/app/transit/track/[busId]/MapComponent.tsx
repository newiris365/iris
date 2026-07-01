"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  stops: any[];
}

export default function MapComponent({ latitude, longitude, stops }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Fix Leaflet's webpack marker assets loading issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize Leaflet Map centered on the bus location
    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 13);
    mapRef.current = map;

    // Standard OpenStreetMap tiles loading
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Plot Route Stops
    const stopCoords: L.LatLngExpression[] = [];
    stops.forEach((stop, index) => {
      L.marker([stop.latitude, stop.longitude])
        .addTo(map)
        .bindPopup(`<b>Stop ${index + 1}: ${stop.name}</b>`)
        .openPopup();
      
      stopCoords.push([stop.latitude, stop.longitude]);
    });

    // Connect stops sequence via Polyline
    if (stopCoords.length > 1) {
      L.polyline(stopCoords, {
        color: '#8B5CF6',
        weight: 5,
        opacity: 0.75,
        dashArray: '5, 10'
      }).addTo(map);
    }

    // Custom Div Icon representing the moving bus
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

    const busMarker = L.marker([latitude, longitude], { icon: busIcon }).addTo(map);
    busMarkerRef.current = busMarker;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync coords changes dynamically without full leaflet teardowns
  useEffect(() => {
    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[450px] rounded-3xl border border-white/5 shadow-2xl relative z-10" />;
}
