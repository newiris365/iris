"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Book, AlertTriangle, TrendingUp } from 'lucide-react';
import { apiGet } from '../../../../lib/api';

export default function AdminLibraryPage() {
  const [stats, setStats] = useState({ totalBooks: 0, activeMembers: 0, issuedBooks: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [booksRes, membersRes] = await Promise.all([
          apiGet('core/books'),
          apiGet('core/library/members'),
        ]);
        if (booksRes.success) setStats(s => ({ ...s, totalBooks: booksRes.books?.length || 0 }));
        if (membersRes.success) setStats(s => ({ ...s, activeMembers: membersRes.members?.length || 0 }));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyan-400 animate-pulse">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BookOpen size={24} className="text-cyan-400" />
        Library Management
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Books', value: stats.totalBooks, icon: Book, color: 'text-blue-400' },
          { label: 'Active Members', value: stats.activeMembers, icon: Users, color: 'text-emerald-400' },
          { label: 'Issued Books', value: stats.issuedBooks, icon: BookOpen, color: 'text-amber-400' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Book Catalog', href: '/library/books', color: 'bg-blue-500/20 text-blue-400' },
          { label: 'E-Books', href: '/library/ebooks', color: 'bg-violet-500/20 text-violet-400' },
          { label: 'Study Rooms', href: '/library/study-rooms', color: 'bg-emerald-500/20 text-emerald-400' },
          { label: 'Fines', href: '/library/fines', color: 'bg-amber-500/20 text-amber-400' },
        ].map(a => (
          <a key={a.label} href={a.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 ${a.color} hover:opacity-80 transition-all`}>
            <span className="text-sm font-medium">{a.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
