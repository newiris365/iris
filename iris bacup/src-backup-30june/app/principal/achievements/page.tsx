"use client";

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Star } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function PrincipalAchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/achievements');
        if (res.success) setAchievements(res.achievements || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const categoryIcons: Record<string, any> = {
    Academic: Trophy,
    Sports: Medal,
    Cultural: Star,
    Other: Award,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Award size={24} className="text-purple-400" />
        Achievements
      </h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading achievements...</div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Award size={40} className="mx-auto mb-3 opacity-50" />
          <p>No achievements recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((a: any) => {
            const Icon = categoryIcons[a.category] || Award;
            return (
              <div key={a.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{a.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{a.student_name || a.recipient || '—'}</span>
                      <span>{a.category}</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
