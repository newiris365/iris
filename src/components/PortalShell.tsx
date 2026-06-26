"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, Menu, X, ChevronRight, Bell, Search, AlertTriangle } from 'lucide-react';
import OnboardingTour from './OnboardingTour';

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

const FEATURE_TO_LINK_MAP: Record<string, string[]> = {
  admissions: ['/admin/admissions', '/officer/admissions', '/applicant'],
  students: ['/admin/students', '/student/assignments', '/student/study-materials', '/student/leave', '/student/courses', '/parent/assignments', '/faculty/students', '/hod/students', '/hod/leaves', '/faculty/leaves', '/faculty/study-materials'],
  attendance: ['/admin/attendance', '/student/attendance', '/student/dashboard', '/parent/attendance', '/teacher/attendance', '/faculty/attendance', '/hod/attendance'],
  timetable: ['/admin/timetable', '/student/timetable', '/student/calendar', '/parent/timetable', '/teacher/timetable', '/faculty/timetable', '/hod/timetable', '/admin/calendar'],
  fees: ['/admin/fees', '/student/fees', '/parent/fees', '/student/wallet', '/hod/fees', '/applicant/fees', '/hostel/fees', '/admin/reports/defaulters'],
  exams: ['/admin/exams', '/admin/exam/seating', '/admin/exam/enrollment', '/student/exams', '/student/results', '/parent/results', '/teacher/results', '/faculty/cia', '/hod/exams'],
  canteen: ['/admin/canteen', '/student/canteen', '/student/mess', '/vendor', '/teacher/canteen', '/hod/canteen'],
  hostel: ['/admin/hostel', '/student/hostel', '/warden/hostel', '/warden/curfew', '/warden/leaves', '/warden/rooms', '/warden/meals', '/warden/transfers', '/warden/complaints', '/warden/visitors', '/hostel'],
  library: ['/admin/library', '/student/library', '/librarian/library', '/library'],
  placements: ['/admin/placements', '/student/placements', '/tpo/placements', '/tpo/companies', '/tpo/drives', '/tpo/students', '/tpo/reports', '/company', '/hod/placements'],
  hr: ['/admin/hr', '/hr', '/teacher/leave', '/principal/hr', '/hr/my', '/hr/hod'],
  gate: ['/admin/gate', '/gate', '/security', '/admin/lost-found'],
  gym: ['/admin/gym', '/student/gym', '/teacher/gym'],
  transit: ['/admin/transit', '/transit', '/parent/transit', '/driver'],
  events: ['/admin/events', '/student/events', '/teacher/events', '/hod/events'],
  notices: ['/admin/notices', '/student/notices', '/parent/notices', '/teacher/notices', '/faculty/notices', '/hod/notices', '/principal/notices'],
  idcards: ['/admin/idcards', '/student/idcard'],
  ai_concierge: ['/admin/ai', '/ai'],
  obe: ['/admin/obe', '/teacher/obe', '/hod/obe', '/iqac/obe'],
  naac: ['/admin/naac', '/iqac', '/hod/naac', '/principal/academics', '/director/naac'],
  director: ['/director'],
  parent_portal: ['/parent'],
  faculty_development: ['/admin/faculty-development', '/hod/faculty-development'],
  achievements: ['/admin/achievements', '/hod/achievements', '/principal/achievements']
};

const getDefaultNotifications = (role: string) => {
  const common = [
    { id: 'c1', title: 'System Maintenance Notice', message: 'IRIS 365 core portal database backup scheduled for Saturday 11:00 PM.', type: 'notice', time: '10h ago', was_read: false }
  ];
  const capitalizedRole = role || 'Student';
  if (capitalizedRole === 'Student') {
    return [
      { id: 's1', title: 'Fee Installment Approaching', message: 'Semester 4 tuition fee installment of ₹45,000 is due by June 30th.', type: 'fee', time: '2h ago', was_read: false },
      { id: 's2', title: '⚠️ Attendance Warning', message: 'Your overall attendance is 72%. Attend the next 3 Compiler Design lectures to cross 75%.', type: 'ai_nudge', time: '4h ago', was_read: false },
      { id: 's3', title: 'Exam Hall Ticket Published', message: 'Term-End practical exams hall ticket is available. Download from portal.', type: 'exam', time: '1d ago', was_read: true },
      { id: 's4', title: '🚌 Route 4 approaching', message: 'Bus Transit Alert: Bus 4 has departed stop Sector-12 and is 3 mins away.', type: 'transit', time: '15m ago', was_read: false },
      ...common
    ];
  }
  if (capitalizedRole === 'Parent') {
    return [
      { id: 'p1', title: '🚌 Bus Boarded Alert', message: 'Your child Rohan has boarded the campus bus at Main Gate (08:45 AM).', type: 'transit', time: '10m ago', was_read: false },
      { id: 'p2', title: 'Fee Dues Alert', message: 'Tuition fees installment of ₹45,000 remains pending for your ward.', type: 'fee', time: '3h ago', was_read: false },
      ...common
    ];
  }
  if (capitalizedRole === 'Teacher') {
    return [
      { id: 't1', title: 'Academic Audit Scheduled', message: 'IQAC curriculum review committee visiting department on June 28th.', type: 'notice', time: '1d ago', was_read: false },
      { id: 't2', title: 'OBE Mapping Pending', message: 'Compiler Design course outcome targets are not yet mapped. Settle before reviews.', type: 'ai_nudge', time: '5h ago', was_read: false },
      ...common
    ];
  }
  if (capitalizedRole === 'Warden') {
    return [
      { id: 'w1', title: 'Mess Hygiene Inspection', message: 'Director mess hygiene inspection scheduled for Friday afternoon.', type: 'notice', time: '5h ago', was_read: false },
      ...common
    ];
  }
  return [
    { id: 'r1', title: 'System Notice', message: 'Check lists, compile reports and verify records for v1.0 migration.', type: 'notice', time: '3h ago', was_read: false },
    ...common
  ];
};

const getNotifTypeColor = (type: string) => {
  switch (type) {
    case 'fee': return '#ef4444';
    case 'ai_nudge': return '#8b5cf6';
    case 'exam': return '#f59e0b';
    case 'transit': return '#06b6d4';
    case 'notice': default: return '#3b82f6';
  }
};

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
  const [disabledFeatures, setDisabledFeatures] = useState<string[]>([]);

  // Custom states for new features
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const savedProfile = localStorage.getItem('iris_user_profile');
    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch {}
    }
  }, []);

  // Fetch enabled features and compute disabled link hrefs
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const savedProfile = localStorage.getItem('iris_user_profile');
        const token = localStorage.getItem('iris_jwt_token');
        if (!savedProfile || !token) return;

        const parsed = JSON.parse(savedProfile);
        if (parsed.role === 'SuperAdmin') return; // SuperAdmin sees everything

        const res = await fetch(`/api/settings?action=my_permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.success || !data.features) return;

        const disabled = new Set<string>();
        for (const f of data.features) {
          if (!f.enabled && FEATURE_TO_LINK_MAP[f.feature_key]) {
            for (const href of FEATURE_TO_LINK_MAP[f.feature_key]) {
              disabled.add(href);
            }
          }
        }
        const disabledList: string[] = [];
        disabled.forEach(val => disabledList.push(val));
        setDisabledFeatures(disabledList);
      } catch {
        // Fail open - show all links
      }
    };
    fetchFeatures();
  }, []);

  // Sync / initialize notifications in localStorage
  useEffect(() => {
    if (profile?.role) {
      const stored = localStorage.getItem(`iris_notifications_${profile.id || profile.role}`);
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch {
          setNotifications(getDefaultNotifications(profile.role));
        }
      } else {
        setNotifications(getDefaultNotifications(profile.role));
      }
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role && notifications.length > 0) {
      localStorage.setItem(`iris_notifications_${profile.id || profile.role}`, JSON.stringify(notifications));
    }
  }, [notifications, profile]);

  // Listen to fallback events
  useEffect(() => {
    const handleFallback = () => {
      setShowFallbackBanner(true);
    };
    window.addEventListener('iris-api-fallback', handleFallback);
    return () => window.removeEventListener('iris-api-fallback', handleFallback);
  }, []);

  // Listen for Ctrl+K search keybinding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.location.href = '/ai/search';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === pathname) return true;
    if (pathname.startsWith(href) && href !== '/' && href.split('/').length >= 3) return true;
    return false;
  };

  const unreadCount = notifications.filter(n => !n.was_read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, was_read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, was_read: true })));
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
          {sidebarLinks
            .filter(link => {
              // Exact match or subpath match of any disabled features
              return !disabledFeatures.some(disabledPath =>
                link.href === disabledPath || link.href.startsWith(disabledPath + '/')
              );
            })
            .map((link) => {
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
            <Link
              href="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C2BD9]/40 to-[#8B5CF6]/30 flex items-center justify-center text-[10px] font-extrabold text-white border border-[#6C2BD9]/20">
                {profile.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-[#A78BFA] transition-colors">{profile.name}</p>
                <p className="text-[9px] text-[#C4B5FD]/40 truncate">{profile.email}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#C4B5FD]/30 hover:text-red-400 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0D0A1A]/80 backdrop-blur-md px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Global Search box in top bar */}
            <div className="relative max-w-xs w-full hidden sm:block" id="global-search-input">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#C4B5FD]/40" />
              <input
                type="text"
                placeholder="Search anything... (Ctrl + K)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/ai/search?q=${encodeURIComponent(e.currentTarget.value)}`;
                  }
                }}
                className="w-full bg-[#13102A]/40 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#C4B5FD]/30 focus:border-[#8B5CF6]/50 focus:outline-none transition-all"
              />
            </div>
            {/* Mobile search button */}
            <Link 
              href="/ai/search" 
              className="sm:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[#C4B5FD]/60"
            >
              <Search className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#C4B5FD]/50 font-medium hidden sm:block">
              {portalName}
            </span>
            {profile && (
              <span className="text-xs text-[#C4B5FD] font-medium">
                {profile.name?.split(' ')[0]}
              </span>
            )}
            
            {/* Unified Dropdown Notification Bell */}
            {profile && profile.role !== 'SuperAdmin' && (
              <div className="relative">
                <button
                  id="notification-bell"
                  onClick={() => setShowInbox(!showInbox)}
                  className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[#C4B5FD]/60 hover:text-white focus:outline-none"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showInbox && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowInbox(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-[#13102A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-left animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                        <h4 className="font-extrabold text-xs text-white">Notifications</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[9px] text-[#A78BFA] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                        {notifications.length === 0 ? (
                          <p className="text-[10px] text-white/30 text-center py-6">No new notifications.</p>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                notif.was_read 
                                  ? 'bg-white/[0.01] border-white/5 opacity-60' 
                                  : 'bg-[#6C2BD9]/10 border-[#6C2BD9]/20 hover:border-[#8B5CF6]/40'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{
                                  backgroundColor: getNotifTypeColor(notif.type) + '20',
                                  color: getNotifTypeColor(notif.type),
                                  border: `1px solid ${getNotifTypeColor(notif.type)}30`
                                }}>
                                  {notif.type.replace('_', ' ')}
                                </span>
                                <span className="text-[7px] text-white/30 font-mono">
                                  {notif.time}
                                </span>
                              </div>
                              <h5 className="font-bold text-xs text-white mt-1.5">{notif.title}</h5>
                              <p className="text-[10px] text-[#C4B5FD]/75 mt-0.5 leading-relaxed">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="text-[10px] border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-[#C4B5FD]/60 hover:text-white"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </header>

        {/* Offline Fallback Banner */}
        {showFallbackBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-400 font-medium flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Showing cached data — live data connection is currently unavailable.</span>
            </div>
            <button 
              onClick={() => setShowFallbackBanner(false)}
              className="p-1 rounded hover:bg-amber-500/20 text-amber-400/70 hover:text-amber-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Onboarding walk-through */}
      {profile && (
        <OnboardingTour role={profile.role} portalName={portalBadge || portalName} />
      )}
    </div>
  );
}
