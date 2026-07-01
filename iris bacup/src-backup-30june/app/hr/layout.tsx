"use client";

import { usePathname } from 'next/navigation';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, CalendarDays, FileText, ClipboardList,
  IndianRupee, FolderOpen, Calculator, Star, UserCircle
} from 'lucide-react';

const hrStaffLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/hr/my/dashboard', icon: LayoutDashboard },
  { label: 'Leave Apply', href: '/hr/my/leave', icon: CalendarDays },
  { label: 'Payslips', href: '/hr/my/payslips', icon: IndianRupee },
  { label: 'Attendance', href: '/hr/my/attendance', icon: ClipboardList },
  { label: 'Self Appraisal', href: '/hr/my/appraisal', icon: Star },
  { label: 'Documents', href: '/hr/my/documents', icon: FolderOpen },
  { label: 'TDS Declaration', href: '/hr/my/tds', icon: Calculator },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

const hrHodLinks: SidebarLink[] = [
  { label: 'Team Overview', href: '/hr/hod/team', icon: LayoutDashboard },
  { label: 'Leave Approvals', href: '/hr/hod/leave-approvals', icon: CalendarDays },
  { label: 'Appraisal Reviews', href: '/hr/hod/appraisals', icon: FileText },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

// Determine portal mode from pathname
function getPortalConfig(pathname: string) {
  if (pathname.startsWith('/hr/hod')) {
    return {
      name: 'HOD HR Portal',
      badge: 'HOD',
      links: hrHodLinks,
    };
  }
  return {
    name: 'Staff HR Portal',
    badge: 'Staff',
    links: hrStaffLinks,
  };
}

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/hr/my';
  const config = getPortalConfig(pathname);

  return (
    <PortalShell
      portalName={config.name}
      portalBadge={config.badge}
      sidebarLinks={config.links}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
