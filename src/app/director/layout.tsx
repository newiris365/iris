"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, AlertTriangle, TrendingUp, Lightbulb, FileText, Settings, GraduationCap } from 'lucide-react';

const directorLinks: SidebarLink[] = [
  { label: 'Overview', href: '/director', icon: LayoutDashboard },
  { label: 'Analytics', href: '/director/analytics', icon: TrendingUp },
  { label: 'Alerts', href: '/director/alerts', icon: AlertTriangle },
  { label: 'AI Insights', href: '/director/insights', icon: Lightbulb },
  { label: 'Reports', href: '/director/reports', icon: FileText },
  { label: 'Students', href: '/director/students', icon: GraduationCap },
  { label: 'Settings', href: '/director/settings', icon: Settings },
];

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Director Console"
      portalBadge="Director"
      sidebarLinks={directorLinks}
      accentColor="#F59E0B"
    >
      {children}
    </PortalShell>
  );
}
