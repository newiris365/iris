"use client";

import React, { useState, useEffect } from 'react';
import { Megaphone, MessageSquare, CheckSquare } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';

export default function ParentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('/core/notices');
      if (res.success) {
        setNotices(res.notices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRead = async (noticeId: string) => {
    setNotices(notices.map(n => n.id === noticeId ? { ...n, isRead: true } : n));
    try {
      await apiPost(`/core/notices/${noticeId}/read`, {});
    } catch (err) {
      // Quiet fail in sandbox
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white p-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6C2BD9]/20 border border-[#6C2BD9]/30 flex items-center justify-center text-[#A78BFA]">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-white">Campus Bulletin Announcements</h1>
            <p className="text-xs text-[#C4B5FD]/70 font-light">Stay updated with general notifications, event dates, and academic schedules for your child.</p>
          </div>
        </div>

        {/* Notices list */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center text-xs text-[#C4B5FD]/50 py-10">Fetching announcements bulletin...</div>
          ) : notices.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center text-xs text-[#C4B5FD]/50 italic">
              Noticeboard is clean. No active announcements listed.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((nt) => (
                <div 
                  key={nt.id} 
                  onClick={() => { if (!nt.isRead) handleRead(nt.id); }}
                  className={`glass-panel rounded-2xl p-5 border transition-all cursor-pointer relative ${
                    nt.isRead ? 'border-white/5 opacity-80' : 'border-[#6C2BD9]/50 shadow-md shadow-[#6C2BD9]/10'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] bg-[#6C2BD9]/20 text-[#A78BFA] px-2 py-0.5 rounded font-bold uppercase">{nt.category}</span>
                      <h4 className="font-heading font-bold text-base text-white mt-1.5 flex items-center gap-1.5">
                        {nt.title}
                        {!nt.isRead && (
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                        )}
                      </h4>
                    </div>

                    {!nt.isRead ? (
                      <span className="text-[9px] text-[#A78BFA] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <MessageSquare className="w-3.5 h-3.5" /> NEW
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <CheckSquare className="w-3.5 h-3.5" /> READ
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#C4B5FD]/80 mt-3 leading-relaxed font-light">{nt.content}</p>

                  <div className="text-[9px] text-[#C4B5FD]/50 font-light flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                    <span>Published: {nt.published_at ? nt.published_at.split('T')[0] : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
