"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Building2, Briefcase, Users,
  FileSpreadsheet, LogOut, UserCircle
} from 'lucide-react';

const tpoLinks: SidebarLink[] = [
  { label: 'TPO Dashboard', href: '/tpo/placements', icon: LayoutDashboard },
  { label: 'Companies CRM', href: '/tpo/companies', icon: Building2 },
  { label: 'Hiring Drives', href: '/tpo/drives', icon: Briefcase },
  { label: 'Student Roster', href: '/tpo/students', icon: Users },
  { label: 'Brochures & NIRF', href: '/tpo/reports', icon: FileSpreadsheet },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function TpoLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="TPO Operations Desk"
      portalBadge="TPO"
      sidebarLinks={tpoLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
