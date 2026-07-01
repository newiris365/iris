"use client";

import React, { useState, useEffect } from 'react';

interface Nudge {
  id: string;
  nudge_type: string;
  title: string;
  message: string;
  priority: string;
  channel: string;
  sent_at: string;
  was_read: boolean;
  was_actioned: boolean;
}

interface NudgePrefs {
  enabled: boolean;
  enabled_types: string[];
  preferred_channels: string[];
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_nudges_per_day: number;
  language_preference: string;
}

const NUDGE_TYPES = [
  { key: 'weekly_prep', label: '📚 Weekly Prep', color: '#6C2BD9' },
  { key: 'assignment_reminder', label: '📝 Assignment', color: '#3B82F6' },
  { key: 'attendance_warning', label: '⚠️ Attendance', color: '#F59E0B' },
  { key: 'fee_reminder', label: '💰 Fee Reminder', color: '#EF4444' },
  { key: 'event_suggestion', label: '🎉 Events', color: '#EC4899' },
  { key: 'library_due', label: '📖 Library', color: '#06B6D4' },
  { key: 'exam_countdown', label: '📝 Exam Prep', color: '#8B5CF6' },
  { key: 'streak_celebration', label: '🔥 Streaks', color: '#10B981' },
  { key: 'motivational', label: '💪 Motivation', color: '#F97316' },
  { key: 'health_tip', label: '🏃 Health', color: '#14B8A6' },
  { key: 'custom', label: '⚙️ Custom', color: '#6B7280' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  normal: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444'
};

export default function NudgesPage() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, actioned: 0, action_rate: 0 });
  const [prefs, setPrefs] = useState<NudgePrefs | null>(null);
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('iris_jwt_token') || 'demo' : 'demo';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { fetchNudges(); fetchPrefs(); }, []);

  const fetchNudges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ai/nudges`, { headers });
      const data = await res.json();
      if (data.success) {
        setNudges(data.nudges || []);
        setStats(data.stats || { total: 0, unread: 0, actioned: 0, action_rate: 0 });
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchPrefs = async () => {
    try {
      const res = await fetch(`${API}/ai/nudges/preferences`, { headers });
      const data = await res.json();
      if (data.success) setPrefs(data.preferences);
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`${API}/ai/nudges/${id}/read`, { method: 'PUT', headers });
      setNudges(prev => prev.map(n => n.id === id ? { ...n, was_read: true } : n));
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch {}
  };

  const markActioned = async (id: string) => {
    try {
      await fetch(`${API}/ai/nudges/${id}/action`, { method: 'PUT', headers });
      setNudges(prev => prev.map(n => n.id === id ? { ...n, was_actioned: true, was_read: true } : n));
    } catch {}
  };

  const savePrefs = async () => {
    if (!prefs) return;
    try {
      await fetch(`${API}/ai/nudges/preferences`, {
        method: 'PUT', headers,
        body: JSON.stringify(prefs)
      });
      alert('Preferences saved!');
    } catch {}
  };

  const triggerBatch = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API}/ai/nudges/send`, { method: 'POST', headers });
      const data = await res.json();
      alert(`Dispatched ${data.sent_count} nudges to students.`);
      fetchNudges();
    } catch {} finally { setSending(false); }
  };

  const toggleType = (type: string) => {
    if (!prefs) return;
    const current = prefs.enabled_types || [];
    const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    setPrefs({ ...prefs, enabled_types: updated });
  };

  const toggleChannel = (ch: string) => {
    if (!prefs) return;
    const current = prefs.preferred_channels || [];
    const updated = current.includes(ch) ? current.filter(c => c !== ch) : [...current, ch];
    setPrefs({ ...prefs, preferred_channels: updated });
  };

  const filteredNudges = filter === 'all' ? nudges
    : filter === 'unread' ? nudges.filter(n => !n.was_read)
    : nudges.filter(n => n.nudge_type === filter);

  const getNudgeIcon = (type: string) => NUDGE_TYPES.find(t => t.key === type)?.label?.split(' ')[0] || '📌';
  const getNudgeColor = (type: string) => NUDGE_TYPES.find(t => t.key === type)?.color || '#6B7280';

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#E0E7FF', margin: 0 }}>
            🔔 Smart Nudges
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            AI-powered proactive intelligence notifications
          </p>
        </div>
        <button onClick={triggerBatch} disabled={sending} style={{
          padding: '0.6rem 1.2rem', borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
          border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
          opacity: sending ? 0.6 : 1
        }}>
          {sending ? 'Sending...' : '🚀 Send Nudge Batch'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Nudges', value: stats.total, color: '#6C2BD9', icon: '📊' },
          { label: 'Unread', value: stats.unread, color: '#F59E0B', icon: '📬' },
          { label: 'Actioned', value: stats.actioned, color: '#10B981', icon: '✅' },
          { label: 'Action Rate', value: `${stats.action_rate}%`, color: '#3B82F6', icon: '📈' }
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(19, 16, 42, 0.8)', backdropFilter: 'blur(12px)',
            borderRadius: '1rem', border: '1px solid rgba(108, 43, 217, 0.3)',
            padding: '1rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['inbox', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.5rem 1.25rem', borderRadius: '0.75rem',
            background: tab === t ? 'rgba(108, 43, 217, 0.3)' : 'rgba(19, 16, 42, 0.5)',
            border: `1px solid ${tab === t ? 'rgba(108, 43, 217, 0.5)' : 'rgba(55, 48, 80, 0.4)'}`,
            color: tab === t ? '#C4B5FD' : '#6B7280',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            textTransform: 'capitalize'
          }}>
            {t === 'inbox' ? '📬 Inbox' : '⚙️ Preferences'}
          </button>
        ))}
      </div>

      {tab === 'inbox' && (
        <>
          {/* Filter Row */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }, ...NUDGE_TYPES.slice(0, 6)].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '0.3rem 0.7rem', borderRadius: '1rem',
                background: filter === f.key ? 'rgba(108, 43, 217, 0.3)' : 'rgba(19, 16, 42, 0.4)',
                border: `1px solid ${filter === f.key ? 'rgba(108, 43, 217, 0.5)' : 'rgba(55, 48, 80, 0.3)'}`,
                color: filter === f.key ? '#C4B5FD' : '#6B7280',
                cursor: 'pointer', fontSize: '0.7rem'
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Nudge Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>Loading nudges...</div>
          ) : filteredNudges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔕</div>
              <p>No nudges found</p>
            </div>
          ) : filteredNudges.map(nudge => (
            <div key={nudge.id} style={{
              background: nudge.was_read ? 'rgba(19, 16, 42, 0.5)' : 'rgba(19, 16, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: '0.75rem',
              border: `1px solid ${nudge.was_read ? 'rgba(55, 48, 80, 0.3)' : 'rgba(108, 43, 217, 0.4)'}`,
              padding: '1rem 1.25rem',
              marginBottom: '0.75rem',
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              opacity: nudge.was_actioned ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '0.75rem',
                background: `${getNudgeColor(nudge.nudge_type)}20`,
                border: `1px solid ${getNudgeColor(nudge.nudge_type)}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0
              }}>
                {getNudgeIcon(nudge.nudge_type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <h3 style={{ color: '#E0E7FF', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                    {nudge.title || nudge.nudge_type}
                    {!nudge.was_read && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#6C2BD9', marginLeft: '0.5rem' }} />}
                  </h3>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.6rem', fontWeight: 600,
                    background: `${PRIORITY_COLORS[nudge.priority]}20`,
                    color: PRIORITY_COLORS[nudge.priority],
                    border: `1px solid ${PRIORITY_COLORS[nudge.priority]}40`
                  }}>{nudge.priority}</span>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>{nudge.message}</p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.65rem' }}>
                    {new Date(nudge.sent_at).toLocaleDateString()} · {nudge.channel}
                  </span>
                  {!nudge.was_read && (
                    <button onClick={() => markRead(nudge.id)} style={{
                      padding: '0.2rem 0.5rem', borderRadius: '0.5rem',
                      background: 'rgba(108, 43, 217, 0.15)', border: '1px solid rgba(108, 43, 217, 0.3)',
                      color: '#C4B5FD', cursor: 'pointer', fontSize: '0.65rem'
                    }}>Mark Read</button>
                  )}
                  {!nudge.was_actioned && (
                    <button onClick={() => markActioned(nudge.id)} style={{
                      padding: '0.2rem 0.5rem', borderRadius: '0.5rem',
                      background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10B981', cursor: 'pointer', fontSize: '0.65rem'
                    }}>✅ Done</button>
                  )}
                  {nudge.was_actioned && (
                    <span style={{ color: '#10B981', fontSize: '0.65rem' }}>✅ Completed</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'settings' && prefs && (
        <div style={{
          background: 'rgba(19, 16, 42, 0.8)', backdropFilter: 'blur(12px)',
          borderRadius: '1rem', border: '1px solid rgba(108, 43, 217, 0.3)',
          padding: '1.5rem'
        }}>
          {/* Master Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ color: '#E0E7FF', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Nudge Notifications</h3>
              <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: 0 }}>Enable or disable all proactive nudges</p>
            </div>
            <button onClick={() => setPrefs({ ...prefs, enabled: !prefs.enabled })} style={{
              width: '48px', height: '26px', borderRadius: '13px',
              background: prefs.enabled ? '#10B981' : '#374151',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s'
            }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '3px',
                left: prefs.enabled ? '25px' : '3px',
                transition: 'left 0.3s'
              }} />
            </button>
          </div>

          {/* Nudge Types */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Enabled Nudge Types</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {NUDGE_TYPES.map(type => (
                <button key={type.key} onClick={() => toggleType(type.key)} style={{
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                  background: prefs.enabled_types?.includes(type.key) ? `${type.color}20` : 'rgba(30, 25, 55, 0.5)',
                  border: `1px solid ${prefs.enabled_types?.includes(type.key) ? `${type.color}50` : 'rgba(55, 48, 80, 0.3)'}`,
                  color: prefs.enabled_types?.includes(type.key) ? type.color : '#6B7280',
                  cursor: 'pointer', fontSize: '0.75rem', textAlign: 'left'
                }}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Channels */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#C4B5FD', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Delivery Channels</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['push', 'in_app', 'whatsapp', 'email'].map(ch => (
                <button key={ch} onClick={() => toggleChannel(ch)} style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  background: prefs.preferred_channels?.includes(ch) ? 'rgba(108, 43, 217, 0.2)' : 'rgba(30, 25, 55, 0.5)',
                  border: `1px solid ${prefs.preferred_channels?.includes(ch) ? 'rgba(108, 43, 217, 0.4)' : 'rgba(55, 48, 80, 0.3)'}`,
                  color: prefs.preferred_channels?.includes(ch) ? '#C4B5FD' : '#6B7280',
                  cursor: 'pointer', fontSize: '0.75rem', textTransform: 'capitalize'
                }}>
                  {ch === 'push' ? '📱 Push' : ch === 'in_app' ? '💬 In-App' : ch === 'whatsapp' ? '📲 WhatsApp' : '📧 Email'}
                </button>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ color: '#9CA3AF', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Quiet Start</label>
              <input type="time" value={prefs.quiet_hours_start} onChange={e => setPrefs({ ...prefs, quiet_hours_start: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)', border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem' }} />
            </div>
            <div>
              <label style={{ color: '#9CA3AF', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Quiet End</label>
              <input type="time" value={prefs.quiet_hours_end} onChange={e => setPrefs({ ...prefs, quiet_hours_end: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)', border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem' }} />
            </div>
            <div>
              <label style={{ color: '#9CA3AF', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Max/Day</label>
              <input type="number" value={prefs.max_nudges_per_day} min={1} max={20} onChange={e => setPrefs({ ...prefs, max_nudges_per_day: parseInt(e.target.value) || 5 })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(30, 25, 55, 0.8)', border: '1px solid rgba(55, 48, 80, 0.4)', color: '#E0E7FF', fontSize: '0.8rem' }} />
            </div>
          </div>

          <button onClick={savePrefs} style={{
            width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #6C2BD9, #8B5CF6)',
            border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600
          }}>
            💾 Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}
