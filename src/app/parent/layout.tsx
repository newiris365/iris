"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, CalendarDays, CreditCard, FileText, MessageSquare, Calendar, Link2, Bell, Bus, Wallet, UserCircle, Upload, AlertCircle, ClipboardList } from 'lucide-react';

const parentLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
  { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
  { label: 'Exam Results', href: '/parent/results', icon: FileText },
  { label: 'Wallet', href: '/parent/wallet', icon: Wallet },
  { label: 'Complaints', href: '/parent/complaints', icon: AlertCircle },
  { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
  { label: 'PTM Schedule', href: '/parent/ptm', icon: Calendar },
  { label: 'Link Child', href: '/parent/link', icon: Link2 },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function ParentLayoutContent({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<SidebarLink[]>(parentLinks);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const authorizedRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Instant redirect if no token — avoids stuck "Checking access..." after sign out
    const token = localStorage.getItem('iris_jwt_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Block mock sandbox tokens in production
    const isProduction = process.env.NEXT_PUBLIC_ENV === 'production' || window.location.hostname !== 'localhost';
    if (token.startsWith('mock-sandbox') && isProduction) {
      localStorage.removeItem('iris_jwt_token');
      localStorage.removeItem('iris_user_profile');
      localStorage.removeItem('iris_refresh_token');
      window.location.href = '/login';
      return;
    }

    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const validateAndRedirect = async () => {
      const savedProfile = localStorage.getItem('iris_user_profile');
      if (!savedProfile) {
        window.location.href = '/login';
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(savedProfile);
      } catch (e) {
        localStorage.removeItem('iris_jwt_token');
        localStorage.removeItem('iris_user_profile');
        localStorage.removeItem('iris_refresh_token');
        window.location.href = '/login';
        return;
      }

      const role = parsed.role || '';
      const instType = parsed.institute_type || 'college';

      // First check: quick localStorage role check
      if (role !== 'Parent') {
        window.location.href = '/login';
        return;
      }

      const applyLinks = (type: string) => {
        if (type === 'school') {
          setLinks([
            { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
            { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
            { label: 'Assignments', href: '/parent/assignments', icon: Upload },
            { label: 'Timetable', href: '/parent/timetable', icon: CalendarDays },
            { label: 'Transit GPS', href: '/parent/transit', icon: Bus },
            { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
            { label: 'Exam Results', href: '/parent/results', icon: FileText },
            { label: 'Leave Application', href: '/parent/leave', icon: ClipboardList },
            { label: 'Wallet', href: '/parent/wallet', icon: Wallet },
            { label: 'Complaints', href: '/parent/complaints', icon: AlertCircle },
            { label: 'Notices', href: '/parent/notices', icon: Bell },
            { label: 'Messages', href: '/parent/messages', icon: MessageSquare },
            { label: 'PTM Schedule', href: '/parent/ptm', icon: Calendar },
            { label: 'Link Child', href: '/parent/link', icon: Link2 },
            { label: 'Profile', href: '/profile', icon: UserCircle },
          ]);
        }
      };

      // Optimistically allow rendering while we validate with backend
      setAuthorized(true);
      authorizedRef.current = true;
      applyLinks(instType);

      // Validate token with backend
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (cancelled) return;

        if (res.status === 401 || res.status === 403) {
          // Token is invalid/expired — clear everything and redirect to login
          localStorage.removeItem('iris_jwt_token');
          localStorage.removeItem('iris_user_profile');
          localStorage.removeItem('iris_refresh_token');
          window.location.href = '/login';
          return;
        }

        const data = await res.json();
        if (data.success && data.profile) {
          const backendRole = data.profile.role || '';
          if (backendRole !== 'Parent') {
            // Role changed or mismatched — clear and redirect
            localStorage.removeItem('iris_jwt_token');
            localStorage.removeItem('iris_user_profile');
            localStorage.removeItem('iris_refresh_token');
            window.location.href = '/login';
            return;
          }
          // Update profile with fresh data from backend
          const freshType = data.profile.institute_type || 'college';
          if (freshType !== instType || data.profile.name !== parsed.name) {
            parsed.institute_type = freshType;
            parsed.name = data.profile.name;
            localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
            applyLinks(freshType);
          }
        }
      } catch {
        // Network error — keep the optimistic render (fail open)
      }
    };

    validateAndRedirect();

    // 3-second safety timeout — redirect to login if auth never resolves
    redirectTimeout = setTimeout(() => {
      if (authorizedRef.current !== true && !cancelled) {
        window.location.href = '/login';
      }
    }, 3000);

    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
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
