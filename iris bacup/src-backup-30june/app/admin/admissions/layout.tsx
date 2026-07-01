"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, RefreshCw, Compass, Users2, BarChart3, Settings
} from 'lucide-react';

const tabs = [
  { label: 'Overview Dashboard', href: '/admin/admissions', icon: LayoutDashboard },
  { label: 'Admission Cycles', href: '/admin/admissions/cycles', icon: RefreshCw },
  { label: 'Programs & Seats', href: '/admin/admissions/programs', icon: Compass },
  { label: 'Leads Pipeline (CRM)', href: '/admin/admissions/crm', icon: Users2 },
  { label: 'Analytics & Reports', href: '/admin/admissions/analytics', icon: BarChart3 },
  { label: 'Campaigns & Settings', href: '/admin/admissions/settings', icon: Settings }
];

export default function AdminAdmissionsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/admissions') {
      return pathname === '/admin/admissions';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      {/* Local Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-px">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const IconComp = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2
                ${active 
                  ? 'border-[#6C2BD9] text-[#A78BFA]' 
                  : 'border-transparent text-[#C4B5FD]/50 hover:text-white hover:border-white/10'
                }
              `}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
