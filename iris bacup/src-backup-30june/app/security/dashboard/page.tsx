"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ScanLine, Car, ShieldAlert, Users, Clock, AlertTriangle
} from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function SecurityDashboard() {
  const [stats, setStats] = useState({ vehicles: 0, visitors: 0, restrictions: 0 });
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [visRes, vehRes, restRes] = await Promise.all([
          apiGet('campusCore/gate/visitors-today'),
          apiGet('campusCore/gate/vehicle-logs', { today: 'true' }),
          apiGet('campusCore/gate/restrictions'),
        ]);
        if (visRes.success) setStats(s => ({ ...s, visitors: visRes.visitors?.length || 0 }));
        if (vehRes.success) {
          setRecentVehicles(vehRes.logs || []);
          setStats(s => ({ ...s, vehicles: vehRes.logs?.length || 0 }));
        }
        if (restRes.success) setStats(s => ({ ...s, restrictions: restRes.restrictions?.length || 0 }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="text-red-400 animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Visitors Today', value: stats.visitors, icon: Users, color: 'text-amber-400' },
          { label: 'Vehicles Today', value: stats.vehicles, icon: Car, color: 'text-blue-400' },
          { label: 'Active Restrictions', value: stats.restrictions, icon: ShieldAlert, color: 'text-red-400' },
          { label: 'Quick Scan', value: '→', icon: ScanLine, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Scan Person', href: '/security/gate', icon: ScanLine, color: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' },
              { label: 'Log Vehicle', href: '/security/vehicles', icon: Car, color: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
              { label: 'Check Blacklist', href: '/security/restrictions', icon: ShieldAlert, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
              { label: 'Visitor Passes', href: '/security/gate', icon: Users, color: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' },
            ].map(a => (
              <a key={a.label} href={a.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 transition-colors ${a.color}`}>
                <a.icon size={24} />
                <span className="text-sm font-medium">{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Vehicles */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Car size={18} className="text-blue-400" /> Recent Vehicle Activity
          </h2>
          {recentVehicles.length === 0 ? (
            <p className="text-slate-400 text-sm">No vehicle activity today.</p>
          ) : (
            <div className="space-y-2">
              {recentVehicles.slice(0, 5).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                  <div>
                    <p className="text-sm font-mono font-medium text-white">{v.vehicle_number}</p>
                    <p className="text-xs text-slate-400">{v.driver_name || '—'} — {v.vehicle_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{new Date(v.entry_time).toLocaleTimeString()}</p>
                    {v.exit_time ? (
                      <p className="text-xs text-emerald-400">Exited</p>
                    ) : (
                      <p className="text-xs text-amber-400">Inside</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
