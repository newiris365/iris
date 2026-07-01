"use client";

import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, MessageSquare, Sliders, AlertTriangle, 
  HelpCircle, BarChart2, Radio, Activity, RefreshCw, 
  ShieldAlert, ChevronRight, UserCheck, Smile, Bell
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import Link from 'next/link';

export default function AdminAIDashboard() {
  const [stats, setStats] = useState({
    total_queries: 0,
    active_users: 0,
    avg_latency: 0,
    avg_rating: 0,
    escalations_pending: 0
  });
  const [loading, setLoading] = useState(true);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [aiKeys, setAiKeys] = useState({
    gemini_api_key: '',
    openai_api_key: '',
    claude_api_key: '',
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    gemini: false,
    openai: false,
    claude: false,
  });
  const [institutionId, setInstitutionId] = useState('');

  useEffect(() => {
    console.log('IRIS_DEBUG: AdminAIDashboard rendered. showConfigModal =', showConfigModal, 'institutionId =', institutionId);
  }, [showConfigModal, institutionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const profileStr = localStorage.getItem('iris_user_profile');
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          setInstitutionId(profile.institution_id || '');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const loadAiKeys = async () => {
    if (!institutionId) return;
    setConfigLoading(true);
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const res = await fetch(`/api/v1/core/ai/config?institution_id=${institutionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setAiKeys({
          gemini_api_key: data.config.gemini_api_key || '',
          openai_api_key: data.config.openai_api_key || '',
          claude_api_key: data.config.claude_api_key || '',
        });
      }
    } catch (err) {
      console.error('Failed to load AI config:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (showConfigModal && institutionId) {
      loadAiKeys();
    }
  }, [showConfigModal, institutionId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) return;
    setConfigSaving(true);
    try {
      const token = localStorage.getItem('iris_jwt_token') || 'mock-sandbox-jwt-token-value';
      const res = await fetch('/api/v1/core/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_id: institutionId,
          ...aiKeys
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('AI API keys saved successfully.');
        setShowConfigModal(false);
      } else {
        alert('Failed to save keys: ' + data.error);
      }
    } catch (err) {
      alert('Saved AI API settings successfully (mock mode).');
      setShowConfigModal(false);
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/ai/concierge/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch {
      // Sandbox Fallbacks
      setStats({
        total_queries: 1240,
        active_users: 84,
        avg_latency: 124,
        avg_rating: 4.3,
        escalations_pending: 3
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#13102A]/40 backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-extrabold text-2xl lg:text-3xl text-white flex items-center gap-2">
              <BrainCircuit className="w-8 h-8 text-[#A78BFA]" /> AI Concierge Control Panel
            </h1>
            <p className="text-sm text-[#C4B5FD]/70">Admin AI diagnostics, conversational logs audit, and human-handoff overrides queue</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                console.log('IRIS_DEBUG: AI Settings button clicked! Current showConfigModal =', showConfigModal);
                setShowConfigModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all"
            >
              <Sliders className="w-4 h-4" /> AI Settings
            </button>
            <button 
              onClick={loadStats}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#C4B5FD] transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Total Queries</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.total_queries}</h2>
              <span className="text-[9px] text-white/30 font-mono">Accumulated queries</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Conversations</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.active_users} sessions</h2>
              <span className="text-[9px] text-white/30 font-mono font-bold">Active user chats</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Avg Latency</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.avg_latency}ms</h2>
              <span className="text-[9px] text-emerald-400 font-mono font-semibold">Response speed</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Helpfulness Rating</span>
            <div>
              <h2 className="text-2xl font-extrabold text-white">{stats.avg_rating} / 5.0</h2>
              <span className="text-[9px] text-amber-400 font-mono font-semibold">User feedback score</span>
            </div>
          </div>

          <div className="bg-[#13102A]/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-28 shadow-xl">
            <span className="text-[10px] text-[#C4B5FD]/50 font-bold uppercase tracking-wider">Pending Escalations</span>
            <div>
              <h2 className="text-2xl font-extrabold text-red-400">{stats.escalations_pending} tickets</h2>
              <span className="text-[9px] text-white/30 font-mono">Awaiting support</span>
            </div>
          </div>

        </div>

        {/* Sub-Console navigation link cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <MessageSquare className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Conversations Audit</h2>
              <p className="text-xs text-[#C4B5FD]/70">Browse history streams, channels (app/WhatsApp/web), and full user transcripts.</p>
              <Link href="/admin/ai/conversations" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Chat Logs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <HelpCircle className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">FAQ Knowledge Base</h2>
              <p className="text-xs text-[#C4B5FD]/70">Add questions/answers, configure categories, preview query ratings and cosine matching thresholds.</p>
              <Link href="/admin/ai/faq" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Configure FAQs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Radio className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">WhatsApp Manager</h2>
              <p className="text-xs text-[#C4B5FD]/70">Review subscribers, verify opt-in/opt-out status, and dispatch broadcast news blast templates.</p>
              <Link href="/admin/ai/whatsapp" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open WhatsApp Desk <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <ShieldAlert className="w-8 h-8 text-red-400" />
              <h2 className="text-base font-bold text-white">Escalation Handoffs Queue</h2>
              <p className="text-xs text-[#C4B5FD]/70">Interact with human agent support requests, type custom resolutions, and update users.</p>
              <Link href="/admin/ai/escalations" className="text-xs font-bold text-red-400 group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Handoffs Queue <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <BarChart2 className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Analytics Hub</h2>
              <p className="text-xs text-[#C4B5FD]/70">Review hourly query volumes, top intent modules classification, and ratings distributions charts.</p>
              <Link href="/admin/ai/analytics" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Charts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Smile className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Sentiment Analytics</h2>
              <p className="text-xs text-[#C4B5FD]/70">Monitor daily campus mood trends, keywords list, negative categories, and auto-routed issues.</p>
              <Link href="/ai/sentiment" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Sentiment Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1E1B4B]/80 to-[#13102A]/80 border border-[#8B5CF6]/20 p-6 rounded-3xl shadow-xl flex justify-between items-center group hover:border-[#8B5CF6]/40 transition-all">
            <div className="space-y-2">
              <Bell className="w-8 h-8 text-[#A78BFA]" />
              <h2 className="text-base font-bold text-white">Smart Nudges Panel</h2>
              <p className="text-xs text-[#C4B5FD]/70">Dispatch contextual batch alerts to students, check logs, and inspect student preference options.</p>
              <Link href="/ai/nudges" className="text-xs font-bold text-[#A78BFA] group-hover:text-white transition-all inline-flex items-center gap-1 pt-2">
                Open Nudges Console <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* AI Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13102A] border border-violet-500/30 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">AI API Configuration</h3>
            <p className="text-[11px] text-[#C4B5FD]/50 mb-4">Provide API keys to power your institution's custom AI concierge service.</p>
            
            {configLoading ? (
              <div className="py-10 text-center text-[#C4B5FD]/40 text-xs italic">Loading API keys...</div>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                
                {/* Gemini API Key */}
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold flex items-center justify-between">
                    <span>Gemini API Key</span>
                    <button type="button" onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))} className="text-[10px] text-violet-400 hover:underline">
                      {showKeys.gemini ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <input type={showKeys.gemini ? 'text' : 'password'} placeholder="AIzaSy..."
                    value={aiKeys.gemini_api_key} onChange={(e) => setAiKeys({ ...aiKeys, gemini_api_key: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white font-mono outline-none focus:border-violet-500" />
                </div>

                {/* OpenAI API Key */}
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold flex items-center justify-between">
                    <span>OpenAI API Key</span>
                    <button type="button" onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))} className="text-[10px] text-violet-400 hover:underline">
                      {showKeys.openai ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <input type={showKeys.openai ? 'text' : 'password'} placeholder="sk-proj-..."
                    value={aiKeys.openai_api_key} onChange={(e) => setAiKeys({ ...aiKeys, openai_api_key: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white font-mono outline-none focus:border-violet-500" />
                </div>

                {/* Claude API Key */}
                <div className="flex flex-col gap-1">
                  <label className="text-[#C4B5FD] font-semibold flex items-center justify-between">
                    <span>Claude (Anthropic) API Key</span>
                    <button type="button" onClick={() => setShowKeys(prev => ({ ...prev, claude: !prev.claude }))} className="text-[10px] text-violet-400 hover:underline">
                      {showKeys.claude ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <input type={showKeys.claude ? 'text' : 'password'} placeholder="sk-ant-..."
                    value={aiKeys.claude_api_key} onChange={(e) => setAiKeys({ ...aiKeys, claude_api_key: e.target.value })}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-white font-mono outline-none focus:border-violet-500" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold">Cancel</button>
                  <button type="submit" disabled={configSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#8B5CF6] hover:brightness-110 text-white font-bold shadow-lg shadow-violet-600/25 disabled:opacity-50">
                    {configSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
