"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { LayoutDashboard, BookOpen, FileText, AlertTriangle, Upload, ClipboardList } from 'lucide-react';

const librarianLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/librarian/library', icon: LayoutDashboard },
  { label: 'Book Catalogue', href: '/librarian/library/catalogue', icon: BookOpen },
  { label: 'Issue / Return', href: '/librarian/library/issue', icon: Upload },
  { label: 'Overdue Books', href: '/librarian/library/overdue', icon: AlertTriangle },
  { label: 'E-Books', href: '/librarian/library/ebooks', icon: FileText },
  { label: 'Reports', href: '/librarian/library/reports', icon: ClipboardList },
];

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Librarian Portal"
      portalBadge="Librarian"
      sidebarLinks={librarianLinks}
      accentColor="#06B6D4"
    >
      {children}
    </PortalShell>
  );
}
