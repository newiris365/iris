"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PortalShell, { SidebarLink } from '../../components/PortalShell';
import {
  QrCode, Calendar, CalendarDays, CreditCard, ShoppingBag, Home, BookOpen,
  Award, Dumbbell, Bus, MessageCircle, FileText, Bell, User, CheckCircle, Briefcase,
  Upload, Download, Wallet, CalendarCheck, UserCircle, GraduationCap, ClipboardList, UtensilsCrossed
} from 'lucide-react';

const studentLinks: SidebarLink[] = [
  { label: 'Attendance QR', href: '/student/dashboard', icon: QrCode },
  { label: 'My Attendance', href: '/student/attendance', icon: CheckCircle },
  { label: 'Timetable', href: '/student/timetable', icon: CalendarDays },
  { label: 'Academic Calendar', href: '/student/calendar', icon: Calendar },
  { label: 'Course Registration', href: '/student/courses', icon: GraduationCap },
  { label: 'Fee Ledger', href: '/student/fees', icon: CreditCard },
  { label: 'Assignments', href: '/student/assignments', icon: Upload },
  { label: 'Study Materials', href: '/student/study-materials', icon: Download },
  { label: 'Leave Application', href: '/student/leave', icon: CalendarCheck },
  { label: 'Campus Wallet', href: '/student/wallet', icon: Wallet },
  { label: 'Canteen', href: '/student/canteen', icon: ShoppingBag },
  { label: 'College Mess', href: '/student/mess', icon: UtensilsCrossed },
  { label: 'Hostel', href: '/hostel', icon: Home },
  { label: 'Library', href: '/student/library/research', icon: BookOpen },
  { label: 'Placements', href: '/student/placements', icon: Briefcase },
  { label: 'Events', href: '/student/events', icon: Award },
  { label: 'FitZone', href: '/student/gym', icon: Dumbbell },
  { label: 'Transit GPS', href: '/transit', icon: Bus },
  { label: 'Exam Results', href: '/student/results', icon: FileText },
  { label: 'Exam Enrollment', href: '/student/exams', icon: ClipboardList },
  { label: 'Notices', href: '/student/notices', icon: Bell },
  { label: 'ID Card', href: '/student/idcard', icon: User },
  { label: 'AI Assistant', href: '/ai/search', icon: MessageCircle, badge: 'AI' },
  { label: 'Profile', href: '/profile', icon: UserCircle },
];

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        const role = parsed.role || '';
        let instType = parsed.institute_type || 'college';

        const refreshProfile = () => {
          const token = localStorage.getItem('iris_jwt_token');
          if (!token) return;
          fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
              if (data.success && data.profile) {
                const freshType = data.profile.institute_type || 'college';
                if (freshType !== instType) {
                  parsed.institute_type = freshType;
                  localStorage.setItem('iris_user_profile', JSON.stringify(parsed));
                  window.location.reload();
                }
              }
            })
            .catch(() => {});
        };

        if (instType === 'school') {
          alert('Student portal is not available for school-type institutes. Parents can access student details through the Parent Portal.');
          window.location.href = '/login';
          return;
        }

        if (role !== 'Student') {
          window.location.href = '/login';
          return;
        }

        setAuthorized(true);
        refreshProfile();
      } catch (e) {
        console.error('Failed parsing profile for student auth check:', e);
        setAuthorized(false);
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  if (!hasMounted || authorized !== true) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Checking access...</p>
      </div>
    );
  }

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

const StudentLayout = dynamic(() => Promise.resolve(StudentLayoutContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#0D0A1A]">
      <p className="text-slate-400 text-sm">Checking access...</p>
    </div>
  )
});

export default StudentLayout;
