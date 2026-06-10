"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, MapPin, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [markedStatus, setMarkedStatus] = useState<string | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const scanQrForAttendance = () => {
    setIsScanning(true);
    setMarkedStatus(null);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      setIsScanning(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoordinates({ lat: latitude, lng: longitude });

        try {
          const response = await fetch('/api/v1/core/attendance/mark', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
            },
            body: JSON.stringify({
              student_id: profile?.id || "student-uuid-placeholder",
              session_id: "session-uuid-placeholder",
              latitude,
              longitude,
              device_id: "web-client"
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to log attendance");
          }

          setMarkedStatus("Present");
        } catch (err: any) {
          setErrorMsg(err.message || "Attendance validation failed.");
        } finally {
          setIsScanning(false);
        }
      },
      (error) => {
        setErrorMsg("Failed to retrieve GPS coordinates. Ensure location access is enabled.");
        setIsScanning(false);
      }
    );
  };

  if (!profile) return <div className="p-8 text-center text-xs text-[#C4B5FD]">Loading session...</div>;

  return (
    <div className="max-w-4xl mx-auto py-6 w-full flex flex-col gap-6">
      <div className="glass-panel rounded-3xl p-8 flex flex-col gap-6">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Smart Attendance Scanner</h2>
          <p className="text-xs text-[#C4B5FD] mt-1 font-light">Mark attendance instantly by sharing your location coordinate vector with the college portal.</p>
        </div>

        <div className="flex flex-col items-center justify-center border border-dashed border-[#6C2BD9]/30 rounded-2xl p-10 bg-black/20 text-center">
          {markedStatus === "Present" ? (
            <div className="flex flex-col items-center gap-3 text-emerald-400">
              <CheckCircle className="w-16 h-16 animate-bounce" />
              <h3 className="font-heading font-bold text-lg text-white">Attendance Verified!</h3>
              <p className="text-xs text-[#C4B5FD] font-light">Status logged: PRESENT (Method: Web Geo-fenced QR check-in)</p>
            </div>
          ) : (
            <>
              <QrCode className="w-20 h-20 text-[#A78BFA] mb-4" />
              <button 
                onClick={scanQrForAttendance}
                disabled={isScanning}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-heading font-bold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isScanning ? "Retrieving GPS Location..." : "Scan & Check-In"}
              </button>
            </>
          )}

          {gpsCoordinates && (
            <div className="text-[10px] font-mono text-[#C4B5FD]/70 mt-4 flex items-center gap-1.5 justify-center">
              <MapPin className="w-3.5 h-3.5" /> Latitude: {gpsCoordinates.lat.toFixed(5)} | Longitude: {gpsCoordinates.lng.toFixed(5)}
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 justify-center">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
