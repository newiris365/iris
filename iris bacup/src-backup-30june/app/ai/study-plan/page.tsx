"use client";

import React, { useState, useEffect } from 'react';

interface StudyBlock {
  time: string;
  subject: string;
  topic: string;
  type: 'focus' | 'review' | 'practice' | 'light';
}

interface DayPlan {
  day: string;
  blocks: StudyBlock[];
}

interface ExamEntry {
  subject: string;
  date: string;
  time: string;
}

interface StudyPlan {
  id: string;
  exam_schedule: ExamEntry[];
  daily_plan: DayPlan[];
  subjects: string[];
  weak_areas: string[];
  study_hours_per_day: number;
  plan_start_date: string;
  plan_end_date: string;
  status: string;
  completion_percentage: number;
  claude_reasoning: string;
  generated_at: string;
}

const BLOCK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  focus: { bg: 'rgba(108, 43, 217, 0.2)', border: 'rgba(108, 43, 217, 0.5)', text: '#C4B5FD' },
  review: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.5)', text: '#93C5FD' },
  practice: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: '#6EE7B7' },
  light: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: '#FCD34D' },
};

const DAY_EMOJIS: Record<string, string> = {
  Monday: '🌅', Tuesday: '🔥', Wednesday: '⚡', Thursday: '🎯',
  Friday: '🚀', Saturday: '📚', Sunday: '🌿'
};

export default function StudyPlanPage() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Form state
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([
    { subject: 'Mathematics', date: '2026-06-25', time: '09:00' },
    { subject: 'Physics', date: '2026-06-27', time: '09:00' },
  ]);
  const [weakAreas, setWeakAreas] = useState<string[]>(['Linear Algebra', 'Thermodynamics']);
  const [newWeak, setNewWeak] = useState('');
  const [studyHours, setStudyHours] = useState(4);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') || 'demo' : 'demo';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/study-plan/b0000000-0000-0000-0000-000000000001`, { headers });
      const data = await res.json();
      if (data.success && data.study_plan) {
        setPlan(data.study_plan);
      }
    } catch {} finally { setLoading(false); }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/ai/study-plan/generate`, {
        method: 'POST', headers,
        body: JSON.stringify({
          exam_schedule: examEntries,
          study_hours_per_day: studyHours,
          weak_areas: weakAreas
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlan(data.study_plan);
        setShowForm(false);
      }
    } catch {} finally { setGenerating(false); }
  };

  const updateProgress = async (pct: number) => {
    if (!plan) return;
    try {
      await fetch(`${API}/ai/study-plan/${plan.id}/progress`, {
        method: 'PUT', headers,
        body: JSON.stringify({ completion_percentage: pct })
      });
      setPlan({ ...plan, completion_percentage: pct });
    } catch {}
  };

  const addExamEntry = () => {
    setExamEntries([...examEntries, { subject: '', date: '', time: '09:00' }]);
  };

  const removeExamEntry = (index: number) => {
    setExamEntries(examEntries.filter((_, i) => i !== index));
  };

  const addWeakArea = () => {
    if (newWeak.trim()) {
      setWeakAreas([...weakAreas, newWeak.trim()]);
      setNewWeak('');
    }
  };

  const daysUntilExam = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const dailyPlan = plan?.daily_plan || [];
  const displayDay = selectedDay || dailyPlan[0]?.day || 'Monday';

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#E0E7FF', margin: 0 }}>
            📖 AI Study Planner
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Claude-generated personalized study schedule
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '0.6rem 1.2rem', borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
          border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
        }}>
          {showForm ? '✕ Close' : '✨ New Plan'}
        </button>
      </div>

      {/* Generator Form */}
      {showForm && (
        <div style={{
          background: 'rgba(19, 16, 42, 0.8)', backdropFilter: 'blur(12px)',
          borderRadius: '1rem', border: '1px solid rgba(108, 43, 217, 0.3)',
          padding: '1.5rem', marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#C4B5FD', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>📝 Exam Schedule</h3>
          
          {examEntries.map((entry, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={entry.subject} onChange={e => {
                const updated = [...examEntries]; updated[i].subject = e.target.value; setExamEntries(updated);
              }} placeholder="Subject" style={{
                padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)',
                border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem'
              }} />
              <input type="date" value={entry.date} onChange={e => {
                const updated = [...examEntries]; updated[i].date = e.target.value; setExamEntries(updated);
              }} style={{
                padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)',
                border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem'
              }} />
              <input type="time" value={entry.time} onChange={e => {
                const updated = [...examEntries]; updated[i].time = e.target.value; setExamEntries(updated);
              }} style={{
                padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)',
                border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem'
              }} />
              <button onClick={() => removeExamEntry(i)} style={{
                padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', cursor: 'pointer'
              }}>✕</button>
            </div>
          ))}
          <button onClick={addExamEntry} style={{
            padding: '0.4rem 0.8rem', borderRadius: '0.5rem', background: 'rgba(108, 43, 217, 0.15)',
            border: '1px solid rgba(108, 43, 217, 0.3)', color: '#C4B5FD', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '1rem'
          }}>+ Add Exam</button>

          <h3 style={{ color: '#C4B5FD', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>🎯 Weak Areas</h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {weakAreas.map((wa, i) => (
              <span key={i} style={{
                padding: '0.3rem 0.6rem', borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', fontSize: '0.7rem',
                cursor: 'pointer'
              }} onClick={() => setWeakAreas(weakAreas.filter((_, j) => j !== i))}>
                {wa} ✕
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input value={newWeak} onChange={e => setNewWeak(e.target.value)} placeholder="Add weak area..."
              onKeyDown={e => e.key === 'Enter' && addWeakArea()}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)', border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem' }} />
            <button onClick={addWeakArea} style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(108, 43, 217, 0.2)',
              border: '1px solid rgba(108, 43, 217, 0.3)', color: '#C4B5FD', cursor: 'pointer', fontSize: '0.8rem'
            }}>Add</button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#9CA3AF', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Study Hours/Day: {studyHours}h</label>
            <input type="range" min={2} max={10} value={studyHours} onChange={e => setStudyHours(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#6C2BD9' }} />
          </div>

          <button onClick={generatePlan} disabled={generating} style={{
            width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
            border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600,
            opacity: generating ? 0.6 : 1
          }}>
            {generating ? '🧠 Claude is generating your plan...' : '✨ Generate AI Study Plan'}
          </button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>Loading study plan...</div>}

      {!loading && plan && (
        <>
          {/* Plan Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Subjects', value: plan.subjects?.length || 0, icon: '📚', color: '#6C2BD9' },
              { label: 'Hours/Day', value: `${plan.study_hours_per_day}h`, icon: '⏰', color: '#3B82F6' },
              { label: 'Completion', value: `${plan.completion_percentage}%`, icon: '📊', color: '#10B981' },
              { label: 'Status', value: plan.status, icon: plan.status === 'active' ? '🟢' : '⏸️', color: plan.status === 'active' ? '#10B981' : '#F59E0B' }
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(19, 16, 42, 0.8)', backdropFilter: 'blur(12px)',
                borderRadius: '1rem', border: '1px solid rgba(108, 43, 217, 0.3)',
                padding: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div style={{
            background: 'rgba(19, 16, 42, 0.8)', borderRadius: '1rem',
            border: '1px solid rgba(108, 43, 217, 0.3)', padding: '1rem 1.25rem', marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600 }}>Study Progress</span>
              <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>{plan.completion_percentage}%</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(30, 25, 55, 0.8)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                background: 'linear-gradient(90deg, #6C2BD9, #10B981)',
                width: `${plan.completion_percentage}%`,
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              {[10, 25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => updateProgress(pct)} style={{
                  padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem',
                  background: plan.completion_percentage >= pct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 25, 55, 0.5)',
                  border: `1px solid ${plan.completion_percentage >= pct ? 'rgba(16, 185, 129, 0.4)' : 'rgba(55, 48, 80, 0.3)'}`,
                  color: plan.completion_percentage >= pct ? '#10B981' : '#6B7280',
                  cursor: 'pointer'
                }}>{pct}%</button>
              ))}
            </div>
          </div>

          {/* Exam Countdown */}
          {plan.exam_schedule && plan.exam_schedule.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#C4B5FD', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>📅 Exam Countdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {plan.exam_schedule.map((exam: ExamEntry, i: number) => {
                  const days = daysUntilExam(exam.date);
                  return (
                    <div key={i} style={{
                      background: 'rgba(19, 16, 42, 0.7)', borderRadius: '0.75rem',
                      border: `1px solid ${days <= 3 ? 'rgba(239, 68, 68, 0.4)' : days <= 7 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(108, 43, 217, 0.3)'}`,
                      padding: '0.75rem'
                    }}>
                      <div style={{ color: '#E0E7FF', fontSize: '0.85rem', fontWeight: 600 }}>{exam.subject}</div>
                      <div style={{ color: '#9CA3AF', fontSize: '0.7rem', marginTop: '0.25rem' }}>{exam.date} · {exam.time}</div>
                      <div style={{
                        marginTop: '0.4rem', fontSize: '1.1rem', fontWeight: 700,
                        color: days <= 3 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#10B981'
                      }}>
                        {days === 0 ? '🔴 TODAY' : `${days} day${days !== 1 ? 's' : ''} left`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {dailyPlan.map(dp => (
              <button key={dp.day} onClick={() => setSelectedDay(dp.day)} style={{
                padding: '0.5rem 1rem', borderRadius: '0.75rem',
                background: displayDay === dp.day ? 'rgba(108, 43, 217, 0.3)' : 'rgba(19, 16, 42, 0.5)',
                border: `1px solid ${displayDay === dp.day ? 'rgba(108, 43, 217, 0.5)' : 'rgba(55, 48, 80, 0.3)'}`,
                color: displayDay === dp.day ? '#C4B5FD' : '#6B7280',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
              }}>
                {DAY_EMOJIS[dp.day] || '📅'} {dp.day}
              </button>
            ))}
          </div>

          {/* Day Schedule */}
          <div style={{
            background: 'rgba(19, 16, 42, 0.6)', borderRadius: '1rem',
            border: '1px solid rgba(108, 43, 217, 0.2)', padding: '1.25rem'
          }}>
            <h3 style={{ color: '#E0E7FF', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {DAY_EMOJIS[displayDay] || '📅'} {displayDay} Schedule
            </h3>
            
            {dailyPlan.find(d => d.day === displayDay)?.blocks.map((block, i) => {
              const colors = BLOCK_COLORS[block.type] || BLOCK_COLORS.focus;
              return (
                <div key={i} style={{
                  display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  padding: '0.75rem 1rem', marginBottom: '0.5rem',
                  borderRadius: '0.75rem', background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  transition: 'transform 0.2s ease'
                }}>
                  <div style={{
                    minWidth: '100px', color: colors.text, fontSize: '0.8rem', fontWeight: 600,
                    fontFamily: 'monospace'
                  }}>
                    {block.time}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E0E7FF', fontSize: '0.85rem', fontWeight: 600 }}>{block.subject}</div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: '0.15rem' }}>{block.topic}</div>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.65rem',
                    background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
                    textTransform: 'uppercase', fontWeight: 600
                  }}>{block.type}</span>
                </div>
              );
            })}

            {!dailyPlan.find(d => d.day === displayDay) && (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '2rem' }}>No blocks scheduled for {displayDay}</p>
            )}
          </div>

          {/* AI Reasoning */}
          {plan.claude_reasoning && (
            <div style={{
              marginTop: '1.5rem', background: 'rgba(19, 16, 42, 0.6)', borderRadius: '1rem',
              border: '1px solid rgba(108, 43, 217, 0.2)', padding: '1rem 1.25rem'
            }}>
              <h4 style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>🧠 AI Reasoning</h4>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>{plan.claude_reasoning}</p>
            </div>
          )}
        </>
      )}

      {!loading && !plan && !showForm && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📖</div>
          <h2 style={{ color: '#E0E7FF', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Study Plan Yet</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Let IRIS AI create a personalized study schedule based on your exams and weak areas.</p>
          <button onClick={() => setShowForm(true)} style={{
            padding: '0.75rem 2rem', borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
            border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600
          }}>✨ Create Study Plan</button>
        </div>
      )}
    </div>
  );
}
