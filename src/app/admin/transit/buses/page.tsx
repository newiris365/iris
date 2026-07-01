"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, ShieldAlert, CheckCircle, XCircle, Save, Calendar, User, Navigation, Info } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../../../../lib/api';
import Link from 'next/link';

export default function AdminBusesManagementPage() {
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Message notifications
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editBusId, setEditBusId] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicle_number: '',
    model: '',
    capacity: 40,
    route_id: '',
    driver_id: '',
    device_id: '',
    insurance_expiry: '',
    fitness_expiry: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [busRes, routeRes, driverRes] = await Promise.all([
        apiGet('/transit/buses'),
        apiGet('/transit/routes'),
        apiGet('/transit/drivers')
      ]);

      if (busRes.success) {
        setBuses(busRes.buses || []);
      }
      if (routeRes.success) {
        setRoutes(routeRes.routes || []);
      }
      if (driverRes.success) {
        setDrivers(driverRes.drivers || []);
      } else {
        setDrivers([]);
      }
    } catch {
      setRoutes([]);
      setDrivers([]);
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_number || !form.capacity) {
      setErrorMsg('Vehicle number and capacity are required.');
      return;
    }

    const payload = {
      vehicle_number: form.vehicle_number,
      model: form.model || undefined,
      capacity: Number(form.capacity),
      route_id: form.route_id || null,
      driver_id: form.driver_id || null,
      device_id: form.device_id || null,
      insurance_expiry: form.insurance_expiry || null,
      fitness_expiry: form.fitness_expiry || null,
      is_active: form.is_active
    };

    try {
      let res;
      if (isEditing && editBusId) {
        res = await apiPut(`/transit/buses/${editBusId}`, payload);
      } else {
        res = await apiPost('/transit/buses', payload);
      }

      if (res.success) {
        setMsg(isEditing ? 'Bus updated successfully.' : 'Bus registered successfully.');
        resetForm();
        loadData();
        setTimeout(() => setMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to save bus details.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch {
      // Mock Success Mode
      const matchedRoute = routes.find(r => r.id === form.route_id);
      const matchedDriverObj = drivers.find(d => d.user_id === form.driver_id);
      
      const newMockBus = {
        id: isEditing ? editBusId : 'mock-bus-' + Math.random(),
        ...payload,
        bus_routes: matchedRoute ? { name: matchedRoute.name } : null,
        users: matchedDriverObj ? { name: matchedDriverObj.users?.name } : null
      };

      if (isEditing) {
        setBuses(buses.map(b => b.id === editBusId ? newMockBus : b));
      } else {
        setBuses([...buses, newMockBus]);
      }

      setMsg('Bus saved successfully! (Mock mode)');
      resetForm();
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleEditTrigger = (bus: any) => {
    setIsEditing(true);
    setEditBusId(bus.id);
    setForm({
      vehicle_number: bus.vehicle_number || '',
      model: bus.model || '',
      capacity: bus.capacity || 40,
      route_id: bus.route_id || '',
      driver_id: bus.driver_id || '',
      device_id: bus.device_id || '',
      insurance_expiry: bus.insurance_expiry || '',
      fitness_expiry: bus.fitness_expiry || '',
      is_active: bus.is_active !== undefined ? bus.is_active : true
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditBusId(null);
    setForm({
      vehicle_number: '',
      model: '',
      capacity: 40,
      route_id: '',
      driver_id: '',
      device_id: '',
      insurance_expiry: '',
      fitness_expiry: '',
      is_active: true
    });
  };

  // Check document expiry status helper
  const getDocExpiryStatus = (dateStr: string) => {
    if (!dateStr) return { label: 'Missing', color: 'text-red-400 bg-red-500/10 border-red-500/20', isWarn: true };
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'Expired', color: 'text-red-500 bg-red-500/20 border-red-500/30', isWarn: true };
    } else if (diffDays <= 30) {
      return { label: `Expires in ${diffDays} days`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', isWarn: true };
    } else {
      return { label: 'Valid', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', isWarn: false };
    }
  };

  // Find expiring buses
  const expiringBuses = buses.filter(b => {
    const ins = getDocExpiryStatus(b.insurance_expiry);
    const fit = getDocExpiryStatus(b.fitness_expiry);
    return ins.isWarn || fit.isWarn;
  });

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
              <h1 className="font-extrabold text-lg">Bus Asset Management</h1>
              <p className="text-[10px] text-[#C4B5FD]/50">Register vehicles, map trackers, and monitor document expiry schedules</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        {/* Expiring Documents Alert Block */}
        {expiringBuses.length > 0 && (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-300">Document Expiration Warnings Detected</h4>
              <p className="text-[10px] text-[#C4B5FD]/60">
                The following buses have insurance policies or fitness certificates expiring within 30 days. Renew them immediately to avoid road penalties.
              </p>
              <div className="flex flex-wrap gap-2.5 mt-3">
                {expiringBuses.map(b => (
                  <span key={b.id} className="text-[9px] font-mono px-2 py-0.5 bg-[#13102A] border border-white/5 rounded text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {b.vehicle_number} ({b.model})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            {msg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create/Edit Form Column */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-[#A78BFA]" /> {isEditing ? 'Modify Bus Asset' : 'Register New Vehicle'}
            </h3>

            <form onSubmit={handleSaveBus} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Vehicle Number</label>
                <input
                  type="text"
                  placeholder="e.g. RJ-19-PB-4050"
                  value={form.vehicle_number}
                  onChange={e => setForm({ ...form, vehicle_number: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Model Details</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Starbus 40-Seater"
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Capacity (Seats)</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Device ID (GPS)</label>
                  <input
                    type="text"
                    placeholder="GPS-DEV-XXXX"
                    value={form.device_id}
                    onChange={e => setForm({ ...form, device_id: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Assigned Route</label>
                <select
                  value={form.route_id}
                  onChange={e => setForm({ ...form, route_id: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="">-- Select Transit Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.route_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Assigned Driver</label>
                <select
                  value={form.driver_id}
                  onChange={e => setForm({ ...form, driver_id: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.user_id}>{d.users?.name || 'Unknown'} - {d.license_number}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Insurance Expiry</label>
                  <input
                    type="date"
                    value={form.insurance_expiry}
                    onChange={e => setForm({ ...form, insurance_expiry: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Fitness Expiry</label>
                  <input
                    type="date"
                    value={form.fitness_expiry}
                    onChange={e => setForm({ ...form, fitness_expiry: e.target.value })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-[#0D0A1A] text-[#6C2BD9] focus:ring-[#6C2BD9]"
                />
                <label htmlFor="is_active" className="text-xs text-[#C4B5FD]/80 font-semibold cursor-pointer">
                  Vehicle is active & operational
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-3 bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {isEditing ? 'Save Changes' : 'Register Bus'}
                </button>
              </div>
            </form>
          </div>

          {/* List Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Active Fleet Vehicles ({buses.length})</h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#C4B5FD]/50 text-xs">Loading fleet data...</div>
            ) : buses.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/20 p-12 text-center text-[#C4B5FD]/30 text-xs">
                No fleet vehicles registered. Create one using the form.
              </div>
            ) : (
              <div className="space-y-4">
                {buses.map(bus => {
                  const insStatus = getDocExpiryStatus(bus.insurance_expiry);
                  const fitStatus = getDocExpiryStatus(bus.fitness_expiry);

                  return (
                    <div key={bus.id} className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-5.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold bg-[#6C2BD9]/20 text-[#C4B5FD] px-2 py-0.5 rounded border border-[#6C2BD9]/20">
                            {bus.vehicle_number}
                          </span>
                          <span className="text-[10px] text-white font-bold">{bus.model || 'Standard Bus'}</span>
                          <span className="text-[9px] text-[#C4B5FD]/60 bg-white/5 px-2 py-0.5 rounded">
                            Capacity: {bus.capacity} seats
                          </span>
                          {bus.is_active ? (
                            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Operational
                            </span>
                          ) : (
                            <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Out of Service
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-white/5 pt-3">
                          <div className="flex items-center gap-2 text-xs text-[#C4B5FD]/70">
                            <Navigation className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <div className="text-[10px]">
                              <p className="text-[8px] text-[#C4B5FD]/40 uppercase font-bold">Mapped Route</p>
                              <p className="font-semibold text-white truncate max-w-[150px]">
                                {bus.bus_routes?.name || 'Unassigned'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#C4B5FD]/70">
                            <User className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <div className="text-[10px]">
                              <p className="text-[8px] text-[#C4B5FD]/40 uppercase font-bold">Assigned Driver</p>
                              <p className="font-semibold text-white">
                                {bus.users?.name || 'Unassigned'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#C4B5FD]/70 col-span-2 md:col-span-1">
                            <Info className="w-3.5 h-3.5 text-[#A78BFA]" />
                            <div className="text-[10px]">
                              <p className="text-[8px] text-[#C4B5FD]/40 uppercase font-bold">GPS Device ID</p>
                              <p className="font-semibold text-white font-mono">{bus.device_id || 'Not Mapped'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 flex-wrap text-[9px] pt-1 border-t border-white/5 border-dashed">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#C4B5FD]/50">Insurance:</span>
                            <span className={`px-1.5 py-0.5 rounded border ${insStatus.color}`}>
                              {insStatus.label} {bus.insurance_expiry && `(${bus.insurance_expiry})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#C4B5FD]/50">Fitness cert:</span>
                            <span className={`px-1.5 py-0.5 rounded border ${fitStatus.color}`}>
                              {fitStatus.label} {bus.fitness_expiry && `(${bus.fitness_expiry})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col justify-end w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 shrink-0 gap-2">
                        <button
                          onClick={() => handleEditTrigger(bus)}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-[10px] font-bold text-[#C4B5FD] transition-all flex-1 md:flex-initial"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
