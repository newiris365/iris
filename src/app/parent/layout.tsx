"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, CalendarDays, CreditCard, FileText } from 'lucide-react';

const parentLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
  { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
  { label: 'Exam Results', href: '/parent/results', icon: FileText },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Parent Portal"
      portalBadge="Parent"
      sidebarLinks={parentLinks}
      accentColor="#EC4899"
    >
      {children}
    </PortalShell>
  );
}
