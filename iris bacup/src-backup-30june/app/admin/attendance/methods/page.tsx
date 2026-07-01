"use client";

import React, { useState, useEffect } from 'react';
import {
  Settings, QrCode, Fingerprint, CreditCard, PenTool, Save,
  CheckCircle2, XCircle, Smartphone, Wifi, RefreshCw, Plus, Trash2
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '../../../../lib/api';

interface AttendanceMethod {
  id: string;
  method_key: string;
  is_enabled: boolean;
  config: Record<string, any>;
  updated_at: string;
}

interface AttendanceDevice {
  id: string;
  device_name: string;
  device_type: string;
  device_serial: string;
  api_key: string;
  department_id?: string;
  is_active: boolean;
  last_heartbeat?: string;
  firmware_version?: string;
  created_at: string;
}

const METHOD_META: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  qr: { label: 'QR Code', icon: <QrCode className="w-5 h-5" />, color: 'violet', description: 'Students scan rotating QR codes displayed by the teacher. Includes geo-fencing and auto-rotation.' },
  biometric: { label: 'Biometric', icon: <Fingerprint className="w-5 h-5" />, color: 'emerald', description: 'Fingerprint scanner devices verify student identity. Supports department-specific session matching.' },
  rfid: { label: 'RFID Card', icon: <CreditCard className="w-5 h-5" />, color: 'blue', description: 'Students tap their RFID cards on readers at entry points. Supports device-level session targeting.' },
  manual: { label: 'Manual', icon: <PenTool className="w-5 h-5" />, color: 'amber', description: 'Teachers manually mark attendance from the student list. Used as a fallback method.' },
};

export default function AttendanceMethodsPage() {
  const [methods, setMethods] = useState<AttendanceMethod[]>([]);
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'methods' | 'devices'>('methods');

  // Device form
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    device_name: '', device_type: 'biometric', device_serial: '', department_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [methodsRes, devicesRes] = await Promise.all([
        apiGet('/core/attendance/methods'),
        apiGet('/core/attendance/devices')
      ]);
      if (methodsRes.success) setMethods(methodsRes.methods || []);
      if (devicesRes.success) setDevices(devicesRes.devices || []);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMethod = async (methodKey: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setMethods(prev => prev.map(m => m.method_key === methodKey ? { ...m, is_enabled: newEnabled } : m));

    try {
      await apiPut('/core/attendance/method', {
        method_key: methodKey,
        is_enabled: newEnabled
      });
    } catch (err) {
      // Revert on failure
      setMethods(prev => prev.map(m => m.method_key === methodKey ? { ...m, is_enabled: currentEnabled } : m));
      alert('Failed to update method.');
    }
  };

  const handleConfigChange = async (methodKey: string, configKey: string, value: any) => {
    const method = methods.find(m => m.method_key === methodKey);
    if (!method) return;

    const newConfig = { ...method.config, [configKey]: value };
    setMethods(prev => prev.map(m => m.method_key === methodKey ? { ...m, config: newConfig } : m));

    try {
      await apiPut('/core/attendance/method', {
        method_key: methodKey,
        is_enabled: method.is_enabled,
        config: newConfig
      });
    } catch (err) {
      alert('Failed to save config.');
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/core/attendance/device', {
        device_name: deviceForm.device_name,
        device_type: deviceForm.device_type,
        device_serial: deviceForm.device_serial,
        department_id: deviceForm.department_id || undefined
      });
      if (res.success) {
        setShowDeviceForm(false);
        setDeviceForm({ device_name: '', device_type: 'biometric', device_serial: '', department_id: '' });
        loadData();
      } else {
        alert(res.error || 'Failed to register device.');
      }
    } catch (err) {
      alert('Failed to register device.');
    }
  };

  const handleToggleDevice = async (deviceId: string, currentActive: boolean) => {
    try {
      await apiPut(`/core/attendance/device/${deviceId}`, { is_active: !currentActive });
      loadData();
    } catch (err) {
      alert('Failed to update device.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Attendance Methods</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light mt-0.5">Enable, disable, and configure attendance verification methods for your institution.</p>
            </div>
          </div>
          <button onClick={loadData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
          {[
            { key: 'methods' as const, label: 'Attendance Methods', icon: <Settings className="w-4 h-4" /> },
            { key: 'devices' as const, label: 'Devices', icon: <Smartphone className="w-4 h-4" /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                  : 'text-[#C4B5FD]/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Methods Tab */}
        {activeTab === 'methods' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(METHOD_META).map(([key, meta]) => {
              const method = methods.find(m => m.method_key === key);
              const isEnabled = method?.is_enabled ?? true;
              const config = method?.config || {};

              return (
                <div key={key}
                  className={`glass-panel rounded-2xl border p-6 transition-all ${
                    isEnabled ? 'border-violet-500/20 bg-violet-500/5' : 'border-white/5 bg-white/[0.02]'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isEnabled ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-[#C4B5FD]/30'
                      }`}>
                        {meta.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{meta.label}</h3>
                        <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">{isEnabled ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggleMethod(key, isEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        isEnabled ? 'bg-emerald-500' : 'bg-white/10'
                      }`}>
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow ${
                        isEnabled ? 'left-6' : 'left-0.5'
                      }`} />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#C4B5FD]/60 leading-relaxed mb-4">{meta.description}</p>

                  {/* QR Config */}
                  {key === 'qr' && isEnabled && (
                    <div className="space-y-3 border-t border-white/5 pt-4">
                      <div>
                        <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-semibold">Rotation Interval (minutes)</label>
                        <input type="number" min={1} max={30}
                          value={config.rotate_interval_minutes || 5}
                          onChange={(e) => handleConfigChange(key, 'rotate_interval_minutes', parseInt(e.target.value) || 5)}
                          className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-semibold">Geo Latitude</label>
                          <input type="number" step="any"
                            value={config.geo_lat || ''}
                            onChange={(e) => handleConfigChange(key, 'geo_lat', parseFloat(e.target.value) || null)}
                            placeholder="26.2389"
                            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500" />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-semibold">Geo Longitude</label>
                          <input type="number" step="any"
                            value={config.geo_lng || ''}
                            onChange={(e) => handleConfigChange(key, 'geo_lng', parseFloat(e.target.value) || null)}
                            placeholder="73.0243"
                            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#C4B5FD]/50 uppercase font-semibold">Geo-Fence Radius (meters)</label>
                        <input type="number" min={50} max={1000}
                          value={config.geo_radius || 200}
                          onChange={(e) => handleConfigChange(key, 'geo_radius', parseInt(e.target.value) || 200)}
                          className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500" />
                      </div>
                    </div>
                  )}

                  {/* Biometric Config */}
                  {key === 'biometric' && isEnabled && (
                    <div className="space-y-3 border-t border-white/5 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={config.require_session !== false}
                          onChange={(e) => handleConfigChange(key, 'require_session', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-violet-500 focus:ring-violet-500" />
                        <span className="text-[11px] text-[#C4B5FD]/70">Require active session to mark</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={config.auto_match !== false}
                          onChange={(e) => handleConfigChange(key, 'auto_match', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-violet-500 focus:ring-violet-500" />
                        <span className="text-[11px] text-[#C4B5FD]/70">Auto-match student by fingerprint</span>
                      </label>
                    </div>
                  )}

                  {/* RFID Config */}
                  {key === 'rfid' && isEnabled && (
                    <div className="space-y-3 border-t border-white/5 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={config.require_session !== false}
                          onChange={(e) => handleConfigChange(key, 'require_session', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-violet-500 focus:ring-violet-500" />
                        <span className="text-[11px] text-[#C4B5FD]/70">Require active session to mark</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">Registered Devices</h2>
                <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Biometric and RFID hardware devices connected to your institution.</p>
              </div>
              <button onClick={() => setShowDeviceForm(true)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Register Device
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="py-12 text-center text-[#C4B5FD]/40 italic text-sm">
                No devices registered. Click "Register Device" to add biometric or RFID hardware.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[#C4B5FD] uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-3 px-4">Device Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Serial</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Heartbeat</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map(device => (
                      <tr key={device.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-3 px-4 font-semibold text-white">{device.device_name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            device.device_type === 'biometric' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            device.device_type === 'rfid' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {device.device_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#C4B5FD]/70">{device.device_serial}</td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1 text-[10px] font-bold ${
                            device.is_active ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {device.is_active ? <Wifi className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {device.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#C4B5FD]/60">
                          {device.last_heartbeat ? new Date(device.last_heartbeat).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleToggleDevice(device.id, device.is_active)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              device.is_active
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            }`}>
                            {device.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Device Modal */}
      {showDeviceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-violet-500/30 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Register Attendance Device</h3>
            <form onSubmit={handleRegisterDevice} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#C4B5FD] font-semibold">Device Name</label>
                <input type="text" required placeholder="e.g. CSE Lab Fingerprint Scanner"
                  value={deviceForm.device_name}
                  onChange={(e) => setDeviceForm({...deviceForm, device_name: e.target.value})}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Device Type</label>
                  <select value={deviceForm.device_type}
                    onChange={(e) => setDeviceForm({...deviceForm, device_type: e.target.value})}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500">
                    <option value="biometric">Biometric</option>
                    <option value="rfid">RFID</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold">Serial Number</label>
                  <input type="text" required placeholder="e.g. BIO-001"
                    value={deviceForm.device_serial}
                    onChange={(e) => setDeviceForm({...deviceForm, device_serial: e.target.value})}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-violet-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowDeviceForm(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold shadow-lg shadow-violet-600/25">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
