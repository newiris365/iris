"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { CalendarDays, Dumbbell, FileText, ClipboardList } from 'lucide-react';

const teacherLinks: SidebarLink[] = [
  { label: 'Attendance', href: '/teacher/attendance', icon: CalendarDays },
  { label: 'Timetable', href: '/teacher/timetable', icon: ClipboardList },
  { label: 'Exam Results', href: '/teacher/results', icon: FileText },
  { label: 'Gym Bookings', href: '/teacher/gym', icon: Dumbbell },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Faculty Portal"
      portalBadge="Teacher"
      sidebarLinks={teacherLinks}
      accentColor="#8B5CF6"
    >
      {children}
    </PortalShell>
  );
}
