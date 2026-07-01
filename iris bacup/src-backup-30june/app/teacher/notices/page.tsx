"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown, ChevronRight, AlertTriangle, Info, CheckCircle, Clock, Filter } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const MOCK_NOTICES = [
  {
    id: '1',
    title: 'Mid-Semester Exam Schedule Released',
    content: 'The mid-semester examination schedule for all departments has been finalized. Please review the timetable and coordinate with your department HOD for any scheduling conflicts. Labs must be rescheduled accordingly.',
    category: 'Academic',
    published_at: '2026-06-10T09:00:00Z',
    isRead: false,
  },
  {
    id: '2',
    title: 'Annual Tech Fest - Volunteer Registration Open',
    content: 'The annual technical festival "TechVision 2026" is scheduled for July 15-17. Faculty coordinators are requested to encourage student participation. Volunteer registration closes on June 25.',
    category: 'Events',
    published_at: '2026-06-09T14:30:00Z',
    isRead: true,
  },
  {
    id: '3',
    title: 'Campus Emergency Drill - June 20',
    content: 'A mandatory campus-wide emergency evacuation drill will be conducted on June 20 at 11:00 AM. All faculty and staff must participate. Department heads should ensure complete compliance.',
    category: 'Emergency',
    published_at: '2026-06-08T08:00:00Z',
    isRead: false,
  },
  {
    id: '4',
    title: 'Updated Attendance Policy for Faculty',
    content: 'The administration has revised the faculty attendance policy effective immediately. Minimum 90% attendance is now mandatory for appraisal evaluation. Biometric registration has been updated.',
    category: 'Admin',
    published_at: '2026-06-07T11:00:00Z',
    isRead: true,
  },
  {
    id: '5',
    title: 'Research Paper Submission Deadline Extended',
    content: 'The deadline for submitting research papers to the International Journal of Engineering has been extended to July 30. Faculty members are encouraged to submit their latest research work.',
    category: 'General',
    published_at: '2026-06-06T16:00:00Z',
    isRead: false,
  },
  {
    id: '6',
    title: 'New Lab Equipment Installation - Block C',
    content: 'State-of-the-art lab equipment for the Electronics and Communication department has been installed in Block C, Room 305. Faculty members are requested to familiarize themselves with the new apparatus.',
    category: 'Academic',
    published_at: '2026-06-05T10:00:00Z',
    isRead: true,
  },
  {
    id: '7',
    title: 'Faculty Development Program - AI & ML Workshop',
    content: 'A 5-day Faculty Development Program on "Artificial Intelligence and Machine Learning Applications in Engineering" will be held from July 1-5. Registration is free for all departments.',
    category: 'Events',
    published_at: '2026-06-04T13:00:00Z',
    isRead: false,
  },
  {
    id: '8',
    title: 'Water Supply Disruption - East Wing',
    content: 'Due to maintenance of the overhead water tank, water supply to the east wing buildings will be disrupted on June 12 from 10:00 AM to 4:00 PM. Please plan accordingly.',
    category: 'Emergency',
    published_at: '2026-06-03T07:30:00Z',
    isRead: false,
  },
];

const CATEGORIES = ['All', 'Academic', 'Events', 'General', 'Emergency', 'Admin'];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Academic: { bg: 'bg-[#6C2BD9]/20', text: 'text-[#A78BFA]', border: 'border-[#6C2BD9]/30' },
  Events: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  General: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  Emergency: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  Admin: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Academic: <Info className="w-3.5 h-3.5" />,
  Events: <Clock className="w-3.5 h-3.5" />,
  General: <Info className="w-3.5 h-3.5" />,
  Emergency: <AlertTriangle className="w-3.5 h-3.5" />,
  Admin: <CheckCircle className="w-3.5 h-3.5" />,
};

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/notices');
      if (res.success) {
        setNotices(res.notices || []);
      } else {
        setNotices(MOCK_NOTICES);
      }
    } catch (err) {
      console.error(err);
      setNotices(MOCK_NOTICES);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRead = async (noticeId: string) => {
    setNotices(prev =>
      prev.map(n => (n.id === noticeId ? { ...n, isRead: true } : n))
    );
    try {
      await apiPost(`/core/notices/${noticeId}/read`, {});
    } catch (err) {
      // Quiet fail
    }
  };

  const handleExpand = (noticeId: string) => {
    const notice = notices.find(n => n.id === noticeId);
    if (notice && !notice.isRead) {
      handleRead(noticeId);
    }
    setExpandedId(prev => (prev === noticeId ? null : noticeId));
  };

  const filteredNotices = notices.filter(n => {
    const matchesCategory = activeCategory === 'All' || n.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unreadCount = notices.filter(n => !n.isRead).length;

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-white">Campus Notices</h1>
              <p className="text-xs text-[#C4B5FD]/70 font-light">
                View announcements, schedules, and important updates from the administration.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#6C2BD9]/20 text-[#A78BFA] border border-[#6C2BD9]/30 px-3 py-1 rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B5FD]/50" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#150F2A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#C4B5FD]/40 focus:outline-none focus:border-[#6C2BD9]/50 transition-colors"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(prev => !prev)}
              className="flex items-center gap-2 bg-[#150F2A] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-[#C4B5FD] hover:border-[#6C2BD9]/50 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {activeCategory}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-[#150F2A] border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                      activeCategory === cat
                        ? 'bg-[#6C2BD9]/20 text-[#A78BFA]'
                        : 'text-[#C4B5FD]/70 hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === cat
                  ? 'bg-[#6C2BD9]/20 text-[#A78BFA] border-[#6C2BD9]/40'
                  : 'bg-transparent text-[#C4B5FD]/50 border-white/10 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notices List */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-16">
              Loading notices...
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center text-xs text-[#C4B5FD]/50 italic">
              No notices found matching your criteria.
            </div>
          ) : (
            filteredNotices.map(nt => {
              const isExpanded = expandedId === nt.id;
              const catStyle = CATEGORY_STYLES[nt.category] || CATEGORY_STYLES.General;

              return (
                <div
                  key={nt.id}
                  onClick={() => handleExpand(nt.id)}
                  className={`glass-panel rounded-2xl border transition-all cursor-pointer ${
                    isExpanded ? 'border-[#6C2BD9]/50 shadow-md shadow-[#6C2BD9]/10' : 'border-white/5'
                  } ${!nt.isRead && !isExpanded ? 'border-[#6C2BD9]/30' : ''}`}
                >
                  {/* Notice Header */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[9px] ${catStyle.bg} ${catStyle.text} border ${catStyle.border} px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1`}
                        >
                          {CATEGORY_ICONS[nt.category]}
                          {nt.category}
                        </span>
                        {!nt.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-white leading-snug">
                        {nt.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!nt.isRead ? (
                        <span className="text-[9px] text-[#A78BFA] font-bold uppercase tracking-wider">
                          NEW
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> READ
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 text-[#C4B5FD]/50 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      <p className="text-xs text-[#C4B5FD]/80 leading-relaxed font-light">
                        {nt.content}
                      </p>
                      <div className="text-[9px] text-[#C4B5FD]/40 font-light flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                        <Clock className="w-3 h-3" />
                        <span>
                          Published: {nt.published_at ? new Date(nt.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {!isLoading && filteredNotices.length > 0 && (
          <div className="text-center text-[10px] text-[#C4B5FD]/30 font-light">
            Showing {filteredNotices.length} of {notices.length} notices
            {activeCategory !== 'All' && ` in "${activeCategory}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

      </div>
    </main>
  );
}
