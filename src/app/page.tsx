"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  BookOpen, 
  Coffee, 
  Dumbbell, 
  Home, 
  Key, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Bot, 
  ChevronRight, 
  CreditCard, 
  Users, 
  CheckCircle,
  Activity,
  Terminal,
  Zap,
  Globe,
  GraduationCap
} from 'lucide-react';

const MODULES = [
  {
    icon: Shield,
    title: "Campus Core",
    desc: "Smart QR/Biometric attendance, printable RFID Digital IDs, and class auto-schedulers.",
    color: "from-blue-500 to-indigo-600",
    badge: "v1 Core"
  },
  {
    icon: Coffee,
    title: "Cashless Canteen",
    desc: "Pre-order meal passes, real-time menu allergy tags, and Express Queue pickup alerts.",
    color: "from-amber-500 to-orange-600",
    badge: "Cashless"
  },
  {
    icon: Dumbbell,
    title: "FitZone Module",
    desc: "Trainer-led gym slot scheduling, conflict-free bookings, and equipment service logs.",
    color: "from-emerald-500 to-teal-600",
    badge: "Wellness"
  },
  {
    icon: Home,
    title: "Hostel Warden Desk",
    desc: "Warden blocks mapping, automated room allocations, and maintenance logs.",
    color: "from-purple-500 to-pink-600",
    badge: "Residential"
  },
  {
    icon: Key,
    title: "Smart Gate Security",
    desc: "Guard entry-log override, visitor guest passes, and instant incident logging.",
    color: "from-rose-500 to-red-600",
    badge: "Harden Security"
  },
  {
    icon: BookOpen,
    title: "Library+",
    desc: "Search index catalogs, late fee returns, and real-time available stock checks.",
    color: "from-cyan-500 to-blue-600",
    badge: "Academic"
  },
  {
    icon: Calendar,
    title: "Events Hub",
    desc: "Public ticketing, volunteer tasks allocations, and coordinator dashboards.",
    color: "from-violet-500 to-fuchsia-600",
    badge: "Social"
  },
  {
    icon: MapPin,
    title: "Transit Tracker",
    desc: "Interactive Leaflet maps tracking active bus coordinate streams in real-time.",
    color: "from-teal-500 to-emerald-600",
    badge: "Realtime GPS"
  },
  {
    icon: TrendingUp,
    title: "Director Dashboard",
    desc: "Advanced multi-tenant financial insights, attendance dips, and fee collection summaries.",
    color: "from-indigo-500 to-violet-600",
    badge: "Analytics"
  },
  {
    icon: Bot,
    title: "AI Concierge",
    desc: "Institutional natural-language helper answers schedules, fees, and marks dynamically.",
    color: "from-fuchsia-500 to-rose-600",
    badge: "LLM Helper"
  }
];

const MOCK_LOGS = [
  { type: "ATTENDANCE", text: "Student 23CSE051 scanned Rotating QR: Present in DBMS", time: "Just now" },
  { type: "PAYMENT", text: "Canteen Wallet top-up of INR 500 via Razorpay successful", time: "1m ago" },
  { type: "SECURITY", text: "Gate 1 RFID scan: Visitor Pass #4092 checked-in", time: "3m ago" },
  { type: "HOSTEL", text: "Warden Jaswant Singh approved plumbing complaint for Room A-101", time: "5m ago" },
  { type: "TRANSIT", text: "Bus RJ19-PA-1024 GPS telemetry packet broadcasted: Speed 45km/h", time: "8m ago" },
  { type: "AI", text: "AI Assistant resolved student timetable query in 320ms", time: "10m ago" }
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [pricingStudents, setPricingStudents] = useState(500);
  const [pricingTier, setPricingTier] = useState("Campus");
  const [liveLogs, setLiveLogs] = useState(MOCK_LOGS);

  // Simulate incoming real-time telemetry logs
  useEffect(() => {
    const timer = setInterval(() => {
      const logTypes = ["ATTENDANCE", "PAYMENT", "SECURITY", "HOSTEL", "TRANSIT", "AI"];
      const rollNums = ["23CSE051", "23CSE052", "23ECE012", "23ME005"];
      const type = logTypes[Math.floor(Math.random() * logTypes.length)];
      let text = "";

      switch(type) {
        case "ATTENDANCE":
          text = `Student ${rollNums[Math.floor(Math.random() * rollNums.length)]} checked-in via Biometric: Present`;
          break;
        case "PAYMENT":
          text = `Canteen Order #${Math.floor(Math.random() * 9000 + 1000)} generated: INR ${Math.floor(Math.random() * 200 + 40)} via Wallet`;
          break;
        case "SECURITY":
          text = `Gate pass check-out logged for student ${rollNums[Math.floor(Math.random() * rollNums.length)]}`;
          break;
        case "HOSTEL":
          text = `Gym booking slot atomic allocation complete for user ${rollNums[Math.floor(Math.random() * rollNums.length)]}`;
          break;
        case "TRANSIT":
          text = `GPS coordinate updated: Lat ${26.29 + (Math.random() - 0.5) * 0.01}, Long ${73.02 + (Math.random() - 0.5) * 0.01}`;
          break;
        case "AI":
          text = `AI Concierge processed query semantic check: pgvector match threshold 0.82`;
          break;
      }

      setLiveLogs(prev => [
        { type, text, time: "Just now" },
        ...prev.map(p => ({ ...p, time: p.time === "Just now" ? "1m ago" : p.time.includes("m") ? `${parseInt(p.time) + 1}m ago` : p.time })).slice(0, 5)
      ]);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Compute mock monthly cost based on selected parameters
  const calculateCost = () => {
    let ratePerStudent = 12;
    if (pricingTier === "Seed") ratePerStudent = 8;
    if (pricingTier === "University") ratePerStudent = 15;
    if (pricingTier === "Enterprise") ratePerStudent = 20;

    return (pricingStudents * ratePerStudent).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR'
    });
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Radial backdrop glows */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#6C2BD9]/10 blur-3xl -top-100 -left-100 pointer-events-none"></div>
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#06B6D4]/5 blur-3xl top-[40%] right-[-20%] pointer-events-none"></div>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#EC4899]/5 blur-3xl bottom-[-10%] left-[-10%] pointer-events-none"></div>

      {/* Navigation Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#0D0A1A]/70 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C2BD9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg tracking-tight">IRIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6]">365</span></span>
            <span className="block text-[8px] text-[#C4B5FD]/50 font-mono tracking-widest uppercase">Campus OS</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#C4B5FD]/75">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#simulator" className="hover:text-white transition-colors">Console</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/home" className="flex items-center gap-1.5 text-[#06B6D4] hover:text-white transition-colors font-semibold">
            <GraduationCap className="w-4 h-4" /> Apply Now
          </Link>
          <span className="text-white/10">|</span>
          <span className="text-[10px] font-mono bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-[#C4B5FD] px-2.5 py-1 rounded-full uppercase tracking-wider">SIET Jodhpur</span>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login?fresh=1" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold tracking-wide transition-all">
            Dashboard Sign In
          </Link>
          <Link href="/login?fresh=1" className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-xs font-bold tracking-wide transition-all shadow-md shadow-[#6C2BD9]/20">
            Launch Portal →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6C2BD9]/10 border border-[#6C2BD9]/30 text-[#C4B5FD] text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Integrated Campus Management System</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none max-w-4xl">
          The Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] via-[#8B5CF6] to-[#EC4899]">Operating System</span> of the Future
        </h1>

        <p className="text-sm sm:text-lg text-[#C4B5FD]/70 mt-6 max-w-2xl font-light leading-relaxed">
          IRIS 365 automates operations, cashless transactions, live transit, and AI concierge services for modern universities under a unified multi-tenant architecture.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link href="/home" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] text-white font-bold text-sm shadow-xl shadow-[#06B6D4]/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            <GraduationCap className="w-4 h-4" /> Apply for Admissions
          </Link>
          <Link href="/login?fresh=1" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all">
            Management Console →
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 text-[#C4B5FD]/70 font-medium text-sm transition-all">
            Explore Modules
          </a>
        </div>
      </section>

      {/* Admissions Banner */}
      <section className="relative z-10 px-6 py-6 max-w-6xl mx-auto w-full">
        <Link href="/home" className="block group">
          <div className="relative overflow-hidden rounded-2xl border border-[#06B6D4]/30 bg-gradient-to-r from-[#06B6D4]/10 via-[#8B5CF6]/10 to-[#EC4899]/10 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-[#06B6D4]/60 transition-all duration-300">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/5 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#06B6D4]/20 shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Admissions Open</span>
                  <span className="text-[9px] font-mono text-[#C4B5FD]/40 uppercase tracking-wider">2026–27 Cycle</span>
                </div>
                <h3 className="font-heading font-bold text-white text-lg group-hover:text-[#06B6D4] transition-colors">Apply for Admissions at SIET Jodhpur</h3>
                <p className="text-xs text-[#C4B5FD]/60 mt-0.5">Register, choose programs, upload documents and pay fees — all in one place.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] text-white font-bold text-sm shadow-lg shadow-[#06B6D4]/20 group-hover:brightness-110 transition-all">
              Start Application <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="relative z-10 px-6 py-20 bg-[#120F26]/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">Consolidated Core Modules</h2>
            <p className="text-[#C4B5FD]/60 text-xs mt-2 max-w-md mx-auto">Every aspect of institutional lifecycle handled atomically with hardened multi-tenant role-based RLS isolation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((mod, index) => {
              const IconComponent = mod.icon;
              return (
                <div key={index} className="glass-panel hover:border-[#06B6D4]/50 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-white/5 border border-white/10 text-[#C4B5FD] px-2 py-0.5 rounded-md">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white group-hover:text-[#06B6D4] transition-colors">{mod.title}</h3>
                  <p className="text-[#C4B5FD]/75 text-xs mt-2 leading-relaxed font-light">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="relative z-10 px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono uppercase mb-4">
              <Terminal className="w-3.5 h-3.5" />
              <span>Telemetry Gateway</span>
            </div>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">Live Operations Simulator</h2>
            <p className="text-[#C4B5FD]/70 text-xs mt-4 leading-relaxed font-light">
              See the Express backend routing and PostgreSQL triggers execute in real-time. The console below updates dynamically as mock actions occur across our campus databases.
            </p>

            <div className="flex flex-col gap-4 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Race Condition Prevention</h4>
                  <p className="text-xs text-[#C4B5FD]/60 mt-1 font-light">Custom PL/pgSQL database functions ensure data consistency during massive registration peaks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Stateless JWT Fingerprinting</h4>
                  <p className="text-xs text-[#C4B5FD]/60 mt-1 font-light">Every request checks the user agent and IP subnet signatures against signed JWT claims to reject session hijacks.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#080512] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden font-mono">
            {/* Window bar controls */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span className="text-[10px] text-white/40">iris-express-node-monitor.log</span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto">
              {liveLogs.map((log, index) => (
                <div key={index} className="text-xs flex flex-col gap-1 border-l-2 pl-3 border-[#6C2BD9]/40 hover:border-[#06B6D4] transition-all">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      log.type === "ATTENDANCE" ? "bg-blue-500/10 text-blue-400" :
                      log.type === "PAYMENT" ? "bg-amber-500/10 text-amber-400" :
                      log.type === "SECURITY" ? "bg-rose-500/10 text-rose-400" :
                      log.type === "HOSTEL" ? "bg-purple-500/10 text-purple-400" :
                      log.type === "TRANSIT" ? "bg-teal-500/10 text-teal-400" :
                      "bg-fuchsia-500/10 text-fuchsia-400"
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[9px] text-white/30">{log.time}</span>
                  </div>
                  <p className="text-white/85 text-[11px] mt-0.5 font-light">{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Calculator Section */}
      <section id="pricing" className="relative z-10 px-6 py-20 bg-[#120F26]/40 border-t border-white/5 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">Institution Plan Estimation</h2>
            <p className="text-[#C4B5FD]/60 text-xs mt-2">Choose the plan matches your campus profile and adjust the slider to estimate monthly licensing costs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#090615]/80 border border-white/10 p-8 rounded-3xl shadow-xl">
            <div className="flex flex-col gap-6">
              {/* Pricing Tier Options */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-wider text-[#C4B5FD] uppercase">Product Tier</span>
                <div className="grid grid-cols-2 gap-2">
                  {["Seed", "Campus", "University", "Enterprise"].map((tier) => (
                    <button 
                      key={tier}
                      onClick={() => setPricingTier(tier)}
                      className={`py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                        pricingTier === tier 
                          ? "bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] border-transparent text-white" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-[#C4B5FD]"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#C4B5FD] uppercase tracking-wider text-[10px]">Estimated Students</span>
                  <span className="text-[#06B6D4] font-mono text-sm">{pricingStudents}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="5000" 
                  step="50"
                  value={pricingStudents}
                  onChange={(e) => setPricingStudents(parseInt(e.target.value))}
                  className="w-full accent-[#06B6D4] bg-white/10 h-1.5 rounded-lg outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
              <span className="text-xs text-[#C4B5FD]/60 uppercase tracking-widest font-semibold">Estimated Monthly Fee</span>
              <span className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] mt-4 tracking-tight">
                {calculateCost()}
              </span>
              <span className="text-[10px] text-[#C4B5FD]/40 mt-2">Billed annually. Dynamic discount scales apply for Jodhpur institutions.</span>
              
              <Link href="/login?fresh=1" className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs transition-all tracking-wide">
                Get Institutional Proposal →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="mt-auto border-t border-white/5 py-12 px-6 bg-[#090615] text-center text-xs text-[#C4B5FD]/50 font-light">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#6C2BD9]/25 border border-[#6C2BD9]/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <span className="font-heading font-bold text-white text-sm">IRIS 365</span>
          </div>

          <p>&copy; 2026 SIN Education and Technology Pvt. Ltd. All rights reserved.</p>

          <div className="flex gap-4 text-[#C4B5FD]/40">
            <span className="hover:text-white transition-colors">Jodhpur, Rajasthan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
