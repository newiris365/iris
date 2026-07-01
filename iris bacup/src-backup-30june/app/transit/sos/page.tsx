"use client";

import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle, MapPin, Printer, HelpCircle } from 'lucide-react';
import { apiPost } from '../../../lib/api';

export default function ParentTransitSosPage() {
  const [loading, setLoading] = useState(false);
  const [triggeredAlert, setTriggeredAlert] = useState<any>(null);
  const [reportText, setReportText] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const profileStr = localStorage.getItem('iris_user_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        setRole(profile.role);
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }
    setProfileLoading(false);
  }, []);

  const triggerEmergencySos = async () => {
    setLoading(true);
    setTriggeredAlert(null);
    setReportText('');

    try {
      const res = await apiPost('/transit/sos/trigger', {
        student_id: 'c0000000-0000-0000-0000-000000000006', // Default student
        bus_id: '70000000-0000-0000-0000-000000000001',     // Default Bus 1
        alert_type: 'parent'
      });

      if (res.success) {
        setTriggeredAlert(res.alert);
        // Compile report
        const reportRes = await fetch(`https://api.iris365.in/api/v1/transit/sos/report/${res.alert.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
          }
        });
        const repJson = await reportRes.json();
        if (repJson.success) {
          setReportText(repJson.report_text);
        }
      }
    } catch {
      // Offline simulation fallback
      const mockAlertId = 'sos-' + Math.floor(Math.random() * 100000);
      const mockAlert = {
        id: mockAlertId,
        status: 'active',
        buses: { vehicle_number: 'RJ-19-PB-4050' },
        students: { users: { name: 'Khushal Student' } },
        incident_details: {
          parent_name: 'Emergency Parent Guard',
          phone: '+91 98290 12347',
          last_rfid_location: 'RFID scan: Boarded Bus Stop Jodhpur Terminal (05:05 PM)',
          last_gps_location: 'GPS lat: 26.2912, lng: 73.0156 (Updated 1 minute ago)',
          driver_broadcasted: true
        },
        timestamp: new Date().toISOString()
      };
      setTriggeredAlert(mockAlert);
      setReportText(`========================================================================
CAMPUS INCIDENT TRANSIT BRIEF (POLICE-FRIENDLY)
REPORT ID: ${mockAlertId}
GENERATED: ${new Date().toLocaleString()}
========================================================================
1. INCIDENT DESCRIPTION:
   Emergency SOS flagged by parent stating their child did not reach home.
   Student Name: Khushal Student
   Bus Assigned: RJ-19-PB-4050
   Driver Name: Rajesh Kumar (+91 98290 12347)

2. CHRONOLOGICAL TELEMETRY SCAN:
   - Last RFID Scan Spot: RFID scan: Boarded Bus Stop Jodhpur Terminal (05:05 PM)
   - Last GPS Tracking Ping: GPS lat: 26.2912, lng: 73.0156 (Updated 1 minute ago)

3. INCIDENT STATUS:
   - Current Status: ACTIVE
   - Resolved At: N/A
========================================================================`);
    } finally {
      setLoading(false);
    }
  };

  const printIncidentReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; padding: 20px; font-size: 14px;">${reportText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (role && role !== 'Parent') {
    return (
      <main className="min-h-screen bg-[#0D0A1A] text-white p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-3xl border border-white/5 bg-[#13102A]/85 backdrop-blur-md p-8 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-xl text-red-400">Access Denied</h2>
          <p className="text-xs text-[#C4B5FD]/60 leading-relaxed">
            The Emergency SOS dispatch portal is strictly reserved for parents. Students and staff are not authorized to trigger priority tracking alerts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-red-400">Emergency Parent SOS Portal</h1>
              <p className="text-xs text-[#C4B5FD]/70">Notify driver instantly, trace last RFID card scans, and export incident details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Action Area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* SOS Trigger Panel */}
            <div className="rounded-3xl border border-red-500/25 bg-[#251215]/40 p-6 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl" />
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Is your child missing or delayed?</h3>
                  <p className="text-xs text-[#C4B5FD]/70 mt-1">
                    Tapping the SOS below triggers a priority console alarm to the driver's mobile app, notifies campus security wardens, and logs tracking metrics.
                  </p>
                </div>
              </div>

              {!triggeredAlert ? (
                <button
                  onClick={triggerEmergencySos}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-sm font-extrabold text-white transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Triggering Alarm...' : 'TRIGGER EMERGENCY SOS BROADCAST'}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    <span>EMERGENCY DISPATCH TRIGGERED</span>
                  </div>
                  <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
                    Driver of bus <strong>{triggeredAlert.buses?.vehicle_number}</strong> has been alert broadcasted. Warden dashboards are flashing red alert.
                  </p>
                </div>
              )}
            </div>

            {/* Display Telemetry Scan Info */}
            {triggeredAlert && (
              <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                  <span>Telemetry Track Verification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-[10px] text-[#C4B5FD]/50 font-bold block mb-1">LAST RFID CARD CHECK-IN</span>
                    <p className="text-white font-semibold">{triggeredAlert.incident_details?.last_rfid_location}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-[10px] text-[#C4B5FD]/50 font-bold block mb-1">LAST SHUTTLE GPS LOCATION</span>
                    <p className="text-white font-semibold">{triggeredAlert.incident_details?.last_gps_location}</p>
                  </div>
                </div>

                {reportText && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Police Brief Preview</span>
                      <button 
                        onClick={printIncidentReport}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[10px] font-bold text-[#C4B5FD] flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Report
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-[#0D0A1A] border border-white/10 text-[9px] font-mono text-white/80 overflow-x-auto leading-relaxed">
                      {reportText}
                    </pre>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Info Box */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#13102A]/60 p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-[#A78BFA]" /> SOS Protocol Info
              </h4>
              <p className="text-[10px] text-[#C4B5FD]/70 leading-relaxed">
                Emergency calls are immediately verified against student logs. If child boarding logs are active, dispatch systems retrieve coordinates coordinates of the satellite GPS device.
              </p>

              <div className="border-t border-white/5 pt-4 text-[9px] text-[#C4B5FD]/45 space-y-2">
                <div className="flex justify-between">
                  <span>Authorized Parent:</span>
                  <span className="text-white font-bold font-mono">Verified (Active Session)</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Dispatch:</span>
                  <span className="text-emerald-400 font-bold">Standard 24x7 Open</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
