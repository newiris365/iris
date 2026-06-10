"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, Menu, X, ChevronRight } from 'lucide-react';

export interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface PortalShellProps {
  portalName: string;
  portalBadge?: string;
  sidebarLinks: SidebarLink[];
  accentColor?: string;
  children: React.ReactNode;
}

export default function PortalShell({
  portalName,
  portalBadge,
  sidebarLinks,
  accentColor = '#6C2BD9',
  children
}: PortalShellProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch {}
    }
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === pathname) return true;
    // Match sub-routes: /admin/canteen should highlight for /admin/canteen/menu
    if (pathname.startsWith(href) && href !== '/' && href.split('/').length >= 3) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-30
        w-[260px] h-screen flex flex-col
        bg-[#0A0818]/95 backdrop-blur-xl
        border-r border-white/5
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo area */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C2BD9] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#6C2BD9]/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">IRIS 365</span>
              <span className="block text-[7px] text-[#C4B5FD]/40 font-mono tracking-widest uppercase">Campus OS</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-[#C4B5FD]/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portal badge */}
        <div className="px-5 py-3 border-b border-white/5">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              color: accentColor === '#6C2BD9' ? '#A78BFA' : accentColor
            }}
          >
            {portalBadge || portalName}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href);
            const IconComp = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group
                  ${active
                    ? 'bg-[#6C2BD9]/15 text-white border border-[#6C2BD9]/25 shadow-sm'
                    : 'text-[#C4B5FD]/60 hover:bg-white/5 hover:text-white border border-transparent'
                  }
                `}
              >
                <IconComp className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#A78BFA]' : 'text-[#C4B5FD]/40 group-hover:text-[#C4B5FD]'}`} />
                <span className="flex-1 truncate">{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#6C2BD9]/20 text-[#A78BFA]">
                    {link.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-3 h-3 text-[#A78BFA]/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {profile && (
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C2BD9]/40 to-[#8B5CF6]/30 flex items-center justify-center text-[10px] font-extrabold text-white border border-[#6C2BD9]/20">
                {profile.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile.name}</p>
                <p className="text-[9px] text-[#C4B5FD]/40 truncate">{profile.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#C4B5FD]/30 hover:text-red-400 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar (mobile only shows hamburger) */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0D0A1A]/80 backdrop-blur-md px-4 lg:px-6 py-3 flex items-center justify-between lg:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#C4B5FD]/50 font-medium hidden sm:block">
              {portalName}
            </span>
            {profile && (
              <span className="text-xs text-[#C4B5FD] font-medium">
                {profile.name?.split(' ')[0]}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-[10px] border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-[#C4B5FD]/60 hover:text-white"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
