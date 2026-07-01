"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, UserCheck, AlertTriangle, Users, Clock, KeyRound, Phone, UserCircle } from 'lucide-react';

const gateLinks: SidebarLink[] = [
  { label: 'Live Dashboard', href: '/gate', icon: LayoutDashboard },
  { label: 'Gate History', href: '/gate/history', icon: Clock },
  { label: 'Currently Inside', href: '/gate/inside', icon: Users },
  { label: 'Visitors', href: '/gate/visitors', icon: UserCheck },
  { label: 'Exit Passes', href: '/gate/exit-pass', icon: KeyRound },
  { label: 'My Pass', href: '/gate/my-pass', icon: KeyRound },
  { label: 'Incidents', href: '/gate/incidents', icon: AlertTriangle },
  { label: 'Emergency Muster', href: '/gate/muster', icon: AlertTriangle },
  { label: 'Smart Intercom', href: '/gate/intercom', icon: Phone },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Smart Gate"
      portalBadge="Security"
      sidebarLinks={gateLinks}
      accentColor="#EF4444"
    >
      {children}
    </PortalShell>
  );
}
