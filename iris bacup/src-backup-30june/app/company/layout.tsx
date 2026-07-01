"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  Briefcase, Users, Calendar, LogIn
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const companyLinks: SidebarLink[] = [
  { label: 'Job Requirements', href: '/company/drives', icon: Briefcase },
  { label: 'Shortlists Review', href: '/company/students', icon: Users },
  { label: 'Interview Schedules', href: '/company/schedule', icon: Calendar },
];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on HR login portal page, do not display navigation sidebar wrapper!
  if (pathname === '/company/portal') {
    return <>{children}</>;
  }

  return (
    <PortalShell
      portalName="Recruiter Panel"
      portalBadge="HR Partner"
      sidebarLinks={companyLinks}
      accentColor="#6C2BD9"
    >
      {children}
    </PortalShell>
  );
}
