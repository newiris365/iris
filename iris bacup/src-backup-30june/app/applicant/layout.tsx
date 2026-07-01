"use client";

import PortalShell, { SidebarLink } from '../../components/PortalShell';
import { 
  LayoutDashboard, User, FileText, Award, CreditCard, 
  CalendarDays, Home, ArrowLeft
} from 'lucide-react';

const applicantLinks: SidebarLink[] = [
  { label: 'Overview Dashboard', href: '/applicant/dashboard', icon: LayoutDashboard },
  { label: 'Application Form', href: '/applicant/application', icon: User },
  { label: 'Document Center', href: '/applicant/documents', icon: FileText },
  { label: 'Offer Letter', href: '/applicant/offer', icon: Award },
  { label: 'Fee Payments', href: '/applicant/fees', icon: CreditCard },
  { label: 'Counseling Session', href: '/applicant/counseling', icon: CalendarDays }
];

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portalName="Applicant Portal"
      portalBadge="Candidate"
      sidebarLinks={applicantLinks}
      accentColor="#6C2BD9"
    >
      {children}
    </PortalShell>
  );
}
