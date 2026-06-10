"use client";

import React, { useState, useEffect } from 'react';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Users, CalendarDays, CreditCard, ShoppingBag, BookOpen,
  Shield, Dumbbell, Bus, BrainCircuit, ClipboardList, GraduationCap,
  Home, Bell, Award, FileText, QrCode, Calendar, MessageCircle, User,
  AlertTriangle, Upload, TrendingUp, Lightbulb, Settings, UserCheck, Clock, KeyRound, Route, MapPin, Bed, CheckCircle
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
  { label: 'Library', href: '/librarian/library', icon: BookOpen },
  { label: 'Smart Gate', href: '/admin/gate', icon: Shield },
  { label: 'FitZone Gym', href: '/admin/gym', icon: Dumbbell },
  { label: 'Transit', href: '/admin/transit', icon: Bus },
  { label: 'Events', href: '/admin/events', icon: Award },
  { label: 'Notices', href: '/admin/notices', icon: Bell },
  { label: 'ID Cards', href: '/admin/idcards', icon: Users },
  { label: 'AI Concierge', href: '/admin/ai', icon: BrainCircuit, badge: 'AI' },
];

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

const wardenLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/warden/hostel', icon: LayoutDashboard },
  { label: 'Complaints', href: '/warden/hostel/complaints', icon: AlertTriangle },
  { label: 'Leave Requests', href: '/warden/hostel/leave', icon: FileText },
  { label: 'Room Allocations', href: '/warden/hostel/allocations', icon: Bed },
  { label: 'Visitors', href: '/warden/hostel/visitors', icon: Users },
  { label: 'Reports', href: '/warden/hostel/reports', icon: ClipboardList },
];

const librarianLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/librarian/library', icon: LayoutDashboard },
  { label: 'Book Catalogue', href: '/librarian/library/catalogue', icon: BookOpen },
  { label: 'Issue / Return', href: '/librarian/library/issue', icon: Upload },
  { label: 'Overdue Books', href: '/librarian/library/overdue', icon: AlertTriangle },
  { label: 'E-Books', href: '/librarian/library/ebooks', icon: FileText },
  { label: 'Reports', href: '/librarian/library/reports', icon: ClipboardList },
];

const directorLinks: SidebarLink[] = [
  { label: 'Overview', href: '/director', icon: LayoutDashboard },
  { label: 'Analytics', href: '/director/analytics', icon: TrendingUp },
  { label: 'Alerts', href: '/director/alerts', icon: AlertTriangle },
  { label: 'AI Insights', href: '/director/insights', icon: Lightbulb },
  { label: 'Reports', href: '/director/reports', icon: FileText },
  { label: 'Students', href: '/director/students', icon: GraduationCap },
  { label: 'Settings', href: '/director/settings', icon: Settings },
];

const gateLinks: SidebarLink[] = [
  { label: 'Live Dashboard', href: '/gate', icon: LayoutDashboard },
  { label: 'Gate History', href: '/gate/history', icon: Clock },
  { label: 'Currently Inside', href: '/gate/inside', icon: Users },
  { label: 'Visitors', href: '/gate/visitors', icon: UserCheck },
  { label: 'Exit Passes', href: '/gate/exit-pass', icon: KeyRound },
  { label: 'My Pass', href: '/gate/my-pass', icon: KeyRound },
  { label: 'Incidents', href: '/gate/incidents', icon: AlertTriangle },
];

const transitLinks: SidebarLink[] = [
  { label: 'Live Tracker', href: '/transit', icon: LayoutDashboard },
  { label: 'Routes', href: '/transit/routes', icon: Route },
  { label: 'Track Bus', href: '/transit/track', icon: MapPin },
  { label: 'My Subscription', href: '/transit/subscription', icon: CreditCard },
];

const parentLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarDays },
  { label: 'Fee Status', href: '/parent/fees', icon: CreditCard },
  { label: 'Exam Results', href: '/parent/results', icon: FileText },
];

const teacherLinks: SidebarLink[] = [
  { label: 'Attendance', href: '/teacher/attendance', icon: CalendarDays },
  { label: 'Timetable', href: '/teacher/timetable', icon: ClipboardList },
  { label: 'Exam Results', href: '/teacher/results', icon: FileText },
  { label: 'Gym Bookings', href: '/teacher/gym', icon: Dumbbell },
];

export default function AiLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (err) {}
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] flex items-center justify-center text-[#C4B5FD] text-xs">
        Detecting session...
      </div>
    );
  }

  // Fallback to Student sidebar layout if no session is set
  const role = profile?.role || 'Student';

  let links = studentLinks;
  let portalName = "Student Portal";
  let portalBadge = "Student";
  let accentColor = "#06B6D4";

  if (role === 'Admin' || role === 'SuperAdmin' || role === 'Vendor') {
    links = adminLinks;
    portalName = "Admin Console";
    portalBadge = "Admin";
    accentColor = "#6C2BD9";
  } else if (role === 'Warden') {
    links = wardenLinks;
    portalName = "Warden Portal";
    portalBadge = "Warden";
    accentColor = "#8B5CF6";
  } else if (role === 'Librarian') {
    links = librarianLinks;
    portalName = "Librarian Portal";
    portalBadge = "Librarian";
    accentColor = "#06B6D4";
  } else if (role === 'Director') {
    links = directorLinks;
    portalName = "Director Console";
    portalBadge = "Director";
    accentColor = "#F59E0B";
  } else if (role === 'Security') {
    links = gateLinks;
    portalName = "Smart Gate";
    portalBadge = "Security";
    accentColor = "#EF4444";
  } else if (role === 'Driver') {
    links = transitLinks;
    portalName = "Transit GPS";
    portalBadge = "Transit";
    accentColor = "#10B981";
  } else if (role === 'Parent') {
    links = parentLinks;
    portalName = "Parent Portal";
    portalBadge = "Parent";
    accentColor = "#EC4899";
  } else if (role === 'Teacher') {
    links = teacherLinks;
    portalName = "Faculty Portal";
    portalBadge = "Teacher";
    accentColor = "#8B5CF6";
  }

  return (
    <PortalShell
      portalName={portalName}
      portalBadge={portalBadge}
      sidebarLinks={links}
      accentColor={accentColor}
    >
      {children}
    </PortalShell>
  );
}
