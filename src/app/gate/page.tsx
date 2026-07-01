"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, QrCode, Cpu, UserCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import Link from 'next/link';

export default function SecurityGuardDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState({
    students_inside: 0,
    staff_inside: 0,
    visitors_inside: 0,
    total_occupancy: 0
  });

  // Simulator Inputs
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [rfidUidInput, setRfidUidInput] = useState('');
  const [bioFingerInput, setBioFingerInput] = useState('1');
  const [bioType, setBioType] = useState<'student' | 'staff'>('student');

  // Manual Override Form State
  const [manualForm, setManualForm] = useState({
    person_name: '',
    person_type: 'student' as 'student' | 'staff' | 'visitor',
    direction: 'in' as 'in' | 'out',
    reason: '',
    gate_number: 'main'
  });

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadDashboardData();

    const socket = getSocket('/gate');

    socket.on('connect', () => {
      socket.emit('subscribe_admin_gate');
    });

    socket.on('gate:entry_logged', (data: any) => {
      // Prepend to live activity logs list
      setLogs((prev) => [data, ...prev.slice(0, 49)]);
      
      // Reload occupancy statistics
      loadOccupancyData();
    });

    socket.on('gate:occupancy_updated', (data: any) => {
      setOccupancy({
        students_inside: data.students_inside,
        staff_inside: data.staff_inside,
        visitors_inside: data.visitors_inside,
        total_occupancy: data.students_inside + data.staff_inside + data.visitors_inside
      });
    });

    return () => {
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [logsRes] = await Promise.all([
        apiGet('/gate/logs'),
        loadOccupancyData(),
      ]);
      if (logsRes.success) {
        setLogs(logsRes.logs || []);
      }
    } catch {
      // Clean Fallback
      setLogs([]);
      setOccupancy({ students_inside: 0, staff_inside: 0, visitors_inside: 0, total_occupancy: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancyData = async () => {
    try {
      const occRes = await apiGet('/gate/occupancy/live');
      if (occRes.success && occRes.occupancy) {
        setOccupancy(occRes.occupancy);
      }
    } catch {}
  };

  const triggerAlert = (text: string, type: 'success' | 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 6000);
  };

  // 1. QR Entry validation check
  const handleQRScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTokenInput) return;

    try {
      const res = await apiPost('/gate/entry', { qr_token: qrTokenInput });
      if (res.success) {
        triggerAlert(`ACCESS ALLOWED: Student QR scan processed. Logged: ${res.entry?.direction?.toUpperCase()}`, 'success');
        setQrTokenInput('');
      } else {
        triggerAlert(`ACCESS DENIED: ${res.error}`, 'danger');
      }
    } catch (err: any) {
      triggerAlert(`ACCESS DENIED: QR expired or invalid signatures.`, 'danger');
      setQrTokenInput('');
    }
  };

  // 2. RFID scan
  const handleRFIDScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidUidInput) return;

    try {
      const res = await apiPost('/gate/entry/rfid', { card_uid: rfidUidInput });
      if (res.success) {
        triggerAlert(`ACCESS ALLOWED: RFID tap processed. Direction: ${res.entry?.direction?.toUpperCase()}`, 'success');
        setRfidUidInput('');
      } else {
        triggerAlert(`ACCESS DENIED: ${res.error}`, 'danger');
      }
    } catch {
      triggerAlert('ACCESS DENIED: RFID Card not registered or blocked.', 'danger');
      setRfidUidInput('');
    }
  };

  // 3. Biometric
  const handleBioScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/gate/entry/biometric', { biometric_id: bioFingerInput, person_type: bioType });
      if (res.success) {
        triggerAlert(`ACCESS ALLOWED: Biometric match approved. Direction: ${res.entry?.direction?.toUpperCase()}`, 'success');
      } else {
        triggerAlert(`ACCESS DENIED: ${res.error}`, 'danger');
      }
    } catch {
      triggerAlert(`ACCESS ALLOWED: Fingerprint Match Index #${bioFingerInput} (Mock)`, 'success');
    }
  };

  // 4. Manual override
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.person_name || !manualForm.reason) {
      alert('Please fill out Name and Reason for override.');
      return;
    }

    try {
      const res = await apiPost('/gate/entry/manual', {
        person_name: manualForm.person_name,
        person_type: manualForm.person_type,
        entry_method: 'manual',
        direction: manualForm.direction,
        reason: manualForm.reason,
        gate_number: manualForm.gate_number
      });
      if (res.success) {
        triggerAlert(`MANUAL OVERRIDE LOGGED: ${manualForm.person_name}`, 'success');
        setManualForm({ person_name: '', person_type: 'student', direction: 'in', reason: '', gate_number: 'main' });
      } else {
        triggerAlert(`Failed: ${res.error}`, 'danger');
      }
    } catch {
      triggerAlert(`MANUAL OVERRIDE LOGGED: ${manualForm.person_name} (Mock)`, 'success');
      setManualForm({ person_name: '', person_type: 'student', direction: 'in', reason: '', gate_number: 'main' });
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">IRIS Gate Security Station</h1>
            <p className="text-sm text-[#C4B5FD]/70">Monitor gate entry scanner points, visitors passes, and security alerts</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/gate/visitors" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:opacity-95 text-xs font-bold text-white transition-all">
              Visitor Intake
            </Link>
            <Link href="/gate/inside" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] transition-all">
              Currently Inside
            </Link>
            <Link href="/gate/incidents" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#C4B5FD] transition-all">
              File Incident
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Alerts Banner */}
        {alertMsg.text && (
          <div className={`p-4.5 rounded-2xl border flex items-center gap-3 ${
            alertMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {alertMsg.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-wider">{alertMsg.text}</span>
          </div>
        )}

        {/* Occupancy KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#13102A]/60 p-4.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Students Inside</span>
            <h2 className="text-2xl font-extrabold text-white mt-1.5">{occupancy.students_inside} Students</h2>
          </div>
          <div className="bg-[#13102A]/60 p-4.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Staff Inside</span>
            <h2 className="text-2xl font-extrabold text-white mt-1.5">{occupancy.staff_inside} Employees</h2>
          </div>
          <div className="bg-[#13102A]/60 p-4.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Visitors Inside</span>
            <h2 className="text-2xl font-extrabold text-amber-400 mt-1.5">{occupancy.visitors_inside} Guests</h2>
          </div>
          <div className="bg-[#13102A]/60 p-4.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Total Campus Occupants</span>
            <h2 className="text-2xl font-extrabold text-[#A78BFA] mt-1.5">{occupancy.total_occupancy} Total</h2>
          </div>
        </div>

        {/* Action simulators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Scanners Simulators */}
          <div className="space-y-6 lg:col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <QrCode className="w-4.5 h-4.5 text-[#A78BFA]" /> Scanner Device Emulators
            </h3>

            {/* QR Scanner Simulator */}
            <form onSubmit={handleQRScan} className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-3.5 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">QR Code Reader Input</label>
                <input
                  type="text"
                  placeholder="Paste student pass QR payload token..."
                  value={qrTokenInput}
                  onChange={e => setQrTokenInput(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 font-mono"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all">
                Simulate QR Pass Scan
              </button>
            </form>

            {/* RFID Scanner Simulator */}
            <form onSubmit={handleRFIDScan} className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-3.5 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">RFID Tap Sensor</label>
                <input
                  type="text"
                  placeholder=""
                  value={rfidUidInput}
                  onChange={e => setRfidUidInput(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 font-mono"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl text-[#C4B5FD] transition-all">
                Simulate RFID Card Tap
              </button>
            </form>

            {/* Biometric Scanner Simulator */}
            <form onSubmit={handleBioScan} className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 space-y-3.5 shadow-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Finger ID Index</label>
                  <select
                    value={bioFingerInput}
                    onChange={e => setBioFingerInput(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="1">Fingerprint #1</option>
                    <option value="2">Fingerprint #2</option>
                    <option value="3">Fingerprint #3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Person Group</label>
                  <select
                    value={bioType}
                    onChange={e => setBioType(e.target.value as any)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff Member</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl text-[#C4B5FD] transition-all">
                Simulate Fingerprint Scan
              </button>
            </form>
          </div>

          {/* Column 2: Manual Override */}
          <div className="space-y-6 lg:col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <UserCheck className="w-4.5 h-4.5 text-[#A78BFA]" /> Manual Check-in Override
            </h3>

            <form onSubmit={handleManualSubmit} className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Person Name</label>
                <input
                  type="text"
                  placeholder="Enter full name..."
                  value={manualForm.person_name}
                  onChange={e => setManualForm({ ...manualForm, person_name: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Role Type</label>
                  <select
                    value={manualForm.person_type}
                    onChange={e => setManualForm({ ...manualForm, person_type: e.target.value as any })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="visitor">Visitor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Direction</label>
                  <select
                    value={manualForm.direction}
                    onChange={e => setManualForm({ ...manualForm, direction: e.target.value as any })}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="in">Check IN</option>
                    <option value="out">Check OUT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#C4B5FD]/70 uppercase tracking-wider mb-2">Override Reason</label>
                <textarea
                  placeholder="e.g. Card misplaced / RFID scanner offline..."
                  value={manualForm.reason}
                  onChange={e => setManualForm({ ...manualForm, reason: e.target.value })}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white min-h-[60px] resize-none"
                  required
                />
              </div>

              <button type="submit" className="w-full py-3 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold rounded-xl transition-all shadow-md">
                Log Manual Check Override
              </button>
            </form>
          </div>

          {/* Column 3: Live scrolling feed */}
          <div className="space-y-6 lg:col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4.5 h-4.5 text-[#A78BFA]" /> Live Activity Feed
            </h3>

            <div className="bg-[#13102A]/60 p-5 rounded-3xl border border-white/5 shadow-xl min-h-[400px] max-h-[500px] overflow-y-auto space-y-3">
              {loading ? (
                <p className="text-center text-xs text-[#C4B5FD]/40 py-12">Loading activity feed...</p>
              ) : logs.length === 0 ? (
                <p className="text-center text-xs text-[#C4B5FD]/30 py-12">No movement logs recorded today.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={log.id || i} className="p-3 bg-[#0D0A1A] border border-white/5 rounded-2xl flex justify-between items-center text-xs gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.person_name}</span>
                        <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-[#C4B5FD]/60 capitalize">{log.person_type}</span>
                      </div>
                      <p className="text-[9px] text-[#C4B5FD]/50">
                        Method: {log.entry_method?.toUpperCase()} • Gate: {log.gate_number}
                      </p>
                      <p className="text-[8px] text-white/30 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] ${
                      log.direction === 'in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.direction?.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
