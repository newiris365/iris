"use client";

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Star, Shield, Search, RefreshCw } from 'lucide-react';

interface Achievement {
  id: string;
  student_name: string;
  achievement_type: string;
  title: string;
  level: string;
  date: string;
  description?: string;
  roll_no: string;
}

export default function AdminStudentAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    total_achievements: 34,
    sports_medals: 12,
    academic_toppers: 14,
    state_level_above: 20
  });

  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/v1/obe/student-achievements/stats', {
        headers: getAuthHeaders()
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Mock student achievements list
      setAchievements([
        { id: 'ac-1', student_name: 'Priya Patel', roll_no: '22CSE02', achievement_type: 'academic', title: 'National Code-Golf Hackathon 1st Rank', level: 'national', date: '2026-05-18', description: 'Awarded cash prize of Rs. 50,000 for serverless database sharding script optimizations.' },
        { id: 'ac-2', student_name: 'Amit Sharma', roll_no: '22CSE01', achievement_type: 'sports', title: 'State Level Chess Tournament Gold Medalist', level: 'state', date: '2026-06-01', description: 'Represented institution in interstate sports championship.' },
        { id: 'ac-3', student_name: 'Rahul Verma', roll_no: '22CSE03', achievement_type: 'competitive', title: 'Google Summer of Code (GSoC) Contributor', level: 'international', date: '2026-05-20', description: 'Selected for open source memory compilation projects.' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Institutional Laurels Registry</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Student Achievements Register</h1>
          <p className="text-xs text-[#C4B5FD]/70">
            Monitor state, national, and international level academic accomplishments, sports trophies, and moral awards catalogued by the campus.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading achievements ledger...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stats Indicators grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Laurels Logged', value: stats.total_achievements, icon: Trophy, color: '#6C2BD9' },
              { label: 'Sports Medals', value: stats.sports_medals, icon: Star, color: '#8B5CF6' },
              { label: 'Academic Toppers', value: stats.academic_toppers, icon: Award, color: '#A78BFA' },
              { label: 'State & Above Level', value: stats.state_level_above, icon: Shield, color: '#10B981' }
            ].map((kpi, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-[#6C2BD9]/50 transition-all bg-[#13102A]/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#C4B5FD] uppercase tracking-wider font-bold">{kpi.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <h3 className="font-extrabold text-xl text-white">{kpi.value}</h3>
              </div>
            ))}
          </div>

          {/* Timeline Roster grid */}
          <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl overflow-hidden bg-[#13102A]/40">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-extrabold text-sm text-white">Student Accomplishments Chronicle</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-4 px-6">Roll No</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Achievement Description</th>
                    <th className="py-4 px-6">Level</th>
                    <th className="py-4 px-6">Event Date</th>
                    <th className="py-4 px-6">Type Category</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map(ac => (
                    <tr key={ac.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs text-white">
                      <td className="py-4 px-6 font-mono text-[#A78BFA] font-bold">{ac.roll_no}</td>
                      <td className="py-4 px-6 font-extrabold">{ac.student_name}</td>
                      <td className="py-4 px-6 max-w-sm">
                        <div className="flex flex-col gap-1 leading-normal font-semibold">
                          <span className="font-extrabold text-white text-xs leading-normal">{ac.title}</span>
                          <span className="text-[10px] text-[#C4B5FD]/75 leading-normal">{ac.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-bold bg-[#6C2BD9]/15 text-[#C4B5FD] border border-[#8B5CF6]/30">
                          {ac.level}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#C4B5FD]/80">{ac.date}</td>
                      <td className="py-4 px-6 font-bold text-white uppercase">{ac.achievement_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
