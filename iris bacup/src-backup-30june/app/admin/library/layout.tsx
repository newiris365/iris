"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Shuffle, Newspaper } from 'lucide-react';

const tabs = [
  { label: 'Book Clubs Coordinator', href: '/admin/library/bookclubs', icon: Users },
  { label: 'Partner Loans Manager', href: '/admin/library/interlibrary', icon: Shuffle },
  { label: 'Newspaper Subscriptions', href: '/admin/library/newspapers', icon: Newspaper },
];

export default function AdminLibraryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white">
      {/* Top navigation tabs for library management */}
      <div className="border-b border-[#6C2BD9]/20 bg-[#13102A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-2 py-3">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-[#6C2BD9]/25 border-[#6C2BD9]/40 text-white shadow-lg shadow-[#6C2BD9]/10'
                    : 'bg-white/5 border-white/5 text-[#C4B5FD]/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#A78BFA]' : ''}`} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
