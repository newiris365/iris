"use client";

import React, { useState, useEffect } from 'react';
import { Award, Download, Calendar, Users, BookOpen, Home, TrendingUp } from 'lucide-react';
import { apiGet } from '../../../lib/api';

export default function DirectorNAACPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet('director/naac-data');
        if (res.success) setData(res);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-purple-400 animate-pulse">Generating NAAC report...</div></div>;
  if (!data) return <div className="text-center py-12 text-slate-400">No data available.</div>;

  const c1 = data.curricular_aspects || {};
  const c2 = data.teaching_learning || {};
  const c3 = data.research_innovation || {};
  const c4 = data.infrastructure || {};
  const c5 = data.student_support || {};
  const c6 = data.governance || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Award size={24} className="text-purple-400" />
          NAAC Accreditation Data
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Academic Year: {data.academic_year}</span>
          <span className="text-xs text-slate-400">Generated: {new Date(data.generated_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Criterion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* C1: Curricular Aspects */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
            <BookOpen size={16} /> C1: Curricular Aspects
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Programs</span>
              <span className="text-white">{c1.total_programs}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Student:Teacher Ratio</span>
              <span className="text-white">{c1.student_teacher_ratio}:1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Student:Staff Ratio</span>
              <span className="text-white">{c1.student_staff_ratio}:1</span>
            </div>
          </div>
        </div>

        {/* C2: Teaching-Learning */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Users size={16} /> C2: Teaching-Learning
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Students</span>
              <span className="text-white">{c2.total_students}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Teachers</span>
              <span className="text-white">{c2.total_teachers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Avg Attendance</span>
              <span className="text-emerald-400">{c2.attendance_summary?.avg_attendance_pct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pass Rate</span>
              <span className="text-blue-400">{c2.exam_results?.pass_rate}%</span>
            </div>
          </div>
        </div>

        {/* C4: Infrastructure */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <Home size={16} /> C4: Infrastructure
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Hostel Blocks</span>
              <span className="text-white">{c4.hostel_blocks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Hostel Capacity</span>
              <span className="text-white">{c4.hostel_capacity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Occupied</span>
              <span className="text-white">{c4.hostel_occupied}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Bus Routes</span>
              <span className="text-white">{c4.bus_routes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Library Books</span>
              <span className="text-white">{c4.library_books}</span>
            </div>
          </div>
        </div>

        {/* C5: Student Support */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> C5: Student Support
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Complaints</span>
              <span className="text-white">{c5.total_complaints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Resolution Rate</span>
              <span className="text-emerald-400">{c5.resolution_rate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Fee Collection Rate</span>
              <span className="text-blue-400">{c5.fee_collection_rate}%</span>
            </div>
          </div>
        </div>

        {/* C6: Governance */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            <Users size={16} /> C6: Governance
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Users</span>
              <span className="text-white">{c6.total_users}</span>
            </div>
            {(c6.roles_breakdown || []).map((r: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-400">{r.role}</span>
                <span className="text-white">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* C3: Research */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
            <Award size={16} /> C3: Research & Innovation
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Academic Events</span>
              <span className="text-white">{c3.total_events}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Workshops</span>
              <span className="text-white">{c3.total_workshops}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise */}
      {data.department_wise && data.department_wise.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Department-wise Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-slate-400">Department</th>
                  <th className="text-right p-2 text-slate-400">Students</th>
                  <th className="text-right p-2 text-slate-400">Teachers</th>
                  <th className="text-right p-2 text-slate-400">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {data.department_wise.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 text-white">{d.department_name}</td>
                    <td className="p-2 text-right text-slate-300">{d.students}</td>
                    <td className="p-2 text-right text-slate-300">{d.teachers}</td>
                    <td className="p-2 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded ${d.attendance_pct >= 75 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {d.attendance_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
