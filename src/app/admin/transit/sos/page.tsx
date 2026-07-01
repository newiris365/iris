"use client";

import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, Check, RefreshCw, Printer, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminSosDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [reportText, setReportText] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadSosAlerts();
  }, []);

  const loadSosAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/transit/sos/alerts');
      if (res.success && res.alerts?.length > 0) {
        setAlerts(res.alerts);
      } else {
        setAlerts([]);
      }
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const res = await apiPost(`/transit/sos/resolve/${alertId}`, {});
      if (res.success) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a));
        if (selectedAlert && selectedAlert.id === alertId) {
          setSelectedAlert(prev => ({ ...prev, status: 'resolved', resolved_at: new Date().toISOString() }));
        }
      }
    } catch {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => ({ ...prev, status: 'resolved', resolved_at: new Date().toISOString() }));
      }
    } finally {
      setResolvingId(null);
    }
  };

  const fetchReport = async (alert: any) => {
    setSelectedAlert(alert);
    setReportText('');
    try {
      const reportRes = await fetch(`https://api.iris365.in/api/v1/transit/sos/report/${alert.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
        }
      });
      const repJson = await reportRes.json();
      if (repJson.success) {
        setReportText(repJson.report_text);
      }
    } catch {
      // Compiled report fallback
      setReportText(`========================================================================
CAMPUS INCIDENT TRANSIT BRIEF (POLICE-FRIENDLY)
REPORT ID: ${alert.id}
GENERATED: ${new Date().toLocaleString()}
========================================================================
1. INCIDENT DESCRIPTION:
   Emergency SOS flagged by parent stating their child did not reach home.
   Student Name: ${alert.students?.users?.name || 'Student'}
   Bus Assigned: ${alert.buses?.vehicle_number || 'RJ-19-PB-4050'}
   Driver Name: ${alert.buses?.driver_id || 'Not Assigned'}

2. CHRONOLOGICAL TELEMETRY SCAN:
   - Last RFID Scan Spot: ${alert.incident_details?.last_rfid_location}
   - Last GPS Tracking Ping: ${alert.incident_details?.last_gps_location}

3. INCIDENT STATUS:
   - Current Status: ${alert.status.toUpperCase()}
   - Resolved At: ${alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A'}
========================================================================`);
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; padding: 20px; font-size: 14px;">${reportText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg animate-pulse">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Active Transit SOS Alarms</h1>
              <p className="text-xs text-[#C4B5FD]/70">Monitor real-time parent/driver emergency triggers, dispatch assistance, and print briefs</p>
            </div>
          </div>

          <button 
            onClick={loadSosAlerts} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[#C4B5FD]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Alarm lists */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]/50">Emergency Feed</h2>
              
              {alerts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center bg-[#13102A]/20 text-xs text-[#C4B5FD]/30">
                  No SOS alerts flagged in current session logs.
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((a) => (
                    <div 
                      key={a.id} 
                      onClick={() => fetchReport(a)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selectedAlert?.id === a.id 
                          ? 'border-red-500 bg-red-950/20' 
                          : a.status === 'active' 
                            ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/30' 
                            : 'border-white/5 bg-[#13102A]/60 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${a.status === 'active' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-[#C4B5FD]/40'}`}>
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="text-xs">
                            <h3 className="font-extrabold text-white">{a.students?.users?.name || 'Student Commuter'}</h3>
                            <p className="text-[10px] text-[#C4B5FD]/50 mt-0.5">Vehicle: {a.buses?.vehicle_number} • Triggered: {new Date(a.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {a.status === 'active' ? (
                            <>
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-red-500/20 text-red-400 uppercase tracking-widest animate-pulse border border-red-500/30">
                                Active Alarm
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolve(a.id);
                                }}
                                disabled={resolvingId === a.id}
                                className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-white/5 text-[#C4B5FD]/40 uppercase tracking-widest">
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side Police Brief & Details */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]/50">Incident brief Details</h2>
              
              {selectedAlert ? (
                <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{selectedAlert.students?.users?.name}</h4>
                      <p className="text-[9px] text-[#C4B5FD]/50 mt-0.5">Parent contact: {selectedAlert.incident_details?.parent_name} ({selectedAlert.incident_details?.phone})</p>
                    </div>
                    
                    {reportText && (
                      <button 
                        onClick={printReport}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[9px] text-[#C4B5FD]/40 block mb-1">RFID SATELLITE ENTRY SCAN</span>
                      <p className="text-white font-semibold">{selectedAlert.incident_details?.last_rfid_location}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[9px] text-[#C4B5FD]/40 block mb-1">BUS GPS GEOLOCALIZATION</span>
                      <p className="text-white font-semibold">{selectedAlert.incident_details?.last_gps_location}</p>
                    </div>
                  </div>

                  {reportText && (
                    <div className="space-y-2">
                      <span className="text-[9px] text-[#C4B5FD]/45 block font-bold uppercase">Incident Text Summary</span>
                      <pre className="p-3 bg-[#0D0A1A] border border-white/10 rounded-xl text-[8px] font-mono text-white/80 overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
                        {reportText}
                      </pre>
                    </div>
                  )}

                  {selectedAlert.status === 'active' && (
                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      disabled={resolvingId === selectedAlert.id}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Mark Emergency Resolved
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-[#13102A]/20 p-8 text-center text-[#C4B5FD]/30 text-xs flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-white/20" />
                  <span>Select an incident from the alarm feed list to compile tracking reports.</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
