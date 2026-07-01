"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, ScanLine, Clock, CalendarDays } from 'lucide-react';
import { apiPost } from '../../../../lib/api';

export default function StudentHostelCheckin() {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode) return;
    
    setLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      const res = await apiPost('/hostel/attendance/mark', { qr_code_secret: qrCode });
      
      if (res && res.success) {
        setStatus('success');
        setMessage(res.message || 'Nightly Check-in marked successfully at ' + currentTime.toLocaleTimeString());
      } else {
        setStatus('failed');
        setMessage(res?.error || 'Check-in failed. Outside of the allowed window (7 PM - 9 PM) or invalid QR.');
      }
    } catch (error) {
      // Fallback for prototype sandbox mode
      const hours = currentTime.getHours();
      if (hours >= 19 && hours <= 21) {
        setStatus('success');
        setMessage('Nightly Check-in marked successfully at ' + currentTime.toLocaleTimeString() + ' (Sandbox Mode)');
      } else {
        setStatus('failed');
        setMessage('Check-in failed. Outside of the allowed window (7 PM - 9 PM).');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-md mx-auto space-y-8 pt-10">
        
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/25">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-white">Hostel Night Check-in</h1>
            <p className="text-sm text-[#C4B5FD]/70 mt-1">Scan the QR code at the Warden's office</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#13102A]/80 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C2BD9]/5 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-center bg-[#0D0A1A] border border-white/10 rounded-xl p-4 mb-8">
             <div className="flex items-center gap-3">
               <Clock className="w-5 h-5 text-[#A78BFA]" />
               <div>
                 <p className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold tracking-wider">Current Time</p>
                 <p className="font-mono font-bold text-white text-sm">{currentTime.toLocaleTimeString()}</p>
               </div>
             </div>
             <div className="flex items-center gap-3 border-l border-white/10 pl-4">
               <CalendarDays className="w-5 h-5 text-[#A78BFA]" />
               <div>
                 <p className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold tracking-wider">Date</p>
                 <p className="font-mono font-bold text-white text-sm">{currentTime.toLocaleDateString()}</p>
               </div>
             </div>
          </div>

          {status === 'idle' && (
            <form onSubmit={handleScan} className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#6C2BD9]/30 rounded-2xl p-8 bg-black/30">
                <QrCode className="w-16 h-16 text-[#6C2BD9]/50 mb-4" />
                <p className="text-xs text-[#C4B5FD]/50 text-center">
                  Camera simulated. Enter the Warden's Check-in Code below.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Enter QR Code Secret..."
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-4 py-4 text-center text-white focus:outline-none focus:border-[#6C2BD9] transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !qrCode}
                className="w-full py-4 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-extrabold tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Mark Attendance</>
                )}
              </button>
            </form>
          )}

          {status === 'success' && (
            <div className="py-8 space-y-4 text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-400">Checked In!</h3>
              <p className="text-sm text-[#C4B5FD]/80">{message}</p>
              <button 
                onClick={() => { setStatus('idle'); setQrCode(''); }}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-[#A78BFA] transition-colors mt-6"
              >
                Reset Scanner
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div className="py-8 space-y-4 text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-lg shadow-rose-500/10">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-rose-400">Check-in Failed</h3>
              <p className="text-sm text-[#C4B5FD]/80">{message}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-[#A78BFA] transition-colors mt-6"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
