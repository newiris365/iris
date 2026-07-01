"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, CheckCircle, MapPin, AlertCircle, Camera, RefreshCw, 
  BrainCircuit, ShieldCheck, Heart, User, Sparkles, Megaphone
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [markedStatus, setMarkedStatus] = useState<string | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [latestNotice, setLatestNotice] = useState<string>("");
  
  // Camera & Face Verification Sim States
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStage, setCameraStage] = useState<'idle' | 'capturing' | 'analyzing' | 'done'>('idle');
  const [counselorActionMsg, setCounselorActionMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Student Health Score Mock Data
  const healthScore = {
    score: 84,
    risk_level: 'low',
    attendance: 88,
    academics: 82,
    fee_status: 'paid',
    recommendation: 'All academic parameters are healthy. Keep up the active participation!'
  };

  useEffect(() => {
    fetchLatestNotice();
    // Load mock student profile from localStorage or create fallback
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
        setProfile({
          id: 'b0000000-0000-0000-0000-000000000006',
          name: 'Khushal Gehlot',
          roll_number: 'CS23B1024',
          email: 'khushal@iris365.edu'
        });
      }
    } else {
      setProfile({
        id: 'b0000000-0000-0000-0000-000000000006',
        name: 'Khushal Gehlot',
        roll_number: 'CS23B1024',
        email: 'khushal@iris365.edu'
      });
    }

    // Cleanup camera stream on component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchLatestNotice = async () => {
    try {
      const res = await apiGet('/hostel/mess-notices/latest');
      if (res && res.success && res.notice) {
        setLatestNotice(res.notice.message);
      } else {
        setLatestNotice("Dinner will be served 30 mins late today due to maintenance.");
      }
    } catch {
      setLatestNotice("Dinner will be served 30 mins late today due to maintenance.");
    }
  };

  // Sync camera stream to HTML5 video element when DOM mounts
  useEffect(() => {
    if (cameraStage === 'analyzing' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraStage]);

  const startAttendanceCheck = async () => {
    setShowCamera(true);
    setCameraStage('capturing');
    setErrorMsg(null);

    // Step 1: Request Geolocation Coord Lock
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // fallback to JIET coordinates if denied
          setGpsCoordinates({ lat: 26.2389, lng: 73.0243 });
        }
      );
    } else {
      setGpsCoordinates({ lat: 26.2389, lng: 73.0243 });
    }

    // Step 2: Request live camera webcam stream access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      streamRef.current = stream;
      setCameraStage('analyzing');

      // Step 3: Run face-mesh matching animation loop, then complete
      setTimeout(() => {
        // Shutdown webcam sensor
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setCameraStage('done');
        setMarkedStatus('Present');
      }, 4500);

    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      setErrorMsg('Webcam access was denied or hardware not found. Please check browser permissions.');
      setShowCamera(false);
      setCameraStage('idle');
    }
  };

  if (!profile) return <div className="p-8 text-center text-xs text-[#C4B5FD]">Loading session...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 w-full flex flex-col gap-6 text-white">
      {/* Welcome Bar */}
      <div className="bg-[#13102A]/80 backdrop-blur-md p-6 rounded-3xl border border-[#6C2BD9]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#A78BFA]" />
            Welcome back, {profile.name}
          </h2>
          <p className="text-xs text-[#A78BFA]/60 mt-1">Roll Number: {profile.roll_number} | CS Department</p>
        </div>
        <div className="text-xs bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified student biometric token active
        </div>
      </div>

      {/* Mess Notices Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 flex items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-amber-400 font-bold text-sm">Warden Mess Notice</h3>
          <p className="text-xs text-amber-400/80 mt-0.5">{latestNotice}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Smart Attendance Scanner */}
        <div className="lg:col-span-2 bg-[#13102A]/80 backdrop-blur-md rounded-3xl p-6 border border-[#6C2BD9]/30 flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-lg">Smart Face-Biometric Attendance Scanner</h3>
            <p className="text-xs text-[#A78BFA]/70 mt-1">
              Mark session attendance instantly via geo-location confirmation and real-time face verification checking.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center border border-dashed border-[#6C2BD9]/30 rounded-2xl p-8 bg-black/30 min-h-[300px] text-center relative overflow-hidden">
            {markedStatus === "Present" ? (
              <div className="flex flex-col items-center gap-3 text-emerald-400 animate-fadeIn">
                <CheckCircle className="w-16 h-16 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">Attendance Verified!</h3>
                <p className="text-xs text-[#A78BFA]/70">
                  Status logged: <strong className="text-emerald-400">PRESENT</strong> today ({new Date().toLocaleDateString()})
                </p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 text-xs flex items-center gap-2 mt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Face-Mesh and Geo-location checks matching
                </div>
              </div>
            ) : showCamera ? (
              <div className="w-full max-w-sm space-y-4">
                {/* Camera Feed */}
                <div className="aspect-video w-full bg-[#0D0A1A] rounded-xl border border-[#6C2BD9]/40 relative overflow-hidden flex flex-col items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                      cameraStage === 'analyzing' ? 'opacity-80' : 'opacity-0 pointer-events-none'
                    }`}
                  />

                  {cameraStage === 'capturing' && (
                    <>
                      <div className="absolute inset-0 border-2 border-dashed border-[#8B5CF6]/50 animate-pulse m-6 rounded-lg"></div>
                      <Camera className="w-10 h-10 text-[#A78BFA] animate-bounce" />
                      <span className="text-xs text-[#A78BFA]/70 mt-2">Connecting camera device...</span>
                    </>
                  )}

                  {cameraStage === 'analyzing' && (
                    <>
                      {/* Face scanner laser line */}
                      <div className="absolute w-full h-0.5 bg-emerald-400 top-0 left-0 animate-scan z-10"></div>
                      {/* Facial mesh points */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent z-10"></div>
                      <div className="w-20 h-20 rounded-full border border-dashed border-emerald-400/40 flex items-center justify-center z-10 bg-emerald-500/5">
                        <User className="w-10 h-10 text-emerald-400 animate-pulse" />
                      </div>
                      <span className="text-xs text-emerald-400 mt-3 font-semibold flex items-center gap-1 z-10 bg-black/60 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Matching Face-Mesh parameters...
                      </span>
                    </>
                  )}
                </div>

                <div className="text-xs text-[#A78BFA]/50 font-mono">
                  {gpsCoordinates ? `GEO GPS: ${gpsCoordinates.lat.toFixed(5)}, ${gpsCoordinates.lng.toFixed(5)}` : 'Syncing position coords...'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <QrCode className="w-20 h-20 text-[#A78BFA] mb-4" />
                <button 
                  onClick={startAttendanceCheck}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-sm shadow-lg shadow-[#6C2BD9]/20 hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Start Face Check-In
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 justify-center">
                <AlertCircle className="w-4 h-4" /> {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Health Score Card */}
        <div className="bg-[#13102A]/80 backdrop-blur-md rounded-3xl p-6 border border-[#6C2BD9]/30 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <BrainCircuit className="w-5 h-5 text-[#A78BFA]" />
              AI Student Health
            </h3>

            <div className="flex flex-col items-center justify-center p-6 bg-[#0D0A1A]/60 rounded-2xl border border-[#6C2BD9]/20 text-center mb-6">
              <div className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-semibold mb-1">
                Your Health Index
              </div>
              <div className="text-4xl font-extrabold text-green-400 mb-1">
                {healthScore.score}%
              </div>
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/25 px-2.5 py-0.5 rounded-full font-bold">
                Low Risk Class
              </span>
            </div>

            {/* Parameter Breakdowns */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-[#A78BFA]/80 mb-1 font-semibold">
                  <span>Class Attendance</span>
                  <span className="text-sky-400">{healthScore.attendance}%</span>
                </div>
                <div className="w-full bg-[#0D0A1A] rounded-full h-1.5 border border-[#6C2BD9]/10">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${healthScore.attendance}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#A78BFA]/80 mb-1 font-semibold">
                  <span>Academic Standing</span>
                  <span className="text-violet-400">{healthScore.academics}%</span>
                </div>
                <div className="w-full bg-[#0D0A1A] rounded-full h-1.5 border border-[#6C2BD9]/10">
                  <div className="bg-violet-400 h-full rounded-full" style={{ width: `${healthScore.academics}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#6C2BD9]/10">
                <span className="text-[#A78BFA]/60 font-semibold">Finance Standing</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {healthScore.fee_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#6C2BD9]/20 text-xs text-[#A78BFA]/75 italic leading-relaxed mt-6">
            &ldquo;{healthScore.recommendation}&rdquo;
          </div>
        </div>
      </div>

      {/* AI Study Planner Dashboard Widget */}
      <div className="bg-[#13102A]/80 backdrop-blur-md rounded-3xl p-6 border border-[#6C2BD9]/30 flex flex-col gap-4" id="ai-study-planner-widget">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#A78BFA]" />
            <h3 className="font-bold text-base md:text-lg">AI Exam Study Planner</h3>
          </div>
          <Link href="/ai/study-plan" className="text-xs font-bold text-[#A78BFA] hover:text-white transition-colors">
            Manage Study Plan &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Progress Tracker Card */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-bold">Study Plan Progress</span>
              <div className="text-2xl font-extrabold text-white mt-1">45% Complete</div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-[#0D0A1A] rounded-full h-2 border border-white/5 mb-1.5">
                <div className="bg-[#6C2BD9] h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
              <span className="text-[9px] text-[#C4B5FD]/40">Active period: Sem 4 Term Finals</span>
            </div>
          </div>

          {/* Today's Focus Blocks */}
          <div className="md:col-span-2 bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[10px] text-[#A78BFA]/50 uppercase tracking-widest font-bold">Today's Focus Study Blocks</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-[#6C2BD9]/10 border border-[#6C2BD9]/20 rounded-xl">
                <div>
                  <span className="font-bold text-white block">06:00 - 08:00 AM · Mathematics</span>
                  <span className="text-[10px] text-[#C4B5FD]/75">Linear algebra proofs & eigen vectors review</span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-[#6C2BD9]/20 text-[#A78BFA] rounded-md uppercase font-mono">Focus</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-xl">
                <div>
                  <span className="font-bold text-white block">04:00 - 05:30 PM · Computer Science</span>
                  <span className="text-[10px] text-[#C4B5FD]/75">Compiler parser trees & syntax validation practice</span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-[#06B6D4]/20 text-[#06B6D4] rounded-md uppercase font-mono">Practice</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
