"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, ScanLine, Car, ShieldAlert, Users, Clock, KeyRound,
  AlertTriangle, Phone, UserCircle, Eye
} from 'lucide-react';

const securityLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/security/dashboard', icon: LayoutDashboard },
  { label: 'Gate Scanner', href: '/security/gate', icon: ScanLine },
  { label: 'Vehicle Logs', href: '/security/vehicles', icon: Car },
  { label: 'Blacklist', href: '/security/restrictions', icon: ShieldAlert },
  { label: 'Gate History', href: '/gate/history', icon: Clock },
  { label: 'Currently Inside', href: '/gate/inside', icon: Users },
  { label: 'Visitors', href: '/gate/visitors', icon: Users },
  { label: 'Exit Passes', href: '/gate/exit-pass', icon: KeyRound },
  { label: 'Incidents', href: '/gate/incidents', icon: AlertTriangle },
  { label: 'Emergency Muster', href: '/gate/muster', icon: AlertTriangle },
  { label: 'Smart Intercom', href: '/gate/intercom', icon: Phone },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Security Portal"
      portalBadge="Security"
      sidebarLinks={securityLinks}
      accentColor="#DC2626"
    >
      {children}
    </PortalShell>
  );
}
