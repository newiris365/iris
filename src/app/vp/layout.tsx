"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Users, FileText,
  ClipboardList, GraduationCap, UserCircle, Calendar
} from 'lucide-react';

const vpLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/vp/dashboard', icon: LayoutDashboard },
  { label: 'Academic Overview', href: '/principal/academics', icon: GraduationCap },
  { label: 'Faculty Directory', href: '/principal/hr/staff', icon: Users },
  { label: 'Appraisal Reviews', href: '/principal/hr/appraisals', icon: ClipboardList },
  { label: 'Academic Calendar', href: '/principal/hr/reports', icon: Calendar },
  { label: 'Notices Board', href: '/principal/notices', icon: FileText },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function VicePrincipalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Vice Principal Suite"
      portalBadge="VP"
      sidebarLinks={vpLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
