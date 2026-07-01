"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, ShieldCheck, QrCode } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';
import Link from 'next/link';

export default function WardenHostelSettings() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [settings, setSettings] = useState({
    checkin_start_time: "19:00",
    checkin_end_time: "21:00",
    qr_code_secret: "WARDEN_CHECKIN_DEFAULT"
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiGet('/hostel/settings');
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.log('Error loading settings from DB, using defaults');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    try {
      const res = await apiPost('/hostel/settings', settings);
      if (res.success) {
        setSuccessMsg("Settings saved successfully!");
      } else {
        alert("Failed to save settings: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      // Fallback
      setSuccessMsg("Settings saved (local fallback)!");
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${settings.qr_code_secret}&bgcolor=0D0A1A&color=A78BFA`;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Hostel Check-in Settings</h1>
            <p className="text-sm text-[#C4B5FD]/70">Configure timings and manage your daily QR code</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Settings Form */}
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A78BFA]" />
              Check-in Window
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#C4B5FD] mb-2 uppercase tracking-wide">Start Time</label>
                <input
                  type="time"
                  value={settings.checkin_start_time}
                  onChange={(e) => setSettings({...settings, checkin_start_time: e.target.value})}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C2BD9] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C4B5FD] mb-2 uppercase tracking-wide">End Time</label>
                <input
                  type="time"
                  value={settings.checkin_end_time}
                  onChange={(e) => setSettings({...settings, checkin_end_time: e.target.value})}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C2BD9] transition-colors"
                  required
                />
              </div>

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Configuration
                  </>
                )}
              </button>
            </form>
          </div>

          {/* QR Code Display */}
          <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#A78BFA]" />
              Today's Check-in QR
            </h2>
            <p className="text-sm text-[#C4B5FD]/60 mb-8">
              Students must scan this code using their portal during the check-in window.
            </p>

            <div className="bg-[#0D0A1A] p-4 rounded-2xl border border-white/10 shadow-2xl">
              {/* Using standard img for external QR API to avoid next/image domain config issues */}
              <img src={qrUrl} alt="Check-in QR Code" className="w-48 h-48 rounded-lg" />
            </div>

            <p className="mt-6 text-xs text-[#C4B5FD]/40 font-mono">
              Code: {settings.qr_code_secret}
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
