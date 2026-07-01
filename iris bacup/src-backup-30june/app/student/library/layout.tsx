"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Award, Newspaper, Users, Shuffle, BookOpen } from 'lucide-react';

const tabs = [
  { label: 'Browse & Rooms', href: '/library', icon: BookOpen },
  { label: 'AI Research', href: '/student/library/research', icon: Sparkles },
  { label: 'Reading Goals', href: '/student/library/goals', icon: Award },
  { label: 'Newspapers', href: '/student/library/newspapers', icon: Newspaper },
  { label: 'Book Clubs', href: '/student/library/bookclubs', icon: Users },
  { label: 'Interlibrary Loans', href: '/student/library/interlibrary', icon: Shuffle },
];

export default function StudentLibraryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white">
      {/* Top navigation tabs for library extensions */}
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
