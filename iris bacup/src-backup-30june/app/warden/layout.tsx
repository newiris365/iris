"use client";

import React from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Users, Home, ClipboardList, UtensilsCrossed,
  ArrowLeftRight, Shield, Bell, UserCircle
} from 'lucide-react';

const wardenLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/warden/dashboard', icon: LayoutDashboard },
  { label: 'Visitor Approvals', href: '/warden/visitors', icon: Users },
  { label: 'Nightly Check-In', href: '/warden/curfew', icon: ClipboardList },
  { label: 'Leave Requests', href: '/warden/leaves', icon: Shield },
  { label: 'Room Management', href: '/warden/rooms', icon: Home },
  { label: 'Meal Subscriptions', href: '/warden/meals', icon: UtensilsCrossed },
  { label: 'Room Transfers', href: '/warden/transfers', icon: ArrowLeftRight },
  { label: 'Complaints', href: '/warden/complaints', icon: Bell },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Warden Portal"
      portalBadge="Warden"
      sidebarLinks={wardenLinks}
      accentColor="#059669"
    >
      {children}
    </PortalShell>
  );
}
