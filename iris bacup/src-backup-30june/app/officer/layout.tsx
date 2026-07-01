"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { 
  Users, CheckSquare, Sparkles, Award, CalendarClock, ListOrdered, Home, UserCircle
} from 'lucide-react';

const officerLinks: SidebarLink[] = [
  { label: 'Application Queue', href: '/officer/admissions', icon: Users },
  { label: 'Verification Desk', href: '/officer/admissions/verify', icon: CheckSquare },
  { label: 'Auto Shortlisting', href: '/officer/admissions/shortlist', icon: Sparkles },
  { label: 'Merit Lists', href: '/officer/admissions/merit', icon: ListOrdered },
  { label: 'Offers System', href: '/officer/admissions/offers', icon: Award },
  { label: 'Counseling Ops', href: '/officer/admissions/counseling', icon: CalendarClock },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Admissions Officer Portal"
      portalBadge="Officer"
      sidebarLinks={officerLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
