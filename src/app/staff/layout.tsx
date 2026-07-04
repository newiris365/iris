"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, Calendar, FileText, Award, UserCircle, Bell, BookOpen } from 'lucide-react';

const staffLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Leave Application', href: '/staff/leave', icon: Calendar },
  { label: 'Payslips', href: '/staff/payslips', icon: FileText },
  { label: 'Appraisal', href: '/staff/appraisal', icon: Award },
  { label: 'Notices', href: '/staff/notices', icon: Bell },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Staff Portal"
      portalBadge="Staff"
      sidebarLinks={staffLinks}
      accentColor="#F59E0B"
    >
      {children}
    </PortalShell>
  );
}
