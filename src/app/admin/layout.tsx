"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Users, CalendarDays, CreditCard, ShoppingBag, BookOpen,
  Shield, Dumbbell, Bus, BrainCircuit, ClipboardList, GraduationCap,
  Home, Bell, Award, FileText
} from 'lucide-react';

const adminLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Attendance', href: '/admin/attendance', icon: CalendarDays },
  { label: 'Timetable', href: '/admin/timetable', icon: ClipboardList },
  { label: 'Fees & Finance', href: '/admin/fees', icon: CreditCard },
  { label: 'Exams & Results', href: '/admin/exams', icon: FileText },
  { label: 'Canteen', href: '/admin/canteen', icon: ShoppingBag },
  { label: 'Hostel', href: '/admin/hostel', icon: Home },
  { label: 'Library', href: '/admin/ai', icon: BookOpen, badge: '' },
  { label: 'Smart Gate', href: '/admin/gate', icon: Shield },
  { label: 'FitZone Gym', href: '/admin/gym', icon: Dumbbell },
  { label: 'Transit', href: '/admin/transit', icon: Bus },
  { label: 'Events', href: '/admin/events', icon: Award },
  { label: 'Notices', href: '/admin/notices', icon: Bell },
  { label: 'ID Cards', href: '/admin/idcards', icon: Users },
  { label: 'AI Concierge', href: '/admin/ai', icon: BrainCircuit, badge: 'AI' },
];

// Deduplicate: Library link was pointing to /admin/ai, fix it
adminLinks[8] = { label: 'Library', href: '/librarian/library', icon: BookOpen };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Admin Console"
      portalBadge="Admin"
      sidebarLinks={adminLinks}
      accentColor="#6C2BD9"
    >
      {children}
    </PortalShell>
  );
}
