"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, AlertCircle, FileCheck2, Plus, RefreshCw } from 'lucide-react';

interface DvvQuery {
  id: string;
  metric_code: string;
  query_text: string;
  response_text?: string;
  status: 'open' | 'resolved';
  created_at: string;
}

export default function IqacDvvDesk() {
  const [queries, setQueries] = useState<DvvQuery[]>([]);
  const [loading, setLoading] = useState(true);

  // AI draft states
  const [selectedQuery, setSelectedQuery] = useState<DvvQuery | null>(null);
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New query fields
  const [showCreate, setShowCreate] = useState(false);
  const [metricCode, setMetricCode] = useState('1.1.1');
  const [queryText, setQueryText] = useState('');

  const loadQueries = async () => {
    setLoading(true);
    try {
      // Mock DVV logs matching the dashboard requirements
      setQueries([
        { id: 'q-1', metric_code: '1.2.2', query_text: 'Provide evidence list of 18 revised syllabus copies for newly introduced courses.', response_text: 'Syllabus copies attached in Criterion 1 folder.', status: 'resolved', created_at: '2026-06-09T12:00:00Z' },
        { id: 'q-2', metric_code: '2.2.1', query_text: 'Full time teacher appointments list is inconsistent with year wise counts. Provide official sanction letters.', status: 'open', created_at: '2026-06-11T09:00:00Z' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const triggerAiDraft = async (query: DvvQuery) => {
    setSelectedQuery(query);
    setAiLoading(true);
    setAiDraft('');
    try {
      // Mock AI response helper
      setTimeout(() => {
        setAiDraft(`Respected DVV Partner,\n\nIn response to the query regarding Metric ${query.metric_code}, we confirm that the full-time teacher rosters have been verified. The sanction letters from the academic board are attached herewith in Section 2.2.1 file upload indexes for your kind verification.`);
        setAiLoading(false);
      }, 1000);
    } catch (err) {
      setAiLoading(false);
    }
  };

  const handleCreateQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    const newQ: DvvQuery = {
      id: `q-${Date.now()}`,
      metric_code: metricCode,
      query_text: queryText,
      status: 'open',
      created_at: new Date().toISOString()
    };
    setQueries(prev => [newQ, ...prev]);
    setQueryText('');
    setShowCreate(false);
    alert('DVV query log added to audit table.');
  };

  const saveResponse = (id: string, response: string) => {
    setQueries(prev => prev.map(q => q.id === id ? { ...q, response_text: response, status: 'resolved' as const } : q));
    setSelectedQuery(null);
    setAiDraft('');
    alert('Response draft approved and registered.');
  };

  return (
    <div className="max-w-7xl mx-auto py-2 w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#6C2BD9]/30 bg-gradient-to-r from-[#13102A] to-[#1E193C] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-widest font-mono">DVV Audit Desk</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Data Validation & Verification (DVV)</h1>
          <p className="text-xs text-[#C4B5FD]/70 max-w-xl">
            Track clarification queries raised by NAAC auditors, resolve discrepancies, and draft evidence responses with Claude AI.
          </p>
        </div>
        
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-white font-bold text-xs shadow-lg shadow-[#6C2BD9]/25 hover:brightness-110 transition-all flex items-center gap-2 border border-[#A78BFA]/20"
        >
          <Plus className="w-4 h-4" /> Log Auditor Query
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#C4B5FD]">Loading query trackers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {queries.map(q => (
              <div key={q.id} className="glass-panel border border-[#6C2BD9]/20 rounded-2xl p-5 bg-[#13102A]/40 flex flex-col gap-3 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#A78BFA] font-mono bg-[#6C2BD9]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded">
                    Metric {q.metric_code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                    q.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <div className="flex gap-3 text-xs text-white leading-relaxed my-1 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p>{q.query_text}</p>
                </div>

                {q.response_text && (
                  <div className="p-3.5 rounded-xl bg-[#0D0A1A]/80 border border-white/5 text-[11px] text-[#C4B5FD] leading-normal font-semibold">
                    <span className="font-extrabold text-white block mb-1">Registered Response:</span>
                    {q.response_text}
                  </div>
                )}

                {q.status === 'open' && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => triggerAiDraft(q)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-bold text-[10px] hover:brightness-110 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Suggest Response with Claude
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Claude Response suggester */}
          <div className="glass-panel border border-[#6C2BD9]/25 rounded-2xl p-6 bg-[#13102A]/20 flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <span>Response Draft Advisor</span>
            </h3>
            
            {selectedQuery ? (
              <div className="flex flex-col gap-4">
                <div className="p-3.5 rounded-xl bg-[#0D0A1A]/50 text-[10px] text-[#C4B5FD] leading-normal border border-white/5 font-semibold">
                  <span className="font-bold text-white block mb-1">Query:</span>
                  {selectedQuery.query_text}
                </div>

                {aiLoading ? (
                  <div className="text-center py-6">
                    <RefreshCw className="w-6 h-6 text-[#8B5CF6] animate-spin mx-auto mb-2" />
                    <p className="text-[10px] text-[#C4B5FD]">Drafting technical response letter...</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      rows={6}
                      className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-3 text-[10px] leading-relaxed text-white focus:outline-none focus:border-[#8B5CF6]"
                      value={aiDraft}
                      onChange={e => setAiDraft(e.target.value)}
                    />
                    <button
                      onClick={() => saveResponse(selectedQuery.id, aiDraft)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all"
                    >
                      Approve & Log Response
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#C4B5FD]/50 text-center py-12">Select an open clarification query above to trigger Claude drafting tools.</p>
            )}
          </div>
        </div>
      )}

      {/* CREATE DIALOG */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel bg-[#13102A] border border-[#6C2BD9]/30 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Log Auditor Query</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#C4B5FD]/50 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateQuery} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Discrepancy Metric Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2.2.1"
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={metricCode}
                  onChange={e => setMetricCode(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#C4B5FD]/70 font-semibold">Clarification Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide description from the NAAC DVV portal query card."
                  className="w-full bg-[#0D0A1A] border border-[#6C2BD9]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#8B5CF6]"
                  value={queryText}
                  onChange={e => setQueryText(e.target.value)}
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
                  Log Query Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
