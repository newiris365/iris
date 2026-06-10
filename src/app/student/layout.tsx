"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  QrCode, Calendar, CreditCard, ShoppingBag, Home, BookOpen,
  Award, Dumbbell, Bus, MessageCircle, FileText, Bell, User, CheckCircle
} from 'lucide-react';

const studentLinks: SidebarLink[] = [
  { label: 'Attendance QR', href: '/student/dashboard', icon: QrCode },
  { label: 'My Attendance', href: '/student/attendance', icon: CheckCircle },
  { label: 'Timetable', href: '/student/timetable', icon: Calendar },
  { label: 'Fee Ledger', href: '/student/fees', icon: CreditCard },
  { label: 'Canteen', href: '/student/canteen', icon: ShoppingBag },
  { label: 'Hostel', href: '/hostel', icon: Home },
  { label: 'Library', href: '/library', icon: BookOpen },
  { label: 'Events', href: '/student/events', icon: Award },
  { label: 'FitZone', href: '/student/gym', icon: Dumbbell },
  { label: 'Transit GPS', href: '/transit', icon: Bus },
  { label: 'Exam Results', href: '/student/results', icon: FileText },
  { label: 'Notices', href: '/student/notices', icon: Bell },
  { label: 'ID Card', href: '/student/idcard', icon: User },
  { label: 'AI Assistant', href: '/ai/search', icon: MessageCircle, badge: 'AI' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Student Portal"
      portalBadge="Student"
      sidebarLinks={studentLinks}
      accentColor="#06B6D4"
    >
      {children}
    </PortalShell>
  );
}
