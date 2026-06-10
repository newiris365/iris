"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, Users, Calendar, ClipboardList, Bell, Shield, Bus, Dumbbell, BookOpen } from 'lucide-react';

export default function GenericDashboard() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  if (!profile) return <div className="p-8 text-center text-xs text-[#C4B5FD]">Loading session...</div>;

  // Role-specific quick links
  const roleLinks: Record<string, any[]> = {
    Staff: [
      { label: 'Mark Attendance', icon: Calendar, href: '/teacher/attendance', desc: 'Manage class attendance sessions' },
      { label: 'Timetable', icon: ClipboardList, href: '/teacher/timetable', desc: 'View and manage lecture schedules' },
      { label: 'Library', icon: BookOpen, href: '/library', desc: 'Issue and return books' },
      { label: 'Notices', icon: Bell, href: '/student/notices', desc: 'Publish campus announcements' }
    ],
    Warden: [
      { label: 'Hostel Rooms', icon: LayoutDashboard, href: '/warden/hostel/allocations', desc: 'View room allocations and occupancy' },
      { label: 'Complaints', icon: ClipboardList, href: '/warden/hostel/complaints', desc: 'Review and resolve maintenance requests' },
      { label: 'Visitors', icon: Users, href: '/warden/hostel/visitors', desc: 'Log and track hostel visitor passes' },
      { label: 'Reports & Attendance', icon: Calendar, href: '/warden/hostel/reports', desc: 'Monitor hostel roll calls' }
    ],
    Security: [
      { label: 'Gate Logs', icon: Shield, href: '/gate/history', desc: 'Log entry/exit via RFID, QR, or biometric' },
      { label: 'Inside Count', icon: Users, href: '/gate/inside', desc: 'Monitor real-time campus occupancy' },
      { label: 'Incidents', icon: Bell, href: '/gate/incidents', desc: 'Report and track security incidents' },
      { label: 'Visitor Management', icon: ClipboardList, href: '/gate/visitors', desc: 'Process and badge visitor entries' }
    ],
    Driver: [
      { label: 'My Route', icon: Bus, href: '/transit/routes', desc: 'View assigned bus route and stops' },
      { label: 'Update Location', icon: Bus, href: '/transit', desc: 'Broadcast live GPS position' },
      { label: 'Passengers', icon: Users, href: '/transit/subscription', desc: 'View student subscriptions on your route' }
    ],
    Vendor: [
      { label: 'Canteen Menu', icon: ClipboardList, href: '/admin/canteen/menu', desc: 'Manage food items and availability' },
      { label: 'Orders', icon: LayoutDashboard, href: '/admin/canteen/orders', desc: 'View and process incoming orders' },
      { label: 'Revenue', icon: Bell, href: '/admin/canteen/offers', desc: 'Daily and monthly sales summary' }
    ],
    Parent: [
      { label: 'Ward Attendance', icon: Calendar, href: '/parent/attendance', desc: 'Monitor your child\'s attendance' },
      { label: 'Fee Status', icon: ClipboardList, href: '/parent/fees', desc: 'View pending and completed fee payments' },
      { label: 'Exam Results', icon: BookOpen, href: '/parent/results', desc: 'Check semester marks and grades' },
      { label: 'Notices', icon: Bell, href: '/parent/dashboard', desc: 'View campus announcements' }
    ]
  };

  const links = roleLinks[profile.role] || roleLinks['Staff'];

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#6C2BD9]/25 bg-[#13102A]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center font-extrabold text-sm text-white">I</div>
          <span className="font-extrabold text-lg text-white">IRIS 365</span>
          <span className="text-[10px] bg-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider">{profile.role} Portal</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#C4B5FD]">Welcome, <strong>{profile.name}</strong></span>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-xs border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 w-full flex-1">
        {/* Welcome Card */}
        <div className="glass-panel rounded-3xl p-8 mb-8">
          <h1 className="font-extrabold text-3xl text-white">Welcome back, {profile.name}</h1>
          <p className="text-sm text-[#C4B5FD] mt-2">
            You are logged in as <strong className="text-[#A78BFA]">{profile.role}</strong>. Use the quick links below to access your modules.
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link: any, idx: number) => (
            <Link
              key={idx}
              href={link.href}
              className="glass-panel rounded-2xl p-6 flex items-start gap-4 hover:border-[#6C2BD9]/50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#6C2BD9]/15 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA] group-hover:bg-[#6C2BD9]/25 transition-all flex-shrink-0">
                <link.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white group-hover:text-[#A78BFA] transition-colors">{link.label}</h3>
                <p className="text-xs text-[#C4B5FD]/70 mt-1 font-light">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-[#C4B5FD]/30">IRIS 365 by SIN Education and Technology Pvt. Ltd. | Jodhpur, Rajasthan</p>
        </div>
      </div>
    </div>
  );
}
