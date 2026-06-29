"use client";

import React, { useState, useEffect } from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, MapPin, Route, CreditCard, Car, Leaf, AlertOctagon, UserCircle } from 'lucide-react';

const transitLinks: SidebarLink[] = [
  { label: 'Live Tracker', href: '/transit', icon: LayoutDashboard },
  { label: 'Routes', href: '/transit/routes', icon: Route },
  { label: 'Track Bus', href: '/transit/track', icon: MapPin },
  { label: 'My Subscription', href: '/transit/subscription', icon: CreditCard },
  { label: 'Parking Pass', href: '/transit/parking', icon: Car },
  { label: 'Carbon Offset', href: '/transit/carbon', icon: Leaf },
  { label: 'Parent SOS', href: '/transit/sos', icon: AlertOctagon },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function TransitLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem('iris_user_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        setRole(profile.role);
      } catch {}
    }
  }, []);

  const filteredLinks = transitLinks.filter(link => {
    if (link.href === '/transit/sos' && role !== 'Parent') {
      return false;
    }
    return true;
  });

  return (
    <PortalShell
      portalName="Transit GPS"
      portalBadge="Transit"
      sidebarLinks={filteredLinks}
      accentColor="#10B981"
    >
      {children}
    </PortalShell>
  );
}
