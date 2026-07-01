"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquarePlus, Activity, CheckCircle2, Plus, RefreshCw } from 'lucide-react';

interface Survey {
  id: string;
  survey_type: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export default function IqacSurveyDesk() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics mock
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');

  // New survey state
  const [showCreate, setShowCreate] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    survey_type: 'Student Satisfaction Survey',
    academic_year: '2026-27',
    questions: ['Rate curriculum flexibility', 'Clarity of grading rubrics']
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('iris_jwt_token')}`
  });

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/obe/surveys', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.surveys && data.surveys.length > 0) {
        setSurveys(data.surveys);
        setSelectedSurvey(data.surveys[0].id);
      } else {
        // Fallback mock surveys
        const demoSurveys: Survey[] = [
          { id: 's-1', survey_type: 'Student Satisfaction Survey (SSS)', academic_year: '2026-27', is_active: true, created_at: '2026-06-11T12:00:00Z' },
          { id: 's-2', survey_type: 'Alumni Engagement Feedback', academic_year: '2026-27', is_active: false, created_at: '2026-06-10T12:00:00Z' },
          { id: 's-3', survey_type: 'Employer Industry Survey', academic_year: '2025-26', is_active: false, created_at: '2025-06-11T12:00:00Z' }
        ];
        setSurveys(demoSurveys);
        setSelectedSurvey(demoSurveys[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (surveyId: string) => {
    if (!surveyId) return;
    try {
      const res = await fetch(`/api/obe/surveys/${surveyId}/analytics`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      // Fallback
      setAnalytics({
        survey_id: surveyId,
        total_responses: 114,
        satisfaction_index: 84.5,
        questions_analytics: [
          { question: 'Quality of web instruction', avg_score: 4.25, distribution: { 5: 60, 4: 30, 3: 15, 2: 7, 1: 2 } },
          { question: 'Clarity of database schemas', avg_score: 4.05, distribution: { 5: 50, 4: 40, 3: 18, 2: 4, 1: 2 } }
        ]
      });
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurvey) {
      loadAnalytics(selectedSurvey);
    }
  }, [selectedSurvey]);

  const handleToggleSurvey = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/obe/surveys/${id}/activate`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: active })
      });
      setSurveys(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
    } catch (err) {
      setSurveys(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/obe/surveys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSurvey)
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        loadSurveys();
      }
    } catch (err) {
      // mock create
      const mockObj: Survey = {
        id: `s-${Date.now()}`,
        survey_type: newSurvey.survey_type,
        academic_year: newSurvey.academic_year,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setSurveys(prev => [mockObj, ...prev]);
      setSelectedSurvey(mockObj.id);
      setShowCreate(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">Stakeholder Auditing Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Feedback Surveys Desk</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Design feedback questionnaires, track respondent analytics, and generate indirect OBE satisfaction index scores.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
        >
          <Plus className="w-4 h-4" /> Create Survey Form
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading feedback desk forms...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Survey Lists */}
          <div className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-5 flex flex-col gap-4 bg-[#13102A]/20">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Active Campaigns</h3>
            <div className="flex flex-col gap-2.5">
              {surveys.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSurvey(s.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer flex flex-col gap-1.5 transition-all ${
                    selectedSurvey === s.id
                      ? 'bg-[#6C2BD9]/15 border-[#6C2BD9] text-white'
                      : 'bg-white/[0.02] border-white/5 text-[#C4B5FD]/70 hover:bg-white/5'
                  }`}
                >
                  <span className="font-extrabold text-xs leading-normal">{s.survey_type}</span>
                  <div className="flex justify-between items-center text-[10px] text-[#C4B5FD]/50 mt-1">
                    <span>Year: {s.academic_year}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSurvey(s.id, !s.is_active);
                      }}
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        s.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Closed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Analytics Section */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {analytics ? (
              <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/40 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-extrabold text-sm text-white">Campaign Analytics</h3>
                    <p className="text-[10px] text-[#C4B5FD]/50">Respondent volume: {analytics.total_responses} submissions registered.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                    Index Score: {analytics.satisfaction_index}%
                  </span>
                </div>

                {/* Question distributions */}
                <div className="flex flex-col gap-6">
                  {analytics.questions_analytics.map((q: any, idx: number) => {
                    const maxDist = Math.max(...Object.values(q.distribution) as number[]);
                    return (
                      <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl bg-[#0D0A1A]/80 border border-white/5">
                        <div className="flex justify-between items-start text-xs font-bold">
                          <span className="text-white max-w-[80%] leading-normal font-medium">{q.question}</span>
                          <span className="text-[#A78BFA]">Avg: {q.avg_score} / 5</span>
                        </div>

                        {/* Visual SVG Likert distribution bar */}
                        <div className="flex gap-2.5 items-end h-16 pt-2">
                          {[5, 4, 3, 2, 1].map(score => {
                            const val = q.distribution[score] || 0;
                            const height = maxDist > 0 ? (val / maxDist) * 100 : 0;
                            return (
                              <div key={score} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="w-full bg-[#1D163F] rounded-t overflow-hidden relative" style={{ height: '40px' }}>
                                  <div
                                    className="absolute bottom-0 left-0 right-0 bg-[#8B5CF6]/70 group-hover:brightness-110 transition-all duration-700"
                                    style={{ height: `${height}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] text-[#C4B5FD] font-bold">{score}★</span>
                                <span className="absolute bottom-full mb-1 hidden group-hover:block bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded px-1.5 py-0.5 text-[8px] text-white z-10">
                                  {val} responses
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#C4B5FD]/50">Select or open a survey to view satisfaction charts.</div>
            )}
          </div>
        </div>
      )}

      {/* CREATE DIALOG */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Design Feedback Survey</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSurvey} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Survey Category Title *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={newSurvey.survey_type}
                  onChange={e => setNewSurvey({ ...newSurvey, survey_type: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Academic Year</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={newSurvey.academic_year}
                  onChange={e => setNewSurvey({ ...newSurvey, academic_year: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#6C2BD9] hover:bg-[#8B5CF6] text-white font-bold transition-all"
                >
                  Publish Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
