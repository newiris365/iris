"use client";

import React, { useState, useEffect } from 'react';

interface SentimentAnalysis {
  date: string;
  total_messages: number;
  sentiment_score: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  flagged_keywords: string[];
  complaint_categories: Record<string, number>;
  flagged_messages: { query: string; time: string; intent: string }[];
  mood: string;
}

interface DeptRanking {
  department: string;
  avg_sentiment: number;
  total_messages: number;
  total_complaints: number;
  mood: string;
  top_keywords: string[];
}

interface DailyTrend {
  date: string;
  message_count: number;
  positive: number;
  negative: number;
  neutral: number;
  avg_sentiment: number;
}

export default function SentimentPage() {
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [deptRankings, setDeptRankings] = useState<DeptRanking[]>([]);
  const [period, setPeriod] = useState(7);
  const [tab, setTab] = useState<'overview' | 'departments' | 'flagged'>('overview');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') || 'demo' : 'demo';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { fetchTrends(); }, [period]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/sentiment/trends?days=${period}`, { headers });
      const data = await res.json();
      if (data.success) {
        setTrends(data.daily_trends || []);
        setDeptRankings(data.department_rankings || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/ai/sentiment/analyze`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) setAnalysis(data.analysis);
    } catch {} finally { setAnalyzing(false); }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return '#10B981';
    if (score >= 0.4) return '#F59E0B';
    return '#EF4444';
  };

  const getSentimentEmoji = (score: number) => {
    if (score >= 0.8) return '😊';
    if (score >= 0.6) return '🙂';
    if (score >= 0.4) return '😐';
    if (score >= 0.2) return '😕';
    return '😟';
  };

  const maxMessages = Math.max(...trends.map(t => t.message_count), 1);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#E0E7FF', margin: 0 }}>
            💬 Sentiment Analysis
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Campus mood monitoring and complaint intelligence
          </p>
        </div>
        <button onClick={runAnalysis} disabled={analyzing} style={{
          padding: '0.6rem 1.2rem', borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
          border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
          opacity: analyzing ? 0.6 : 1
        }}>
          {analyzing ? '🔄 Analyzing...' : '🧠 Run Analysis'}
        </button>
      </div>

      {/* Today's Analysis Results */}
      {analysis && (
        <div style={{
          background: 'rgba(19, 16, 42, 0.8)', backdropFilter: 'blur(12px)',
          borderRadius: '1rem', border: '1px solid rgba(108, 43, 217, 0.3)',
          padding: '1.25rem', marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#C4B5FD', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Today's Analysis — {analysis.date}</h3>
            <span style={{ fontSize: '1.5rem' }}>{analysis.mood}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getSentimentColor(analysis.sentiment_score) }}>
                {(analysis.sentiment_score * 100).toFixed(0)}%
              </div>
              <div style={{ color: '#6B7280', fontSize: '0.7rem' }}>Sentiment Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{analysis.positive_count}</div>
              <div style={{ color: '#6B7280', fontSize: '0.7rem' }}>Positive</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{analysis.neutral_count}</div>
              <div style={{ color: '#6B7280', fontSize: '0.7rem' }}>Neutral</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>{analysis.negative_count}</div>
              <div style={{ color: '#6B7280', fontSize: '0.7rem' }}>Negative</div>
            </div>
          </div>
          {/* Sentiment Bar */}
          <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(30, 25, 55, 0.8)', overflow: 'hidden', marginTop: '1rem', display: 'flex' }}>
            <div style={{ width: `${(analysis.positive_count / (analysis.total_messages || 1)) * 100}%`, background: '#10B981', height: '100%' }} />
            <div style={{ width: `${(analysis.neutral_count / (analysis.total_messages || 1)) * 100}%`, background: '#F59E0B', height: '100%' }} />
            <div style={{ width: `${(analysis.negative_count / (analysis.total_messages || 1)) * 100}%`, background: '#EF4444', height: '100%' }} />
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[3, 7, 14, 30].map(d => (
          <button key={d} onClick={() => setPeriod(d)} style={{
            padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
            background: period === d ? 'rgba(108, 43, 217, 0.3)' : 'rgba(19, 16, 42, 0.5)',
            border: `1px solid ${period === d ? 'rgba(108, 43, 217, 0.5)' : 'rgba(55, 48, 80, 0.3)'}`,
            color: period === d ? '#C4B5FD' : '#6B7280',
            cursor: 'pointer', fontSize: '0.75rem'
          }}>{d}D</button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['overview', 'departments', 'flagged'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1rem', borderRadius: '0.75rem',
            background: tab === t ? 'rgba(108, 43, 217, 0.3)' : 'rgba(19, 16, 42, 0.5)',
            border: `1px solid ${tab === t ? 'rgba(108, 43, 217, 0.5)' : 'rgba(55, 48, 80, 0.4)'}`,
            color: tab === t ? '#C4B5FD' : '#6B7280',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize'
          }}>
            {t === 'overview' ? '📊 Trend' : t === 'departments' ? '🏢 Departments' : '🚩 Flagged'}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>Loading sentiment data...</div>}

      {!loading && tab === 'overview' && (
        <div style={{
          background: 'rgba(19, 16, 42, 0.6)', backdropFilter: 'blur(12px)',
          borderRadius: '1rem', border: '1px solid rgba(108, 43, 217, 0.2)',
          padding: '1.25rem'
        }}>
          <h3 style={{ color: '#C4B5FD', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
            Daily Message Volume & Sentiment ({period} days)
          </h3>

          {trends.length === 0 ? (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '2rem' }}>No trend data available. Run analysis first.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px', paddingBottom: '2rem', position: 'relative' }}>
              {trends.map((t, i) => {
                const height = (t.message_count / maxMessages) * 160;
                const sentColor = getSentimentColor(t.avg_sentiment);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: sentColor, fontSize: '0.7rem', fontWeight: 600 }}>
                      {getSentimentEmoji(t.avg_sentiment)}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '40px', height: `${height}px`, borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                      <div style={{ height: `${(t.positive / (t.message_count || 1)) * 100}%`, background: '#10B981', minHeight: '2px' }} />
                      <div style={{ height: `${(t.neutral / (t.message_count || 1)) * 100}%`, background: '#F59E0B', minHeight: '2px' }} />
                      <div style={{ height: `${(t.negative / (t.message_count || 1)) * 100}%`, background: '#EF4444', minHeight: '2px' }} />
                    </div>
                    <span style={{ color: '#6B7280', fontSize: '0.55rem', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                      {t.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {[{ label: 'Positive', color: '#10B981' }, { label: 'Neutral', color: '#F59E0B' }, { label: 'Negative', color: '#EF4444' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'departments' && (
        <div>
          {deptRankings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏢</div>
              <p>No department data available</p>
            </div>
          ) : deptRankings.map((dept, i) => (
            <div key={i} style={{
              background: 'rgba(19, 16, 42, 0.8)', backdropFilter: 'blur(12px)',
              borderRadius: '0.75rem', border: '1px solid rgba(108, 43, 217, 0.3)',
              padding: '1rem 1.25rem', marginBottom: '0.75rem',
              display: 'flex', gap: '1rem', alignItems: 'center'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '0.75rem',
                background: `${getSentimentColor(dept.avg_sentiment)}15`,
                border: `1px solid ${getSentimentColor(dept.avg_sentiment)}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0
              }}>
                {getSentimentEmoji(dept.avg_sentiment)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#E0E7FF', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{dept.department}</h3>
                  <span style={{ color: getSentimentColor(dept.avg_sentiment), fontSize: '0.85rem', fontWeight: 700 }}>
                    {(dept.avg_sentiment * 100).toFixed(0)}%
                  </span>
                </div>
                {/* Sentiment Bar */}
                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(30, 25, 55, 0.8)', overflow: 'hidden', margin: '0.5rem 0' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    background: `linear-gradient(90deg, ${getSentimentColor(dept.avg_sentiment)}, ${getSentimentColor(dept.avg_sentiment)}80)`,
                    width: `${dept.avg_sentiment * 100}%`
                  }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>📨 {dept.total_messages} msgs</span>
                  <span style={{ color: '#EF4444', fontSize: '0.7rem' }}>⚠️ {dept.total_complaints} complaints</span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{dept.mood}</span>
                </div>
                {dept.top_keywords.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {dept.top_keywords.map((kw, j) => (
                      <span key={j} style={{
                        padding: '0.15rem 0.4rem', borderRadius: '0.5rem', fontSize: '0.6rem',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#FCA5A5'
                      }}>{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'flagged' && analysis && (
        <div>
          {/* Flagged Keywords */}
          {analysis.flagged_keywords.length > 0 && (
            <div style={{
              background: 'rgba(19, 16, 42, 0.8)', borderRadius: '1rem',
              border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.25rem', marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#FCA5A5', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>🚩 Flagged Keywords</h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {analysis.flagged_keywords.map((kw, i) => (
                  <span key={i} style={{
                    padding: '0.3rem 0.7rem', borderRadius: '1rem', fontSize: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5'
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Complaint Categories */}
          {Object.keys(analysis.complaint_categories || {}).length > 0 && (
            <div style={{
              background: 'rgba(19, 16, 42, 0.8)', borderRadius: '1rem',
              border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1.25rem', marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#FCD34D', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>📋 Complaint Categories</h3>
              {Object.entries(analysis.complaint_categories).sort(([,a], [,b]) => b - a).map(([cat, count], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#E0E7FF', fontSize: '0.8rem', minWidth: '120px', textTransform: 'capitalize' }}>{cat}</span>
                  <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(30, 25, 55, 0.8)' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                      width: `${Math.min(100, (count / 15) * 100)}%`
                    }} />
                  </div>
                  <span style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600, minWidth: '30px' }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Flagged Messages */}
          {analysis.flagged_messages.length > 0 && (
            <div style={{
              background: 'rgba(19, 16, 42, 0.8)', borderRadius: '1rem',
              border: '1px solid rgba(108, 43, 217, 0.3)', padding: '1.25rem'
            }}>
              <h3 style={{ color: '#C4B5FD', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>⚠️ Flagged Messages</h3>
              {analysis.flagged_messages.map((msg, i) => (
                <div key={i} style={{
                  padding: '0.6rem 0.8rem', marginBottom: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.08)', borderRadius: '0.5rem',
                  borderLeft: '3px solid #EF4444'
                }}>
                  <p style={{ color: '#E0E7FF', fontSize: '0.8rem', margin: 0 }}>"{msg.query}"</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ color: '#6B7280', fontSize: '0.65rem' }}>{msg.intent}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.65rem' }}>·</span>
                    <span style={{ color: '#6B7280', fontSize: '0.65rem' }}>{new Date(msg.time).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!analysis || (analysis.flagged_messages.length === 0 && analysis.flagged_keywords.length === 0)) && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <p>No flagged content. Campus mood looks good!</p>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'flagged' && !analysis && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧠</div>
          <p>Run analysis to see flagged messages and keywords</p>
          <button onClick={runAnalysis} style={{
            padding: '0.6rem 1.5rem', borderRadius: '0.75rem', marginTop: '0.5rem',
            background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
            border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
          }}>🧠 Run Analysis</button>
        </div>
      )}
    </div>
  );
}
