"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, PlayCircle, MapPin, Users, AlertTriangle, Bus, UserCircle, Navigation, Phone
} from 'lucide-react';

const driverLinks: SidebarLink[] = [
  { label: 'My Bus', href: '/driver/dashboard', icon: Bus },
  { label: 'Start/End Trip', href: '/driver/trip', icon: PlayCircle },
  { label: 'Stops', href: '/driver/stops', icon: MapPin },
  { label: 'Headcount', href: '/driver/headcount', icon: Users },
  { label: 'Live Map', href: '/transit/track', icon: Navigation },
  { label: 'Emergency', href: '/driver/emergency', icon: AlertTriangle },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Driver Portal"
      portalBadge="Driver"
      sidebarLinks={driverLinks}
      accentColor="#EA580C"
    >
      {children}
    </PortalShell>
  );
}
