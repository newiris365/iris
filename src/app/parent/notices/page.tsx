"use client";

import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, BookOpen, Calendar, AlertTriangle, PartyPopper, GraduationCap, Filter, ChevronRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; priority: number; label: string }> = {
  'Exam': { icon: GraduationCap, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', priority: 1, label: 'Exams' },
  'Urgent': { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', priority: 1, label: 'Urgent' },
  'Academic': { icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', priority: 2, label: 'Academic' },
  'Event': { icon: PartyPopper, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', priority: 3, label: 'Events' },
  'Holiday': { icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', priority: 4, label: 'Holidays' },
  'General': { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', priority: 5, label: 'General' },
};

function getCategoryConfig(cat: string) {
  return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['General'];
}

export default function ParentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/notices');
      if (res.success) setNotices(res.notices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRead = async (noticeId: string) => {
    setNotices(notices.map(n => n.id === noticeId ? { ...n, isRead: true } : n));
    try { await apiPost(`/core/notices/${noticeId}/read`, {}); } catch {}
  };

  const sortedNotices = [...notices].sort((a, b) => {
    const aPriority = getCategoryConfig(a.category).priority;
    const bPriority = getCategoryConfig(b.category).priority;
    if (aPriority !== bPriority) return aPriority - bPriority;
    const aRead = a.isRead ? 1 : 0;
    const bRead = b.isRead ? 1 : 0;
    if (aRead !== bRead) return aRead - bRead;
    return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
  });

  const filtered = activeFilter === 'all'
    ? sortedNotices
    : sortedNotices.filter(n => (n.category || 'General') === activeFilter);

  const categories = Array.from(new Set(notices.map(n => n.category || 'General')));

  const unreadByCategory: Record<string, number> = {};
  notices.forEach(n => {
    if (!n.isRead) {
      const cat = n.category || 'General';
      unreadByCategory[cat] = (unreadByCategory[cat] || 0) + 1;
    }
  });
  const totalUnread = notices.filter(n => !n.isRead).length;

  return (
    <div className="max-w-5xl mx-auto py-6 w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-white">Notices & Announcements</h2>
            <p className="text-[10px] text-[#C4B5FD]/50">Stay updated with important campus notifications</p>
          </div>
        </div>
        {totalUnread > 0 && (
          <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
            {totalUnread} unread
          </span>
        )}
      </div>

      {/* Urgent Banner */}
      {unreadByCategory['Urgent'] > 0 && activeFilter === 'all' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-red-400">You have {unreadByCategory['Urgent']} urgent notice{unreadByCategory['Urgent'] > 1 ? 's' : ''} that need your attention!</p>
            <p className="text-[10px] text-red-400/50 mt-0.5">Please review them immediately</p>
          </div>
          <button onClick={() => setActiveFilter('Urgent')}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-all flex items-center gap-1">
            View <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-[#6C2BD9]/20 border-[#6C2BD9]/40 text-white'
              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          <Filter className="w-3 h-3" /> All
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] ${activeFilter === 'all' ? 'bg-[#6C2BD9]/30' : 'bg-white/10'}`}>
            {notices.length}
          </span>
        </button>

        {categories.sort((a, b) => getCategoryConfig(a).priority - getCategoryConfig(b).priority).map(cat => {
          const config = getCategoryConfig(cat);
          const Icon = config.icon;
          const count = notices.filter(n => (n.category || 'General') === cat).length;
          const unread = unreadByCategory[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                activeFilter === cat
                  ? `${config.bg} ${config.border} ${config.color}`
                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <Icon className="w-3 h-3" /> {config.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] ${activeFilter === cat ? 'bg-white/10' : 'bg-white/10'}`}>
                {count}
              </span>
              {unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-extrabold">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-xs text-[#C4B5FD]/50">Loading notices...</div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 border border-white/5 text-center">
            <Megaphone className="w-12 h-12 text-[#C4B5FD]/10 mx-auto mb-3" />
            <p className="text-xs text-white/30">
              {activeFilter === 'all' ? 'No notices yet' : `No ${getCategoryConfig(activeFilter).label.toLowerCase()} notices`}
            </p>
          </div>
        ) : (
          filtered.map((nt) => {
            const config = getCategoryConfig(nt.category || 'General');
            const Icon = config.icon;
            return (
              <div
                key={nt.id}
                onClick={() => { if (!nt.isRead) handleRead(nt.id); }}
                className={`glass-panel rounded-2xl p-5 border transition-all cursor-pointer ${
                  !nt.isRead
                    ? `${config.border} shadow-lg shadow-black/20`
                    : 'border-white/5 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] ${config.bg} ${config.color} px-2 py-0.5 rounded font-bold uppercase`}>
                        {config.label}
                      </span>
                      {!nt.isRead && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[8px] font-extrabold uppercase">NEW</span>
                      )}
                      {(nt.category === 'Exam' || nt.category === 'Urgent') && !nt.isRead && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[8px] font-extrabold uppercase animate-pulse">
                          IMPORTANT
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-sm text-white mb-1.5">{nt.title}</h4>
                    <p className="text-xs text-[#C4B5FD]/60 leading-relaxed font-light line-clamp-2">{nt.content}</p>
                    <div className="text-[9px] text-[#C4B5FD]/30 mt-2 flex items-center gap-3">
                      <span>{nt.published_at ? new Date(nt.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                      {nt.expires_at && <span>Expires: {new Date(nt.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {nt.isRead ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400/40" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
