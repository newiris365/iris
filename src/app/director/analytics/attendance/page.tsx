"use client";

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { ArrowLeft, RefreshCw, Calendar, Phone, MessageSquare, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../../lib/api';
import Link from 'next/link';

export default function AttendanceAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  // Stats State
  const [trend, setTrend] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
    loadAttendanceData();
  }, [days]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/director/analytics/attendance', { days: days.toString() });
      if (res.success) {
        setTrend(res.trend || []);
        setDefaulters(res.defaulters || []);
        setHeatmap(res.heatmap || {});
      }
    } catch {
      // Mock Fallbacks
      setTrend(
        Array.from({ length: 10 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (10 - i));
          return { date: d.toISOString().split('T')[0], attendance_percent: 74 + Math.floor(Math.random() * 20) };
        })
      );
      setDefaulters([]);
      setHeatmap({
        '2026-06-01': 82,
        '2026-06-02': 74,
        '2026-06-03': 65,
        '2026-06-04': 88,
        '2026-06-05': 91
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock department comparison lists
  const departmentData = [
    { department: 'Computer Science', attendance: 88, target: 85 },
    { department: 'Electronics', attendance: 78, target: 85 },
    { department: 'Electrical', attendance: 82, target: 85 },
    { department: 'Mechanical', attendance: 71, target: 85 },
    { department: 'Civil Eng', attendance: 79, target: 85 }
  ];

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link href="/director/analytics" className="text-[#C4B5FD]/70 hover:text-white transition-all">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Link>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Attendance Analytics</h1>
            </div>
            <p className="text-sm text-[#C4B5FD]/70">Analyze institution-wide daily attendance rate variations, department performance, and low attendance defaulters list</p>
          </div>

          <div className="flex gap-3">
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="bg-[#13102A] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button
              onClick={loadAttendanceData}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        {/* 1. VISUAL CHART ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Institution-wide daily attendance line chart */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Institution-Wide Attendance Trend</h3>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} domain={[40, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="attendance_percent" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#A78BFA' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Radar Chart: Department Performance vs Target */}
          <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Departments Target Comparison</h3>
            <div className="h-64 w-full flex items-center justify-center">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={departmentData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="department" stroke="rgba(255,255,255,0.4)" fontSize={8} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                    <Radar name="Attendance" dataKey="attendance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    <Radar name="Target" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ backgroundColor: '#13102A', border: 'none' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* 2. HEATMAP CALENDAR PREVIEW */}
        <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4.5 h-4.5 text-[#A78BFA]" /> Daily Attendance Heatmap
          </h3>
          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(heatmap).map(([date, val]) => (
              <div 
                key={date}
                className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center p-1.5 transition-all cursor-help ${
                  val >= 85 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  val >= 75 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
                title={`Date: ${date} (${val}% Attendance)`}
              >
                <span className="text-[8px] text-white/30 font-mono">{date.substring(8)}</span>
                <span className="text-[11px] font-bold mt-0.5">{val}%</span>
              </div>
            ))}
            {Object.keys(heatmap).length === 0 && (
              <p className="text-xs text-white/30 p-4">No calendar logs compiled for the selected date filters.</p>
            )}
          </div>
        </div>

        {/* 3. ATTENDANCE DEFAULTERS LIST (X% limit check) */}
        <div className="bg-[#13102A]/60 p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4.5 h-4.5" /> Attendance Defaulters (Below 75% Threshold)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[#C4B5FD]/50">
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Attendance Rate</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {defaulters.map(student => (
                  <tr key={student.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="py-3.5 px-4 font-bold font-mono text-[#A78BFA]">{student.roll_number}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{student.name}</td>
                    <td className="py-3.5 px-4 text-[#C4B5FD]/80">{student.department}</td>
                    <td className="py-3.5 px-4 font-bold text-red-400">{student.attendance_rate}%</td>
                    <td className="py-3.5 px-4 text-right flex justify-end gap-2.5">
                      <a 
                        href={`tel:${student.phone}`}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
                        title="Call Guardian"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a 
                        href={`https://wa.me/${student.phone.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#10B981]/10 hover:bg-[#10B981]/25 text-[#10B981] transition-all"
                        title="WhatsApp Notice"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
                {defaulters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/30 text-xs">All students are above attendance limit constraints!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
