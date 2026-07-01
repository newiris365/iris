"use client";

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, CreditCard, ShieldCheck, Megaphone } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function CollegeMessPage() {
  const [isHosteller, setIsHosteller] = useState(false);
  const [walletBalance, setWalletBalance] = useState(350); // Default mock balance
  const [claimed, setClaimed] = useState(false);
  const [tokenCode, setTokenCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latestNotice, setLatestNotice] = useState<string>("");

  // Meal timing sessions
  const getMealSession = () => {
    const hours = currentTime.getHours();
    if (hours >= 7 && hours < 10) return { name: "Breakfast", hours: "07:00 AM - 10:00 AM", menu: "Idli Sambar, Bread Butter, Tea/Coffee" };
    if (hours >= 12 && hours < 15) return { name: "Lunch", hours: "12:00 PM - 03:00 PM", menu: "Paneer Butter Masala, Roti, Rice, Dal, Salad, Curd" };
    if (hours >= 19 && hours < 22) return { name: "Dinner", hours: "07:00 PM - 10:00 PM", menu: "Veg Kofta, Roti, Jeera Rice, Dal Fry, Sweet Halwa" };
    return { name: "Snacks / Closed", hours: "Mess Counter is Closed", menu: "No active meal session. Next session: Breakfast at 7:00 AM" };
  };

  const session = getMealSession();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadData();
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      // Fetch latest notice
      try {
        const noticeRes = await apiGet('/hostel/mess-notices/latest');
        if (noticeRes && noticeRes.success && noticeRes.notice) {
          setLatestNotice(noticeRes.notice.message);
        } else {
          setLatestNotice("Dinner will be served at 8:30 PM today due to maintenance.");
        }
      } catch {
        setLatestNotice("Dinner will be served at 8:30 PM today due to maintenance.");
      }

      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.id || user?.student_id;

      const url = studentId ? `/hostel/allocations?studentId=${studentId}` : '/hostel/allocations';
      const res = await apiGet(url);
      if (res && res.success && res.allocations && res.allocations.length > 0) {
        setIsHosteller(true);
      } else {
        // Fallback for mock sandbox profiles
        if (user && (user.email === 'khushal@gmail.com' || user.email === 'khushal@iris365.edu')) {
          setIsHosteller(true);
        } else {
          setIsHosteller(false);
        }
      }
    } catch {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user && (user.email === 'khushal@gmail.com' || user.email === 'khushal@iris365.edu')) {
        setIsHosteller(true);
      } else {
        setIsHosteller(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimMeal = () => {
    if (!isHosteller) {
      if (walletBalance < 100) {
        alert("Insufficient wallet balance. Please add money to your Campus Wallet first.");
        return;
      }
      setWalletBalance(prev => prev - 100);
    }
    
    // Generate a unique token
    const uniqueToken = "MESS_" + (isHosteller ? "HOST_" : "DAY_") + Math.random().toString(36).substr(2, 9).toUpperCase();
    setTokenCode(uniqueToken);
    setClaimed(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#6C2BD9] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-white">College Mess</h1>
            <p className="text-sm text-[#C4B5FD]/70">Daily student meals portal</p>
          </div>
        </div>

        {/* Notices Broadcast Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-amber-400 font-bold text-sm">Warden Mess notice</h3>
            <p className="text-xs text-amber-400/80 mt-1">{latestNotice}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: User Status & Session details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Status Card */}
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#C4B5FD]/60 uppercase tracking-wider font-bold">Student Status</p>
                <h3 className="text-lg font-bold text-white mt-1">
                  {isHosteller ? "Hosteller (Resident)" : "Day Scholar"}
                </h3>
              </div>
              <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${
                isHosteller 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-[#6C2BD9]/10 border-[#6C2BD9]/20 text-[#A78BFA]"
              }`}>
                {isHosteller ? "Free Meal Access" : "₹100 / Meal"}
              </div>
            </div>

            {/* Session Card */}
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#A78BFA]" /> Current Meal Session
                </h3>
                <span className="px-3 py-1 rounded-full bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 text-xs font-bold text-[#A78BFA]">
                  {session.name}
                </span>
              </div>
              
              <div className="bg-[#0D0A1A] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-xs text-[#C4B5FD]/60 font-semibold">Session Timings</span>
                <span className="text-xs font-mono font-bold text-white">{session.hours}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider mb-2">Today's Menu</h4>
                <p className="text-sm text-[#C4B5FD]/80 leading-relaxed bg-[#0D0A1A] p-4 rounded-xl border border-white/5">
                  {session.menu}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Claim Meal Card */}
          <div className="space-y-6">
            
            {/* Wallet for day scholars */}
            {!isHosteller && (
              <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#A78BFA]" />
                  <div>
                    <p className="text-[10px] text-[#C4B5FD]/50 uppercase font-bold">Wallet Balance</p>
                    <p className="text-base font-extrabold text-white">₹{walletBalance}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Claim widget */}
            <div className="rounded-2xl border border-white/5 bg-[#13102A]/60 p-6 text-center space-y-6">
              {!claimed ? (
                <>
                  <h3 className="font-bold text-white">Claim Your Meal</h3>
                  <p className="text-xs text-[#C4B5FD]/60 leading-relaxed">
                    {isHosteller 
                      ? "As a hosteller, you can generate a free meal token to present at the mess counter." 
                      : "Deduct ₹100 from your campus wallet to purchase a meal slip."
                    }
                  </p>

                  <button
                    onClick={handleClaimMeal}
                    disabled={session.name.includes("Closed")}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-white font-extrabold transition-all shadow-lg disabled:opacity-50"
                  >
                    {isHosteller ? "Claim Free Token" : "Pay ₹100 & Get Token"}
                  </button>
                </>
              ) : (
                <div className="space-y-4 flex flex-col items-center">
                  <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 justify-center">
                    <ShieldCheck className="w-5 h-5" /> Token Generated
                  </h3>
                  <div className="bg-[#0D0A1A] p-4 rounded-xl border border-white/10 shadow-2xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${tokenCode}&bgcolor=0D0A1A&color=A78BFA`}
                      alt="Meal QR Token"
                      className="w-40 h-40 rounded-lg"
                    />
                  </div>
                  <p className="text-xs font-mono text-[#C4B5FD]/50">{tokenCode}</p>
                  <p className="text-[10px] text-[#C4B5FD]/40 leading-relaxed">
                    Show this QR code at the mess counter to scan and claim your meal.
                  </p>
                  
                  <button
                    onClick={() => setClaimed(false)}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-[#A78BFA] transition-all"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
