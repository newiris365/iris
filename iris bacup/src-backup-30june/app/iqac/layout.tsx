"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, FileSpreadsheet, FolderGit, MessageSquareCode,
  FileCheck, ShieldQuestion, Award, UserCircle
} from 'lucide-react';

const iqacLinks: SidebarLink[] = [
  { label: 'NAAC Dashboard', href: '/iqac/dashboard', icon: LayoutDashboard },
  { label: 'Criteria Entry', href: '/iqac/criteria/1', icon: FileSpreadsheet },
  { label: 'SSR Documents', href: '/iqac/documents', icon: FolderGit },
  { label: 'Survey Desk', href: '/iqac/surveys', icon: MessageSquareCode },
  { label: 'SSR Generator', href: '/iqac/ssr/generate', icon: FileCheck },
  { label: 'DVV Queries', href: '/iqac/dvv', icon: ShieldQuestion },
  { label: 'OBE Overview', href: '/iqac/obe/overview', icon: Award },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function IQACLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="IQAC Quality Cell"
      portalBadge="IQAC Coordinator"
      sidebarLinks={iqacLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
