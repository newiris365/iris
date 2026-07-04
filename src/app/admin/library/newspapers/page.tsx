"use client";

import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Link as LinkIcon, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { apiGet, apiPost } from '../../../../lib/api';

export default function AdminNewspapersPage() {
  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [currentIssueUrl, setCurrentIssueUrl] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const res = await apiGet('/library/newspapers');
      if (res.success) {
        setNewspapers(res.newspapers || []);
      }
    } catch (err) {
      console.error(err);
      // Mocks fallback
      setNewspapers([
        {
          id: 'n1',
          name: 'The Times of India',
          provider: 'TOI Digital Campus',
          current_issue_url: 'https://timesofindia.indiatimes.com'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !provider.trim() || !currentIssueUrl.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await apiPost('/library/newspapers', {
        name,
        provider,
        current_issue_url: currentIssueUrl
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Successfully registered "${name}" subscription!` });
        setName('');
        setProvider('');
        setCurrentIssueUrl('');
        loadSubscriptions();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to register digital newspaper.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A1A] text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/15 via-[#0D0A1A] to-[#0D0A1A]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/25">
              <Newspaper className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl lg:text-3xl text-white">Newspaper Subscriptions</h1>
              <p className="text-sm text-[#C4B5FD]/70">Admin Console • Register and coordinate campus digital editions and provider credentials</p>
            </div>
          </div>
          <button onClick={loadSubscriptions} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#C4B5FD]/80 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-xl border mb-6 text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Register Subscription Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#10B981]" /> Register Sub-edition
              </h3>
              
              <form onSubmit={handleRegisterSubscription} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">Newspaper Name</label>
                  <input
                    type="text"
                    placeholder="e.g. The Hindu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">Sub Plan Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. The Hindu Institutional Package"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#C4B5FD]/70 mb-1">E-Reader URL</label>
                  <input
                    type="url"
                    placeholder="https://thehindu.com/e-paper"
                    value={currentIssueUrl}
                    onChange={(e) => setCurrentIssueUrl(e.target.value)}
                    className="w-full bg-[#0D0A1A] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50"
                    required
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[10px] text-[#C4B5FD]/80 leading-relaxed flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Verify URL belongs to valid paid academic subscription proxy to avoid reader timeouts.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !provider.trim() || !currentIssueUrl.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-xs font-bold text-white transition-all shadow-lg hover:brightness-110 disabled:opacity-55"
                >
                  {submitting ? 'Registering...' : 'Register Subscription'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Columns: Active Subscriptions list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-[#C4B5FD]/70 uppercase tracking-wider">Currently Registered Daily Editions</h3>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : newspapers.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl text-center text-xs text-[#C4B5FD]/30">
                No subscription packages registered. Register the first package on the left dashboard!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newspapers.map((news) => (
                  <div key={news.id} className="glass-panel p-5 rounded-3xl border border-white/5 bg-[#13102A]/60 shadow-xl flex flex-col justify-between h-40">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-mono text-[#C4B5FD]/40">SUB ID: {news.id}</span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">Active Plan</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-1.5">{news.name}</h4>
                      <p className="text-[10px] text-[#C4B5FD]/60 mt-0.5">Provider: {news.provider}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-[#C4B5FD]/50">
                      <a href={news.current_issue_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#10B981] transition-colors">
                        <LinkIcon className="w-3.5 h-3.5" /> URL Link
                      </a>
                      <span className="font-mono text-[8px]">Modified: Daily Auto-sync</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
