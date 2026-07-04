"use client";

import React, { useState } from 'react';
import { FileText, Plus, Calendar, Tag, Eye, X } from 'lucide-react';

const MOCK_NOTICES = [
  { id: '1', title: 'Independence Day Celebration', category: 'Event', date: '2026-07-05', content: 'Annual Independence Day celebration will be held on August 15th. All students must participate in the cultural program. Rehearsals start from August 10th.', author: 'Principal' },
  { id: '2', title: 'Mid-Term Exam Schedule Released', category: 'Academic', date: '2026-07-03', content: 'The mid-term examination schedule for classes 9-12 has been published. Please check the academic calendar for detailed dates and timings.', author: 'VP Office' },
  { id: '3', title: 'PTM Meeting — July 12', category: 'Event', date: '2026-07-01', content: 'Parent-Teacher Meeting scheduled for July 12th (Saturday). All class teachers must prepare progress reports.', author: 'Admin' },
  { id: '4', title: 'Staff Training Workshop', category: 'HR', date: '2026-06-28', content: 'Mandatory digital literacy training for all staff members on July 8th. Attendance will be recorded.', author: 'HR' },
  { id: '5', title: 'Rainy Day Protocol', category: 'General', date: '2026-06-25', content: 'During heavy rainfall, assembly will be held in the main hall. Bus timings may be adjusted. Parents will be notified via SMS.', author: 'Admin' },
];

export default function NoticesPage() {
  const [notices] = useState(MOCK_NOTICES);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Event: 'bg-purple-500/20 text-purple-400',
      Academic: 'bg-blue-500/20 text-blue-400',
      HR: 'bg-amber-500/20 text-amber-400',
      General: 'bg-slate-500/20 text-slate-400',
    };
    return colors[cat] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={24} className="text-violet-400" /> Notices Board
        </h1>
        <p className="text-sm text-[#C4B5FD]/60 mt-1">School notices, circulars, and announcements</p>
      </div>

      <div className="space-y-3">
        {notices.map(n => (
          <div key={n.id} onClick={() => setSelectedNotice(n)}
            className="bg-white/5 rounded-xl border border-white/10 p-4 cursor-pointer hover:bg-white/[0.07] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{n.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{n.author} · {n.date}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(n.category)}`}>
                {n.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-[#6C2BD9]/30 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setSelectedNotice(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={16} />
            </button>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(selectedNotice.category)}`}>
              {selectedNotice.category}
            </span>
            <h3 className="font-bold text-base text-white mt-2">{selectedNotice.title}</h3>
            <p className="text-[10px] text-slate-400 mt-1">By {selectedNotice.author} · {selectedNotice.date}</p>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">{selectedNotice.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}
