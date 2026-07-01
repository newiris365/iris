"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Eye, EyeOff } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function PrincipalNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/notices');
        if (res.success) setNotices(res.notices || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const priorityColors: Record<string, string> = {
    Urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    Important: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Bell size={24} className="text-purple-400" />
        Notices
      </h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No notices found.</div>
      ) : (
        <div className="space-y-3">
          {notices.map((n: any) => (
            <div key={n.id} className={`bg-white/5 rounded-xl p-4 border ${priorityColors[n.priority] || 'border-white/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${priorityColors[n.priority] || ''}`}>{n.priority}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{n.content}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{n.created_by_name || 'Admin'}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
