"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, CalendarDays, ClipboardList, FileText,
  BookOpen, Users, Award, Bell, UserCircle
} from 'lucide-react';

const facultyLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'My Timetable', href: '/faculty/timetable', icon: ClipboardList },
  { label: 'Attendance', href: '/faculty/attendance', icon: CalendarDays },
  { label: 'CIA Marks', href: '/faculty/cia', icon: FileText },
  { label: 'Leave Approvals', href: '/faculty/leaves', icon: Award },
  { label: 'Study Materials', href: '/faculty/study-materials', icon: BookOpen },
  { label: 'Notices', href: '/faculty/notices', icon: Bell },
  { label: 'Students', href: '/faculty/students', icon: Users },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Faculty Portal"
      portalBadge="Faculty"
      sidebarLinks={facultyLinks}
      accentColor="#2563EB"
    >
      {children}
    </PortalShell>
  );
}
