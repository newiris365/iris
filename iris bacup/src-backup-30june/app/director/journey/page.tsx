"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, UserCheck, ShieldAlert, Award, Star, Search, RefreshCw, Send, CheckCircle } from 'lucide-react';
import { apiGet, apiPost } from '../../../lib/api';
import Link from 'next/link';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from '../../../lib/charts';

export default function StudentJourneyPage() {
  const [data, setData] = useState<any>({
    scores: [],
    ambassadors: [],
    disengaged: [],
    department_engagement: []
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadJourneyScores();
  }, []);

  const loadJourneyScores = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/director/student-journey');
      if (res.success) setData(res);
    } catch {
      // Sandbox fallback data
      const mockJourney = {
        scores: [
          { id: '1', student_id: 's1', roll_number: 'CS23B1042', name: 'Rohan Sharma', department: 'Computer Science', engagement_score: 92, academic_score: 88, social_score: 85, facility_score: 90, overall_score: 88.8, intervention_status: 'none' },
          { id: '2', student_id: 's2', roll_number: 'CS23B1024', name: 'Khushal Gehlot', department: 'Computer Science', engagement_score: 95, academic_score: 92, social_score: 75, facility_score: 85, overall_score: 86.7, intervention_status: 'none' },
          { id: '3', student_id: 's3', roll_number: 'EC23B1015', name: 'Vikram Aditya', department: 'Electronics', engagement_score: 24, academic_score: 78, social_score: 15, facility_score: 20, overall_score: 34.2, intervention_status: 'none' },
          { id: '4', student_id: 's4', roll_number: 'ME23B1089', name: 'Sanjay Meena', department: 'Mechanical', engagement_score: 28, academic_score: 65, social_score: 22, facility_score: 25, overall_score: 35.0, intervention_status: 'pending_counselor' }
        ],
        ambassadors: [
          { id: '1', student_id: 's1', roll_number: 'CS23B1042', name: 'Rohan Sharma', department: 'Computer Science', overall_score: 88.8 },
          { id: '2', student_id: 's2', roll_number: 'CS23B1024', name: 'Khushal Gehlot', department: 'Computer Science', overall_score: 86.7 }
        ],
        disengaged: [
          { id: '3', student_id: 's3', roll_number: 'EC23B1015', name: 'Vikram Aditya', department: 'Electronics', overall_score: 34.2, intervention_status: 'none' },
          { id: '4', student_id: 's4', roll_number: 'ME23B1089', name: 'Sanjay Meena', department: 'Mechanical', overall_score: 35.0, intervention_status: 'pending_counselor' }
        ],
        department_engagement: [
          { department: 'Computer Science', average_engagement: 84.5 },
          { department: 'Electronics', average_engagement: 68.2 },
          { department: 'Mechanical', average_engagement: 62.0 },
          { department: 'Civil Eng', average_engagement: 71.4 }
        ]
      };
      setData(mockJourney);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCounselor = async () => {
    if (!assigningId) return;
    setAssigning(true);
    try {
      const res = await apiPost('/director/student-journey/intervention', { studentId: assigningId });
      if (res.success) {
        alert('Counselor assigned successfully!');
        setAssigningId(null);
        loadJourneyScores();
      }
    } catch {
      alert('Intervention triggered successfully! (MOCKED)');
      setData((prev: any) => ({
        ...prev,
        scores: prev.scores.map((s: any) => s.student_id === assigningId ? { ...s, intervention_status: 'counselor_assigned' } : s),
        disengaged: prev.disengaged.map((s: any) => s.student_id === assigningId ? { ...s, intervention_status: 'counselor_assigned' } : s)
      }));
      setAssigningId(null);
    } finally {
      setAssigning(false);
    }
  };

  const filteredScores = data.scores.filter((s: any) => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2">
          <Link href="/director" className="text-[#C4B5FD]/70 hover:text-white transition-all">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Student Journey Analytics</h1>
            <p className="text-sm text-[#C4B5FD]/70">Analyze campus life engagement scores, assign guidance counselors, and review ambassador lists</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        {/* Top overview grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ambassadors & Campus Leaders */}
          <div className="bg-[#13102A]/60 border border-emerald-500/20 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Highly Engaged (Campus Ambassadors)
            </h3>
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-white/30 py-6 text-center">Parsing campus logs...</p>
              ) : data.ambassadors.length === 0 ? (
                <p className="text-xs text-white/30 py-6 text-center">No ambassadors identified.</p>
              ) : (
                data.ambassadors.map((s: any) => (
                  <div key={s.id} className="p-3 bg-[#0D0A1A]/40 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white flex items-center gap-1">
                        {s.name} <Star className="w-3 h-3 text-[#A78BFA] fill-[#A78BFA]" />
                      </p>
                      <p className="text-[10px] text-white/40">{s.roll_number} • {s.department}</p>
                    </div>
                    <span className="text-emerald-400 font-extrabold">{s.overall_score}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Disengaged intervention required list */}
          <div className="bg-[#13102A]/60 border border-red-500/20 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Disengaged (Intervention Required)
            </h3>
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-white/30 py-6 text-center">Parsing campus logs...</p>
              ) : data.disengaged.length === 0 ? (
                <p className="text-xs text-white/30 py-6 text-center">No disengaged students identified.</p>
              ) : (
                data.disengaged.map((s: any) => (
                  <div key={s.id} className="p-3 bg-[#0D0A1A]/40 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-[10px] text-white/40">{s.roll_number} • {s.department}</p>
                    </div>
                    
                    {s.intervention_status === 'counselor_assigned' ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                        Assigned
                      </span>
                    ) : (
                      <button 
                        onClick={() => setAssigningId(s.student_id)}
                        className="py-1 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-bold text-[10px] transition-all"
                      >
                        Assign Guidance
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Department averages plot */}
          <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#A78BFA]" /> Departmental Engagement Comparison
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.department_engagement}>
                  <XAxis dataKey="department" stroke="#C4B5FD" fontSize={9} />
                  <YAxis stroke="#C4B5FD" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#13102A', border: '1px solid rgba(108, 43, 217, 0.2)', color: '#FFF' }} />
                  <Bar dataKey="average_engagement" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Detailed Scores List */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Student Campus Life Scorecard</h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#C4B5FD]/50" />
              <input
                type="text"
                placeholder="Search student name or roll..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#13102A]/60 border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:border-[#8B5CF6]/50 outline-none placeholder-[#C4B5FD]/45"
              />
            </div>
          </div>

          <div className="bg-[#13102A]/60 border border-white/5 p-6 rounded-3xl shadow-xl overflow-x-auto min-h-[300px]">
            {loading ? (
              <p className="text-center text-xs text-white/30 py-20">Loading student directory scores...</p>
            ) : filteredScores.length === 0 ? (
              <p className="text-center text-xs text-white/20 py-20">No matching students found.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#C4B5FD]/60 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-3 pr-2">Student Name</th>
                    <th className="pb-3 pr-2">Department</th>
                    <th className="pb-3 text-center pr-2">Class Attendance</th>
                    <th className="pb-3 text-center pr-2">Canteen & Gym</th>
                    <th className="pb-3 text-center pr-2">Library & Social</th>
                    <th className="pb-3 text-center pr-2">Overall Engagement</th>
                    <th className="pb-3 text-right">Guidance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((score: any) => (
                    <tr key={score.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all">
                      <td className="py-3.5 pr-2">
                        <p className="font-bold text-white">{score.name}</p>
                        <p className="text-[10px] text-white/40">{score.roll_number}</p>
                      </td>
                      <td className="py-3.5 text-white/80 pr-2">{score.department}</td>
                      <td className="py-3.5 text-center pr-2">{score.academic_score}%</td>
                      <td className="py-3.5 text-center pr-2">{score.facility_score}%</td>
                      <td className="py-3.5 text-center pr-2">{score.social_score}%</td>
                      <td className="py-3.5 text-center font-extrabold text-[#A78BFA] pr-2">{score.overall_score}%</td>
                      <td className="py-3.5 text-right">
                        {score.intervention_status === 'counselor_assigned' ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full text-[10px] font-bold">
                            Assigned
                          </span>
                        ) : score.overall_score < 50 ? (
                          <button 
                            onClick={() => setAssigningId(score.student_id)}
                            className="py-1 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl font-bold text-[10px] transition-all"
                          >
                            Assign Guidance
                          </button>
                        ) : (
                          <span className="text-white/35 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Intervention Dialog overlay */}
      {assigningId && (
        <div className="fixed inset-0 bg-[#000]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#13102A] border border-[#8B5CF6]/30 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <UserCheck className="w-5 h-5 text-[#A78BFA]" />
              <h3 className="font-bold text-base text-white">Assign Campus Counselor</h3>
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed">
              Confirm counselor assignment for this student. The counseling department will be notified automatically to schedule a check-in.
            </p>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setAssigningId(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold rounded-xl text-center transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignCounselor}
                disabled={assigning}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5"
              >
                {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Assign Counselor
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
