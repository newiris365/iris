"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, BookOpen, FileText, CreditCard, Search, Armchair } from 'lucide-react';

const libraryLinks: SidebarLink[] = [
  { label: 'Library Home', href: '/library', icon: LayoutDashboard },
  { label: 'Browse Books', href: '/library/books', icon: BookOpen },
  { label: 'E-Books', href: '/library/ebooks', icon: FileText },
  { label: 'My Books', href: '/library/my-books', icon: Search },
  { label: 'Study Rooms', href: '/library/study-rooms', icon: Armchair },
  { label: 'Fines', href: '/library/fines', icon: CreditCard },
];

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Library"
      portalBadge="Library"
      sidebarLinks={libraryLinks}
      accentColor="#06B6D4"
    >
      {children}
    </PortalShell>
  );
}
