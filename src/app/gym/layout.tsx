"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Dumbbell } from 'lucide-react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';

const gymLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/gym', icon: Dumbbell },
  { label: 'Book Slot', href: '/gym', icon: Dumbbell },
  { label: 'My Bookings', href: '/gym', icon: Dumbbell },
  { label: 'Equipment', href: '/gym', icon: Dumbbell },
];

function GymLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="FitZone"
      portalBadge="Gym"
      sidebarLinks={gymLinks}
      accentColor="#F59E0B"
    >
      {children}
    </PortalShell>
  );
}

const GymLayout = dynamic(() => Promise.resolve(GymLayoutContent), { ssr: false });

export default function GymLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <GymLayout>{children}</GymLayout>;
}
