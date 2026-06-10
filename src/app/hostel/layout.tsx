"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, AlertTriangle, FileText, CreditCard, Users } from 'lucide-react';

const hostelLinks: SidebarLink[] = [
  { label: 'My Room', href: '/hostel', icon: LayoutDashboard },
  { label: 'Complaints', href: '/hostel/complaints', icon: AlertTriangle },
  { label: 'Leave Requests', href: '/hostel/leave', icon: FileText },
  { label: 'Hostel Fees', href: '/hostel/fees', icon: CreditCard },
  { label: 'Visitors', href: '/hostel/visitors', icon: Users },
];

export default function HostelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Hostel"
      portalBadge="Hostel"
      sidebarLinks={hostelLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
