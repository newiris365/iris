"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, CalendarDays, CreditCard, FileText, MessageSquare, Calendar, Link2, Bell, Bus, Wallet, UserCircle, Upload } from 'lucide-react';

const parentLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
  { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
  { label: 'Exam Results', href: '/parent/results', icon: FileText },
  { label: 'Wallet Top-Up', href: '/parent/dashboard', icon: Wallet },
  { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
  { label: 'PTM Schedule', href: '/parent/ptm', icon: Calendar },
  { label: 'Link Child', href: '/parent/link', icon: Link2 },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function ParentLayoutContent({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<SidebarLink[]>(parentLinks);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        const role = parsed.role || '';
        const instType = parsed.institute_type || 'college';

        if (role !== 'Parent') {
          window.location.href = '/login';
          return;
        }

        setAuthorized(true);

        if (instType === 'school') {
          setLinks([
            { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
            { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
            { label: 'Assignments', href: '/parent/assignments', icon: Upload },
            { label: 'Timetable', href: '/parent/timetable', icon: CalendarDays },
            { label: 'Transit GPS', href: '/parent/transit', icon: Bus },
            { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
            { label: 'Exam Results', href: '/parent/results', icon: FileText },
            { label: 'Notices', href: '/parent/notices', icon: Bell },
            { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
            { label: 'PTM Schedule', href: '/parent/ptm', icon: Calendar },
            { label: 'Link Child', href: '/parent/link', icon: Link2 },
            { label: 'Profile', href: '/profile', icon: UserCircle },
          ]);
        }
      } catch (e) {
        console.error('Failed parsing profile for parent auth check:', e);
        setAuthorized(false);
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  if (!hasMounted || authorized !== true) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Checking access...</p>
      </div>
    );
  }

  return (
    <PortalShell
      portalName="Parent Portal"
      portalBadge="Parent"
      sidebarLinks={links}
      accentColor="#EC4899"
    >
      {children}
    </PortalShell>
  );
}

const ParentLayout = dynamic(() => Promise.resolve(ParentLayoutContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#0D0A1A]">
      <p className="text-slate-400 text-sm">Checking access...</p>
    </div>
  )
});

export default ParentLayout;
