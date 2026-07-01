"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Activity, CreditCard, TrendingUp, AlertTriangle,
  Award, ShieldAlert, Lightbulb, FileText, GraduationCap, Settings,
  Home, BarChart3, Target, Briefcase, Users, UserCircle
} from 'lucide-react';

const directorLinks: SidebarLink[] = [
  { label: 'Campus Pulse', href: '/director/pulse', icon: Activity },
  { label: 'Overview', href: '/director', icon: LayoutDashboard },
  { label: 'Fee Recovery', href: '/director/fee-recovery', icon: CreditCard },
  { label: 'Attendance Trends', href: '/director/attendance-trends', icon: TrendingUp },
  { label: 'Complaint SLA', href: '/director/complaint-sla', icon: AlertTriangle },
  { label: 'NAAC Data', href: '/director/naac', icon: Award },
  { label: 'Anomaly Detection', href: '/director/anomalies', icon: ShieldAlert },
  { label: 'Analytics', href: '/director/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/director/alerts', icon: AlertTriangle },
  { label: 'AI Insights', href: '/director/insights', icon: Lightbulb },
  { label: 'Student Journey', href: '/director/journey', icon: Users },
  { label: 'Reports', href: '/director/reports', icon: FileText },
  { label: 'Students', href: '/director/students', icon: GraduationCap },
  { label: 'Goals', href: '/director/goals', icon: Target },
  { label: 'Board Reports', href: '/director/board-reports', icon: Briefcase },
  { label: 'Financial P&L', href: '/director/financial-pl', icon: CreditCard },
  { label: 'Benchmarks', href: '/director/benchmarks', icon: Users },
  { label: 'Settings', href: '/director/settings', icon: Settings },
  { label: 'Profile', href: '/profile', icon: UserCircle },
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
