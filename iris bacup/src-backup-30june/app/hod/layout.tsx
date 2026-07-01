"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, GraduationCap, BarChart3, Target, Users, UserCircle,
  Wand2, ClipboardList, BookOpen, UserCheck, CalendarDays, FileText,
  Bell, Award, IndianRupee, Briefcase, TrendingUp, Settings, UtensilsCrossed,
  Award as AwardIcon, FileBarChart, AlertTriangle, CheckCircle
} from 'lucide-react';

const hodLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
  { label: 'Department Students', href: '/hod/students', icon: Users },
  { label: 'Faculty Management', href: '/hod/faculty', icon: UserCheck },
  { label: 'Auto Timetable', href: '/hod/timetable/auto', icon: Wand2 },
  { label: 'Timetable View', href: '/hod/timetable', icon: ClipboardList },
  { label: 'Attendance Reports', href: '/hod/attendance', icon: CalendarDays },
  { label: 'Exam Results', href: '/hod/exams', icon: FileText },
  { label: 'Leave Approvals', href: '/hod/leaves', icon: CheckCircle },
  { label: 'Fee Defaulters', href: '/hod/fees', icon: IndianRupee },
  { label: 'OBE Programs', href: '/hod/obe/programs', icon: GraduationCap },
  { label: 'CO-PO Attainment', href: '/hod/obe/po-attainment', icon: Target },
  { label: 'Gap Analysis', href: '/hod/obe/gap-analysis', icon: BarChart3 },
  { label: 'Faculty Development', href: '/hod/faculty-development', icon: BookOpen },
  { label: 'NAAC Compliance', href: '/hod/naac', icon: Award },
  { label: 'Department Analytics', href: '/hod/analytics', icon: TrendingUp },
  { label: 'Student Achievements', href: '/hod/achievements', icon: AwardIcon },
  { label: 'Placements', href: '/hod/placements', icon: Briefcase },
  { label: 'Notices', href: '/hod/notices', icon: Bell },
  { label: 'Events', href: '/hod/events', icon: CalendarDays },
  { label: 'Canteen', href: '/hod/canteen', icon: UtensilsCrossed },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

export default function HodLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="HOD Portal"
      portalBadge="HOD"
      sidebarLinks={hodLinks}
      accentColor="#0891B2"
    >
      {children}
    </PortalShell>
  );
}
