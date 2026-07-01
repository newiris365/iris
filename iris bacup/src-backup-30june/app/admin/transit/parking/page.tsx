"use client";

import React, { useState, useEffect } from 'react';
import { Car, Grid, ToggleLeft, RefreshCw, AlertTriangle, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminParkingManagement() {
  const [slots, setSlots] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadParkingData();
  }, []);

  const loadParkingData = async () => {
    setLoading(true);
    try {
      const [slotsRes, alertsRes] = await Promise.all([
        apiGet('/transit/parking/slots'),
        apiGet('/transit/parking/alerts')
      ]);

      if (slotsRes.success) {
        setSlots(slotsRes.slots || []);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes);
      }
    } catch {
      // Offline fallback seed data
      setSlots([
        { id: 's1', slot_number: 'A-01', zone: 'Zone A', is_occupied: false, vehicle_number: null, last_occupied_at: null },
        { id: 's2', slot_number: 'A-02', zone: 'Zone A', is_occupied: true, vehicle_number: 'RJ-19-CS-4412', last_occupied_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() },
        { id: 's3', slot_number: 'A-03', zone: 'Zone A', is_occupied: false, vehicle_number: null, last_occupied_at: null },
        { id: 's4', slot_number: 'B-01', zone: 'Zone B', is_occupied: false, vehicle_number: null, last_occupied_at: null },
        { id: 's5', slot_number: 'B-02', zone: 'Zone B', is_occupied: true, vehicle_number: 'RJ-19-PB-4050', last_occupied_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        { id: 's6', slot_number: 'V-01', zone: 'Visitor', is_occupied: false, vehicle_number: null, last_occupied_at: null },
        { id: 's7', slot_number: 'V-02', zone: 'Visitor', is_occupied: true, vehicle_number: 'DL-3C-AS-1020', last_occupied_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
      ]);
      setAlerts({
        overstay_alerts: [
          { id: 's2', slot_number: 'A-02', zone: 'Zone A', vehicle_number: 'RJ-19-CS-4412', last_occupied_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() }
        ],
        visitor_logs: [
          { vehicle_number: "DL-3C-AS-1020", visitor_name: "Amit Kumar", entry_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), purpose: "Guest Lecture" },
          { vehicle_number: "MH-12-PQ-9080", visitor_name: "Suresh Mehta", entry_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), purpose: "Vendor Delivery" }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOccupancy = async (slotId: string, currentOccupied: boolean, slotNum: string) => {
    setUpdatingId(slotId);
    const nextOccupied = !currentOccupied;
    const testVehNum = nextOccupied ? 'RJ-19-XX-' + Math.floor(1000 + Math.random() * 9000) : null;

    try {
      const res = await apiPost('/transit/parking/occupy', {
        id: slotId,
        is_occupied: nextOccupied,
        vehicle_number: testVehNum
      });

      if (res.success) {
        setSlots(prev => prev.map(s => s.id === slotId ? { 
          ...s, 
          is_occupied: nextOccupied, 
          vehicle_number: testVehNum,
          last_occupied_at: nextOccupied ? new Date().toISOString() : null 
        } : s));
      }
    } catch {
      setSlots(prev => prev.map(s => s.id === slotId ? { 
        ...s, 
        is_occupied: nextOccupied, 
        vehicle_number: testVehNum,
        last_occupied_at: nextOccupied ? new Date().toISOString() : null 
      } : s));
    } finally {
      setUpdatingId(null);
    }
  };

  const zones = ['Zone A', 'Zone B', 'Visitor'];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Campus Parking Admin Console</h1>
              <p className="text-xs text-[#C4B5FD]/70">Track slot allocation, overstay violations, and visitor entry durations</p>
            </div>
          </div>
          <button 
            onClick={loadParkingData} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Real-time zone visual layout mapping & toggles */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Grid className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-base font-bold">Interactive Slot Controls</h2>
                  </div>
                  <span className="text-[10px] text-[#C4B5FD]/60">(Click any card to manually simulate occupancy toggle)</span>
                </div>

                <div className="space-y-8">
                  {zones.map(zone => {
                    const zoneSlots = slots.filter(s => s.zone === zone);
                    return (
                      <div key={zone} className="space-y-3">
                        <span className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider block">{zone}</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                          {zoneSlots.map(slot => (
                            <div 
                              key={slot.id} 
                              onClick={() => handleToggleOccupancy(slot.id, slot.is_occupied, slot.slot_number)}
                              className={`p-4 rounded-xl border text-center relative cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${
                                slot.is_occupied 
                                  ? 'bg-red-500/5 border-red-500/20 text-red-300' 
                                  : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                              } ${updatingId === slot.id ? 'opacity-50' : ''}`}
                            >
                              <span className="block text-sm font-extrabold">{slot.slot_number}</span>
                              <span className="text-[9px] block mt-1 uppercase tracking-widest font-mono">
                                {slot.is_occupied ? 'Occupied' : 'Vacant'}
                              </span>
                              {slot.is_occupied && slot.vehicle_number && (
                                <span className="absolute bottom-1 left-0 right-0 text-[8px] opacity-40 font-mono">
                                  {slot.vehicle_number}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Alerts & Logs */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Overstay Warnings (>12 hours) */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Overstay Violations</span>
                </h3>

                {alerts?.overstay_alerts?.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-500/10 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>No active overstay violations</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts?.overstay_alerts?.map((al: any) => (
                      <div key={al.id} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs">
                        <div className="flex justify-between items-start font-bold">
                          <span className="text-white font-mono">{al.vehicle_number}</span>
                          <span className="text-amber-400">{al.slot_number} ({al.zone})</span>
                        </div>
                        <p className="text-[9px] text-[#C4B5FD]/60 mt-1 leading-relaxed">
                          Occupied: {new Date(al.last_occupied_at).toLocaleString()}
                        </p>
                        <span className="inline-block mt-2 font-mono text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-extrabold uppercase">
                          Overstay Alert &gt;12 Hours
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visitor Parking Durations */}
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>Visitor Parking Tracker</span>
                </h3>

                <div className="space-y-3">
                  {alerts?.visitor_logs?.map((vl: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-white font-mono">
                        <span>{vl.vehicle_number}</span>
                        <span className="text-[10px] font-semibold text-[#A78BFA] font-sans flex items-center gap-0.5"><UserCheck className="w-3.5 h-3.5" /> Visitor</span>
                      </div>
                      <p className="text-[10px] text-[#C4B5FD]/70">Name: {vl.visitor_name} • Purpose: {vl.purpose}</p>
                      <p className="text-[9px] text-[#C4B5FD]/40">Entered: {new Date(vl.entry_time).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
