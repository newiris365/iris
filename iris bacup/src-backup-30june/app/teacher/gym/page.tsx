"use client";

import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Users, Clock } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function TeacherGymPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [classesRes, sessionsRes] = await Promise.all([
          apiGet('gym/classes'),
          apiGet('gym/sessions'),
        ]);
        if (classesRes.success) setClasses(classesRes.classes || []);
        if (sessionsRes.success) setSessions(sessionsRes.sessions || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const upcomingSessions = sessions.filter(s => new Date(s.start_time) > new Date()).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Dumbbell size={24} className="text-violet-400" />
        Gym Bookings
      </h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading gym data...</div>
      ) : (
        <>
          {/* Today's Classes */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-violet-400" /> Available Classes
            </h2>
            {classes.length === 0 ? (
              <p className="text-slate-400 text-sm">No classes scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classes.slice(0, 6).map((c: any) => (
                  <div key={c.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{c.name || c.class_name}</p>
                        <p className="text-xs text-slate-400">{c.instructor || '—'} · {c.schedule || '—'}</p>
                      </div>
                      <span className="bg-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded">{c.capacity || '—'} slots</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" /> Upcoming Sessions
            </h2>
            {upcomingSessions.length === 0 ? (
              <p className="text-slate-400 text-sm">No upcoming sessions.</p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{s.class_name || s.title}</p>
                      <p className="text-xs text-slate-400">{s.instructor} · {new Date(s.start_time).toLocaleString()}</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded">
                      {s.booked_count || 0}/{s.capacity || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
