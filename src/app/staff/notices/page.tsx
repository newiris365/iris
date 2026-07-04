"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function StaffNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet('staff/notices');
      if (res.success) setNotices(res.notices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      HR: 'bg-amber-500/20 text-amber-400',
      Admin: 'bg-blue-500/20 text-blue-400',
      General: 'bg-slate-500/20 text-slate-400',
      Event: 'bg-purple-500/20 text-purple-400',
    };
    return colors[cat] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Bell size={24} className="text-amber-400" /> Notices
      </h1>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Bell size={40} className="mx-auto mb-3 opacity-50" />
          <p>No notices available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">{n.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{n.content}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{n.created_at ? new Date(n.created_at).toLocaleDateString() : '—'}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(n.category)}`}>
                  {n.category || 'General'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
