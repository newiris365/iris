"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  LayoutDashboard, Users, CalendarDays, CreditCard, ShoppingBag, BookOpen,
  Shield, Bus, BrainCircuit, ClipboardList, GraduationCap,
  Home, Bell, Award, FileText, UserCheck, Settings,
  Package, AlertTriangle, Calendar, BarChart3, UserCircle, MessageSquare,
  Sliders, UserPlus, BedDouble, School, BookMarked, UtensilsCrossed, Tag,
  Building2
} from 'lucide-react';

const collegeAdminLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Admissions', href: '/admin/admissions', icon: UserCheck },
  { label: 'New Admission', href: '/admin/admissions/new', icon: Users },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Users & Roles', href: '/admin/users', icon: UserPlus },
  { label: 'Departments', href: '/admin/departments', icon: Building2 },
  { label: 'Permissions', href: '/admin/permissions', icon: Sliders },
  { label: 'Attendance', href: '/admin/attendance', icon: CalendarDays },
  { label: 'Timetable', href: '/admin/timetable', icon: ClipboardList },
  { label: 'Timetable Auto', href: '/admin/timetable/auto', icon: ClipboardList },
  { label: 'Fees & Finance', href: '/admin/fees', icon: CreditCard },
  { label: 'Fee Escalation', href: '/admin/fees/escalation', icon: AlertTriangle },
  { label: 'Exams & Results', href: '/admin/exams', icon: FileText },
  { label: 'Exam Seating', href: '/admin/exam/seating', icon: ClipboardList },
  { label: 'Exam Enrollment', href: '/admin/exam/enrollment', icon: ClipboardList },
  { label: 'Academic Calendar', href: '/admin/calendar', icon: Calendar },
  { label: 'Defaulter Report', href: '/admin/reports/defaulters', icon: BarChart3 },
  { label: 'Canteen', href: '/admin/canteen', icon: ShoppingBag },
  { label: 'Hostel', href: '/admin/hostel', icon: Home },
  { label: 'Pending Complaints', href: '/admin/complaints', icon: AlertTriangle },
  { label: 'Library', href: '/admin/library/bookclubs', icon: BookOpen },
  { label: 'Placements', href: '/admin/placements', icon: ClipboardList },
  { label: 'HR Management', href: '/admin/hr', icon: ClipboardList },
  { label: 'Smart Gate', href: '/admin/gate', icon: Shield },
  { label: 'FitZone Gym', href: '/admin/gym', icon: ClipboardList },
  { label: 'Transit', href: '/admin/transit', icon: Bus },
  { label: 'Events', href: '/admin/events', icon: Award },
  { label: 'Lost & Found', href: '/admin/lost-found', icon: Package },
  { label: 'Notices', href: '/admin/notices', icon: Bell },
  { label: 'ID Cards', href: '/admin/idcards', icon: Users },
  { label: 'AI Concierge', href: '/admin/ai', icon: BrainCircuit, badge: 'AI' },
  { label: 'OBE Maps', href: '/admin/obe', icon: GraduationCap },
  { label: 'NAAC Scorecard', href: '/admin/naac', icon: Award },
  { label: 'Faculty Dev', href: '/admin/faculty-development', icon: ClipboardList },
  { label: 'Faculty Portal', href: '/faculty/dashboard', icon: Users },
  { label: 'Security Portal', href: '/security/dashboard', icon: Shield },
  { label: 'Driver Portal', href: '/driver/dashboard', icon: Bus },
  { label: 'Vendor Portal', href: '/vendor/dashboard', icon: ShoppingBag },
  { label: 'Achievements', href: '/admin/achievements', icon: FileText },
  { label: 'WhatsApp API', href: '/admin/whatsapp', icon: MessageSquare },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Service Pricing', href: '/admin/pricing', icon: Tag },
  { label: 'Payment Settings', href: '/admin/payment-settings', icon: CreditCard },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

const schoolAdminLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Teachers & Staff', href: '/admin/users', icon: Users },
  { label: 'Departments', href: '/admin/departments', icon: Building2 },
  { label: 'Classes & Sections', href: '/admin/classes', icon: School },
  { label: 'Attendance', href: '/admin/attendance', icon: CalendarDays },
  { label: 'Timetable', href: '/admin/timetable', icon: ClipboardList },
  { label: 'Fees & Finance', href: '/admin/fees', icon: CreditCard },
  { label: 'Scholarships', href: '/admin/fees/scholarships', icon: Award },
  { label: 'Exams & Results', href: '/admin/exams', icon: FileText },
  { label: 'Academic Calendar', href: '/admin/calendar', icon: Calendar },
  { label: 'Admissions', href: '/admin/admissions', icon: UserCheck },
  { label: 'Canteen & Meals', href: '/admin/canteen', icon: UtensilsCrossed },
  { label: 'Library', href: '/admin/library/bookclubs', icon: BookMarked },
  { label: 'Transit & Buses', href: '/admin/transit', icon: Bus },
  { label: 'Gate & Security', href: '/admin/gate', icon: Shield },
  { label: 'Hostel', href: '/admin/hostel', icon: BedDouble },
  { label: 'Events', href: '/admin/events', icon: Award },
  { label: 'Notices', href: '/admin/notices', icon: Bell },
  { label: 'Complaints', href: '/admin/complaints', icon: AlertTriangle },
  { label: 'Lost & Found', href: '/admin/lost-found', icon: Package },
  { label: 'ID Cards', href: '/admin/idcards', icon: Users },
  { label: 'AI Concierge', href: '/admin/ai', icon: BrainCircuit, badge: 'AI' },
  { label: 'WhatsApp API', href: '/admin/whatsapp', icon: MessageSquare },
  { label: 'Service Pricing', href: '/admin/pricing', icon: Tag },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Permissions', href: '/admin/permissions', icon: Sliders },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

import { getRoleLabel } from '../../lib/roleLabels';

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  SuperAdmin: '/admin/global',
  Admin: '/admin/dashboard',
  Director: '/director/dashboard',
  HOD: '/hod/dashboard',
  Teacher: '/teacher/timetable',
  Staff: '/faculty/dashboard',
  Student: '/student/dashboard',
  Parent: '/parent/dashboard',
  Warden: '/warden/hostel',
  Security: '/gate',
  Vendor: '/vendor/dashboard',
  Driver: '/driver/dashboard',
  Librarian: '/librarian/library',
};

const ALLOWED_ADMIN_ROLES = new Set(['SuperAdmin', 'Admin']);

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<SidebarLink[]>(collegeAdminLinks);
  const [userRole, setUserRole] = useState<string>('');
  const [instituteType, setInstituteType] = useState<string>('college');
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const authorizedRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const applySidebar = (role: string, instType: string) => {
    if (role === 'SuperAdmin') {
      setLinks([
        { label: 'Global Console', href: '/admin/global', icon: Shield },
        { label: 'Profile', href: '/profile', icon: UserCircle },
      ]);
    } else if (instType === 'school') {
      setLinks(schoolAdminLinks);
    } else {
      setLinks(collegeAdminLinks.filter(l => l.href !== '/admin/settings'));
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('iris_jwt_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Block mock sandbox tokens in production
    const isProduction = process.env.NEXT_PUBLIC_ENV === 'production' || window.location.hostname !== 'localhost';
    if (token.startsWith('mock-sandbox') && isProduction) {
      localStorage.removeItem('iris_jwt_token');
      localStorage.removeItem('iris_user_profile');
      localStorage.removeItem('iris_refresh_token');
      window.location.href = '/login';
      return;
    }

    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const savedProfile = localStorage.getItem('iris_user_profile');
    if (!savedProfile) {
      window.location.href = '/login';
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(savedProfile);
    } catch (e) {
      localStorage.removeItem('iris_jwt_token');
      localStorage.removeItem('iris_user_profile');
      localStorage.removeItem('iris_refresh_token');
      window.location.href = '/login';
      return;
    }

    const role = parsed.role || '';
    const instType = parsed.institute_type || 'college';
    setUserRole(role);
    setInstituteType(instType);

    if (!ALLOWED_ADMIN_ROLES.has(role)) {
      const redirect = ROLE_DASHBOARD_MAP[role] || '/dashboard';
      window.location.href = redirect;
      return;
    }

    // Optimistically allow rendering while we validate with backend
    setAuthorized(true);
    authorizedRef.current = true;
    applySidebar(role, instType);

    // Validate token with backend
    fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (cancelled) return;
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem('iris_jwt_token');
          localStorage.removeItem('iris_user_profile');
          localStorage.removeItem('iris_refresh_token');
          window.location.href = '/login';
          return;
        }
        const data = await r.json();
        if (data.success && data.profile) {
          const backendRole = data.profile.role || '';
          if (!ALLOWED_ADMIN_ROLES.has(backendRole)) {
            localStorage.removeItem('iris_jwt_token');
            localStorage.removeItem('iris_user_profile');
            localStorage.removeItem('iris_refresh_token');
            window.location.href = '/login';
            return;
          }
          const freshType = data.profile.institute_type || 'college';
          if (freshType !== instType) {
            parsed.institute_type = freshType;
            localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
            setInstituteType(freshType);
            applySidebar(role, freshType);
          }
        }
      })
      .catch(() => {});

    redirectTimeout = setTimeout(() => {
      if (authorizedRef.current !== true && !cancelled) {
        window.location.href = '/login';
      }
    }, 3000);

    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, []);

  if (!hasMounted || authorized !== true) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Checking access...</p>
      </div>
    );
  }

  const mappedRole = getRoleLabel(userRole, instituteType);

  return (
    <PortalShell
      portalName={userRole === 'SuperAdmin' ? "SuperAdmin Console" : `${mappedRole} Console`}
      portalBadge={userRole === 'SuperAdmin' ? "SuperAdmin" : mappedRole}
      sidebarLinks={links}
      accentColor="#6C2BD9"
    >
      {children}
    </PortalShell>
  );
}

const AdminLayout = dynamic(() => Promise.resolve(AdminLayoutContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#0D0A1A]">
      <p className="text-slate-400 text-sm">Checking access...</p>
    </div>
  )
});

export default AdminLayout;
