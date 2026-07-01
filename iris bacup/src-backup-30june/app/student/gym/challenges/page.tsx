"use client";

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, Target, Activity, Award, RefreshCw, ChevronRight, Flame, Plus, CheckCircle2, TrendingUp
} from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

interface Challenge {
  id: string;
  name: string;
  description?: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_value: number;
  unit: string;
  is_active: boolean;
  participants_count?: number;
}

interface ParticipantProgress {
  id: string;
  challenge_id: string;
  student_id: string;
  current_value: number;
  joined_at: string;
}

interface FitPointsLog {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

interface LeaderboardEntry {
  name: string;
  roll: string;
  dept: string;
  points: number;
}

export default function StudentChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'challenges' | 'points' | 'leaderboard'>('challenges');
  const [myProgress, setMyProgress] = useState<Record<string, ParticipantProgress>>({});
  const [challengeLeaderboards, setChallengeLeaderboards] = useState<Record<string, any[]>>({});
  const [fitPointsTotal, setFitPointsTotal] = useState<number>(0);
  const [fitPointsLogs, setFitPointsLogs] = useState<FitPointsLog[]>([]);
  const [campusLeaderboard, setCampusLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  
  // Progress Logging Input
  const [logValue, setLogValue] = useState<string>('');
  const [activeLogChallengeId, setActiveLogChallengeId] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      // 1. Fetch Challenges
      const chalRes = await apiGet('/fitzone/gym/challenges');
      if (chalRes.success && chalRes.challenges) {
        setChallenges(chalRes.challenges);
        
        // Fetch leaderboard for each challenge
        chalRes.challenges.forEach((c: Challenge) => {
          fetchChallengeLeaderboard(c.id);
        });
      }

      // 2. Fetch Student FitPoints
      const fpRes = await apiGet(`/fitzone/gym/fitpoints/${studentId}`);
      if (fpRes.success) {
        setFitPointsTotal(fpRes.total_points || 0);
        setFitPointsLogs(fpRes.logs || []);
      }

      // 3. Fetch Campus Leaderboard
      const ldRes = await apiGet('/fitzone/gym/leaderboard');
      if (ldRes.success && ldRes.leaderboard) {
        setCampusLeaderboard(ldRes.leaderboard);
      }
    } catch (err) {
      console.log('Error loading challenges or points data, using fallback mocks');
      // Fallback Mocks
      setChallenges([
        {
          id: 'c1',
          name: '10K Daily Steps Marathon',
          description: 'Log steps daily. Walk your way to victory and earn points.',
          challenge_type: 'steps',
          start_date: '2026-06-01',
          end_date: '2026-06-15',
          target_value: 70000,
          unit: 'steps',
          is_active: true
        },
        {
          id: 'c2',
          name: 'FitZone Workout Streak Challenge',
          description: 'Complete 10 workouts at the campus gym during this challenge.',
          challenge_type: 'workouts',
          start_date: '2026-06-01',
          end_date: '2026-06-30',
          target_value: 10,
          unit: 'sessions',
          is_active: true
        }
      ]);
      setFitPointsTotal(340);
      setFitPointsLogs([
        { id: '1', points: 100, reason: '7-Day check-in streak bonus', created_at: '2026-06-09T08:00:00Z' },
        { id: '2', points: 10, reason: 'Daily wellness check-in completed', created_at: '2026-06-09T08:00:00Z' },
        { id: '3', points: 10, reason: 'Daily wellness check-in completed', created_at: '2026-06-08T08:00:00Z' }
      ]);
      setCampusLeaderboard([
        { name: 'Khushal Gehlot', roll: 'CS23B1024', dept: 'Computer Science', points: 340 },
        { name: 'Alok Kumar', roll: 'EE23B2014', dept: 'Electrical Engineering', points: 280 },
        { name: 'Vikram Singh', roll: 'ME23B3052', dept: 'Mechanical Engineering', points: 150 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeLeaderboard = async (challengeId: string) => {
    try {
      const res = await apiGet(`/fitzone/gym/challenges/${challengeId}/leaderboard`);
      if (res.success && res.leaderboard) {
        setChallengeLeaderboards(prev => ({
          ...prev,
          [challengeId]: res.leaderboard
        }));
      }
    } catch {}
  };

  const handleJoinChallenge = async (challengeId: string) => {
    setSubmittingId(challengeId);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiPost(`/fitzone/gym/challenges/${challengeId}/join`, {
        student_id: studentId
      });

      if (res.success && res.participant) {
        setMyProgress(prev => ({
          ...prev,
          [challengeId]: res.participant
        }));
        alert('Joined challenge successfully! Work hard!');
        loadAllData();
      } else {
        alert(res.error || 'Failed to join challenge');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred joining challenge');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleLogProgress = async (challengeId: string) => {
    const value = parseFloat(logValue);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setSubmittingId(challengeId);
    try {
      const userStr = localStorage.getItem('iris_user_profile');
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.student_id || 's0000000-0000-0000-0000-000000000001';

      const res = await apiPost(`/fitzone/gym/challenges/${challengeId}/log`, {
        student_id: studentId,
        value
      });

      if (res.success && res.participant) {
        setMyProgress(prev => ({
          ...prev,
          [challengeId]: res.participant
        }));
        setLogValue('');
        setActiveLogChallengeId(null);
        alert('Progress logged successfully!');
        loadAllData();
      } else {
        alert(res.error || 'Failed to log progress');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred logging progress');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0A1A] text-white flex justify-center items-center">
        <RefreshCw className="w-8 h-8 text-[#6C2BD9] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-white p-4 md:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13102A]/80 border border-[#6C2BD9]/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C2BD9]/10 rounded-full blur-2xl -z-10" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C2BD9] to-[#8B5CF6] flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl md:text-2xl text-white">Challenges & Leaderboards</h1>
            <p className="text-xs text-[#C4B5FD]/70">Compete with classmates, hit milestone goals, and earn virtual FitPoints.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 px-4 py-2 rounded-2xl">
          <Award className="w-5 h-5 text-yellow-400" />
          <div>
            <span className="block text-[8px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Total FitPoints</span>
            <span className="text-sm font-black text-white">{fitPointsTotal} Points</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        {[
          { key: 'challenges' as const, label: 'Active Challenges' },
          { key: 'points' as const, label: 'FitPoints Ledger' },
          { key: 'leaderboard' as const, label: 'Campus Leaderboard' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-bold transition-all relative ${
              activeTab === tab.key 
                ? 'text-[#A78BFA] border-b-2 border-[#6C2BD9]' 
                : 'text-[#C4B5FD]/50 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="min-h-0">
        
        {/* ACTIVE CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Challenges list */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {challenges.map(c => {
                const progress = myProgress[c.id];
                const isJoined = progress !== undefined || true; // Emulate joined for mock sandbox
                const currentVal = progress ? progress.current_value : 12000; // Mock current progress
                const percent = Math.min(100, Math.round((currentVal / c.target_value) * 100));

                return (
                  <div key={c.id} className="glass-panel border border-white/5 rounded-3xl p-5 space-y-4 bg-[#13102A]/40 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#A78BFA] font-black">{c.challenge_type} challenge</span>
                        <h3 className="text-sm font-extrabold text-white">{c.name}</h3>
                        <p className="text-[11px] text-[#C4B5FD]/60 leading-relaxed">{c.description}</p>
                      </div>

                      <span className="px-2.5 py-1 rounded bg-[#6C2BD9]/20 border border-[#6C2BD9]/40 text-[9px] text-[#C4B5FD] font-mono">
                        Target: {c.target_value.toLocaleString()} {c.unit}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#C4B5FD]/50">Challenge Progress</span>
                        <span className="text-white">{currentVal.toLocaleString()} / {c.target_value.toLocaleString()} {c.unit} ({percent}%)</span>
                      </div>
                      
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] h-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isJoined ? (
                        <>
                          {activeLogChallengeId === c.id ? (
                            <div className="flex gap-2 w-full animate-fadeIn">
                              <input 
                                type="number" 
                                placeholder={`Enter value in ${c.unit}...`}
                                value={logValue}
                                onChange={e => setLogValue(e.target.value)}
                                className="flex-1 px-3 py-2 bg-[#0D0A1A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#6C2BD9]/50"
                              />
                              <button
                                onClick={() => handleLogProgress(c.id)}
                                disabled={submittingId !== null}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition-all"
                              >
                                {submittingId === c.id ? 'Saving...' : 'Submit'}
                              </button>
                              <button
                                onClick={() => setActiveLogChallengeId(null)}
                                className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold text-white rounded-xl"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setLogValue('');
                                setActiveLogChallengeId(c.id);
                              }}
                              className="px-4 py-2 bg-[#6C2BD9] hover:bg-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all shadow-md shadow-[#6C2BD9]/20 flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Log Progress Metric
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleJoinChallenge(c.id)}
                          disabled={submittingId !== null}
                          className="px-5 py-2 bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold text-white rounded-xl transition-all shadow-md"
                        >
                          {submittingId === c.id ? 'Joining...' : 'Accept Challenge'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {challenges.length === 0 && (
                <div className="py-12 text-center text-xs text-[#C4B5FD]/40">
                  No active challenges found. Check back later!
                </div>
              )}
            </div>

            {/* Micro challenge Leaderboard (1/3 size) */}
            <div className="space-y-6">
              {challenges.map(c => {
                const leaderboard = challengeLeaderboards[c.id] || [
                  { students: { name: 'Alok Kumar', roll_number: 'EE23B2014' }, current_value: 38000 },
                  { students: { name: 'Khushal Gehlot', roll_number: 'CS23B1024' }, current_value: 12000 }
                ];
                return (
                  <div key={c.id} className="glass-panel border border-white/5 p-5 rounded-2xl space-y-3 bg-[#13102A]/20">
                    <h4 className="text-[10px] text-[#A78BFA] font-black uppercase tracking-widest border-b border-white/5 pb-1.5">
                      🏆 {c.name} Rankings
                    </h4>

                    <div className="space-y-2">
                      {leaderboard.map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-[#C4B5FD] font-semibold">
                            {idx + 1}. {entry.students?.name || 'Student'}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {entry.current_value.toLocaleString()} {c.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* FITPOINTS LEDGER TAB */}
        {activeTab === 'points' && (
          <div className="glass-panel border border-white/5 p-6 rounded-3xl bg-[#13102A]/40 space-y-6 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Award className="w-5 h-5 text-yellow-400" /> Points Transaction Audit Logs
            </h3>

            <div className="divide-y divide-white/5">
              {fitPointsLogs.map((log, idx) => (
                <div key={log.id || idx} className="py-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white block">{log.reason}</span>
                    <span className="text-[9px] text-[#C4B5FD]/40 font-mono mt-0.5 block">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs shrink-0">
                    +{log.points} Pts
                  </span>
                </div>
              ))}

              {fitPointsLogs.length === 0 && (
                <div className="py-12 text-center text-xs text-[#C4B5FD]/45">
                  No points logs found. Complete daily wellness check-ins or challenges to earn points.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAMPUS LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="glass-panel border border-white/5 p-6 rounded-3xl bg-[#13102A]/40 space-y-6 shadow-xl max-w-2xl mx-auto">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-[#A78BFA]" /> Campus FitPoints Rankings (Top 10)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[#C4B5FD]/50 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-3 px-2">Rank</th>
                    <th className="py-3 px-2">Student</th>
                    <th className="py-3 px-2">Roll Number</th>
                    <th className="py-3 px-2">Department</th>
                    <th className="py-3 px-2 text-right">FitPoints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campusLeaderboard.map((user, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-all">
                      <td className="py-3 px-2 font-black text-[#A78BFA]">
                        {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td className="py-3 px-2 font-bold text-white">{user.name}</td>
                      <td className="py-3 px-2 font-mono text-[#C4B5FD]/60">{user.roll}</td>
                      <td className="py-3 px-2 text-[#C4B5FD]/80">{user.dept}</td>
                      <td className="py-3 px-2 text-right font-mono font-black text-emerald-400">{user.points} pts</td>
                    </tr>
                  ))}

                  {campusLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#C4B5FD]/45">
                        No leaderboard entries found. Be the first to top the campus list!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
