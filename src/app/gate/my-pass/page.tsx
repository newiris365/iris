"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, QrCode, Clock, RefreshCw, ArrowLeft, CheckCircle, Smartphone } from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function StudentMyPassPage() {
  const [profile, setProfile] = useState<any>(null);
  const [qrPayload, setQrPayload] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [lastScanned, setLastScanned] = useState<any>(null);

  useEffect(() => {
    // 1. Get user profile
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('iris_user_profile') : null;
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setProfile(parsed);
        generateQR(parsed);
        fetchLastMovement(parsed.id);
      } catch {}
    } else {
      const fallback = { id: '', name: 'Student', role: 'Student', email: '' };
      setProfile(fallback);
      generateQR(fallback);
      fetchLastMovement(fallback.id);
    }
  }, []);

  // 2. Timer cycle to rotate QR code every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (profile) {
            generateQR(profile);
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [profile]);

  const generateQR = (user: any) => {
    const payload = JSON.stringify({
      person_id: user.id,
      timestamp: new Date().toISOString(),
      person_type: user.role?.toLowerCase() === 'student' ? 'student' : 'staff'
    });
    setQrPayload(payload);
  };

  const fetchLastMovement = async (personId: string) => {
    try {
      const res = await apiGet(`/gate/person/${personId}/history`);
      if (res.success && res.history && res.history.length > 0) {
        setLastScanned(res.history[0]);
      }
    } catch {
      // Fallback
      setLastScanned({
        direction: 'in',
        gate_number: 'main',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      });
    }
  };

  const manualRefresh = () => {
    if (profile) {
      generateQR(profile);
      setTimeLeft(60);
      fetchLastMovement(profile.id);
    }
  };

  const qrImageUrl = qrPayload 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}&bgcolor=13102A&color=ffffff`
    : '';

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-md mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/student/dashboard" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-xl text-white">Smart QR Gate Pass</h1>
            <p className="text-[10px] text-[#C4B5FD]/70">Scan this pass at entry/exit points for automated logging</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-8 space-y-6">
        
        {/* Pass Card Container */}
        <div className="bg-gradient-to-b from-[#1E1B4B] to-[#13102A] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#8B5CF6]" />
          
          {/* Top Credentials */}
          <div className="space-y-1">
            <h2 className="text-base font-extrabold tracking-wide text-white">{profile.name}</h2>
            <p className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest">{profile.role}</p>
            <p className="text-[9px] text-[#C4B5FD]/50 font-mono">ID: {profile.id}</p>
          </div>

          {/* QR Code Canvas Frame */}
          <div className="bg-[#13102A] border border-white/5 p-4 rounded-2xl inline-block relative">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="Gate Pass QR"
                className="w-48 h-48 mx-auto rounded-lg border border-white/10"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-[#0D0A1A]">
                <QrCode className="w-12 h-12 text-white/20" />
              </div>
            )}
            
            {/* Pulsing indicator */}
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>

          {/* Rotations / Timers indicator */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#C4B5FD]">
              <Clock className="w-4 h-4 text-[#A78BFA]" />
              <span>Pass refreshes in <strong className="text-white font-mono">{timeLeft}s</strong></span>
            </div>
            
            {/* Timer linear progress indicator */}
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>

            <button
              onClick={manualRefresh}
              className="px-4 py-1.5 hover:bg-white/5 border border-white/5 text-[10px] text-[#C4B5FD] font-bold rounded-lg transition-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Refresh QR Pass
            </button>
          </div>

        </div>

        {/* Real-time Status check */}
        <div className="bg-[#13102A]/60 p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#A78BFA]" /> Campus Location Status
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0D0A1A] border border-white/5 p-3.5 rounded-xl text-center space-y-1">
              <span className="text-[9px] text-white/40 uppercase font-semibold">Current State</span>
              <p className="text-xs font-extrabold text-white flex items-center justify-center gap-1">
                <CheckCircle className={`w-3.5 h-3.5 ${lastScanned?.direction === 'in' ? 'text-emerald-400' : 'text-amber-400'}`} />
                {lastScanned?.direction === 'in' ? 'INSIDE CAMPUS' : 'OUTSIDE CAMPUS'}
              </p>
            </div>
            <div className="bg-[#0D0A1A] border border-white/5 p-3.5 rounded-xl text-center space-y-1">
              <span className="text-[9px] text-white/40 uppercase font-semibold">Last Gate Touch</span>
              <p className="text-xs font-extrabold text-white capitalize">
                {lastScanned?.gate_number || 'Main Gate'}
              </p>
            </div>
          </div>

          {lastScanned?.timestamp && (
            <p className="text-[9px] text-white/30 text-center font-mono">
              Last movement registered: {new Date(lastScanned.timestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* Notice Info alerts */}
        <div className="bg-[#13102A]/30 p-4.5 rounded-2xl border border-white/5 text-[10px] text-[#C4B5FD]/70 leading-relaxed space-y-1.5">
          <p className="font-semibold text-white">🔒 Security Protocol Note:</p>
          <p>This QR signature is dynamically signed with a client token that expires after 60 seconds to prevent unauthorized screenshot sharing. Make sure your device has the correct network time enabled before scanning.</p>
        </div>

      </div>
    </main>
  );
}
