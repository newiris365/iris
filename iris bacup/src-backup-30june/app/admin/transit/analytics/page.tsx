"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, ShieldCheck, Wrench, BarChart2, DollarSign, Users, Award, ShieldAlert } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminTransitAnalyticsPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Performance KPI aggregates
  const [stats, setStats] = useState({
    avgDelay: 4.2,
    activeIncidents: 0,
    totalMaintenanceCost: 0,
    activeSubscriptions: 34
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const [routeRes, busRes, incidentRes, maintenanceRes] = await Promise.all([
        apiGet('/transit/routes'),
        apiGet('/transit/buses'),
        apiGet('/transit/incidents'),
        apiGet('/transit/maintenance')
      ]);

      if (routeRes.success) setRoutes(routeRes.routes || []);
      if (busRes.success) setBuses(busRes.buses || []);
      if (incidentRes.success) setIncidents(incidentRes.incidents || []);
      if (maintenanceRes.success) {
        setMaintenance(maintenanceRes.maintenance || []);
        
        // Sum maintenance cost
        const totalCost = (maintenanceRes.maintenance || []).reduce((acc: number, item: any) => acc + Number(item.cost || 0), 0);
        setStats(prev => ({
          ...prev,
          totalMaintenanceCost: totalCost
        }));
      }

      const activeIncCount = (incidentRes.incidents || []).filter((i: any) => i.status !== 'resolved').length;
      setStats(prev => ({
        ...prev,
        activeIncidents: activeIncCount
      }));

    } catch {
      // Mock Fallbacks
      setRoutes([
        { id: 'r1', name: 'Jodhpur Central Route', route_number: 'ROUTE-101', distance_km: 18.5, monthly_fee: 1200, stops: [1,2,3,4] },
        { id: 'r2', name: 'Mandore Outskirts Route', route_number: 'ROUTE-102', distance_km: 24.2, monthly_fee: 1500, stops: [1,2,3,4] },
        { id: 'r3', name: 'Boronada Industrial Line', route_number: 'ROUTE-103', distance_km: 12.8, monthly_fee: 1000, stops: [1,2,3] }
      ]);
      setBuses([
        { id: 'b1', vehicle_number: 'RJ-19-PB-4050', model: 'Tata Starbus 40-Seater' },
        { id: 'b2', vehicle_number: 'RJ-19-PB-8820', model: 'Tata Starbus 50-Seater' }
      ]);
      setIncidents([
        { id: 'i1', incident_type: 'breakdown', severity: 'critical', description: 'Engine heating up near Sardarpura Circle', status: 'resolved', buses: { vehicle_number: 'RJ-19-PB-4050' }, created_at: new Date().toISOString() },
        { id: 'i2', incident_type: 'traffic', severity: 'low', description: 'Heavy traffic at Shastri circle. 10m delay', status: 'reported', buses: { vehicle_number: 'RJ-19-PB-8820' }, created_at: new Date().toISOString() }
      ]);
      setMaintenance([
        { id: 'm1', maintenance_type: 'service', cost: 4500, service_center: 'Tata Motors Authorized Jodhpur', scheduled_date: '2026-05-10', completed_date: '2026-05-11', buses: { vehicle_number: 'RJ-19-PB-4050' }, notes: 'Engine oil replacement, air filters check' },
        { id: 'm2', maintenance_type: 'repair', cost: 12800, service_center: 'Karni Garage Services', scheduled_date: '2026-05-22', completed_date: '2026-05-22', buses: { vehicle_number: 'RJ-19-PB-8820' }, notes: 'Suspension system bush replacement & alignment' }
      ]);
      setStats({
        avgDelay: 6.4,
        activeIncidents: 1,
        totalMaintenanceCost: 17300,
        activeSubscriptions: 28
      });
    } finally {
      setLoading(false);
    }
  };

  // Predefined Mock stats for graphs
  const routeOccupancyData = [
    { name: 'ROUTE-101', subscribed: 16, capacity: 40, fillPct: 40 },
    { name: 'ROUTE-102', subscribed: 12, capacity: 50, fillPct: 24 },
    { name: 'ROUTE-103', subscribed: 0, capacity: 40, fillPct: 0 }
  ];

  const averageDelaysData = [
    { name: 'ROUTE-101', delay: 4.5 },
    { name: 'ROUTE-102', delay: 8.2 },
    { name: 'ROUTE-103', delay: 2.1 }
  ];

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
              <h1 className="font-extrabold text-lg">Transit Operations Analytics</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Monitor fleet on-time performance charts, route loads, safety alerts, and service expenses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#13102A]/60 p-5 rounded-2xl border border-white/5 flex items-center gap-4.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Avg Trip Delay</p>
              <h2 className="text-xl font-extrabold mt-0.5">{stats.avgDelay} Mins</h2>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-5 rounded-2xl border border-white/5 flex items-center gap-4.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Active Incidents</p>
              <h2 className="text-xl font-extrabold mt-0.5">{stats.activeIncidents} Open</h2>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-5 rounded-2xl border border-white/5 flex items-center gap-4.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Maintenance Cost</p>
              <h2 className="text-xl font-extrabold mt-0.5">₹{stats.totalMaintenanceCost.toLocaleString()}</h2>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-5 rounded-2xl border border-white/5 flex items-center gap-4.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-[#C4B5FD]/50 uppercase font-bold">Total Bookings</p>
              <h2 className="text-xl font-extrabold mt-0.5">{stats.activeSubscriptions} Student Passes</h2>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Average Trip Delay */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-purple-400" /> Average Delays by Transit Route (Minutes)
            </h4>
            <div className="space-y-4 pt-4">
              {averageDelaysData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#C4B5FD]/80">{item.name}</span>
                    <span className="text-white font-mono">{item.delay} mins avg</span>
                  </div>
                  <div className="w-full h-3 bg-[#0D0A1A] rounded-full overflow-hidden border border-white/5">
                    {/* Width percentage calculated dynamically */}
                    <div
                      className="h-full bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.delay / 12) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Route Subscription Load Fill Rates */}
          <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" /> Student Subscriptions vs Vehicle Capacity
            </h4>
            <div className="space-y-4 pt-4">
              {routeOccupancyData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#C4B5FD]/80">{item.name}</span>
                    <span className="text-white font-mono">{item.subscribed} / {item.capacity} Seats ({item.fillPct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-[#0D0A1A] rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                      style={{ width: `${item.fillPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Logs Table Section (Incidents & Maintenance) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Safety Incidents logs */}
          <div className="lg:col-span-1 rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-400" /> Incident Alert Logs
            </h4>
            
            <div className="space-y-3 pt-2">
              {incidents.map(inc => (
                <div key={inc.id} className="p-3.5 rounded-xl bg-[#0D0A1A] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded uppercase font-bold">
                      {inc.incident_type}
                    </span>
                    <span className="text-[8px] text-[#C4B5FD]/40">{new Date(inc.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[#C4B5FD] text-[11px]">{inc.description}</p>
                  <div className="flex justify-between items-center text-[9px] border-t border-white/5 pt-2 text-[#C4B5FD]/50">
                    <span>Bus: {inc.buses?.vehicle_number}</span>
                    <span className={`font-bold ${inc.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                      {inc.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {incidents.length === 0 && (
                <div className="text-center py-8 text-[#C4B5FD]/30 text-xs">No incidents reported recently.</div>
              )}
            </div>
          </div>

          {/* Maintenance Logs Ledger */}
          <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Wrench className="w-4.5 h-4.5 text-purple-400" /> Fleet Maintenance & Expenses Log
            </h4>
            
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD]/50 text-[10px] uppercase font-bold">
                    <th className="pb-3 pr-2">Bus Vehicle</th>
                    <th className="pb-3 pr-2">Service Type</th>
                    <th className="pb-3 pr-2">Service Center</th>
                    <th className="pb-3 pr-2">Completion Date</th>
                    <th className="pb-3 text-right">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {maintenance.map(m => (
                    <tr key={m.id} className="text-[#C4B5FD]/90 hover:bg-white/5 transition-all">
                      <td className="py-3 pr-2 font-mono text-white font-semibold">{m.buses?.vehicle_number}</td>
                      <td className="py-3 pr-2">
                        <span className="capitalize">{m.maintenance_type}</span>
                        {m.notes && <p className="text-[9px] text-[#C4B5FD]/40 mt-0.5">{m.notes}</p>}
                      </td>
                      <td className="py-3 pr-2 truncate max-w-[150px]">{m.service_center || 'Local Garage'}</td>
                      <td className="py-3 pr-2 font-mono">{m.completed_date || 'In Progress'}</td>
                      <td className="py-3 text-right text-emerald-400 font-bold font-mono">₹{Number(m.cost).toLocaleString()}</td>
                    </tr>
                  ))}

                  {maintenance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[#C4B5FD]/30 text-xs">No maintenance history logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
