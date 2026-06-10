"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, ClipboardList, Users, FileText, Bed, AlertTriangle } from 'lucide-react';

const wardenLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/warden/hostel', icon: LayoutDashboard },
  { label: 'Complaints', href: '/warden/hostel/complaints', icon: AlertTriangle },
  { label: 'Leave Requests', href: '/warden/hostel/leave', icon: FileText },
  { label: 'Room Allocations', href: '/warden/hostel/allocations', icon: Bed },
  { label: 'Visitors', href: '/warden/hostel/visitors', icon: Users },
  { label: 'Reports', href: '/warden/hostel/reports', icon: ClipboardList },
];

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Warden Portal"
      portalBadge="Warden"
      sidebarLinks={wardenLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
