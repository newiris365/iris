"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Users } from 'lucide-react';
import { apiGet } from '../../../../lib/api';

export default function PrincipalReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('campusCore/attendance/institution-summary');
        if (res.success) setSummary(res);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 size={24} className="text-purple-400" />
        Institution Reports
      </h1>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading reports...</div>
      ) : !summary ? (
        <div className="text-center py-12 text-slate-400">No data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: summary.total_students || 0, icon: Users, color: 'text-blue-400' },
              { label: 'Avg Attendance', value: `${summary.avg_attendance_pct || 0}%`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Low Attendance', value: summary.low_attendance_count || 0, icon: Calendar, color: 'text-amber-400' },
              { label: 'Critical', value: summary.critical_count || 0, icon: BarChart3, color: 'text-red-400' },
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

          {/* Department Breakdown */}
          {summary.departments && summary.departments.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Department Breakdown</h2>
              <div className="space-y-3">
                {summary.departments.map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{d.name}</p>
                      <p className="text-xs text-slate-400">{d.student_count} students</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${d.avg_attendance || 0}%` }} />
                      </div>
                      <span className="text-sm text-white font-medium">{d.avg_attendance || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
